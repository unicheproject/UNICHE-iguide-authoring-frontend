import { reactive, ref, type Ref } from "vue";
import { ApiError } from "@/platform/api";
import { assetTypeOf, fetchAssetLimits, sizeProblem, uploadAsset, type Asset, type AssetLimits, type AssetType } from "@/platform/assets";

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

/** Sends one file; the default creates a new Asset, a replacement sends the file of an existing one. */
export type Uploader = (entry: UploadEntry, onProgress: (fraction: number) => void, signal: AbortSignal) => Promise<Asset>;

/** Two at a time keeps the progress readable and does not saturate a museum's uplink. */
const PARALLEL = 2;

/**
 * Uploads with per-file progress (iGuide spec 12, media library and section 5; mockup C-02; DECISIONS.md D-032):
 * files wait in a queue; the size limits are checked before any bytes leave the browser, and a file is not sent
 * at all while the limits cannot be loaded; a failed file keeps its reason and can be retried unless it is too
 * large; the files still waiting or running can be cancelled; every result is announced in `announcement` for a
 * polite live region (`14` §3); every uploaded Asset is handed to `onUploaded`.
 */
export function useAssetUpload(
  projectId: Ref<string>,
  onUploaded: (asset: Asset) => void,
  options: { uploader?: Uploader } = {},
) {
  const entries = ref<UploadEntry[]>([]);
  const limits = ref<AssetLimits | null>(null);
  const limitsFailed = ref(false);
  const announcement = ref("");
  let counter = 0;
  let running = 0;
  const waiters: (() => void)[] = [];

  const send: Uploader =
    options.uploader ??
    ((entry, onProgress, signal) => uploadAsset(projectId.value, entry.file, { floorPlan: entry.floorPlan, onProgress, signal }));

  async function ensureLimits(): Promise<AssetLimits | null> {
    if (limits.value) return limits.value;
    try {
      limits.value = await fetchAssetLimits(projectId.value);
      limitsFailed.value = false;
    } catch (e) {
      if (!(e instanceof ApiError)) throw e;
      limitsFailed.value = true;
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

  function fail(entry: UploadEntry, message: string, tooLarge = false) {
    entry.state = "error";
    entry.tooLarge = tooLarge;
    entry.message = message;
    announcement.value = `${entry.file.name} was not uploaded: ${message}`;
  }

  async function run(entry: UploadEntry) {
    entry.state = "queued";
    entry.progress = 0;
    entry.message = null;
    entry.tooLarge = false;
    const known = await ensureLimits();
    if (!known) {
      fail(entry, "The size limits could not be loaded, so nothing was sent. Retry in a moment.");
      return;
    }
    const problem = sizeProblem(entry.file.size, entry.type, known);
    if (problem) {
      fail(entry, problem, true);
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
      const asset = await send(entry, (f) => (entry.progress = f), entry.controller.signal);
      entry.state = "done";
      entry.progress = 1;
      entry.asset = asset;
      announcement.value = `${entry.file.name} uploaded.`;
      onUploaded(asset);
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") {
        entry.state = "cancelled";
        entry.message = "Cancelled.";
        announcement.value = `${entry.file.name}: upload cancelled.`;
      } else {
        if (!(e instanceof ApiError)) throw e;
        const message =
          e.platformUnavailable
            ? "The UNICHE platform is not reachable."
            : e.code === "VERSION_CONFLICT"
              ? "Someone else changed the asset meanwhile. Reload it and try again."
              : (e.fieldMessages().file ?? e.message);
        fail(entry, message, e.status === 413);
      }
    } finally {
      entry.controller = null;
      release();
    }
  }

  /**
   * Queues one upload per file; resolves when all have finished, successfully or not. `type` names the type the
   * backend will give the files (a replacement keeps its Asset's type); otherwise it is guessed from each file.
   */
  async function upload(files: FileList | File[], options: { floorPlan?: boolean; type?: AssetType } = {}): Promise<UploadEntry[]> {
    const started = Array.from(files).map((file) =>
      reactive<UploadEntry>({
        key: ++counter,
        file,
        type: options.type ?? (options.floorPlan ? "FLOOR_PLAN" : assetTypeOf(file)),
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

  /** Stops one file: waiting ones at once, a running one through its request. */
  function cancel(entry: UploadEntry) {
    if (entry.state === "queued") {
      entry.state = "cancelled";
      entry.message = "Cancelled.";
      announcement.value = `${entry.file.name}: upload cancelled.`;
    } else if (entry.state === "uploading") {
      entry.controller?.abort();
    }
  }

  /** Stops the files still waiting or running; finished ones stay. */
  function cancelRemaining() {
    for (const entry of entries.value) cancel(entry);
  }

  function dismissFinished() {
    entries.value = entries.value.filter((e) => e.state === "uploading" || e.state === "queued");
  }

  const busy = () => entries.value.some((e) => e.state === "uploading" || e.state === "queued");

  return {
    entries,
    upload,
    retry,
    cancel,
    cancelRemaining,
    dismissFinished,
    ensureLimits,
    limits,
    limitsFailed,
    announcement,
    busy,
  };
}
