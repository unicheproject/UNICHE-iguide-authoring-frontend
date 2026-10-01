import { reactive, readonly } from "vue";

export type ToastTone = "success" | "warning" | "error" | "info";

interface ToastState {
  id: number;
  title: string;
  body: string;
  tone: ToastTone;
}

const state = reactive<{ current: ToastState | null }>({ current: null });
export const toastState = readonly(state);

let timer: ReturnType<typeof setTimeout> | null = null;
let counter = 0;

/** Shows one toast at a time, as in the mockup; it dismisses itself after a few seconds. */
export function showToast(title: string, body = "", tone: ToastTone = "success"): void {
  state.current = { id: ++counter, title, body, tone };
  if (timer) clearTimeout(timer);
  timer = setTimeout(dismissToast, 6000);
}

export function dismissToast(): void {
  state.current = null;
  if (timer) clearTimeout(timer);
  timer = null;
}
