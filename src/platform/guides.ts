import { ApiError, apiRequest } from "./api";
import { syncMedia, toMediaBindings, type MediaBinding, type MediaBindingResponse } from "./assets";
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

/*
 * Bridge until the guide editor works on blocks (PLAN.md C3, backend D-022). The iGuide backend follows
 * `03` §11: a Guide is an ordered list of blocks shared by all languages, TEXT (rich text per language)
 * or REFERENCE (a POI, Route, Place, Page, or Event). This editor's model maps onto it: each language's
 * story is the text of one TEXT block, placed first, and the related items are the REFERENCE blocks after
 * it. Story images are the backend's `asset` nodes and become INLINE media of the Guide there (backend
 * D-025); the other media are saved through `.../guides/{id}/resource-assets`. SEO texts and Page items are
 * not available yet and are refused at their field rather than dropped.
 */

interface BlockResponse {
  id: string;
  blockType: "TEXT" | "REFERENCE";
  resourceType: GuideItemType | null;
  resourceId: string | null;
  sortOrder: number;
  translations: Record<string, { text: ApiBody | null; caption: string | null }>;
}

/** The backend's rich text: an image is `{type: "asset", assetId}` (`03` §4). */
type ApiNode =
  | { type: "paragraph"; text: string }
  | { type: "heading"; level: 2 | 3; text: string }
  | { type: "asset"; assetId: string };
interface ApiBody {
  blocks: ApiNode[];
}

const fromApiBody = (body: ApiBody | null): GuideBody | null =>
  body && { blocks: body.blocks.map((n) => (n.type === "asset" ? { type: "image", assetId: n.assetId } : n)) };

const toApiBody = (body: GuideBody): ApiBody => ({
  blocks: body.blocks.map((b) => (b.type === "image" ? { type: "asset", assetId: b.assetId } : b)),
});

/** Reports a TEXT block error at the story field, `translations.{code}.body.blocks[i]`. */
function atStory(e: unknown): unknown {
  if (!(e instanceof ApiError)) return e;
  const details = e.details.map((d) => d.replace(/^(translations\.[^.]+)\.text\./, "$1.body."));
  return new ApiError(e.status, e.code, e.message, e.requestId, details, e.body);
}

type GuideResponse = Omit<Guide, "translations" | "items" | "media"> & {
  translations: Record<string, { title: string | null; summary: string | null }>;
  blocks: BlockResponse[];
  media: MediaBindingResponse[];
};

interface Page<T> {
  content: T[];
  totalPages: number;
}

function toGuide({ translations, blocks, media, ...rest }: GuideResponse): Guide {
  const text = blocks.find((b) => b.blockType === "TEXT");
  const codes = new Set([...Object.keys(translations), ...Object.keys(text?.translations ?? {})]);
  const texts: Record<string, GuideTranslation> = {};
  for (const code of codes) {
    texts[code] = {
      title: translations[code]?.title ?? null,
      summary: translations[code]?.summary ?? null,
      body: fromApiBody(text?.translations[code]?.text ?? null),
      seoTitle: null,
      seoDescription: null,
    };
  }
  const items = blocks
    .filter((b) => b.blockType === "REFERENCE" && b.resourceType && b.resourceId)
    .map((b) => ({ resourceType: b.resourceType!, resourceId: b.resourceId! }));
  return { ...rest, translations: texts, items, media: toMediaBindings(media) };
}

function unsupported(input: UpdateGuideInput): string[] {
  const details: string[] = [];
  for (const [code, t] of Object.entries(input.translations)) {
    if (t.seoTitle?.trim()) details.push(`translations.${code}.seoTitle: SEO texts are not stored by iGuide.`);
    if (t.seoDescription?.trim()) details.push(`translations.${code}.seoDescription: SEO texts are not stored by iGuide.`);
  }
  input.items.forEach((item, i) => {
    if (item.resourceType === "PAGE") details.push(`items[${i}]: Pages cannot be related until they exist in iGuide.`);
  });
  return details;
}

const blocksPath = (projectId: string, guideId: string) => `${base(projectId)}/${encodeURIComponent(guideId)}/blocks`;

/** Every Guide of the Project, in order: the backend serves at most 200 per page. */
export async function listGuides(projectId: string, signal?: AbortSignal): Promise<Guide[]> {
  const guides: Guide[] = [];
  for (let page = 0; ; page++) {
    const result = await apiRequest<Page<GuideResponse>>(`${base(projectId)}?size=200&page=${page}`, { signal });
    guides.push(...result.content.map(toGuide));
    if (page + 1 >= result.totalPages) return guides;
  }
}

export async function fetchGuide(projectId: string, guideId: string): Promise<Guide> {
  return toGuide(await apiRequest<GuideResponse>(`${base(projectId)}/${encodeURIComponent(guideId)}`));
}

export async function createGuide(projectId: string, input: { title: string; slug: string }): Promise<Guide> {
  return toGuide(await apiRequest<GuideResponse>(base(projectId), { method: "POST", body: input }));
}

/**
 * Saves the Guide's own fields, then its blocks: the story as one TEXT block first (removed when every
 * language is empty), the related items as REFERENCE blocks in list order.
 */
export async function updateGuide(projectId: string, guideId: string, input: UpdateGuideInput): Promise<Guide> {
  const details = unsupported(input);
  if (details.length) throw new ApiError(422, "VALIDATION_ERROR", "Some fields cannot be saved in iGuide yet.", null, details);

  const titles: Record<string, { title: string | null; summary: string | null }> = {};
  const stories: Record<string, { text: ApiBody | null }> = {};
  for (const [code, t] of Object.entries(input.translations)) {
    titles[code] = { title: t.title, summary: t.summary };
    stories[code] = { text: t.body?.blocks.length ? toApiBody(t.body) : null };
  }
  const saved = await apiRequest<GuideResponse>(`${base(projectId)}/${encodeURIComponent(guideId)}`, {
    method: "PUT",
    body: {
      version: input.version,
      slug: input.slug,
      internalName: input.internalName,
      estimatedReadingMinutes: input.estimatedReadingMinutes,
      featured: input.featured,
      translations: titles,
    },
  });

  const path = blocksPath(projectId, guideId);
  const order: string[] = [];
  const textBlock = saved.blocks.find((b) => b.blockType === "TEXT");
  const hasStory = Object.values(stories).some((s) => s.text);
  if (hasStory && textBlock) {
    await apiRequest(`${path}/${encodeURIComponent(textBlock.id)}`, { method: "PUT", body: { translations: stories } }).catch((e) => {
      throw atStory(e);
    });
    order.push(textBlock.id);
  } else if (hasStory) {
    const created = await apiRequest<BlockResponse>(path, { method: "POST", body: { blockType: "TEXT", translations: stories } }).catch(
      (e) => {
        throw atStory(e);
      },
    );
    order.push(created.id);
  } else if (textBlock) {
    await apiRequest(`${path}/${encodeURIComponent(textBlock.id)}`, { method: "DELETE" });
  }

  const unmatched = saved.blocks.filter((b) => b.blockType === "REFERENCE");
  const itemIds: string[] = [];
  for (const item of input.items) {
    const at = unmatched.findIndex((b) => b.resourceType === item.resourceType && b.resourceId === item.resourceId);
    if (at >= 0) {
      itemIds.push(unmatched.splice(at, 1)[0].id);
    } else {
      const created = await apiRequest<BlockResponse>(path, {
        method: "POST",
        body: { blockType: "REFERENCE", resourceType: item.resourceType, resourceId: item.resourceId },
      });
      itemIds.push(created.id);
    }
  }
  for (const stale of unmatched) await apiRequest(`${path}/${encodeURIComponent(stale.id)}`, { method: "DELETE" });
  order.push(...itemIds);

  const after = await apiRequest<BlockResponse[]>(path);
  const rest = after.map((b) => b.id).filter((id) => !order.includes(id));
  const wanted = [...order, ...rest];
  if (after.map((b) => b.id).join() !== wanted.join()) {
    await apiRequest(`${path}:order`, { method: "PUT", body: { ids: wanted } });
  }
  await syncMedia(projectId, "guides", guideId, input.media);
  return fetchGuide(projectId, guideId);
}

export async function changeGuideStatus(projectId: string, guideId: string, targetStatus: ResourceStatus, version: number): Promise<Guide> {
  return toGuide(
    await apiRequest<GuideResponse>(`${base(projectId)}/${encodeURIComponent(guideId)}/status`, {
      method: "POST",
      body: { targetStatus, version },
    }),
  );
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
