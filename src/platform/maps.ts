import { apiRequest } from "./api";
import type { ResourceStatus } from "./places";
import type { ResourceReference } from "./references";
import { listCategories } from "./categories";

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
  hasWorkingCopy: boolean;
  workingCopyUpdatedAt: string | null;
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

export type UpdateMapInput = Omit<GeoMap, "id" | "projectId" | "status" | "area" | "osmId" | "sortOrder" | "archivedAt" | "createdAt" | "updatedAt" | "hasWorkingCopy" | "workingCopyUpdatedAt" | "minLatitude" | "minLongitude" | "maxLatitude" | "maxLongitude"> & {
  minLatitude: number | null;
  minLongitude: number | null;
  maxLatitude: number | null;
  maxLongitude: number | null;
};

const base = (projectId: string) => `/projects/${encodeURIComponent(projectId)}/maps`;

/*
 * Stopgap until the generated client (PLAN.md C0b, C3). The iGuide backend (D-018) differs from the
 * shape this CMS was built on: lists are paged; `visibility` and `visitorFilterEnabled` replace
 * `showPois`, `showRoutes`, `hiddenCategoryIds`, `visitorFilter`; placements are a child collection
 * (`.../maps/{id}/resources`) rather than part of the map body. The functions below keep `GeoMap`.
 */

interface TypeVisibility {
  visible: boolean;
  hiddenCategoryIds: string[];
}

type MapResponse = Omit<GeoMap, "showPois" | "showRoutes" | "hiddenCategoryIds" | "visitorFilter" | "sortOrder" | "placements"> & {
  visibility: { POI: TypeVisibility; ROUTE: TypeVisibility };
  visitorFilterEnabled: boolean;
};

interface PlacementResponse extends MapPlacement {
  id: string;
}

interface Page<T> {
  content: T[];
  totalPages: number;
}

async function allPages<T>(path: string, signal?: AbortSignal): Promise<T[]> {
  const items: T[] = [];
  for (let page = 0; ; page++) {
    const separator = path.includes("?") ? "&" : "?";
    const result = await apiRequest<Page<T>>(`${path}${separator}size=200&page=${page}`, { signal });
    items.push(...result.content);
    if (page + 1 >= result.totalPages) return items;
  }
}

const placementsPath = (projectId: string, mapId: string) => `${base(projectId)}/${encodeURIComponent(mapId)}/resources`;

async function toGeoMap(projectId: string, map: MapResponse, signal?: AbortSignal): Promise<GeoMap> {
  return withPlacements(map, await apiRequest<PlacementResponse[]>(placementsPath(projectId, map.id), { signal }));
}

function withPlacements(map: MapResponse, placements: PlacementResponse[]): GeoMap {
  const { visibility, visitorFilterEnabled, ...rest } = map;
  return {
    ...rest,
    showPois: visibility.POI.visible,
    showRoutes: visibility.ROUTE.visible,
    hiddenCategoryIds: [...visibility.POI.hiddenCategoryIds, ...visibility.ROUTE.hiddenCategoryIds],
    visitorFilter: visitorFilterEnabled,
    sortOrder: 0,
    placements: placements.map(({ resourceType, resourceId, latitude, longitude }) => ({ resourceType, resourceId, latitude, longitude })),
  };
}

export async function listMaps(projectId: string, signal?: AbortSignal): Promise<GeoMap[]> {
  const maps = await allPages<MapResponse>(base(projectId), signal);
  return Promise.all(maps.map((map) => toGeoMap(projectId, map, signal)));
}

export async function fetchMap(projectId: string, mapId: string): Promise<GeoMap> {
  return toGeoMap(projectId, await apiRequest<MapResponse>(`${base(projectId)}/${encodeURIComponent(mapId)}`));
}

export async function createMap(projectId: string, input: CreateMapInput): Promise<GeoMap> {
  return toGeoMap(projectId, await apiRequest<MapResponse>(base(projectId), { method: "POST", body: input }));
}

/**
 * Saves the map, then brings its placements in line with `input.placements`: removed ones are deleted,
 * moved ones updated, new ones added.
 */
export async function updateMap(projectId: string, mapId: string, input: UpdateMapInput): Promise<GeoMap> {
  const { placements, ...fields } = input;
  await apiRequest<MapResponse>(`${base(projectId)}/${encodeURIComponent(mapId)}`, {
    method: "PUT",
    body: await toMapBody(projectId, fields),
  });
  const path = placementsPath(projectId, mapId);
  const current = await apiRequest<PlacementResponse[]>(path);
  const key = (p: { resourceType: string; resourceId: string }) => `${p.resourceType}:${p.resourceId}`;
  const wanted = new Map(placements.map((p) => [key(p), p]));
  const existing = new Map(current.map((p) => [key(p), p]));
  for (const p of current.filter((p) => !wanted.has(key(p)))) {
    await apiRequest(`${path}/${encodeURIComponent(p.id)}`, { method: "DELETE" });
  }
  for (const p of placements) {
    const before = existing.get(key(p));
    if (!before) {
      await apiRequest(path, { method: "POST", body: p });
    } else if (before.latitude !== p.latitude || before.longitude !== p.longitude) {
      await apiRequest(`${path}/${encodeURIComponent(before.id)}`, {
        method: "PUT",
        body: { latitude: p.latitude, longitude: p.longitude },
      });
    }
  }
  return fetchMap(projectId, mapId);
}

/** The map body of the backend from the CMS shape, `version` included when given. */
async function toMapBody(projectId: string, input: Omit<UpdateMapInput, "placements" | "version"> & { version?: number }) {
  const { showPois, showRoutes, hiddenCategoryIds, visitorFilter, ...rest } = input;
  // The backend keeps hidden Categories per type (backend D-024); each goes under its Category's scope.
  const scopes = hiddenCategoryIds.length
    ? new Map((await listCategories(projectId)).map((c) => [c.id, c.scope]))
    : new Map<string, string>();
  return {
    ...rest,
    visibility: {
      POI: { visible: showPois, hiddenCategoryIds: hiddenCategoryIds.filter((id) => scopes.get(id) !== "ROUTE") },
      ROUTE: { visible: showRoutes, hiddenCategoryIds: hiddenCategoryIds.filter((id) => scopes.get(id) === "ROUTE") },
    },
    visitorFilterEnabled: visitorFilter,
  };
}

/**
 * The working-copy payload of an ACTIVE map (backend D-027): the map body without `version` and its placements
 * as one list. The backend keeps an existing placement of the same target, so no placement ids are needed.
 */
export async function mapWorkingCopyPayload(projectId: string, input: Omit<UpdateMapInput, "version">): Promise<Record<string, unknown>> {
  const { placements, ...fields } = input;
  return {
    ...(await toMapBody(projectId, fields)),
    placements: placements.map(({ resourceType, resourceId, latitude, longitude }) => ({ resourceType, resourceId, latitude, longitude })),
  };
}

/** A map as the backend renders a working copy or an apply: the map with its placements embedded. */
export const mapFromResponse = (raw: unknown): GeoMap => {
  const { placements, ...map } = raw as MapResponse & { placements: PlacementResponse[] };
  return withPlacements(map, placements ?? []);
};

export async function changeMapStatus(projectId: string, mapId: string, targetStatus: ResourceStatus, version: number): Promise<GeoMap> {
  return toGeoMap(
    projectId,
    await apiRequest<MapResponse>(`${base(projectId)}/${encodeURIComponent(mapId)}/status`, { method: "POST", body: { targetStatus, version } }),
  );
}

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
