import { ApiError, apiRequest } from "./api";
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
  seoTitle: string | null;
  seoDescription: string | null;
}

/** Fields that count towards translation completeness; the SEO fields are optional extras. */
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
 * Stopgap until the generated client (PLAN.md C0b, C3). The iGuide backend (D-020) pages its lists and
 * does not store SEO texts (QUESTIONS.md on SEO texts): responses get empty values for them, and a save
 * that would drop SEO text is refused here, at that field. The Category and the media are bindings
 * (backend D-024, D-025): read from `categoryIds` and `media`, saved through `.../pois/{id}/categories`
 * and `.../pois/{id}/resource-assets` after the POI itself.
 */

type PoiTranslationResponse = Omit<PoiTranslation, "seoTitle" | "seoDescription">;
type PoiResponse = Omit<Poi, "categoryId" | "media" | "translations"> & {
  translations: Record<string, PoiTranslationResponse>;
  categoryIds: string[];
  media: MediaBindingResponse[];
};

interface Page<T> {
  content: T[];
  totalPages: number;
}

function toPoi({ categoryIds, media, ...response }: PoiResponse): Poi {
  const translations: Record<string, PoiTranslation> = {};
  for (const [code, t] of Object.entries(response.translations)) {
    translations[code] = { ...t, seoTitle: null, seoDescription: null };
  }
  return { ...response, categoryId: categoryIds[0] ?? null, media: toMediaBindings(media), translations };
}

function unsupported(input: UpdatePoiInput): string[] {
  const details: string[] = [];
  for (const [code, t] of Object.entries(input.translations)) {
    if (t.seoTitle?.trim()) details.push(`translations.${code}.seoTitle: SEO texts are not stored by iGuide.`);
    if (t.seoDescription?.trim()) details.push(`translations.${code}.seoDescription: SEO texts are not stored by iGuide.`);
  }
  return details;
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

export async function updatePoi(projectId: string, poiId: string, input: UpdatePoiInput): Promise<Poi> {
  const details = unsupported(input);
  if (details.length) {
    throw new ApiError(422, "VALIDATION_ERROR", "Some fields cannot be saved in iGuide yet.", null, details);
  }
  const { categoryId, media, translations, ...rest } = input;
  const texts: Record<string, PoiTranslationResponse> = {};
  for (const [code, { seoTitle: _title, seoDescription: _description, ...t }] of Object.entries(translations)) {
    texts[code] = t;
  }
  await apiRequest<PoiResponse>(`${base(projectId)}/${encodeURIComponent(poiId)}`, {
    method: "PUT",
    body: { ...rest, translations: texts },
  });
  await setResourceCategory(projectId, "pois", poiId, categoryId);
  await syncMedia(projectId, "pois", poiId, media);
  return fetchPoi(projectId, poiId);
}

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
