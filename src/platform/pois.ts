import { apiRequest } from "./api";
import type { MediaBinding } from "./assets";
import type { ResourceStatus } from "./places";
import type { ResourceReference } from "./references";

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

export function listPois(projectId: string, signal?: AbortSignal): Promise<Poi[]> {
  return apiRequest<Poi[]>(base(projectId), { signal });
}

export function fetchPoi(projectId: string, poiId: string, signal?: AbortSignal): Promise<Poi> {
  return apiRequest<Poi>(`${base(projectId)}/${encodeURIComponent(poiId)}`, { signal });
}

export function createPoi(projectId: string, input: CreatePoiInput): Promise<Poi> {
  return apiRequest<Poi>(base(projectId), { method: "POST", body: input });
}

export function updatePoi(projectId: string, poiId: string, input: UpdatePoiInput): Promise<Poi> {
  return apiRequest<Poi>(`${base(projectId)}/${encodeURIComponent(poiId)}`, { method: "PUT", body: input });
}

export function changePoiStatus(projectId: string, poiId: string, targetStatus: ResourceStatus, version: number): Promise<Poi> {
  return apiRequest<Poi>(`${base(projectId)}/${encodeURIComponent(poiId)}/status`, {
    method: "POST",
    body: { targetStatus, version },
  });
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
