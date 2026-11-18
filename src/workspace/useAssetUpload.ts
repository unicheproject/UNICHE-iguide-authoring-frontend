import { reactive, ref, type Ref } from "vue";
import { ApiError } from "@/platform/api";
import { describeError } from "@/lib/errors";
import {
  assetTypeOf,
  duplicateOf,
  fetchAssetLimits,
  isAcceptedFile,
  sizeProblem,
  uploadAsset,
  type Asset,
  type AssetLimits,
  type AssetType,
} from "@/platform/assets";

export interface UploadEntry {
  key: number;
  file: File;
  type: AssetType;
  progress: number;
  state: "queued" | "held" | "uploading" | "done" | "error" | "cancelled";
  message: string | null;
  /** The platform's request id of a failed upload, to quote to support. */
  requestId: string | null;
  /** The platform's answer to a failed upload when the server, not the file, is the problem: the row shows it through `ProblemAlert` (D-087), never the server's own text. */
  error: ApiError | null;
  /** Too large for its type, or refused for good: retrying cannot help. */
  tooLarge: boolean;
  /** Whether Retry can help (a network or server failure); false for a refusal of the file itself. */
  retryable: boolean;
  /** Why the file waits for the author's say-so (`state` "held"): an unusual type, or a copy of an Asset. */
  hold: { kind: "type" | "duplicate"; message: string; existing: Asset | null } | null;
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
  options: { uploader?: Uploader; /** The library, to spot a file that looks like a copy. */ existing?: () => readonly Asset[] } = {},
) {
  const entries = ref<UploadEntry[]>([]);
  /** Every message in order, for a `role="log"` live region (additions are read one after the other); `announcement` is only the latest. */
  const log = ref<{ id: number; text: string; tone: "info" | "success" | "error" }[]>([]);
  let logCounter = 0;
  function note(text: string, tone: "info" | "success" | "error" = "info") {
    log.value.push({ id: ++logCounter, text, tone });
    announcement.value = text;
  }
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

  function fail(entry: UploadEntry, message: string, options: { tooLarge?: boolean; retryable?: boolean; requestId?: string | null; error?: ApiError | null } = {}) {
    entry.state = "error";
    entry.error = options.error ?? null;
    entry.tooLarge = options.tooLarge ?? false;
    entry.retryable = options.retryable ?? !options.tooLarge;
    entry.requestId = options.requestId ?? null;
    entry.message = message;
    note(`${entry.file.name} was not uploaded: ${message}`, "error");
  }

  /** The reason a file waits for confirmation, or null when it can go. Checked once, before the limits. */
  function holdReason(entry: UploadEntry): UploadEntry["hold"] {
    if (!isAcceptedFile(entry.file) && entry.type !== "FLOOR_PLAN") {
      return { kind: "type", message: "This file type is not one visitors can use. Accepted: images, audio, video, PDF documents and 3D models.", existing: null };
    }
    const copy = duplicateOf(entry.file, options.existing?.() ?? []);
    if (copy) return { kind: "duplicate", message: `This looks like a copy of ${copy.internalName}.`, existing: copy };
    const twin = entries.value.find((e) => e !== entry && e.state !== "error" && e.state !== "cancelled" && e.file.name === entry.file.name && e.file.size === entry.file.size && e.key < entry.key);
    if (twin) return { kind: "duplicate", message: `This looks like a copy of ${twin.file.name}, chosen before it.`, existing: null };
    return null;
  }

  /** Lets a held file go (the author chose "Upload anyway"). */
  function confirmHeld(entry: UploadEntry) {
    if (entry.state !== "held") return;
    entry.hold = null;
    void run(entry, true);
  }

  /** Takes a skipped file back to "needs your decision" (the author changed their mind). */
  function undoSkip(entry: UploadEntry) {
    if (entry.state !== "cancelled" || !entry.hold) return;
    entry.state = "held";
    entry.message = entry.hold.message;
    note(`${entry.file.name}: back to waiting for your decision.`);
  }

  /** Drops a held file without sending it. */
  function skipHeld(entry: UploadEntry) {
    if (entry.state !== "held") return;
    entry.state = "cancelled";
    entry.message = "Skipped.";
    note(`${entry.file.name}: skipped.`);
  }

  async function run(entry: UploadEntry, confirmed = false) {
    entry.state = "queued";
    entry.progress = 0;
    entry.message = null;
    entry.requestId = null;
    entry.error = null;
    entry.tooLarge = false;
    entry.retryable = true;
    const known = await ensureLimits();
    if (!known) {
      fail(entry, "The size limits could not be loaded, so nothing was sent. Retry in a moment.");
      return;
    }
    const problem = sizeProblem(entry.file.size, entry.type, known);
    if (problem) {
      fail(entry, problem, { tooLarge: true });
      return;
    }
    if (!confirmed) {
      const hold = holdReason(entry);
      if (hold) {
        entry.state = "held";
        entry.hold = hold;
        entry.message = hold.message;
        note(`${entry.file.name}: ${hold.message} Choose Upload anyway or Skip.`, "info");
        return;
      }
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
      note(`${entry.file.name} uploaded.`, "success");
      onUploaded(asset);
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") {
        entry.state = "cancelled";
        entry.message = "Cancelled.";
        note(`${entry.file.name}: upload cancelled.`);
      } else {
        if (!(e instanceof ApiError)) throw e;
        // Server text is never shown (D-087): a refusal of the file itself uses the field message the platform
        // validated, everything else the fixed sentence for the status.
        const message =
          e.code === "VERSION_CONFLICT"
            ? "Someone else changed the asset meanwhile. Reload it and try again."
            : e.status === 413
              ? "The file is larger than the platform accepts."
              : e.status === 422 && e.fieldMessages().file
                ? e.fieldMessages().file!
                : describeError(e, "upload the file").body;
        fail(entry, message, {
          error: e.status >= 500 || e.platformUnavailable ? e : null,
          tooLarge: e.status === 413,
          retryable: e.status === 413 ? false : e.platformUnavailable || e.status >= 500 || e.status === 429 || e.status === 408 || e.code === "VERSION_CONFLICT",
          requestId: e.requestId,
        });
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
        requestId: null,
        error: null,
        tooLarge: false,
        retryable: true,
        hold: null,
        floorPlan: !!options.floorPlan,
        asset: null,
        controller: null,
      }),
    );
    entries.value.push(...started);
    note(started.length === 1 ? `Uploading ${started[0].file.name}.` : `Uploading ${started.length} files.`);
    await Promise.all(started.map((entry) => run(entry)));
    // A held file waits for the author; the summary is given when nothing is left running.
    if (started.length > 1 || started.some((e) => e.state !== "done")) {
      const done = started.filter((e) => e.state === "done").length;
      const failed = started.filter((e) => e.state === "error").length;
      const held = started.filter((e) => e.state === "held").length;
      const parts = [`${done} uploaded`, ...(failed ? [`${failed} failed`] : []), ...(held ? [`${held} waiting for your decision`] : [])];
      note(`${parts.join(", ")}.`, failed ? "error" : "success");
    }
    return started;
  }

  function retry(entry: UploadEntry) {
    if (entry.retryable && !entry.tooLarge) void run(entry, true);
  }

  /** Stops one file: waiting ones at once, a running one through its request. */
  function cancel(entry: UploadEntry) {
    if (entry.state === "queued") {
      entry.state = "cancelled";
      entry.message = "Cancelled.";
      note(`${entry.file.name}: upload cancelled.`);
    } else if (entry.state === "uploading") {
      entry.controller?.abort();
    }
  }

  /** Stops the files still waiting or running; finished ones stay. */
  function cancelRemaining() {
    for (const entry of entries.value) cancel(entry);
  }

  function dismissFinished() {
    entries.value = entries.value.filter((e) => e.state === "uploading" || e.state === "queued" || e.state === "held");
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
    log,
    confirmHeld,
    skipHeld,
    undoSkip,
    busy,
  };
}
