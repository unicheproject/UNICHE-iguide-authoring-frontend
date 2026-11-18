import { formatBytes } from "@/lib/format";
import { fold } from "@/lib/utils";
import { ApiError, apiRequest, apiUpload } from "./api";
import { assetNeedsText } from "./completeness";
import type { ResourceStatus } from "./places";
import type { ResourceReference } from "./references";

export const ASSET_TYPES = ["IMAGE", "AUDIO", "VIDEO", "DOCUMENT", "THREE_D_MODEL", "FLOOR_PLAN", "OTHER"] as const;
export type AssetType = (typeof ASSET_TYPES)[number];

export const ASSET_USAGES = [
  "HERO_IMAGE",
  "THUMBNAIL",
  "GALLERY_IMAGE",
  "VIDEO",
  "AUDIO_NARRATION",
  "ATTACHMENT",
  "MODEL",
  "MODEL_POSTER",
  "INLINE",
] as const;
export type AssetUsage = (typeof ASSET_USAGES)[number];

export interface AssetTranslation {
  title: string | null;
  caption: string | null;
  alternativeText: string | null;
  credits: string | null;
  transcript: string | null;
}

export interface Asset {
  id: string;
  projectId: string;
  type: AssetType;
  status: ResourceStatus;
  internalName: string;
  decorative: boolean;
  originalFilename: string;
  mimeType: string;
  sizeBytes: number;
  checksum: string;
  width: number | null;
  height: number | null;
  durationSeconds: number | null;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
  version: number;
  /** Reads the bytes until `urlExpiresAt`; the bucket itself is private. */
  url: string;
  urlExpiresAt: string;
  usageCount: number;
  translations: Record<string, AssetTranslation>;
}

/** One media binding of a Resource; the list order is the order within a usage. */
export interface MediaBinding {
  assetId: string;
  usage: AssetUsage;
  /** Null applies to every language. */
  languageCode: string | null;
}

export interface AssetLimits {
  /** The largest request the backend takes, whatever the type. */
  maxUploadBytes: number;
  /** The largest file per type; a type without an entry is bound by `maxUploadBytes` only. */
  perType: Partial<Record<AssetType, number>>;
}

/**
 * Why a file may not be sent, or null when it fits (`12` §5: an upload over the limit is rejected before any bytes
 * leave the browser). The type's own limit and the global request limit both apply.
 */
export function sizeProblem(size: number, type: AssetType, limits: AssetLimits): string | null {
  const own = limits.perType[type];
  if (own !== undefined && size > own) return `Exceeds the ${formatBytes(own)} limit for ${assetTypeLabel(type).toLowerCase()} files.`;
  if (size > limits.maxUploadBytes) return `Exceeds the ${formatBytes(limits.maxUploadBytes)} limit for any upload.`;
  return null;
}

const base = (projectId: string) => `/projects/${encodeURIComponent(projectId)}/assets`;

interface Page<T> {
  content: T[];
  totalPages: number;
}

/** Every Asset of the Project, newest first: the backend serves at most 200 per page. */
export async function listAssets(projectId: string, signal?: AbortSignal): Promise<Asset[]> {
  const assets: Asset[] = [];
  for (let page = 0; ; page++) {
    const result = await apiRequest<Page<Asset>>(`${base(projectId)}?size=200&page=${page}`, { signal });
    assets.push(...result.content);
    if (page + 1 >= result.totalPages) return assets;
  }
}

export function fetchAsset(projectId: string, assetId: string): Promise<Asset> {
  return apiRequest<Asset>(`${base(projectId)}/${encodeURIComponent(assetId)}`);
}

/** The limits the backend enforces (`07` §14 `GET /upload-limits`); not Project-scoped. */
export function fetchAssetLimits(_projectId: string): Promise<AssetLimits> {
  return apiRequest<AssetLimits>("/upload-limits");
}

export function uploadAsset(
  projectId: string,
  file: File,
  options: { floorPlan?: boolean; onProgress?: (fraction: number) => void; signal?: AbortSignal } = {},
): Promise<Asset> {
  const form = new FormData();
  form.append("file", file, file.name);
  if (options.floorPlan) form.append("type", "FLOOR_PLAN");
  return apiUpload<Asset>(base(projectId), form, options.onProgress, options.signal);
}

export function updateAsset(
  projectId: string,
  assetId: string,
  input: { version: number; internalName: string; decorative: boolean; translations: Record<string, AssetTranslation> },
): Promise<Asset> {
  return apiRequest<Asset>(`${base(projectId)}/${encodeURIComponent(assetId)}`, { method: "PUT", body: input });
}

export function changeAssetStatus(projectId: string, assetId: string, targetStatus: ResourceStatus, version: number): Promise<Asset> {
  return apiRequest<Asset>(`${base(projectId)}/${encodeURIComponent(assetId)}/status`, { method: "POST", body: { targetStatus, version } });
}

export function fetchAssetReferences(projectId: string, assetId: string): Promise<ResourceReference[]> {
  return apiRequest<ResourceReference[]>(`${base(projectId)}/${encodeURIComponent(assetId)}/references`);
}

/**
 * Replaces the file of a DRAFT Asset with one of the same type, keeping its texts and every binding. The backend
 * refuses it for an ACTIVE Asset (`03` §1: upload a new Asset and bind it instead).
 */
export function replaceAssetFile(
  projectId: string,
  assetId: string,
  file: File,
  version: number,
  onProgress?: (fraction: number) => void,
  signal?: AbortSignal,
): Promise<Asset> {
  const form = new FormData();
  form.append("file", file, file.name);
  form.append("version", String(version));
  return apiUpload<Asset>(`${base(projectId)}/${encodeURIComponent(assetId)}/file`, form, onProgress, signal);
}

/** A short-lived link that downloads the file under its original name. */
export function fetchAssetDownload(projectId: string, assetId: string): Promise<{ url: string; expiresAt: string }> {
  return apiRequest<{ url: string; expiresAt: string }>(`${base(projectId)}/${encodeURIComponent(assetId)}/download`);
}

/*
 * Media bindings (backend D-025) are a child collection of the Resource, `.../{kind}/{id}/resource-assets`,
 * not part of its update body. Reads carry them as `media`; a save goes through `syncMedia` after the
 * Resource's own `PUT`. INLINE bindings follow the images in rich text and are never written here.
 */

/** One binding as the backend returns it. */
export interface MediaBindingResponse {
  id: string;
  assetId: string;
  usage: AssetUsage;
  languageCode: string | null;
  sortOrder: number;
}

export type MediaKind = "places" | "pois" | "routes" | "guides" | "events";

export const toMediaBindings = (media: MediaBindingResponse[]): MediaBinding[] =>
  media.map(({ assetId, usage, languageCode }) => ({ assetId, usage, languageCode }));

const bindingKey = (b: { assetId: string; usage: string; languageCode: string | null }) =>
  `${b.usage}|${b.languageCode ?? ""}|${b.assetId}`;

/** Re-reports a binding error at the field of the slot that sent it, such as `media[2].assetId`. */
function atSlot(e: unknown, index: number): unknown {
  if (!(e instanceof ApiError)) return e;
  const details = e.details.map((d) => (/^(assetId|usage|languageCode): /.test(d) ? `media[${index}].${d}` : d));
  if (!details.length) details.push(`media[${index}].assetId: ${e.message}`);
  return new ApiError(e.status, e.code, e.message, e.requestId, details, e.body);
}

/**
 * Makes the Resource's media, INLINE bindings aside, exactly `desired` in that order: removes what is gone,
 * binds what is new, then sets the order. A model's poster is bound before the model and removed after it.
 */
export async function syncMedia(projectId: string, kind: MediaKind, resourceId: string, desired: MediaBinding[]): Promise<void> {
  const path = `/projects/${encodeURIComponent(projectId)}/${kind}/${encodeURIComponent(resourceId)}/resource-assets`;
  const current = (await apiRequest<MediaBindingResponse[]>(path)).filter((b) => b.usage !== "INLINE");
  const wanted = desired.filter((b) => b.usage !== "INLINE");
  const unmatched = [...current];
  const ids: (string | null)[] = wanted.map((b) => {
    const i = unmatched.findIndex((c) => bindingKey(c) === bindingKey(b));
    return i < 0 ? null : unmatched.splice(i, 1)[0].id;
  });
  const removals = [...unmatched].sort((a, b) => Number(b.usage === "MODEL") - Number(a.usage === "MODEL"));
  for (const binding of removals) await apiRequest(`${path}/${encodeURIComponent(binding.id)}`, { method: "DELETE" });
  const additions = wanted.map((_, i) => i).filter((i) => ids[i] === null);
  additions.sort((a, b) => Number(wanted[b].usage === "MODEL_POSTER") - Number(wanted[a].usage === "MODEL_POSTER"));
  for (const i of additions) {
    try {
      ids[i] = (await apiRequest<MediaBindingResponse>(path, { method: "POST", body: wanted[i] })).id;
    } catch (e) {
      throw atSlot(e, desired.indexOf(wanted[i]));
    }
  }
  const order = ids as string[];
  const unchanged = !removals.length && !additions.length && current.every((c, i) => c.id === order[i]);
  if (!unchanged && order.length) await apiRequest(`${path}:order`, { method: "PUT", body: { ids: order } });
}

/** "03:12" for a duration in seconds. */
export function formatDuration(seconds: number): string {
  // Whole seconds played, as the browser's player counts them.
  const total = Math.floor(seconds);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const mm = String(m).padStart(h ? 2 : 2, "0");
  return h ? `${h}:${mm}:${String(s).padStart(2, "0")}` : `${mm}:${String(s).padStart(2, "0")}`;
}

/** Search over the name, the file name, and the title in every language (iGuide spec 12, media library). */
export function assetMatches(asset: Asset, query: string, languageCode = ""): boolean {
  const q = fold(query.trim());
  if (!q) return true;
  const titles = languageCode ? [asset.translations[languageCode]?.title ?? ""] : Object.values(asset.translations).map((t) => t.title ?? "");
  return [asset.internalName, asset.originalFilename, ...titles].some((text) =>
    fold(text ?? "").includes(q),
  );
}

/** Lowercase without accents, so "κυμη" finds "Κύμη" and "cafe" finds "Café". */

/** The type the backend will give a file, from its MIME type or name, to check the size limit first. */
export function assetTypeOf(file: File): AssetType {
  const mime = file.type.toLowerCase();
  const name = file.name.toLowerCase();
  if (mime.startsWith("image/")) return "IMAGE";
  if (mime.startsWith("audio/")) return "AUDIO";
  if (mime.startsWith("video/")) return "VIDEO";
  if (mime.startsWith("model/") || /\.(glb|gltf|obj|usdz)$/.test(name)) return "THREE_D_MODEL";
  if (mime === "application/pdf" || mime.startsWith("text/") || /\.(pdf|docx?|txt)$/.test(name)) return "DOCUMENT";
  return "OTHER";
}

/** One line of "Accepted formats": what a type holds, with the file extensions that name it. */
export interface AcceptedFormat {
  type: AssetType;
  /** Plain words, shown to authors. */
  formats: string;
}

/**
 * What the library takes (client allow-list, `12` §5; the backend accepts any type, G-032, Q-015): images, audio, video,
 * PDF documents and 3D models. Anything else is held back with a warning until the author confirms it.
 */
export const ACCEPTED_FORMATS: AcceptedFormat[] = [
  { type: "IMAGE", formats: "JPG, PNG, WebP, GIF, SVG, AVIF" },
  { type: "AUDIO", formats: "MP3, WAV, M4A, OGG, FLAC" },
  { type: "VIDEO", formats: "MP4, WebM, MOV" },
  { type: "DOCUMENT", formats: "PDF" },
  { type: "THREE_D_MODEL", formats: "GLB, GLTF" },
];

/** Whether a file belongs to one of the {@link ACCEPTED_FORMATS}; text files, scripts and archives do not. */
export function isAcceptedFile(file: File): boolean {
  const type = assetTypeOf(file);
  if (type === "IMAGE" || type === "AUDIO" || type === "VIDEO" || type === "THREE_D_MODEL") return true;
  const name = file.name.toLowerCase();
  return type === "DOCUMENT" && (file.type === "application/pdf" || name.endsWith(".pdf"));
}

/** The text of the "choose files" dialog's `accept`, for the given types (empty: no restriction). */
export function acceptAttributeFor(types: readonly AssetType[]): string {
  const map: Partial<Record<AssetType, string>> = {
    IMAGE: "image/*",
    FLOOR_PLAN: "image/*",
    AUDIO: "audio/*",
    VIDEO: "video/*",
    DOCUMENT: ".pdf,application/pdf",
    THREE_D_MODEL: ".glb,.gltf,model/gltf-binary",
  };
  return types.map((t) => map[t] ?? "").filter(Boolean).join(",");
}

/** The Asset that a file looks like a copy of (same file name and size), or null. */
export function duplicateOf(file: File, assets: readonly Asset[]): Asset | null {
  return assets.find((a) => a.sizeBytes === file.size && a.originalFilename.toLowerCase() === file.name.toLowerCase()) ?? null;
}

/**
 * Whether an Asset still needs text work in a language: an image that is not decorative has no alternative text, or
 * any Asset has no title. Drives the library's "Needs translation" filter.
 */
export function missingTextIn(asset: Asset, languageCode: string): boolean {
  return assetNeedsText(asset, languageCode);
}

/**
 * What exactly is missing in a language, in the words a worklist row shows ("alt text", "title"; C2-51). The same two
 * checks as {@link missingTextIn} (one definition of complete: title, plus alternative text of an image that is not
 * decorative), so the filter, the row and the Asset editor never disagree. Empty when nothing is missing.
 */
export function missingTextNames(asset: Asset, languageCode: string): string[] {
  const names: string[] = [];
  if (missingAlternativeText(asset, languageCode)) names.push("alt text");
  if (!asset.translations[languageCode]?.title?.trim()) names.push("title");
  return names;
}

const TYPE_LABELS: Record<AssetType, string> = {
  IMAGE: "Image",
  AUDIO: "Audio",
  VIDEO: "Video",
  DOCUMENT: "Document",
  THREE_D_MODEL: "3D model",
  FLOOR_PLAN: "Floor plan",
  OTHER: "Other",
};
export const assetTypeLabel = (type: AssetType) => TYPE_LABELS[type];

/** "1600 × 1067 · 420 KB", "03:12 · 4.1 MB", or "audio/mpeg · 3.1 MB". */
export function assetMeta(asset: Asset): string {
  const size = formatBytes(asset.sizeBytes);
  if (asset.width && asset.height) return `${asset.width} × ${asset.height} · ${size}`;
  if (asset.durationSeconds) return `${formatDuration(asset.durationSeconds)} · ${size}`;
  return `${asset.mimeType} · ${size}`;
}

export function isImage(asset: Asset): boolean {
  return asset.type === "IMAGE" || asset.type === "FLOOR_PLAN";
}

/**
 * An image that visitors would meet without a text alternative in the given language. A floor plan is an image too:
 * its text summarises the plan (`14` §2 Alternative text), though only an IMAGE blocks activation without one.
 */
export function missingAlternativeText(asset: Asset, languageCode: string | null): boolean {
  if (!isImage(asset) || asset.decorative || !languageCode) return false;
  return !asset.translations[languageCode]?.alternativeText?.trim();
}
