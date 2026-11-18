import { coordinateError, parseDecimal } from "@/components/map/coordinates";
import { runIndependentWrites, type IndependentWrite } from "@/workspace/useResourceEditor";
import { problemText } from "@/lib/problemText";
import { ApiError, PartlySavedError, apiBlob, apiRequest } from "./api";
import type { ResourceStatus } from "./places";
import type { SurfaceName } from "./surfaces";

/*
 * Interaction Triggers (`03` §14, backend D-026): how visitors reach a Resource in place. They have no
 * screen of their own (`12` §3); the editor of their target edits them and `saveWithTriggers` saves them before
 * the Resource itself, so a refused trigger stops the save, and puts them back when the Resource is then refused.
 */

export type TriggerType = "QR_CODE" | "BEACON" | "GEO_PROXIMITY";

/**
 * The surfaces able to run each type, the ceiling of the capability matrix (`13` §1, `03` §14; backend
 * `TriggerType`): a beacon runs on the mobile app only, a geo-proximity area on the web and the mobile app.
 */
export const TRIGGER_SURFACES: Record<TriggerType, SurfaceName[]> = {
  QR_CODE: ["WEB", "MOBILE", "KIOSK"],
  GEO_PROXIMITY: ["WEB", "MOBILE"],
  BEACON: ["MOBILE"],
};

export const SURFACE_LABELS: Record<SurfaceName, string> = { WEB: "Web", MOBILE: "Mobile app", KIOSK: "Kiosk" };

/** The surfaces a trigger runs on: those it names, or every surface able to run its type when it names none. */
export function triggerSurfaces(type: TriggerType, surfaces: SurfaceName[] | null): SurfaceName[] {
  return surfaces ?? TRIGGER_SURFACES[type];
}

/** The kinds a trigger can open (backend D-028); a Route Stop is opened by the triggers of its POI. */
export type TriggerTargetType = "POI" | "PLACE" | "ROUTE" | "GUIDE" | "EVENT";

export interface Trigger {
  id: string;
  /**
   * The absolute runtime URL a QR code encodes (`11` §9): null for other types, and while the Project's WEB surface
   * has no public web address (backend D-029).
   */
  runtimeUrl?: string | null;
  triggerType: TriggerType;
  targetResourceType: TriggerTargetType;
  targetResourceId: string;
  code: string | null;
  supportedSurfaces: SurfaceName[] | null;
  status: ResourceStatus;
  configuration: Record<string, unknown>;
  sortOrder: number;
  version: number;
}

/** One row of the "How visitors reach it" card; every value is the text of its input. */
export interface TriggerForm {
  key: string;
  id: string | null;
  type: TriggerType;
  code: string;
  uuid: string;
  major: string;
  minor: string;
  proximityMeters: string;
  cooldownSeconds: string;
  latitude: string;
  longitude: string;
  radiusMeters: string;
  /** The surfaces it is restricted to, in matrix order; null for every surface able to run the type (`03` §14). */
  surfaces: SurfaceName[] | null;
  /** As last saved: the code the backend's QR image encodes, and its runtime URL; null for a new row. */
  savedCode: string | null;
  runtimeUrl: string | null;
  /**
   * Why the last save could not store this row, in one sentence; set when a save stored the Resource but not this row
   * (C3-20), cleared when the row is edited or saved. The row shows it inline and stays open until then.
   */
  problem: string | null;
}

interface Page<T> {
  content: T[];
  totalPages: number;
}

const base = (projectId: string) => `/projects/${encodeURIComponent(projectId)}/triggers`;

let keyCounter = 0;
const text = (value: unknown) => (value === null || value === undefined ? "" : String(value));

export function blankTrigger(type: TriggerType, defaults: Partial<TriggerForm> = {}): TriggerForm {
  return {
    key: `t-${++keyCounter}`,
    id: null,
    type,
    code: "",
    uuid: "",
    major: "",
    minor: "",
    proximityMeters: type === "BEACON" ? "2" : "",
    cooldownSeconds: type === "QR_CODE" ? "" : "300",
    latitude: "",
    longitude: "",
    radiusMeters: type === "GEO_PROXIMITY" ? "30" : "",
    surfaces: null,
    savedCode: null,
    runtimeUrl: null,
    problem: null,
    ...defaults,
  };
}

export function triggerToForm(t: Trigger): TriggerForm {
  const c = t.configuration;
  return {
    ...blankTrigger(t.triggerType),
    id: t.id,
    code: t.code ?? "",
    uuid: text(c.uuid),
    major: text(c.major),
    minor: text(c.minor),
    proximityMeters: text(c.proximityMeters),
    cooldownSeconds: text(c.cooldownSeconds),
    latitude: text(c.latitude),
    longitude: text(c.longitude),
    radiusMeters: text(c.radiusMeters),
    surfaces: t.supportedSurfaces ? TRIGGER_SURFACES[t.triggerType].filter((s) => t.supportedSurfaces!.includes(s)) : null,
    savedCode: t.code,
    runtimeUrl: t.runtimeUrl ?? null,
  };
}

/** The backend's QR image of a saved QR code trigger (`GET .../triggers/{id}/qr.png`), as a PNG blob. */
export function fetchQrImage(projectId: string, triggerId: string, signal?: AbortSignal): Promise<Blob> {
  return apiBlob(`${base(projectId)}/${encodeURIComponent(triggerId)}/qr.png`, { signal, accept: "image/png, application/json" });
}

/** The non-archived triggers of one Resource, in their order. */
export async function listTargetTriggers(projectId: string, type: TriggerTargetType, id: string): Promise<Trigger[]> {
  return (await listEveryTargetTrigger(projectId, type, id)).filter((t) => t.status !== "ARCHIVED");
}

async function listEveryTargetTrigger(projectId: string, type: TriggerTargetType, id: string): Promise<Trigger[]> {
  const triggers: Trigger[] = [];
  for (let page = 0; ; page++) {
    const result = await apiRequest<Page<Trigger>>(
      `${base(projectId)}?targetResourceType=${type}&targetResourceId=${encodeURIComponent(id)}&size=200&page=${page}`,
    );
    triggers.push(...result.content);
    if (page + 1 >= result.totalPages) return triggers;
  }
}

/** Every trigger of the Project, archived ones included, for the preview's "fire trigger" control. */
export async function listProjectTriggers(projectId: string, signal?: AbortSignal): Promise<Trigger[]> {
  const triggers: Trigger[] = [];
  for (let page = 0; ; page++) {
    const result = await apiRequest<Page<Trigger>>(`${base(projectId)}?size=200&page=${page}`, { signal });
    triggers.push(...result.content);
    if (page + 1 >= result.totalPages) return triggers;
  }
}

/** The non-archived triggers of each Resource of one kind, by Resource id and in their order, for list chips. */
export function groupTriggersByTarget(triggers: Trigger[] | null, type: TriggerTargetType): Map<string, Trigger[]> | null {
  if (!triggers) return null;
  const byTarget = new Map<string, Trigger[]>();
  for (const t of [...triggers].sort((a, b) => a.sortOrder - b.sortOrder)) {
    if (t.status === "ARCHIVED" || t.targetResourceType !== type) continue;
    byTarget.set(t.targetResourceId, [...(byTarget.get(t.targetResourceId) ?? []), t]);
  }
  return byTarget;
}

/** A number as typed (a decimal comma is fine); text that is not a number is passed on so the platform names the field. */
const num = (value: string) => (value.trim() === "" ? null : (parseDecimal(value) ?? value.trim()));

function bodyOf(form: TriggerForm): {
  code: string | null;
  supportedSurfaces: SurfaceName[] | null;
  configuration: Record<string, unknown>;
} {
  return { ...typeBody(form), supportedSurfaces: form.surfaces };
}

function typeBody(form: TriggerForm): { code: string | null; configuration: Record<string, unknown> } {
  switch (form.type) {
    case "QR_CODE":
      return { code: form.code.trim() || null, configuration: {} };
    case "BEACON":
      return {
        code: null,
        configuration: {
          uuid: form.uuid.trim(),
          major: num(form.major),
          minor: num(form.minor),
          proximityMeters: num(form.proximityMeters),
          cooldownSeconds: num(form.cooldownSeconds),
        },
      };
    case "GEO_PROXIMITY":
      return {
        code: null,
        configuration: {
          latitude: num(form.latitude),
          longitude: num(form.longitude),
          radiusMeters: num(form.radiusMeters),
          cooldownSeconds: num(form.cooldownSeconds),
        },
      };
  }
}

const DUPLICATE_BEACON = "Another way of reaching an item already uses this UUID with this Major and Minor. Change one of them.";
const DUPLICATE_CODE = "This code is already used by another item in this Project. Choose another or leave it empty.";

/** Re-reports an error at the row that caused it: `code` → `triggers[2].code`, `configuration.uuid` → `triggers[2].uuid`. */
function atRow(e: unknown, index: number | null): unknown {
  if (!(e instanceof ApiError)) return e;
  const row = index === null ? "triggers" : `triggers[${index}]`;
  // A code or beacon that another item already uses is a field error of the row, said once and never as "Another point of
  // interest already uses this qr code 1, code" (C3-20): the editor's generic duplicate sentence does not fit a row.
  if (e.code === "DUPLICATE_VALUE") {
    const field = e.details.some((d) => /^(?:configuration\.)?(?:uuid|major|minor)/.test(d)) ? "uuid" : "code";
    return new ApiError(422, "VALIDATION_ERROR", e.message, e.requestId, [`${row}.${field}: ${field === "uuid" ? DUPLICATE_BEACON : DUPLICATE_CODE}`], e.body);
  }
  const details = e.details.map((d) => {
    const m = /^(?:configuration\.)?(code|supportedSurfaces|uuid|major|minor|proximityMeters|cooldownSeconds|latitude|longitude|radiusMeters): (.*)$/.exec(d);
    return m ? `${row}.${m[1]}: ${m[2]}` : `${row}: ${d.replace(/^[^:]*: /, "")}`;
  });
  if (!details.length) details.push(`${row}: ${e.message}`);
  return new ApiError(e.status, e.code, e.message, e.requestId, details, e.body);
}

/** The short name of a row among its siblings: "Beacon 1", "QR code 2", numbered per type (C2-60). */
export function triggerRowName(forms: TriggerForm[], form: TriggerForm): string {
  const names: Record<TriggerType, string> = { BEACON: "Beacon", GEO_PROXIMITY: "Geo-proximity", QR_CODE: "QR code" };
  return `${names[form.type]} ${forms.filter((x) => x.type === form.type).indexOf(form) + 1}`;
}

const TRIGGER_FIELD_NAMES: Record<string, string> = {
  uuid: "UUID",
  major: "Major",
  minor: "Minor",
  proximityMeters: "Distance",
  cooldownSeconds: "Wait",
  latitude: "Latitude",
  longitude: "Longitude",
  radiusMeters: "Radius",
  code: "Code",
  supportedSurfaces: "Runs on",
};

/** "Beacon 1, UUID" for the error path `triggers[0].uuid`; null for any other path. For the editor's `describePath`. */
export function describeTriggerPath(path: string, forms: TriggerForm[]): string | null {
  const m = /^triggers\[(\d+)\](?:\.(\w+))?$/.exec(path);
  if (!m) return null;
  const form = forms[Number(m[1])];
  if (!form) return "How visitors reach it";
  return m[2] ? `${triggerRowName(forms, form)}, ${TRIGGER_FIELD_NAMES[m[2]] ?? m[2]}` : triggerRowName(forms, form);
}

/** One trigger row that could not be written, for the partial-failure sentence. */
export interface TriggerFailure {
  /** The row's place in the form; null for a removed row that could not be archived. */
  index: number | null;
  /** What the row is called in a sentence: "Beacon 1". */
  name: string;
  /** The error, with its paths already rewritten to `triggers[i].field`. */
  error: ApiError;
  /** The row's key in the form; null for a removed row. */
  key: string | null;
}

/** One sentence for a row that failed, chosen by status and code; the server's words are never shown (D-087). */
export function rowFailureText(error: ApiError): string {
  if (error.status === 422 || error.status === 400) {
    return Object.values(error.fieldMessages())[0] ?? "Check the fields of this row.";
  }
  return problemText(error.status, error.code).body.replace(/\s*Nothing was changed\.?/g, "").trim();
}

/** One error out of several: the first one's status and code, every row's field messages. */
function mergeErrors(errors: ApiError[]): ApiError {
  if (errors.length === 1) return errors[0];
  const [first] = errors;
  return new ApiError(first.status, first.code, first.message, first.requestId, errors.flatMap((e) => e.details), first.body);
}

/**
 * Makes the Resource's triggers exactly `desired`: new rows are created and activated (a trigger
 * opens its target only when both are ACTIVE), changed rows updated, removed rows archived, so a printed
 * QR code still lands on the Resource (`11` §9). The rows are independent, so the removals run together, then the
 * creations and updates run together (C2-73); a row that fails never stops the others. Resolves with the rows that
 * failed, empty when all worked; the caller decides whether that stops the save.
 */
export async function syncTriggers(
  projectId: string,
  type: TriggerTargetType,
  id: string,
  desired: TriggerForm[],
  current?: Trigger[],
): Promise<{ triggers: Trigger[]; failed: TriggerFailure[]; ids: Record<string, string> }> {
  current ??= await listTargetTriggers(projectId, type, id);
  // A new row identical to a trigger nobody kept is that trigger: a save that failed half-way created it.
  const unclaimed = current.filter((t) => !desired.some((d) => d.id === t.id));
  const adopted = desired.map((d) => {
    if (d.id) return d;
    const body = JSON.stringify(bodyOf(d));
    const match = unclaimed.findIndex((t) => t.triggerType === d.type
      && (d.type === "QR_CODE" && !d.code.trim() ? true : JSON.stringify(bodyOf(triggerToForm(t))) === body));
    return match < 0 ? d : { ...d, id: unclaimed.splice(match, 1)[0].id };
  });
  const kept = new Set(adopted.flatMap((d) => (d.id ? [d.id] : [])));
  const failed: TriggerFailure[] = [];
  // The id each row has after this save, by row key: its own, the one it was adopted with, or the one just created.
  const ids: Record<string, string> = {};
  adopted.forEach((d) => {
    if (d.id) ids[d.key] = d.id;
  });
  const collect = (rows: Map<IndependentWrite, { index: number | null; name: string }>) => async (writes: IndependentWrite[]) => {
    for (const { write, error } of await runIndependentWrites(writes)) {
      const row = rows.get(write)!;
      failed.push({ ...row, key: row.index === null ? null : desired[row.index].key, error: atRow(error, row.index) as ApiError });
    }
  };

  const removals = new Map<IndependentWrite, { index: number | null; name: string }>();
  for (const old of current.filter((t) => !kept.has(t.id))) {
    removals.set(
      {
        label: "the removed way of reaching it",
        run: () => apiRequest(`${base(projectId)}/${encodeURIComponent(old.id)}/status`, { method: "POST", body: { targetStatus: "ARCHIVED", version: old.version } }),
      },
      { index: null, name: "A removed way of reaching it" },
    );
  }
  await collect(removals)([...removals.keys()]);

  const upserts = new Map<IndependentWrite, { index: number | null; name: string }>();
  adopted.forEach((form, index) => {
    const body = bodyOf(form);
    const name = triggerRowName(desired, desired[index]);
    const run = async () => {
      if (!form.id) {
        let created: Trigger;
        try {
          created = await apiRequest<Trigger>(base(projectId), {
            method: "POST",
            body: { targetResourceType: type, targetResourceId: id, triggerType: form.type, ...body },
          });
        } catch (e) {
          // The code is already in use: by this very item (an earlier save stored it) it is that row, saved; by another
          // item it is a refusal at the row (C3-20).
          if (!(e instanceof ApiError) || e.code !== "DUPLICATE_VALUE") throw e;
          const wanted = JSON.stringify(body);
          const own = (await listTargetTriggers(projectId, type, id)).find((t) => t.triggerType === form.type && JSON.stringify(bodyOf(triggerToForm(t))) === wanted);
          if (!own) throw e;
          ids[form.key] = own.id;
          return;
        }
        ids[form.key] = created.id;
        await apiRequest(`${base(projectId)}/${encodeURIComponent(created.id)}/status`, {
          method: "POST",
          body: { targetStatus: "ACTIVE", version: created.version },
        });
        return;
      }
      const before = current.find((t) => t.id === form.id);
      // An emptied QR code keeps its code: printed codes must go on working.
      const wanted = before && form.type === "QR_CODE" && !body.code ? { ...body, code: before.code } : body;
      let version = before?.version ?? 0;
      if (before && JSON.stringify(bodyOf(triggerToForm(before))) !== JSON.stringify(wanted)) {
        version = (await apiRequest<Trigger>(`${base(projectId)}/${encodeURIComponent(form.id)}`, {
          method: "PUT",
          body: { version: before.version, ...wanted },
        })).version;
      }
      // A row an earlier, half-finished save created but did not activate is activated now: it opens its target only then.
      if (before?.status === "DRAFT") {
        await apiRequest(`${base(projectId)}/${encodeURIComponent(form.id)}/status`, { method: "POST", body: { targetStatus: "ACTIVE", version } });
      }
    };
    upserts.set({ label: name, run }, { index, name });
  });
  await collect(upserts)([...upserts.keys()]);
  return { triggers: await listTargetTriggers(projectId, type, id), failed, ids };
}

/**
 * The card's rows after a save that stored the Resource but not every row (C3-20): a row that was saved becomes the
 * saved trigger (same row key, so its place, focus and open state stay), a row that failed stays as typed with its
 * sentence in `problem`, so the next save sends only the failed rows. Rows that were removed are not in the form.
 */
export function reconcileTriggers(forms: TriggerForm[], notice: PartialTriggers): TriggerForm[] {
  const failedKeys = new Map(notice.rows.map((r) => [r.key, r.sentence]));
  return forms.map((form) => {
    const problem = failedKeys.get(form.key);
    const id = notice.ids[form.key] ?? form.id;
    if (problem !== undefined) return { ...form, id, problem };
    const saved = id ? notice.triggers.find((t) => t.id === id) : undefined;
    return saved ? { ...triggerToForm(saved), key: form.key } : form;
  });
}

/** "Beacon 1 and QR code 2": the rows that failed, for `partialSentence`. */
function failedNames(failed: TriggerFailure[]): string[] {
  return [...new Set(failed.map((f) => f.name))];
}

/**
 * Saves the triggers, then the Resource through `saveResource`. The triggers go first, so a refused trigger stops
 * the save; when the rest is refused, the triggers are put back as they were, so a save that failed changed
 * nothing (DECISIONS.md D-044). Putting them back is best effort: when it fails too, the next save repairs them.
 *
 * With `partial` the Resource is saved even when some rows were refused (they are independent of it, C2-73): the
 * result then throws a `PartlySavedError` that carries the saved Resource and the rows' field errors, so the editor
 * keeps the form dirty for a retry. The caller names what failed with {@link partialNotice}. Without it (a working
 * copy, whose editor cannot take a partial result) any refused row stops the save and is put back.
 */
export async function saveWithTriggers<R>(
  projectId: string,
  type: TriggerTargetType,
  id: string,
  desired: TriggerForm[],
  saveResource: () => Promise<R>,
  options: { partial?: boolean; onPartial?: (notice: PartialTriggers) => void } = {},
): Promise<{ saved: R; triggers: Trigger[] }> {
  const before = await listTargetTriggers(projectId, type, id);
  let saved: R;
  let synced: { triggers: Trigger[]; failed: TriggerFailure[]; ids: Record<string, string> };
  try {
    synced = await syncTriggers(projectId, type, id, desired, before);
    if (synced.failed.length && !options.partial) throw mergeErrors(synced.failed.map((f) => f.error));
    saved = await saveResource();
  } catch (e) {
    await restoreTriggers(projectId, type, id, before).catch(() => undefined);
    throw e;
  }
  if (synced.failed.length) {
    options.onPartial?.({
      names: failedNames(synced.failed),
      requestId: synced.failed[0].error.requestId,
      validation: synced.failed.every((f) => f.error.status === 422 || f.error.status === 400),
      triggers: synced.triggers,
      ids: synced.ids,
      rows: synced.failed.flatMap((f) => (f.key ? [{ key: f.key, sentence: rowFailureText(f.error) }] : [])),
    });
    throw new PartlySavedError(saved, mergeErrors(synced.failed.map((f) => f.error)));
  }
  return { saved, triggers: synced.triggers };
}

/** What a partial save leaves to say: the rows that were refused, and whether the platform named their fields. */
export interface PartialTriggers {
  names: string[];
  requestId: string | null;
  /** True when every refusal is a validation error shown at its field; the editor's own summary is then enough. */
  validation: boolean;
  /** The Resource's triggers as stored after the save, and the id each form row (by key) has now. */
  triggers: Trigger[];
  ids: Record<string, string>;
  /** The rows that failed, by form key, with their sentence. */
  rows: { key: string; sentence: string }[];
}

const settingsOf = (t: Trigger) =>
  JSON.stringify({ code: t.code, supportedSurfaces: t.supportedSurfaces, configuration: t.configuration });

/** Makes the Resource's triggers those of `before` again: new ones archived, removed ones restored, edits undone. */
async function restoreTriggers(projectId: string, type: TriggerTargetType, id: string, before: Trigger[]): Promise<void> {
  const now = await listEveryTargetTrigger(projectId, type, id);
  const status = (t: Trigger, targetStatus: ResourceStatus) =>
    apiRequest<Trigger>(`${base(projectId)}/${encodeURIComponent(t.id)}/status`, {
      method: "POST",
      body: { targetStatus, version: t.version },
    });
  // Archived first, so a restored QR code does not meet a new one with the same code.
  for (const added of now.filter((t) => t.status !== "ARCHIVED" && !before.some((b) => b.id === t.id))) {
    await status(added, "ARCHIVED");
  }
  for (const old of before) {
    let current = now.find((t) => t.id === old.id);
    if (!current) continue;
    if (current.status === "ARCHIVED") {
      current = await status(current, "DRAFT");
      if (old.status === "ACTIVE") current = await status(current, "ACTIVE");
    }
    if (settingsOf(current) !== settingsOf(old)) {
      await apiRequest(`${base(projectId)}/${encodeURIComponent(old.id)}`, {
        method: "PUT",
        body: { version: current.version, code: old.code, supportedSurfaces: old.supportedSurfaces, configuration: old.configuration },
      });
    }
  }
}

export const TRIGGER_LABELS: Record<TriggerType, string> = {
  BEACON: "Bluetooth beacon",
  GEO_PROXIMITY: "Geo-proximity",
  QR_CODE: "QR code",
};

/** The colour of a trigger type's chip, in the editor card and in the lists alike. */
export const TRIGGER_CHIP_CLASS: Record<TriggerType, string> = {
  BEACON: "bg-info-tint text-info",
  GEO_PROXIMITY: "bg-success-tint text-success",
  QR_CODE: "bg-muted text-ink-2",
};

/** A trigger in a few characters for a list chip: "QR · K7F2A9QX", "Beacon · 12/3", "Geo · 30 m". */
export function triggerLabel(trigger: Trigger): string {
  const c = trigger.configuration;
  switch (trigger.triggerType) {
    case "QR_CODE":
      return trigger.code ? `QR · ${trigger.code}` : "QR";
    case "BEACON":
      return c.major !== undefined && c.minor !== undefined ? `Beacon · ${text(c.major)}/${text(c.minor)}` : "Beacon";
    case "GEO_PROXIMITY":
      return c.radiusMeters !== undefined ? `Geo · ${text(c.radiusMeters)} m` : "Geo";
  }
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Why `text` is not a whole number from `min` to `max`, or null (empty text is allowed: the platform says what is required). */
function wholeError(text: string, label: string, min: number, max: number): string | null {
  if (!text.trim()) return null;
  return /^\d+$/.test(text.trim()) && Number(text) >= min && Number(text) <= max ? null : `${label} is a whole number from ${min} to ${max}.`;
}

/** Why `text` is not a number above zero, or null when it is empty or fine. */
function positiveError(text: string, label: string): string | null {
  if (!text.trim()) return null;
  const value = parseDecimal(text);
  return value !== null && value > 0 ? null : `${label} is a number above 0.`;
}

/** Why `text` is not a whole number from `min` to `max`; an empty text is "Enter …" when the field is required. */
function requiredWhole(text: string, label: string, min: number, max: number, required: boolean): string | null {
  if (!text.trim()) return required ? `Enter the ${label.toLowerCase()}.` : null;
  return wholeError(text, label, min, max);
}

/**
 * Why a geo-proximity coordinate is not acceptable as typed, or null. Used on leaving the field (C2-69): an empty field is
 * not an error while the other one is empty too, so a new row is not red before the author starts.
 */
export function triggerCoordinateError(form: TriggerForm, axis: "latitude" | "longitude"): string | null {
  const own = form[axis].trim();
  const other = (axis === "latitude" ? form.longitude : form.latitude).trim();
  if (!own) return other ? `Enter a ${axis} too, or clear the ${axis === "latitude" ? "longitude" : "latitude"}.` : null;
  return coordinateError(own, axis);
}

/**
 * Client-side check of the card's rows, in the editor's error map under `triggers[i].field`, so a typo shows at its field
 * before anything is sent and never reaches the platform as a non-number. A beacon needs its UUID, Major and Minor and a
 * geo-proximity area its latitude, longitude and radius: an empty row is named here, field by field, and never sent (C2-60).
 */
export function checkTriggers(forms: TriggerForm[], found: Record<string, string>): void {
  forms.forEach((t, i) => {
    const put = (field: string, message: string | null) => {
      if (message) found[`triggers[${i}].${field}`] = message;
    };
    if (t.type === "BEACON") {
      if (!t.uuid.trim()) put("uuid", "Enter the beacon's UUID.");
      else if (!UUID_PATTERN.test(t.uuid.trim())) put("uuid", "A beacon UUID looks like e2c56db5-dffb-48d2-b060-d0f5a71096e0.");
      put("major", requiredWhole(t.major, "Major", 0, 65535, true));
      put("minor", requiredWhole(t.minor, "Minor", 0, 65535, true));
      put("proximityMeters", positiveError(t.proximityMeters, "Distance"));
      put("cooldownSeconds", wholeError(t.cooldownSeconds, "Wait", 0, 86400));
    } else if (t.type === "GEO_PROXIMITY") {
      put("latitude", coordinateError(t.latitude, "latitude"));
      put("longitude", coordinateError(t.longitude, "longitude"));
      if (!t.radiusMeters.trim()) put("radiusMeters", "Enter the radius in metres.");
      else put("radiusMeters", positiveError(t.radiusMeters, "Radius"));
      put("cooldownSeconds", wholeError(t.cooldownSeconds, "Wait", 0, 86400));
    }
  });
}
