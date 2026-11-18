import { reactive, readonly } from "vue";
import { say } from "@/lib/announcer";
import { describeError } from "@/lib/errors";

/** `neutral` is a confirmation that is neither good news nor a problem (Discarded, Archived): a check, ink colour. */
export type ToastTone = "success" | "warning" | "error" | "info" | "neutral";

export interface ToastItem {
  id: number;
  title: string;
  body: string;
  tone: ToastTone;
  /** Shown with a copy button on errors, so the author can quote it. */
  requestId: string | null;
  /** Errors stay until dismissed; others dismiss themselves (5 s, warnings 8 s). */
  persist: boolean;
  /** How many identical toasts this one stands for ("x3"); 1 for a single one. */
  count: number;
  /** When it was shown (ms since epoch); a route change clears toasts older than a moment. */
  createdAt: number;
}

export interface ToastOptions {
  requestId?: string | null;
  /** Keep the toast until dismissed. Errors always persist. */
  persist?: boolean;
}

/** Up to three toasts, newest last (D-078). */
const state = reactive<{ items: ToastItem[] }>({ items: [] });
export const toastState = readonly(state);

const MAX = 3;
let counter = 0;
const timers = new Map<number, ReturnType<typeof setTimeout>>();
const remaining = new Map<number, number>();
const startedAt = new Map<number, number>();

/** Confirmations that are not warnings, whatever tone the caller passed (D-102): a check icon, never a triangle. */
const NEUTRAL_TITLE = /^(changes discarded|discarded|archived|restored|link copied)\b/i;
/** A toast that carries an instruction the person still has to act on stays until dismissed (D-102). */
const INSTRUCTION_BODY = /\b(by hand|manually)\b/i;

function duration(tone: ToastTone): number {
  return tone === "warning" ? 8000 : 5000;
}

function arm(id: number, ms: number) {
  startedAt.set(id, Date.now());
  remaining.set(id, ms);
  timers.set(id, setTimeout(() => dismissToast(id), ms));
}

/**
 * Shows a toast (stacked, up to three). Success and info dismiss after 5 s, warnings after 8 s, errors stay until
 * dismissed; timers pause while the pointer or focus is on a toast (`pauseToast`). An identical toast (same title, body,
 * tone and request id) is not stacked again: the one on screen counts up ("x3") and its timer restarts. One
 * announcement per toast: an error goes to the assertive live region once (the toast itself has no role), a warning is
 * `role="alert"` on the toast, success and info are `role="status"` (D-086). The signature of earlier calls (`title`,
 * `body`, `tone`) is unchanged.
 */
export function showToast(title: string, body = "", tone: ToastTone = "success", options: ToastOptions = {}): void {
  const requestId = options.requestId ?? null;
  // D-102: neutral confirmations read as a check; "Link copied" is one line (the link is already on the page).
  if (tone === "warning" && NEUTRAL_TITLE.test(title)) tone = "neutral";
  if (/^link copied$/i.test(title)) body = "";
  const persist = options.persist === true || tone === "error" || INSTRUCTION_BODY.test(body);
  const same = state.items.find((t) => t.title === title && t.body === body && t.tone === tone && t.requestId === requestId);
  if (same) {
    same.count += 1;
    if (!persist) {
      clearTimeout(timers.get(same.id));
      arm(same.id, duration(tone));
    }
    return;
  }
  const id = ++counter;
  state.items.push({ id, title, body, tone, requestId, persist, count: 1, createdAt: Date.now() });
  while (state.items.length > MAX) dismissToast(state.items[0].id);
  if (!persist) arm(id, duration(tone));
  if (tone === "error") say(`${title}. ${body}`.trim(), "assertive");
}

/**
 * Shows a failed request as an error toast: the heading and fixed sentence of `describeError` (never the server's
 * text) and the request id. `action` completes the sentence ("save the place").
 */
export function showErrorToast(error: unknown, action = "complete this", title?: string): void {
  const described = describeError(error, action);
  showToast(title ?? described.title, described.body, "error", { requestId: described.requestId });
}

/** A route change clears the toasts of the screen that was left (D-102); one shown in the last 1.5 s belongs to the move. */
export function clearStaleToasts(maxAgeMs = 1500): void {
  const now = Date.now();
  for (const item of [...state.items]) if (now - item.createdAt > maxAgeMs) dismissToast(item.id);
}

/** Removes one toast, or the oldest when no id is given. */
export function dismissToast(id?: number): void {
  const target = id ?? state.items[0]?.id;
  if (target === undefined) return;
  clearTimeout(timers.get(target));
  timers.delete(target);
  remaining.delete(target);
  startedAt.delete(target);
  const index = state.items.findIndex((t) => t.id === target);
  if (index >= 0) state.items.splice(index, 1);
}

/** Pauses a toast's countdown while it is hovered or focused. */
export function pauseToast(id: number): void {
  if (!timers.has(id)) return;
  clearTimeout(timers.get(id));
  timers.delete(id);
  remaining.set(id, Math.max(1500, (remaining.get(id) ?? 0) - (Date.now() - (startedAt.get(id) ?? Date.now()))));
}

/** Resumes a paused countdown with the time left (at least 1.5 s). */
export function resumeToast(id: number): void {
  const left = remaining.get(id);
  const item = state.items.find((t) => t.id === id);
  if (left === undefined || !item || item.persist || timers.has(id)) return;
  arm(id, left);
}
