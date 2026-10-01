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

export function listPlaces(projectId: string, signal?: AbortSignal): Promise<Place[]> {
  return apiRequest<Place[]>(base(projectId), { signal });
}

export function fetchPlace(projectId: string, placeId: string, signal?: AbortSignal): Promise<Place> {
  return apiRequest<Place>(`${base(projectId)}/${encodeURIComponent(placeId)}`, { signal });
}

export function createPlace(projectId: string, input: CreatePlaceInput): Promise<Place> {
  return apiRequest<Place>(base(projectId), { method: "POST", body: input });
}

export function updatePlace(projectId: string, placeId: string, input: UpdatePlaceInput): Promise<Place> {
  return apiRequest<Place>(`${base(projectId)}/${encodeURIComponent(placeId)}`, { method: "PUT", body: input });
}

export function changePlaceStatus(
  projectId: string,
  placeId: string,
  targetStatus: ResourceStatus,
  version: number,
): Promise<Place> {
  return apiRequest<Place>(`${base(projectId)}/${encodeURIComponent(placeId)}/status`, {
    method: "POST",
    body: { targetStatus, version },
  });
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

export function fetchSpatialLink(projectId: string, placeId: string): Promise<SpatialLink> {
  return apiRequest<SpatialLink>(`${base(projectId)}/${encodeURIComponent(placeId)}/spatial-link`);
}

/** Links the map or floor plan at once, moving the link from wherever it was; both null unlinks. */
export function setSpatialLink(projectId: string, placeId: string, link: SpatialLink): Promise<SpatialLink> {
  return apiRequest<SpatialLink>(`${base(projectId)}/${encodeURIComponent(placeId)}/spatial-link`, { method: "PUT", body: link });
}
