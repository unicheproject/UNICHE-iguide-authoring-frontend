import { listAssets, type Asset } from "@/platform/assets";
import { listEvents, type CmsEvent } from "@/platform/events";
import { listGuides, type Guide } from "@/platform/guides";
import { fetchProjectLanguages, type ProjectLanguage } from "@/platform/languages";
import { listMaps, type GeoMap } from "@/platform/maps";
import type { ResourceStatus } from "@/platform/places";
import { listPlaces, type Place } from "@/platform/places";
import { listPois, type Poi } from "@/platform/pois";
import { listRoutes, type Route } from "@/platform/routes";
import { listProjectTriggers, type Trigger } from "@/platform/triggers";
import { fetchWorkingCopy, type WorkingCopyKind } from "@/platform/workingCopies";

/*
 * Everything the stand-in visitor app shows (DECISIONS.md D-015), read from the authoring endpoints until
 * the runtime manifest exists (`11` §3). "Working" shows drafts and active content, as the preview view of
 * `12` §3 does; "Live" only active content, as visitors see it.
 */

export type PreviewMode = "WORKING" | "LIVE";

export interface PreviewData {
  places: Place[];
  pois: Poi[];
  routes: Route[];
  guides: Guide[];
  events: CmsEvent[];
  assets: Asset[];
  maps: GeoMap[];
  languages: ProjectLanguage[];
  triggers: Trigger[];
}

export async function loadPreviewData(projectId: string, signal?: AbortSignal): Promise<PreviewData> {
  const [places, pois, routes, guides, events, assets, maps, languages, triggers] = await Promise.all([
    listPlaces(projectId, signal),
    listPois(projectId, signal),
    listRoutes(projectId, signal),
    listGuides(projectId, signal),
    listEvents(projectId, signal),
    listAssets(projectId, signal),
    listMaps(projectId, signal),
    fetchProjectLanguages(projectId, signal),
    listProjectTriggers(projectId, signal),
  ]);
  return { places, pois, routes, guides, events, assets, maps, languages: languages.languages, triggers };
}

const shown = (mode: PreviewMode) => (status: ResourceStatus) => (mode === "LIVE" ? status === "ACTIVE" : status !== "ARCHIVED");

/** The content a visitor of the given mode would meet; the asset library and languages are kept whole. */
export function visibleData(data: PreviewData, mode: PreviewMode): PreviewData {
  const ok = shown(mode);
  return {
    ...data,
    places: data.places.filter((p) => ok(p.status)),
    pois: data.pois.filter((p) => ok(p.status)),
    routes: data.routes.filter((r) => ok(r.status)),
    guides: data.guides.filter((g) => ok(g.status)),
    events: data.events.filter((e) => ok(e.status)),
    maps: data.maps.filter((m) => ok(m.status)),
    triggers: data.triggers.filter((t) => ok(t.status)),
  };
}

/** Whether the Resource a trigger opens is in the data of the current mode (Live hides drafts). */
export function previewHas(data: PreviewData, target: { type: "PLACE" | "POI" | "ROUTE" | "GUIDE" | "EVENT"; id: string }): boolean {
  const lists = { PLACE: data.places, POI: data.pois, ROUTE: data.routes, GUIDE: data.guides, EVENT: data.events };
  return lists[target.type].some((r) => r.id === target.id);
}

/** What the Working Copies added to the data: how many pending edits exist, and how many could not be read. */
export interface WorkingOverlay {
  /** Active items with a pending edit. */
  pending: number;
  /** Pending edits whose content is drawn. */
  applied: number;
  /** Pending edits that could not be read or no longer pass the rules; the live content is drawn for them. */
  failed: number;
}

interface Pendable {
  id: string;
  status: ResourceStatus;
  hasWorkingCopy: boolean;
}

/** Reads at most this many Working Copies at once, so a large Project does not flood the API. */
const WORKING_COPY_CONCURRENCY = 6;

/**
 * "Working" content of the preview view (`12` §3: "renders the Working Copy in place of the live rows"): each active
 * item with a pending edit is read through its Working Copy endpoint and its `resource` (the read model as it would
 * read after apply, backend D-027) replaces the live row. Drafts are their own rows already. A copy that cannot be
 * read keeps its live row and is counted, so the page can say so (G-034). The Working Copy is read with the author's
 * token only and nothing is written.
 */
export async function withWorkingCopies(
  projectId: string,
  data: PreviewData,
  signal?: AbortSignal,
): Promise<{ data: PreviewData; overlay: WorkingOverlay }> {
  const overlay: WorkingOverlay = { pending: 0, applied: 0, failed: 0 };
  const jobs: (() => Promise<void>)[] = [];
  const copy = { ...data };

  function plan<K extends "places" | "pois" | "routes" | "guides" | "events" | "maps">(key: K, kind: WorkingCopyKind) {
    const rows = data[key] as unknown as Pendable[];
    const next = [...rows];
    for (const [index, row] of rows.entries()) {
      if (row.status !== "ACTIVE" || !row.hasWorkingCopy) continue;
      overlay.pending += 1;
      jobs.push(async () => {
        try {
          const response = await fetchWorkingCopy(projectId, kind, row.id);
          const resource = response.resource;
          if (!resource || typeof resource !== "object" || (resource as { id?: unknown }).id !== row.id) {
            overlay.failed += 1;
            return;
          }
          next[index] = { ...row, ...resource, id: row.id, status: row.status, hasWorkingCopy: true } as Pendable;
          overlay.applied += 1;
        } catch (e) {
          if (e instanceof DOMException && e.name === "AbortError") throw e;
          overlay.failed += 1;
        }
      });
    }
    (copy as Record<string, unknown>)[key] = next;
  }
  plan("places", "places");
  plan("pois", "pois");
  plan("routes", "routes");
  plan("guides", "guides");
  plan("events", "events");
  plan("maps", "maps");

  const queue = [...jobs];
  const worker = async () => {
    for (let job = queue.shift(); job; job = queue.shift()) {
      if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
      await job();
    }
  };
  await Promise.all(Array.from({ length: Math.min(WORKING_COPY_CONCURRENCY, jobs.length) }, worker));
  return { data: copy, overlay };
}
