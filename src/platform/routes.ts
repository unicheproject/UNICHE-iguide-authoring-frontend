import { apiRequest } from "./api";
import type { MediaBinding } from "./assets";
import type { ResourceStatus } from "./places";
import type { ResourceReference } from "./references";

/** Indoor routes run through a building on floor plans, outdoor ones over a site or a city on a map. */
export const ROUTE_TYPES = ["INDOOR", "OUTDOOR"] as const;
export type RouteType = (typeof ROUTE_TYPES)[number];

export const ROUTE_DIFFICULTIES = ["EASY", "MODERATE", "DEMANDING"] as const;

export const ROUTE_MODES = ["WALKING", "HIKING", "BIKING", "CAR", "SAILING"] as const;
export type RouteMode = (typeof ROUTE_MODES)[number];
export type RouteDifficulty = (typeof ROUTE_DIFFICULTIES)[number];

export interface RouteTranslation {
  title: string | null;
  summary: string | null;
  description: string | null;
  instructions: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
}

/** Fields that count towards translation completeness; the SEO fields are optional extras. */
export const ROUTE_TEXT_FIELDS = ["title", "summary", "description", "instructions"] as const;

export interface RouteStopTranslation {
  /** Null means the Point of Interest's title is used. */
  titleOverride: string | null;
  description: string | null;
  navigationInstructions: string | null;
  narrative: string | null;
}

export interface RouteStop {
  /** Null for a stop that is not saved yet. */
  id: string | null;
  poiId: string;
  position: number;
  optional: boolean;
  translations: Record<string, RouteStopTranslation>;
}

export interface Route {
  id: string;
  projectId: string;
  slug: string;
  type: RouteType;
  status: ResourceStatus;
  difficulty: RouteDifficulty | null;
  mode: RouteMode | null;
  /** At most one Category that applies to Routes. */
  categoryId: string | null;
  estimatedDurationMinutes: number | null;
  distanceMeters: number | null;
  loop: boolean;
  internalName: string | null;
  featured: boolean;
  sortOrder: number;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
  version: number;
  hasWorkingCopy: boolean;
  workingCopyUpdatedAt: string | null;
  translations: Record<string, RouteTranslation>;
  stops: RouteStop[];
  media: MediaBinding[];
}

export interface CreateRouteInput {
  title: string;
  slug: string;
  type: RouteType;
}

/** Full update including the complete, ordered stop list. */
export interface UpdateRouteInput {
  version: number;
  slug: string;
  type: RouteType;
  difficulty: RouteDifficulty | null;
  mode: RouteMode | null;
  categoryId: string | null;
  loop: boolean;
  estimatedDurationMinutes: number | null;
  distanceMeters: number | null;
  internalName: string | null;
  featured: boolean;
  translations: Record<string, RouteTranslation>;
  stops: RouteStop[];
  media: MediaBinding[];
}

const base = (projectId: string) => `/projects/${encodeURIComponent(projectId)}/routes`;

export function listRoutes(projectId: string, signal?: AbortSignal): Promise<Route[]> {
  return apiRequest<Route[]>(base(projectId), { signal });
}

export function fetchRoute(projectId: string, routeId: string, signal?: AbortSignal): Promise<Route> {
  return apiRequest<Route>(`${base(projectId)}/${encodeURIComponent(routeId)}`, { signal });
}

export function createRoute(projectId: string, input: CreateRouteInput): Promise<Route> {
  return apiRequest<Route>(base(projectId), { method: "POST", body: input });
}

export function updateRoute(projectId: string, routeId: string, input: UpdateRouteInput): Promise<Route> {
  return apiRequest<Route>(`${base(projectId)}/${encodeURIComponent(routeId)}`, { method: "PUT", body: input });
}

export function changeRouteStatus(projectId: string, routeId: string, targetStatus: ResourceStatus, version: number): Promise<Route> {
  return apiRequest<Route>(`${base(projectId)}/${encodeURIComponent(routeId)}/status`, {
    method: "POST",
    body: { targetStatus, version },
  });
}

export function routeTitle(route: Route, defaultLanguage: string | null): string {
  return (defaultLanguage ? route.translations[defaultLanguage]?.title?.trim() : undefined) || route.slug;
}

export function routeCompleteness(route: Route, languageCode: string): "complete" | "partial" | "missing" {
  const t = route.translations[languageCode];
  const filled = t ? ROUTE_TEXT_FIELDS.filter((f) => t[f]?.trim()).length : 0;
  if (filled === 0) return "missing";
  return filled === ROUTE_TEXT_FIELDS.length ? "complete" : "partial";
}

const TYPE_LABELS: Record<RouteType, string> = {
  INDOOR: "Indoor",
  OUTDOOR: "Outdoor",
};
const MODE_LABELS: Record<RouteMode, string> = { WALKING: "Walking", HIKING: "Hiking", BIKING: "Biking", CAR: "Car", SAILING: "Sailing" };
export const routeModeLabel = (mode: RouteMode) => MODE_LABELS[mode];
/** What the setting means, as the create dialog explains it. */
export const ROUTE_TYPE_HINTS: Record<RouteType, string> = {
  INDOOR: "Inside a building. Stops sit on floor plans",
  OUTDOOR: "On a site or in a city. Drawn on a map",
};
const DIFFICULTY_LABELS: Record<RouteDifficulty, string> = { EASY: "Easy", MODERATE: "Moderate", DEMANDING: "Demanding" };

export const routeTypeLabel = (type: RouteType) => TYPE_LABELS[type];
export const routeDifficultyLabel = (difficulty: RouteDifficulty) => DIFFICULTY_LABELS[difficulty];

/** Resources that still use the Route; non-empty blocks deactivation and archival. */
export function fetchRouteReferences(projectId: string, routeId: string): Promise<ResourceReference[]> {
  return apiRequest<ResourceReference[]>(`${base(projectId)}/${encodeURIComponent(routeId)}/references`);
}
