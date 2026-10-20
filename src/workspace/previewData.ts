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
