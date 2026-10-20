import { apiRequest } from "./api";
import type { ResourceReference } from "./references";

export type ResourceStatus = "DRAFT" | "ACTIVE" | "ARCHIVED";

export const PLACE_TYPES = ["REGION", "DESTINATION", "SITE", "BUILDING", "FLOOR", "ROOM", "AREA", "OTHER"] as const;
export type PlaceType = (typeof PLACE_TYPES)[number];

/** Indoor places put their Points of Interest on a floor plan, outdoor ones on a geographic map. */
export const PLACE_SETTINGS = ["OUTDOOR", "INDOOR"] as const;
export type PlaceSetting = (typeof PLACE_SETTINGS)[number];
export const PLACE_SETTING_LABELS: Record<PlaceSetting, { label: string; hint: string; uses: string }> = {
  OUTDOOR: { label: "Outdoor", hint: "Site, area, trail. Uses a geographic map", uses: "Geographic map" },
  INDOOR: { label: "Indoor", hint: "Building, floor, room. Uses a floor plan", uses: "Floor plan" },
};
/** The types that fit each setting, in the order the type picker offers them. */
export const PLACE_TYPES_BY_SETTING: Record<PlaceSetting, PlaceType[]> = {
  OUTDOOR: ["SITE", "AREA", "DESTINATION", "REGION", "OTHER"],
  INDOOR: ["BUILDING", "FLOOR", "ROOM", "OTHER"],
};

export interface PlaceTranslation {
  title: string | null;
  summary: string | null;
  description: string | null;
  visitorInformation: string | null;
  accessibilityInformation: string | null;
}

export const PLACE_TEXT_FIELDS = [
  "title",
  "summary",
  "description",
  "visitorInformation",
  "accessibilityInformation",
] as const satisfies readonly (keyof PlaceTranslation)[];

export interface Place {
  id: string;
  projectId: string;
  parentPlaceId: string | null;
  slug: string;
  type: PlaceType;
  setting: PlaceSetting;
  status: ResourceStatus;
  internalName: string | null;
  latitude: number | null;
  longitude: number | null;
  featured: boolean;
  sortOrder: number;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
  version: number;
  hasWorkingCopy: boolean;
  workingCopyUpdatedAt: string | null;
  /** Keyed by language code. */
  translations: Record<string, PlaceTranslation>;
}

export interface CreatePlaceInput {
  /** In the Project's default language. */
  title: string;
  slug: string;
  type: PlaceType;
  parentPlaceId: string | null;
  setting: PlaceSetting;
}

export interface UpdatePlaceInput {
  version: number;
  slug: string;
  type: PlaceType;
  setting: PlaceSetting;
  parentPlaceId: string | null;
  internalName: string | null;
  latitude: number | null;
  longitude: number | null;
  featured: boolean;
  translations: Record<string, PlaceTranslation>;
}

const base = (projectId: string) => `/projects/${encodeURIComponent(projectId)}/places`;

/*
 * Stopgap until the generated client (PLAN.md C0b, C3): the backend calls `setting` `environment`
 * (backend D-018) and pages its lists, so responses and request bodies are translated here.
 */

/** A Place as the backend returns it. */
type PlaceResponse = Omit<Place, "setting"> & { environment: PlaceSetting };

interface Page<T> {
  content: T[];
  page: number;
  totalPages: number;
}

const toPlace = ({ environment, ...rest }: PlaceResponse): Place => ({ ...rest, setting: environment });

function toBody<T extends { setting: PlaceSetting }>({ setting, ...rest }: T) {
  return { ...rest, environment: setting };
}

/** Every Place of the Project, in order: the backend serves at most 200 per page. */
export async function listPlaces(projectId: string, signal?: AbortSignal): Promise<Place[]> {
  const places: Place[] = [];
  for (let page = 0; ; page++) {
    const result = await apiRequest<Page<PlaceResponse>>(`${base(projectId)}?size=200&page=${page}`, { signal });
    places.push(...result.content.map(toPlace));
    if (page + 1 >= result.totalPages) return places;
  }
}

export async function fetchPlace(projectId: string, placeId: string, signal?: AbortSignal): Promise<Place> {
  return toPlace(await apiRequest<PlaceResponse>(`${base(projectId)}/${encodeURIComponent(placeId)}`, { signal }));
}

export async function createPlace(projectId: string, input: CreatePlaceInput): Promise<Place> {
  return toPlace(await apiRequest<PlaceResponse>(base(projectId), { method: "POST", body: toBody(input) }));
}

export async function updatePlace(projectId: string, placeId: string, input: UpdatePlaceInput): Promise<Place> {
  return toPlace(
    await apiRequest<PlaceResponse>(`${base(projectId)}/${encodeURIComponent(placeId)}`, {
      method: "PUT",
      body: toBody(input),
    }),
  );
}

export async function changePlaceStatus(
  projectId: string,
  placeId: string,
  targetStatus: ResourceStatus,
  version: number,
): Promise<Place> {
  return toPlace(
    await apiRequest<PlaceResponse>(`${base(projectId)}/${encodeURIComponent(placeId)}/status`, {
      method: "POST",
      body: { targetStatus, version },
    }),
  );
}

/** Title in the given language, then the default, then the slug. */
export function placeTitle(place: Place, languageCode: string | null, defaultLanguage: string | null): string {
  const pick = (code: string | null) => (code ? place.translations[code]?.title?.trim() : undefined);
  return pick(languageCode) || pick(defaultLanguage) || place.slug;
}

export type Completeness = "complete" | "partial" | "missing";

export function translationCompleteness(place: Place, languageCode: string): Completeness {
  const t = place.translations[languageCode];
  const filled = t ? PLACE_TEXT_FIELDS.filter((f) => t[f]?.trim()).length : 0;
  if (filled === 0) return "missing";
  return filled === PLACE_TEXT_FIELDS.length ? "complete" : "partial";
}

/** Resources that still use the Place; non-empty blocks deactivation and archival. */
export function fetchPlaceReferences(projectId: string, placeId: string): Promise<ResourceReference[]> {
  return apiRequest<ResourceReference[]>(`${base(projectId)}/${encodeURIComponent(placeId)}/references`);
}

/** The map (outdoor) or floor plan (indoor) a Place's page shows. */
export interface SpatialLink {
  mapId: string | null;
  floorPlanId: string | null;
}

/*
 * The backend has no `spatial-link` endpoint: the link is `placeId` on the map or floor plan
 * (backend D-018). These two functions keep the editor's shape on top of that.
 */

type Linkable = Record<string, unknown> & { id: string; placeId: string | null; version: number };

const projectPath = (projectId: string) => `/projects/${encodeURIComponent(projectId)}`;

async function linkedTo(projectId: string, kind: "maps" | "floor-plans", placeId: string): Promise<Linkable[]> {
  const query = kind === "floor-plans" ? `&placeId=${encodeURIComponent(placeId)}` : "";
  const page = await apiRequest<Page<Linkable>>(`${projectPath(projectId)}/${kind}?size=200${query}`);
  return page.content.filter((item) => item.placeId === placeId);
}

export async function fetchSpatialLink(projectId: string, placeId: string): Promise<SpatialLink> {
  const [maps, plans] = await Promise.all([
    linkedTo(projectId, "maps", placeId),
    linkedTo(projectId, "floor-plans", placeId),
  ]);
  return { mapId: maps[0]?.id ?? null, floorPlanId: plans[0]?.id ?? null };
}

/** Re-saves a map or floor plan with another `placeId`; only DRAFT ones can be saved. */
async function relink(projectId: string, kind: "maps" | "floor-plans", item: Linkable, placeId: string | null) {
  await apiRequest(`${projectPath(projectId)}/${kind}/${encodeURIComponent(item.id)}`, {
    method: "PUT",
    body: { ...item, placeId },
  });
}

/** Links the map or floor plan, unlinking whatever the Place showed before; both null unlinks. */
export async function setSpatialLink(projectId: string, placeId: string, link: SpatialLink): Promise<SpatialLink> {
  const [maps, plans] = await Promise.all([
    linkedTo(projectId, "maps", placeId),
    linkedTo(projectId, "floor-plans", placeId),
  ]);
  for (const map of maps.filter((m) => m.id !== link.mapId)) await relink(projectId, "maps", map, null);
  for (const plan of plans.filter((p) => p.id !== link.floorPlanId)) await relink(projectId, "floor-plans", plan, null);
  if (link.mapId && !maps.some((m) => m.id === link.mapId)) {
    const map = await apiRequest<Linkable>(`${projectPath(projectId)}/maps/${encodeURIComponent(link.mapId)}`);
    await relink(projectId, "maps", map, placeId);
  }
  if (link.floorPlanId && !plans.some((p) => p.id === link.floorPlanId)) {
    const plan = await apiRequest<Linkable>(`${projectPath(projectId)}/floor-plans/${encodeURIComponent(link.floorPlanId)}`);
    await relink(projectId, "floor-plans", plan, placeId);
  }
  return fetchSpatialLink(projectId, placeId);
}
