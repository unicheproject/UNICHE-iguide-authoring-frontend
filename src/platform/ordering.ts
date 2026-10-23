import { apiRequest } from "./api";

/**
 * The manual order of a content kind (iGuide spec 07 section 14, `PUT .../{kind}:order`). The body lists every
 * id of the Project exactly once, archived ones included; the backend writes `sortOrder` without touching
 * `version`, so ACTIVE Resources and their working copies are not affected.
 */
export type OrderedKind = "places" | "pois" | "routes" | "guides" | "events" | "categories" | "floor-plans";

export function saveOrder(projectId: string, kind: OrderedKind, ids: string[]): Promise<void> {
  return apiRequest<void>(`/projects/${encodeURIComponent(projectId)}/${kind}:order`, { method: "PUT", body: { ids } });
}
