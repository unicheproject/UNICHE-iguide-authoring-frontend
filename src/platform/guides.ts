import { ApiError, apiRequest } from "./api";
import { syncMedia, toMediaBindings, type MediaBinding, type MediaBindingResponse } from "./assets";
import type { ResourceStatus } from "./places";
import type { ResourceReference } from "./references";

/** One node of a TEXT block's rich text: a paragraph, a heading (level 2 or 3), or an inline image. */
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
}

export const GUIDE_ITEM_TYPES = ["POI", "ROUTE", "PLACE", "PAGE", "EVENT"] as const;
export type GuideItemType = (typeof GUIDE_ITEM_TYPES)[number];

export type GuideBlockType = "TEXT" | "REFERENCE";

/** One language of a block: a TEXT block's rich text, or a REFERENCE block's caption. */
export interface GuideBlockTexts {
  text: GuideBody | null;
  caption: string | null;
}

/**
 * One block of a Guide (`03` §11): TEXT (rich text per language) or REFERENCE (a POI, Route, Place, Page, or Event
 * with an optional caption per language). The list order is the order visitors read; the same target may appear in
 * several blocks (backend D-022).
 */
export interface GuideBlock {
  /** Null for a block that is not saved yet. */
  id: string | null;
  blockType: GuideBlockType;
  resourceType: GuideItemType | null;
  resourceId: string | null;
  translations: Record<string, GuideBlockTexts>;
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
  blocks: GuideBlock[];
  /** Includes INLINE bindings, which follow the images in TEXT blocks and are never sent back. */
  media: MediaBinding[];
}

export interface UpdateGuideInput {
  version: number;
  slug: string;
  internalName: string | null;
  estimatedReadingMinutes: number | null;
  featured: boolean;
  translations: Record<string, GuideTranslation>;
  blocks: GuideBlock[];
  media: MediaBinding[];
}

const base = (projectId: string) => `/projects/${encodeURIComponent(projectId)}/guides`;

/*
 * The iGuide backend follows `03` §11 (backend D-022): a Guide is an ordered list of blocks shared by all
 * languages, TEXT or REFERENCE, edited here as such (DECISIONS.md D-031). A DRAFT saves them through
 * `.../guides/{id}/blocks` (create, update, delete, then `:order` with every id); an ACTIVE Guide sends them as one
 * ordered list in its working copy. Errors come back at `blocks[i]…`; a DRAFT block's own request reports paths
 * without the index, which `atBlock` adds. Story images are the backend's `asset` nodes and become INLINE media of
 * the Guide there (backend D-025); the other media are saved through `.../guides/{id}/resource-assets`. Page
 * references are refused at their field until Pages exist (M6).
 */

interface BlockResponse {
  id: string;
  blockType: GuideBlockType;
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
export interface ApiBody {
  blocks: ApiNode[];
}

const fromApiBody = (body: ApiBody | null): GuideBody | null =>
  body && { blocks: body.blocks.map((n) => (n.type === "asset" ? { type: "image", assetId: n.assetId } : n)) };

/** A TEXT block's rich text as the backend reads it, for a save of one block's texts (Translation workspace, D-021). */
export const toApiBody = (body: GuideBody): ApiBody => ({
  blocks: body.blocks.map((b) => (b.type === "image" ? { type: "asset", assetId: b.assetId } : b)),
});

/** A block's errors from its own request, reported where the form shows them: `blocks[i].…`. */
function atBlock(e: unknown, index: number): unknown {
  if (!(e instanceof ApiError)) return e;
  const prefix = (path: string) => (path ? `blocks[${index}].${path}` : `blocks[${index}]`);
  const details = e.fieldErrors.map((f) => `${prefix(f.path)}: ${f.message}`);
  const fieldErrors = e.fieldErrors.map((f) => ({ ...f, path: prefix(f.path) }));
  return new ApiError(e.status, e.code, e.message, e.requestId, details, e.body, fieldErrors);
}

type GuideResponse = Omit<Guide, "blocks" | "media"> & {
  blocks: BlockResponse[];
  media: MediaBindingResponse[];
};

interface Page<T> {
  content: T[];
  totalPages: number;
}

function toGuide({ blocks, media, ...rest }: GuideResponse): Guide {
  return {
    ...rest,
    blocks: [...blocks]
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((b) => ({
        id: b.id,
        blockType: b.blockType,
        resourceType: b.resourceType,
        resourceId: b.resourceId,
        translations: Object.fromEntries(
          Object.entries(b.translations).map(([code, t]) => [code, { text: fromApiBody(t.text), caption: t.caption }]),
        ),
      })),
    media: toMediaBindings(media),
  };
}

function unsupported(blocks: GuideBlock[]): string[] {
  const details: string[] = [];
  blocks.forEach((block, i) => {
    if (block.resourceType === "PAGE") details.push(`blocks[${i}].resourceType: Pages cannot be referenced until they exist in iGuide.`);
  });
  return details;
}

/**
 * A block's texts as the backend takes them: every language the block carries, a TEXT block's rich text (null when
 * empty) and a REFERENCE block's caption (null when blank). Null is sent explicitly, since a language left out keeps
 * its stored text.
 */
function blockTexts(block: GuideBlock): Record<string, { text: ApiBody | null; caption: string | null }> {
  return Object.fromEntries(
    Object.entries(block.translations).map(([code, t]) => [
      code,
      block.blockType === "TEXT"
        ? { text: t.text?.blocks.length ? toApiBody(t.text) : null, caption: null }
        : { text: null, caption: t.caption?.trim() || null },
    ]),
  );
}

function blockBody(block: GuideBlock) {
  return {
    blockType: block.blockType,
    resourceType: block.blockType === "REFERENCE" ? block.resourceType : null,
    resourceId: block.blockType === "REFERENCE" ? block.resourceId : null,
    translations: blockTexts(block),
  };
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
 * Saves a DRAFT Guide's own fields, then its blocks as listed: removed blocks are deleted, kept ones updated, new
 * ones created, and the order set with every id. Then the media.
 */
export async function updateGuide(projectId: string, guideId: string, input: UpdateGuideInput): Promise<Guide> {
  const details = unsupported(input.blocks);
  if (details.length) throw new ApiError(422, "VALIDATION_ERROR", "Some fields cannot be saved in iGuide yet.", null, details);

  const saved = await apiRequest<GuideResponse>(`${base(projectId)}/${encodeURIComponent(guideId)}`, {
    method: "PUT",
    body: {
      version: input.version,
      slug: input.slug,
      internalName: input.internalName,
      estimatedReadingMinutes: input.estimatedReadingMinutes,
      featured: input.featured,
      translations: input.translations,
    },
  });

  const path = blocksPath(projectId, guideId);
  const existing = new Set(saved.blocks.map((b) => b.id));
  const kept = new Set(input.blocks.flatMap((b) => (b.id && existing.has(b.id) ? [b.id] : [])));
  for (const stale of saved.blocks.filter((b) => !kept.has(b.id))) {
    await apiRequest(`${path}/${encodeURIComponent(stale.id)}`, { method: "DELETE" });
  }
  const order: string[] = [];
  for (const [i, block] of input.blocks.entries()) {
    try {
      if (block.id && kept.has(block.id)) {
        await apiRequest(`${path}/${encodeURIComponent(block.id)}`, { method: "PUT", body: blockBody(block) });
        order.push(block.id);
      } else {
        order.push((await apiRequest<BlockResponse>(path, { method: "POST", body: blockBody(block) })).id);
      }
    } catch (e) {
      throw atBlock(e, i);
    }
  }
  const after = await apiRequest<BlockResponse[]>(path);
  const current = [...after].sort((a, b) => a.sortOrder - b.sortOrder).map((b) => b.id);
  if (current.join() !== order.join()) {
    await apiRequest(`${path}:order`, { method: "PUT", body: { ids: order } });
  }
  await syncMedia(projectId, "guides", guideId, input.media);
  return fetchGuide(projectId, guideId);
}

/**
 * The working-copy payload of an ACTIVE Guide (backend D-027): the update body without `version`, every block in
 * order (a saved block keeps its id, a new one has none), and the media. Errors come back at `blocks[i]`.
 */
export function guideWorkingCopyPayload(input: Omit<UpdateGuideInput, "version">): Record<string, unknown> {
  const details = unsupported(input.blocks);
  if (details.length) throw new ApiError(422, "VALIDATION_ERROR", "Some fields cannot be saved in iGuide yet.", null, details);
  return {
    slug: input.slug,
    internalName: input.internalName,
    estimatedReadingMinutes: input.estimatedReadingMinutes,
    featured: input.featured,
    translations: input.translations,
    blocks: input.blocks.map((block) => ({ id: block.id, ...blockBody(block) })),
    media: input.media.filter((b) => b.usage !== "INLINE").map(({ assetId, usage, languageCode }) => ({ assetId, usage, languageCode })),
  };
}

/** A Guide as the backend renders a working copy or an apply. */
export const guideFromResponse = (raw: unknown): Guide => toGuide(raw as GuideResponse);

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

/** The rich text of a Guide's TEXT blocks in one language, in order. */
export function storyNodes(guide: Pick<Guide, "blocks">, languageCode: string): StoryBlock[] {
  return guide.blocks.flatMap((b) => (b.blockType === "TEXT" ? b.translations[languageCode]?.text?.blocks ?? [] : []));
}

/**
 * Whether the story is written in a language: every TEXT block has text or an image in it, as the backend counts it
 * (backend D-038). A Guide without TEXT blocks has no story to count.
 */
export function storyComplete(guide: Pick<Guide, "blocks">, languageCode: string): boolean | null {
  const texts = guide.blocks.filter((b) => b.blockType === "TEXT");
  if (!texts.length) return null;
  return texts.every((b) => storyHasContent(b.translations[languageCode]?.text?.blocks ?? []));
}

/** Text or an image: what a visitor sees in a TEXT block. */
export function storyHasContent(blocks: StoryBlock[]): boolean {
  return blocks.some((n) => (n.type === "image" ? !!n.assetId : !!n.text.trim()));
}

/** Title, summary, and the story (when the Guide has TEXT blocks) count towards completeness. */
export function guideCompleteness(guide: Guide, languageCode: string): "complete" | "partial" | "missing" {
  const t = guide.translations[languageCode];
  const story = storyComplete(guide, languageCode);
  const counted = [t?.title?.trim(), t?.summary?.trim(), ...(story === null ? [] : [story])];
  const filled = counted.filter(Boolean).length;
  if (filled === 0) return "missing";
  return filled === counted.length ? "complete" : "partial";
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
