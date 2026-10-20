import { apiRequest } from "./api";

/** The content kinds the Visitor app overview counts, by their collection path and workspace section. */
export const CONTENT_KINDS = [
  { path: "places", section: "places", label: "Places" },
  { path: "pois", section: "pois", label: "Points of Interest" },
  { path: "routes", section: "routes", label: "Routes" },
  { path: "guides", section: "guides", label: "Guides" },
  { path: "events", section: "events", label: "Events" },
  { path: "categories", section: "categories", label: "Categories" },
  { path: "assets", section: "media", label: "Media" },
  { path: "maps", section: "maps", label: "Maps" },
  { path: "floor-plans", section: "floor-plans", label: "Floor plans" },
] as const;

export type ContentKind = (typeof CONTENT_KINDS)[number];

export interface ContentCount {
  kind: ContentKind;
  active: number;
  draft: number;
}

interface Page {
  totalElements: number;
}

/*
 * Counts without loading the lists: every collection pages and filters by status, so one row per status
 * (`size=1`) carries the total. Stopgap until `GET .../statistics` exists (`05` §8, backend G-024 area).
 */
async function count(projectId: string, path: string, status: "ACTIVE" | "DRAFT", signal?: AbortSignal): Promise<number> {
  const page = await apiRequest<Page>(
    `/projects/${encodeURIComponent(projectId)}/${path}?size=1&status=${status}`,
    { signal },
  );
  return page.totalElements;
}

/** Active and draft counts of every content kind of the Project; archived content is not counted. */
export function fetchContentCounts(projectId: string, signal?: AbortSignal): Promise<ContentCount[]> {
  return Promise.all(
    CONTENT_KINDS.map(async (kind) => {
      const [active, draft] = await Promise.all([
        count(projectId, kind.path, "ACTIVE", signal),
        count(projectId, kind.path, "DRAFT", signal),
      ]);
      return { kind, active, draft };
    }),
  );
}
