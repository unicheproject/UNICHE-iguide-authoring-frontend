import { apiRequest } from "./api";
import type { MediaBinding } from "./assets";
import type { ResourceStatus } from "./places";
import type { ResourceReference } from "./references";

/** One block of a Guide body; the backend stores the list as its rich text document. */
export type StoryBlock =
  | { type: "paragraph"; text: string }
  | { type: "heading"; level: 2 | 3; text: string }
  | { type: "image"; assetId: string };

export interface GuideBody {
  blocks: StoryBlock[];
}

export interface GuideTranslation {
  title: string | null;
  summary: string | null;
  body: GuideBody | null;
  seoTitle: string | null;
  seoDescription: string | null;
}

export const GUIDE_ITEM_TYPES = ["POI", "ROUTE", "PLACE", "PAGE", "EVENT"] as const;
export type GuideItemType = (typeof GUIDE_ITEM_TYPES)[number];

/** One related Resource; the list order is the order visitors see. */
export interface GuideItem {
  resourceType: GuideItemType;
  resourceId: string;
}

export interface Guide {
  id: string;
  projectId: string;
  slug: string;
  status: ResourceStatus;
  internalName: string | null;
  estimatedReadingMinutes: number | null;
  featured: boolean;
  sortOrder: number;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
  version: number;
  hasWorkingCopy: boolean;
  workingCopyUpdatedAt: string | null;
  translations: Record<string, GuideTranslation>;
  items: GuideItem[];
  /** Includes INLINE bindings, which follow the images in the body and are never sent back. */
  media: MediaBinding[];
}

export interface UpdateGuideInput {
  version: number;
  slug: string;
  internalName: string | null;
  estimatedReadingMinutes: number | null;
  featured: boolean;
  translations: Record<string, GuideTranslation>;
  items: GuideItem[];
  media: MediaBinding[];
}

const base = (projectId: string) => `/projects/${encodeURIComponent(projectId)}/guides`;

export function listGuides(projectId: string, signal?: AbortSignal): Promise<Guide[]> {
  return apiRequest<Guide[]>(base(projectId), { signal });
}

export function fetchGuide(projectId: string, guideId: string): Promise<Guide> {
  return apiRequest<Guide>(`${base(projectId)}/${encodeURIComponent(guideId)}`);
}

export function createGuide(projectId: string, input: { title: string; slug: string }): Promise<Guide> {
  return apiRequest<Guide>(base(projectId), { method: "POST", body: input });
}

export function updateGuide(projectId: string, guideId: string, input: UpdateGuideInput): Promise<Guide> {
  return apiRequest<Guide>(`${base(projectId)}/${encodeURIComponent(guideId)}`, { method: "PUT", body: input });
}

export function changeGuideStatus(projectId: string, guideId: string, targetStatus: ResourceStatus, version: number): Promise<Guide> {
  return apiRequest<Guide>(`${base(projectId)}/${encodeURIComponent(guideId)}/status`, { method: "POST", body: { targetStatus, version } });
}

export function guideTitle(guide: Guide, defaultLanguage: string | null): string {
  return (defaultLanguage ? guide.translations[defaultLanguage]?.title?.trim() : undefined) || guide.slug;
}

/** Title, summary, and body count towards completeness; the SEO fields are optional extras. */
export function guideCompleteness(guide: Guide, languageCode: string): "complete" | "partial" | "missing" {
  const t = guide.translations[languageCode];
  const filled = t ? [t.title?.trim(), t.summary?.trim(), storyWords(t.body?.blocks ?? []) > 0].filter(Boolean).length : 0;
  if (filled === 0) return "missing";
  return filled === 3 ? "complete" : "partial";
}

export function storyWords(blocks: StoryBlock[]): number {
  return blocks.reduce((n, b) => n + (b.type === "image" ? 0 : b.text.trim().split(/\s+/).filter(Boolean).length), 0);
}

/** About 200 words a minute, as a reading time suggestion. */
export function readingMinutes(blocks: StoryBlock[]): number {
  return Math.max(1, Math.round(storyWords(blocks) / 200));
}

/** Resources that still use the Guide; non-empty blocks deactivation and archival. */
export function fetchGuideReferences(projectId: string, guideId: string): Promise<ResourceReference[]> {
  return apiRequest<ResourceReference[]>(`${base(projectId)}/${encodeURIComponent(guideId)}/references`);
}
