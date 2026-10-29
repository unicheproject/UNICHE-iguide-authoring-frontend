import { apiRequest } from "./api";
import { syncMedia, toMediaBindings, type MediaBinding, type MediaBindingResponse } from "./assets";
import type { ResourceStatus } from "./places";
import type { ResourceReference } from "./references";
import { setResourceCategory } from "./categories";

export interface PoiTranslation {
  title: string | null;
  summary: string | null;
  description: string | null;
  instructions: string | null;
  accessibilityInformation: string | null;
}

/** Fields that count towards translation completeness. */
export const POI_TEXT_FIELDS = [
  "title",
  "summary",
  "description",
  "instructions",
  "accessibilityInformation",
] as const satisfies readonly (keyof PoiTranslation)[];

export interface Poi {
  id: string;
  projectId: string;
  placeId: string | null;
  /** At most one Category that applies to Points of Interest. */
  categoryId: string | null;
  slug: string;
  /** Exhibit code a visitor types to open it. */
  code: string | null;
  status: ResourceStatus;
  internalName: string | null;
  latitude: number | null;
  longitude: number | null;
  estimatedVisitMinutes: number | null;
  featured: boolean;
  sortOrder: number;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
  version: number;
  hasWorkingCopy: boolean;
  workingCopyUpdatedAt: string | null;
  translations: Record<string, PoiTranslation>;
  media: MediaBinding[];
}

export interface CreatePoiInput {
  title: string;
  slug: string;
  placeId: string | null;
  code: string | null;
}

export interface UpdatePoiInput {
  version: number;
  slug: string;
  placeId: string | null;
  categoryId: string | null;
  code: string | null;
  internalName: string | null;
  latitude: number | null;
  longitude: number | null;
  estimatedVisitMinutes: number | null;
  featured: boolean;
  translations: Record<string, PoiTranslation>;
  /** The complete media list; its order is the order within each slot. */
  media: MediaBinding[];
}

const base = (projectId: string) => `/projects/${encodeURIComponent(projectId)}/pois`;

/*
 * Stopgap until the generated client (PLAN.md C0b, C3). The iGuide backend (D-020) pages its lists; there
 * are no SEO texts (removed from `03` on 2026-10-01, DECISIONS.md D-028). The Category and the media are bindings
 * (backend D-024, D-025): read from `categoryIds` and `media`, saved through `.../pois/{id}/categories`
 * and `.../pois/{id}/resource-assets` after a DRAFT POI itself, or inside the working copy of an ACTIVE one.
 */

type PoiResponse = Omit<Poi, "categoryId" | "media"> & {
  categoryIds: string[];
  media: MediaBindingResponse[];
};

interface Page<T> {
  content: T[];
  totalPages: number;
}

function toPoi({ categoryIds, media, ...response }: PoiResponse): Poi {
  return { ...response, categoryId: categoryIds[0] ?? null, media: toMediaBindings(media) };
}

/** Every Point of Interest of the Project, in order: the backend serves at most 200 per page. */
export async function listPois(projectId: string, signal?: AbortSignal): Promise<Poi[]> {
  const pois: Poi[] = [];
  for (let page = 0; ; page++) {
    const result = await apiRequest<Page<PoiResponse>>(`${base(projectId)}?size=200&page=${page}`, { signal });
    pois.push(...result.content.map(toPoi));
    if (page + 1 >= result.totalPages) return pois;
  }
}

export async function fetchPoi(projectId: string, poiId: string, signal?: AbortSignal): Promise<Poi> {
  return toPoi(await apiRequest<PoiResponse>(`${base(projectId)}/${encodeURIComponent(poiId)}`, { signal }));
}

export async function createPoi(projectId: string, input: CreatePoiInput): Promise<Poi> {
  return toPoi(await apiRequest<PoiResponse>(base(projectId), { method: "POST", body: input }));
}

/** Splits the input into the POI body and its bindings. */
function toBody(input: Omit<UpdatePoiInput, "version">) {
  const { categoryId, media, ...body } = input;
  return { body, categoryId, media };
}

export async function updatePoi(projectId: string, poiId: string, input: UpdatePoiInput): Promise<Poi> {
  const { body, categoryId, media } = toBody(input);
  await apiRequest<PoiResponse>(`${base(projectId)}/${encodeURIComponent(poiId)}`, {
    method: "PUT",
    body: { ...body, version: input.version },
  });
  await setResourceCategory(projectId, "pois", poiId, categoryId);
  await syncMedia(projectId, "pois", poiId, media);
  return fetchPoi(projectId, poiId);
}

/**
 * The working-copy payload of an ACTIVE Point of Interest (backend D-027): the update body without `version`,
 * with the Category and the media (INLINE aside, in display order) inside it instead of as separate calls.
 */
export function poiWorkingCopyPayload(input: Omit<UpdatePoiInput, "version">): Record<string, unknown> {
  const { body, categoryId, media } = toBody(input);
  return {
    ...body,
    categoryIds: categoryId ? [categoryId] : [],
    media: media.filter((b) => b.usage !== "INLINE"),
  };
}

/** A Point of Interest as the backend renders a working copy or an apply. */
export const poiFromResponse = (raw: unknown): Poi => toPoi(raw as PoiResponse);

export async function changePoiStatus(projectId: string, poiId: string, targetStatus: ResourceStatus, version: number): Promise<Poi> {
  return toPoi(
    await apiRequest<PoiResponse>(`${base(projectId)}/${encodeURIComponent(poiId)}/status`, {
      method: "POST",
      body: { targetStatus, version },
    }),
  );
}

export function poiTitle(poi: Poi, defaultLanguage: string | null): string {
  return (defaultLanguage ? poi.translations[defaultLanguage]?.title?.trim() : undefined) || poi.slug;
}

export function poiCompleteness(poi: Poi, languageCode: string): "complete" | "partial" | "missing" {
  const t = poi.translations[languageCode];
  const filled = t ? POI_TEXT_FIELDS.filter((f) => t[f]?.trim()).length : 0;
  if (filled === 0) return "missing";
  return filled === POI_TEXT_FIELDS.length ? "complete" : "partial";
}

/** Exhibit code: letters, digits, and single hyphens, at most 32 characters. */
export const POI_CODE_PATTERN = /^[A-Za-z0-9]+(-[A-Za-z0-9]+)*$/;

/** Resources that still use the Point of Interest; non-empty blocks deactivation and archival. */
export function fetchPoiReferences(projectId: string, poiId: string): Promise<ResourceReference[]> {
  return apiRequest(`${base(projectId)}/${encodeURIComponent(poiId)}/references`);
}
