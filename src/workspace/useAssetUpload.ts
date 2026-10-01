import { reactive, ref, type Ref } from "vue";
import { ApiError } from "@/platform/api";
import { assetTypeLabel, assetTypeOf, fetchAssetLimits, formatBytes, uploadAsset, type Asset, type AssetLimits, type AssetType } from "@/platform/assets";

export interface UploadEntry {
  key: number;
  file: File;
  type: AssetType;
  progress: number;
  state: "queued" | "uploading" | "done" | "error" | "cancelled";
  message: string | null;
  /** Too large for its type: retrying cannot help. */
  tooLarge: boolean;
  floorPlan: boolean;
  asset: Asset | null;
  controller: AbortController | null;
}

/** Two at a time keeps the progress readable and does not saturate a museum's uplink. */
const PARALLEL = 2;

/**
 * Uploads with per-file progress (iGuide spec 12, media library; mockup C-02): files wait in a queue, the
 * per-type size limit is checked before any bytes leave the browser, a failed file keeps its reason and
 * can be retried unless it is too large, the files still waiting or running can be cancelled, and every
 * uploaded Asset is handed to `onUploaded`.
 */
export function useAssetUpload(projectId: Ref<string>, onUploaded: (asset: Asset) => void) {
  const entries = ref<UploadEntry[]>([]);
  const limits = ref<AssetLimits | null>(null);
  let counter = 0;
  let running = 0;
  const waiters: (() => void)[] = [];

  async function ensureLimits(): Promise<AssetLimits | null> {
    if (limits.value) return limits.value;
    try {
      limits.value = await fetchAssetLimits(projectId.value);
    } catch (e) {
      if (!(e instanceof ApiError)) throw e;
      // Without the limits the backend still enforces them; the file is then rejected after upload.
    }
    return limits.value;
  }

  async function slot() {
    if (running < PARALLEL) {
      running++;
      return;
    }
    await new Promise<void>((resolve) => waiters.push(resolve));
    running++;
  }

  function release() {
    running--;
    waiters.shift()?.();
  }

  async function run(entry: UploadEntry) {
    entry.state = "queued";
    entry.progress = 0;
    entry.message = null;
    const known = await ensureLimits();
    const limit = known?.perType[entry.type];
    if (limit !== undefined && entry.file.size > limit) {
      entry.state = "error";
      entry.tooLarge = true;
      entry.message = `Exceeds the ${formatBytes(limit)} limit for ${assetTypeLabel(entry.type).toLowerCase()} files.`;
      return;
    }
    await slot();
    if (entry.state !== "queued") {
      release();
      return;
    }
    entry.state = "uploading";
    entry.controller = new AbortController();
    try {
      const asset = await uploadAsset(projectId.value, entry.file, {
        floorPlan: entry.floorPlan,
        onProgress: (f) => (entry.progress = f),
        signal: entry.controller.signal,
      });
      entry.state = "done";
      entry.progress = 1;
      entry.asset = asset;
      onUploaded(asset);
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") {
        entry.state = "cancelled";
        entry.message = "Cancelled.";
      } else {
        if (!(e instanceof ApiError)) throw e;
        entry.state = "error";
        entry.tooLarge = e.status === 413;
        entry.message = e.platformUnavailable ? "The UNICHE platform is not reachable." : e.message;
      }
    } finally {
      entry.controller = null;
      release();
    }
  }

  /** Queues one upload per file; resolves when all have finished, successfully or not. */
  async function upload(files: FileList | File[], options: { floorPlan?: boolean } = {}): Promise<UploadEntry[]> {
    const started = Array.from(files).map((file) =>
      reactive<UploadEntry>({
        key: ++counter,
        file,
        type: options.floorPlan ? "FLOOR_PLAN" : assetTypeOf(file),
        progress: 0,
        state: "queued",
        message: null,
        tooLarge: false,
        floorPlan: !!options.floorPlan,
        asset: null,
        controller: null,
      }),
    );
    entries.value.push(...started);
    await Promise.all(started.map((entry) => run(entry)));
    return started;
  }

  function retry(entry: UploadEntry) {
    if (!entry.tooLarge) void run(entry);
  }

  /** Stops the files still waiting or running; finished ones stay. */
  function cancelRemaining() {
    for (const entry of entries.value) {
      if (entry.state === "queued") {
        entry.state = "cancelled";
        entry.message = "Cancelled.";
      } else if (entry.state === "uploading") {
        entry.controller?.abort();
      }
    }
  }

  function dismissFinished() {
    entries.value = entries.value.filter((e) => e.state === "uploading" || e.state === "queued");
  }

  const busy = () => entries.value.some((e) => e.state === "uploading" || e.state === "queued");

  return { entries, upload, retry, cancelRemaining, dismissFinished, ensureLimits, limits, busy };
}
