import { ApiError, apiRequest } from "./api";
import { syncMedia, toMediaBindings, type MediaBinding, type MediaBindingResponse } from "./assets";
import type { ResourceStatus } from "./places";
import type { ResourceReference } from "./references";
import { setResourceCategory } from "./categories";

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

/*
 * Stopgap until the generated client (PLAN.md C0b, C3). The iGuide backend (D-021) follows `03` §9:
 * `travelMode` for `mode`, difficulty `HARD` for `DEMANDING`, no optional stops, no SEO texts, and stops
 * as a child collection (`.../routes/{id}/stops`, `.../stops:order`) instead of part of the route body.
 * The Category and the media are bindings (backend D-024, D-025): read from `categoryIds` and `media`,
 * saved through `.../routes/{id}/categories` and `.../routes/{id}/resource-assets` for a DRAFT Route, or inside
 * the working copy of an ACTIVE one, with the stops. The functions below keep
 * `Route`; a save carrying SEO text or an optional stop is refused at that field.
 */

type ApiDifficulty = "EASY" | "MODERATE" | "HARD";
type RouteTranslationResponse = Omit<RouteTranslation, "seoTitle" | "seoDescription">;
type StopTranslationResponse = RouteStopTranslation;

interface StopResponse {
  id: string;
  poiId: string;
  position: number;
  translations: Record<string, StopTranslationResponse>;
}

type RouteResponse = Omit<Route, "mode" | "difficulty" | "categoryId" | "media" | "translations" | "stops"> & {
  travelMode: RouteMode | null;
  difficulty: ApiDifficulty | null;
  computedDistanceMeters: number | null;
  translations: Record<string, RouteTranslationResponse>;
  stops: StopResponse[];
  categoryIds: string[];
  media: MediaBindingResponse[];
};

interface Page<T> {
  content: T[];
  totalPages: number;
}

const fromApiDifficulty = (d: ApiDifficulty | null): RouteDifficulty | null => (d === "HARD" ? "DEMANDING" : d);
const toApiDifficulty = (d: RouteDifficulty | null): ApiDifficulty | null => (d === "DEMANDING" ? "HARD" : d);

function toStop(stop: StopResponse): RouteStop {
  return { id: stop.id, poiId: stop.poiId, position: stop.position, optional: false, translations: stop.translations };
}

function toRoute({ travelMode, difficulty, computedDistanceMeters: _computed, translations, stops, categoryIds, media, ...rest }: RouteResponse): Route {
  const texts: Record<string, RouteTranslation> = {};
  for (const [code, t] of Object.entries(translations)) texts[code] = { ...t, seoTitle: null, seoDescription: null };
  return {
    ...rest,
    mode: travelMode,
    difficulty: fromApiDifficulty(difficulty),
    categoryId: categoryIds[0] ?? null,
    media: toMediaBindings(media),
    translations: texts,
    stops: stops.map(toStop),
  };
}

function unsupported(input: Omit<UpdateRouteInput, "version">): string[] {
  const details: string[] = [];
  for (const [code, t] of Object.entries(input.translations)) {
    if (t.seoTitle?.trim()) details.push(`translations.${code}.seoTitle: SEO texts are not stored by iGuide.`);
    if (t.seoDescription?.trim()) details.push(`translations.${code}.seoDescription: SEO texts are not stored by iGuide.`);
  }
  input.stops.forEach((stop, i) => {
    if (stop.optional) details.push(`stops[${i}].optional: Every stop is part of the route; optional stops are not supported.`);
  });
  return details;
}

const stopsPath = (projectId: string, routeId: string) => `${base(projectId)}/${encodeURIComponent(routeId)}/stops`;

/** Every Route of the Project, in order: the backend serves at most 200 per page. */
export async function listRoutes(projectId: string, signal?: AbortSignal): Promise<Route[]> {
  const routes: Route[] = [];
  for (let page = 0; ; page++) {
    const result = await apiRequest<Page<RouteResponse>>(`${base(projectId)}?size=200&page=${page}`, { signal });
    routes.push(...result.content.map(toRoute));
    if (page + 1 >= result.totalPages) return routes;
  }
}

export async function fetchRoute(projectId: string, routeId: string, signal?: AbortSignal): Promise<Route> {
  return toRoute(await apiRequest<RouteResponse>(`${base(projectId)}/${encodeURIComponent(routeId)}`, { signal }));
}

export async function createRoute(projectId: string, input: CreateRouteInput): Promise<Route> {
  return toRoute(await apiRequest<RouteResponse>(base(projectId), { method: "POST", body: input }));
}

/** Refuses locally what iGuide cannot store, then splits the input into the Route body and its children. */
function toBody(input: Omit<UpdateRouteInput, "version">) {
  const details = unsupported(input);
  if (details.length) throw new ApiError(422, "VALIDATION_ERROR", "Some fields cannot be saved in iGuide yet.", null, details);

  const { mode, difficulty, categoryId, media, stops, translations, ...rest } = input;
  const texts: Record<string, RouteTranslationResponse> = {};
  for (const [code, { seoTitle: _t, seoDescription: _d, ...t }] of Object.entries(translations)) texts[code] = t;
  return {
    body: { ...rest, travelMode: mode, difficulty: toApiDifficulty(difficulty), translations: texts },
    categoryId,
    media,
    stops,
  };
}

/**
 * Saves the Route's own fields, then brings its stops in line with `input.stops`: stops left out are
 * removed, saved ones updated, new ones added, and the order set when it changed.
 */
export async function updateRoute(projectId: string, routeId: string, input: UpdateRouteInput): Promise<Route> {
  const { body, categoryId, media, stops } = toBody(input);
  const saved = await apiRequest<RouteResponse>(`${base(projectId)}/${encodeURIComponent(routeId)}`, {
    method: "PUT",
    body: { ...body, version: input.version },
  });

  const path = stopsPath(projectId, routeId);
  const wanted = new Set(stops.flatMap((s) => (s.id ? [s.id] : [])));
  for (const current of saved.stops.filter((s) => !wanted.has(s.id))) {
    await apiRequest(`${path}/${encodeURIComponent(current.id)}`, { method: "DELETE" });
  }
  const order: string[] = [];
  for (const stop of stops) {
    const body = { poiId: stop.poiId, translations: stop.translations };
    if (stop.id) {
      await apiRequest(`${path}/${encodeURIComponent(stop.id)}`, { method: "PUT", body });
      order.push(stop.id);
    } else {
      order.push((await apiRequest<StopResponse>(path, { method: "POST", body })).id);
    }
  }
  const after = await apiRequest<StopResponse[]>(path);
  if (after.map((s) => s.id).join() !== order.join()) {
    await apiRequest(`${path}:order`, { method: "PUT", body: { ids: order } });
  }
  await setResourceCategory(projectId, "routes", routeId, categoryId);
  await syncMedia(projectId, "routes", routeId, media);
  return fetchRoute(projectId, routeId);
}

/**
 * The working-copy payload of an ACTIVE Route (backend D-027): the update body without `version`, with the
 * ordered stops (a saved stop keeps its `id`), the Category, and the media (INLINE aside) inside it.
 */
export function routeWorkingCopyPayload(input: Omit<UpdateRouteInput, "version">): Record<string, unknown> {
  const { body, categoryId, media, stops } = toBody(input);
  return {
    ...body,
    stops: stops.map((stop) => ({ id: stop.id || null, poiId: stop.poiId, translations: stop.translations })),
    categoryIds: categoryId ? [categoryId] : [],
    media: media.filter((b) => b.usage !== "INLINE"),
  };
}

/** A Route as the backend renders a working copy or an apply. */
export const routeFromResponse = (raw: unknown): Route => toRoute(raw as RouteResponse);

export async function changeRouteStatus(projectId: string, routeId: string, targetStatus: ResourceStatus, version: number): Promise<Route> {
  return toRoute(
    await apiRequest<RouteResponse>(`${base(projectId)}/${encodeURIComponent(routeId)}/status`, {
      method: "POST",
      body: { targetStatus, version },
    }),
  );
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
