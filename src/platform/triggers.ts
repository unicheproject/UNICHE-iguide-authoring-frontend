import { ApiError, apiBlob, apiRequest } from "./api";
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

const num = (value: string) => (value.trim() === "" ? null : Number.isNaN(Number(value)) ? value.trim() : Number(value));

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

/** Re-reports an error at the row that caused it: `code` → `triggers[2].code`, `configuration.uuid` → `triggers[2].uuid`. */
function atRow(e: unknown, index: number): unknown {
  if (!(e instanceof ApiError)) return e;
  const details = e.details.map((d) => {
    const m = /^(?:configuration\.)?(code|supportedSurfaces|uuid|major|minor|proximityMeters|cooldownSeconds|latitude|longitude|radiusMeters): (.*)$/.exec(d);
    return m ? `triggers[${index}].${m[1]}: ${m[2]}` : `triggers[${index}]: ${d.replace(/^[^:]*: /, "")}`;
  });
  if (!details.length) details.push(`triggers[${index}]: ${e.message}`);
  return new ApiError(e.status, e.code, e.message, e.requestId, details, e.body);
}

/**
 * Makes the Resource's triggers exactly `desired`: new rows are created and activated (a trigger
 * opens its target only when both are ACTIVE), changed rows updated, removed rows archived, so a printed
 * QR code still lands on the Resource (`11` §9).
 */
export async function syncTriggers(
  projectId: string,
  type: TriggerTargetType,
  id: string,
  desired: TriggerForm[],
  current?: Trigger[],
): Promise<Trigger[]> {
  current ??= await listTargetTriggers(projectId, type, id);
  // A new row identical to a trigger nobody kept is that trigger: a save that failed half-way created it.
  const unclaimed = current.filter((t) => !desired.some((d) => d.id === t.id));
  desired = desired.map((d) => {
    if (d.id) return d;
    const body = JSON.stringify(bodyOf(d));
    const match = unclaimed.findIndex((t) => t.triggerType === d.type
      && (d.type === "QR_CODE" && !d.code.trim() ? true : JSON.stringify(bodyOf(triggerToForm(t))) === body));
    return match < 0 ? d : { ...d, id: unclaimed.splice(match, 1)[0].id };
  });
  const kept = new Set(desired.flatMap((d) => (d.id ? [d.id] : [])));
  for (const old of current.filter((t) => !kept.has(t.id))) {
    await apiRequest(`${base(projectId)}/${encodeURIComponent(old.id)}/status`, {
      method: "POST",
      body: { targetStatus: "ARCHIVED", version: old.version },
    });
  }
  for (const [index, form] of desired.entries()) {
    const body = bodyOf(form);
    try {
      if (!form.id) {
        const created = await apiRequest<Trigger>(base(projectId), {
          method: "POST",
          body: { targetResourceType: type, targetResourceId: id, triggerType: form.type, ...body },
        });
        await apiRequest(`${base(projectId)}/${encodeURIComponent(created.id)}/status`, {
          method: "POST",
          body: { targetStatus: "ACTIVE", version: created.version },
        });
        continue;
      }
      const before = current.find((t) => t.id === form.id);
      // An emptied QR code keeps its code: printed codes must go on working.
      const wanted = before && form.type === "QR_CODE" && !body.code ? { ...body, code: before.code } : body;
      if (before && JSON.stringify(bodyOf(triggerToForm(before))) !== JSON.stringify(wanted)) {
        await apiRequest(`${base(projectId)}/${encodeURIComponent(form.id)}`, {
          method: "PUT",
          body: { version: before.version, ...wanted },
        });
      }
    } catch (e) {
      throw atRow(e, index);
    }
  }
  return listTargetTriggers(projectId, type, id);
}

/**
 * Saves the triggers, then the Resource through `saveResource`. The triggers go first, so a refused trigger stops
 * the save; when the rest is refused, the triggers are put back as they were, so a save that failed changed
 * nothing (DECISIONS.md D-044). Putting them back is best effort: when it fails too, the next save repairs them.
 */
export async function saveWithTriggers<R>(
  projectId: string,
  type: TriggerTargetType,
  id: string,
  desired: TriggerForm[],
  saveResource: () => Promise<R>,
): Promise<{ saved: R; triggers: Trigger[] }> {
  const before = await listTargetTriggers(projectId, type, id);
  try {
    const triggers = await syncTriggers(projectId, type, id, desired, before);
    return { saved: await saveResource(), triggers };
  } catch (e) {
    await restoreTriggers(projectId, type, id, before).catch(() => undefined);
    throw e;
  }
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
  BEACON: "bg-[#e3ecf7] text-[#1f4e8c]",
  GEO_PROXIMITY: "bg-[#e1f3ea] text-[#17643f]",
  QR_CODE: "bg-[#ececef] text-[#374151]",
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
