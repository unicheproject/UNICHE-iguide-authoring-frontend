import { apiRequest } from "./api";
import type { ResourceStatus } from "./places";
import type { ResourceReference } from "./references";

/** What can be placed on a map or floor plan. */
export type PlaceableType = "POI" | "PLACE";

export interface MapPlacement {
  resourceType: PlaceableType;
  resourceId: string;
  latitude: number;
  longitude: number;
}

/** A Geographic Map (iGuide spec 03, section 7; CMS mockup of 2026-10-01). */
export interface GeoMap {
  id: string;
  projectId: string;
  status: ResourceStatus;
  internalName: string;
  /** The outdoor Place whose page shows the map. */
  placeId: string | null;
  initialLatitude: number;
  initialLongitude: number;
  initialZoom: number;
  minLatitude: number | null;
  minLongitude: number | null;
  maxLatitude: number | null;
  maxLongitude: number | null;
  /** The area the map was searched as, such as "Apollonas, Naxos". */
  area: string | null;
  osmId: string | null;
  showPois: boolean;
  showRoutes: boolean;
  hiddenCategoryIds: string[];
  /** Visitors get a filter bar by type and Category. */
  visitorFilter: boolean;
  sortOrder: number;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
  version: number;
  placements: MapPlacement[];
}

export interface CreateMapInput {
  internalName: string;
  placeId: string | null;
  initialLatitude: number;
  initialLongitude: number;
  initialZoom: number;
  minLatitude: number;
  minLongitude: number;
  maxLatitude: number;
  maxLongitude: number;
  area: string | null;
  osmId: string | null;
}

export type UpdateMapInput = Omit<GeoMap, "id" | "projectId" | "status" | "area" | "osmId" | "sortOrder" | "archivedAt" | "createdAt" | "updatedAt" | "minLatitude" | "minLongitude" | "maxLatitude" | "maxLongitude"> & {
  minLatitude: number | null;
  minLongitude: number | null;
  maxLatitude: number | null;
  maxLongitude: number | null;
};

const base = (projectId: string) => `/projects/${encodeURIComponent(projectId)}/maps`;

export const listMaps = (projectId: string, signal?: AbortSignal) => apiRequest<GeoMap[]>(base(projectId), { signal });
export const fetchMap = (projectId: string, mapId: string) => apiRequest<GeoMap>(`${base(projectId)}/${encodeURIComponent(mapId)}`);
export const createMap = (projectId: string, input: CreateMapInput) => apiRequest<GeoMap>(base(projectId), { method: "POST", body: input });
export const updateMap = (projectId: string, mapId: string, input: UpdateMapInput) =>
  apiRequest<GeoMap>(`${base(projectId)}/${encodeURIComponent(mapId)}`, { method: "PUT", body: input });
export const changeMapStatus = (projectId: string, mapId: string, targetStatus: ResourceStatus, version: number) =>
  apiRequest<GeoMap>(`${base(projectId)}/${encodeURIComponent(mapId)}/status`, { method: "POST", body: { targetStatus, version } });
export const fetchMapReferences = (projectId: string, mapId: string) =>
  apiRequest<ResourceReference[]>(`${base(projectId)}/${encodeURIComponent(mapId)}/references`);

/** One result of an area search on OpenStreetMap Nominatim. */
export interface AreaResult {
  placeId: number;
  name: string;
  rest: string;
  kind: string;
  displayName: string;
  osmId: string;
  /** South, north, west, east. */
  bounds: [number, number, number, number];
}

/**
 * Searches an area by name on OpenStreetMap Nominatim, as the mockup's "New map" does. The service allows
 * about one request a second and asks for attribution; it is called only when the author presses Search.
 */
export async function searchArea(query: string, language: string | null): Promise<AreaResult[]> {
  const url =
    "https://nominatim.openstreetmap.org/search?format=jsonv2&limit=6&addressdetails=0" +
    (language ? `&accept-language=${encodeURIComponent(language)}` : "") +
    `&q=${encodeURIComponent(query)}`;
  const response = await fetch(url, { headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error(`Nominatim answered ${response.status}`);
  const rows = (await response.json()) as {
    place_id: number;
    display_name: string;
    addresstype?: string;
    type?: string;
    osm_type: string;
    osm_id: number;
    boundingbox: [string, string, string, string];
  }[];
  return rows.map((r) => {
    const parts = r.display_name.split(", ");
    return {
      placeId: r.place_id,
      name: parts[0],
      rest: parts.slice(1).join(", "),
      kind: (r.addresstype || r.type || "").replace(/_/g, " "),
      displayName: r.display_name,
      osmId: `${r.osm_type}/${r.osm_id}`,
      bounds: r.boundingbox.map(Number) as [number, number, number, number],
    };
  });
}
