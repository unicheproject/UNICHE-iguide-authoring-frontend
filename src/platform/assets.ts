import { apiRequest, apiUpload } from "./api";
import type { ResourceStatus } from "./places";
import type { ResourceReference } from "./references";

export const ASSET_TYPES = ["IMAGE", "AUDIO", "VIDEO", "DOCUMENT", "THREE_D_MODEL", "FLOOR_PLAN", "OTHER"] as const;
export type AssetType = (typeof ASSET_TYPES)[number];

export const ASSET_USAGES = ["HERO_IMAGE", "THUMBNAIL", "GALLERY_IMAGE", "VIDEO", "AUDIO_NARRATION", "ATTACHMENT", "MODEL", "INLINE"] as const;
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
  maxUploadBytes: number;
  perType: Record<AssetType, number>;
}

const base = (projectId: string) => `/projects/${encodeURIComponent(projectId)}/assets`;

export function listAssets(projectId: string, signal?: AbortSignal): Promise<Asset[]> {
  return apiRequest<Asset[]>(base(projectId), { signal });
}

export function fetchAsset(projectId: string, assetId: string): Promise<Asset> {
  return apiRequest<Asset>(`${base(projectId)}/${encodeURIComponent(assetId)}`);
}

export function fetchAssetLimits(projectId: string): Promise<AssetLimits> {
  return apiRequest<AssetLimits>(`${base(projectId)}/limits`);
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

/** Replaces the file of an Asset with one of the same type, keeping its texts and every binding. */
export function replaceAssetFile(
  projectId: string,
  assetId: string,
  file: File,
  version: number,
  onProgress?: (fraction: number) => void,
): Promise<Asset> {
  const form = new FormData();
  form.append("file", file, file.name);
  form.append("version", String(version));
  return apiUpload<Asset>(`${base(projectId)}/${encodeURIComponent(assetId)}/file`, form, onProgress);
}

/** One Resource that uses the Asset, with the roles it has there. */
export interface AssetUsageEntry {
  resource: ResourceReference;
  usages: { usage: AssetUsage | "FLOOR_PLAN_IMAGE"; languageCode: string | null }[];
}

export function fetchAssetUsages(projectId: string, assetId: string): Promise<AssetUsageEntry[]> {
  return apiRequest<AssetUsageEntry[]>(`${base(projectId)}/${encodeURIComponent(assetId)}/usages`);
}

/** A short-lived link that downloads the file under its original name. */
export function fetchAssetDownload(projectId: string, assetId: string): Promise<{ url: string; expiresAt: string }> {
  return apiRequest<{ url: string; expiresAt: string }>(`${base(projectId)}/${encodeURIComponent(assetId)}/download`);
}

const USAGE_LABELS: Record<AssetUsage | "FLOOR_PLAN_IMAGE", string> = {
  HERO_IMAGE: "primary image",
  THUMBNAIL: "thumbnail",
  GALLERY_IMAGE: "gallery",
  VIDEO: "video",
  AUDIO_NARRATION: "audio narration",
  ATTACHMENT: "attachment",
  MODEL: "3D model",
  INLINE: "inline",
  FLOOR_PLAN_IMAGE: "plan image",
};
export const usageLabel = (usage: AssetUsage | "FLOOR_PLAN_IMAGE") => USAGE_LABELS[usage];

/** "03:12" for a duration in seconds. */
export function formatDuration(seconds: number): string {
  const total = Math.round(seconds);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const mm = String(m).padStart(h ? 2 : 2, "0");
  return h ? `${h}:${mm}:${String(s).padStart(2, "0")}` : `${mm}:${String(s).padStart(2, "0")}`;
}

/** Search over the name, the file name, and the title in every language (iGuide spec 12, media library). */
export function assetMatches(asset: Asset, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return [asset.internalName, asset.originalFilename, ...Object.values(asset.translations).map((t) => t.title ?? "")].some((text) =>
    text.toLowerCase().includes(q),
  );
}

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

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

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

/** An image that visitors would meet without a text alternative in the given language. */
export function missingAlternativeText(asset: Asset, languageCode: string | null): boolean {
  if (asset.type !== "IMAGE" || asset.decorative || !languageCode) return false;
  return !asset.translations[languageCode]?.alternativeText?.trim();
}
