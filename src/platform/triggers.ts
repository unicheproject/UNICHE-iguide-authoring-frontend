import { ApiError, apiRequest } from "./api";
import type { ResourceStatus } from "./places";

/*
 * Interaction Triggers (`03` §14, backend D-026): how visitors reach a Resource in place. They have no
 * screen of their own (`12` §3); the editor of their target edits them and `syncTriggers` saves them after
 * the Resource itself.
 */

export type TriggerType = "QR_CODE" | "BEACON" | "GEO_PROXIMITY";

export interface Trigger {
  id: string;
  triggerType: TriggerType;
  targetResourceType: "POI";
  targetResourceId: string;
  code: string | null;
  supportedSurfaces: string[] | null;
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
  };
}

/** The non-archived triggers of a Point of Interest, in their order. */
export async function listPoiTriggers(projectId: string, poiId: string): Promise<Trigger[]> {
  const triggers: Trigger[] = [];
  for (let page = 0; ; page++) {
    const result = await apiRequest<Page<Trigger>>(
      `${base(projectId)}?targetResourceType=POI&targetResourceId=${encodeURIComponent(poiId)}&size=200&page=${page}`,
    );
    triggers.push(...result.content.filter((t) => t.status !== "ARCHIVED"));
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

const num = (value: string) => (value.trim() === "" ? null : Number.isNaN(Number(value)) ? value.trim() : Number(value));

function bodyOf(form: TriggerForm): { code: string | null; configuration: Record<string, unknown> } {
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
    const m = /^(?:configuration\.)?(code|uuid|major|minor|proximityMeters|cooldownSeconds|latitude|longitude|radiusMeters): (.*)$/.exec(d);
    return m ? `triggers[${index}].${m[1]}: ${m[2]}` : `triggers[${index}]: ${d.replace(/^[^:]*: /, "")}`;
  });
  if (!details.length) details.push(`triggers[${index}]: ${e.message}`);
  return new ApiError(e.status, e.code, e.message, e.requestId, details, e.body);
}

/**
 * Makes the Point of Interest's triggers exactly `desired`: new rows are created and activated (a trigger
 * opens its target only when both are ACTIVE), changed rows updated, removed rows archived, so a printed
 * QR code still lands on the Resource (`11` §9).
 */
export async function syncPoiTriggers(projectId: string, poiId: string, desired: TriggerForm[]): Promise<Trigger[]> {
  const current = await listPoiTriggers(projectId, poiId);
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
          body: { targetResourceType: "POI", targetResourceId: poiId, triggerType: form.type, ...body },
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
          body: { version: before.version, supportedSurfaces: before.supportedSurfaces, ...wanted },
        });
      }
    } catch (e) {
      throw atRow(e, index);
    }
  }
  return listPoiTriggers(projectId, poiId);
}

export const TRIGGER_LABELS: Record<TriggerType, string> = {
  BEACON: "Bluetooth beacon",
  GEO_PROXIMITY: "Geo-proximity",
  QR_CODE: "QR code",
};
