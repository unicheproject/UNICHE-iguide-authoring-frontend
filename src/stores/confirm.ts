import { reactive, readonly } from "vue";

/*
 * The CMS's own confirmation dialog, in place of the browser's `window.confirm` (`ConfirmDialog.vue`,
 * mounted once in `App.vue`). One question at a time; asking again answers the open one with "no".
 */

export interface ConfirmOptions {
  title: string;
  body: string;
  /** The action that goes ahead, such as "Leave without saving". */
  confirmLabel: string;
  /** The way back, such as "Keep editing". */
  cancelLabel?: string;
  /** Red action for something that loses work or data. */
  danger?: boolean;
}

interface ConfirmState extends ConfirmOptions {
  id: number;
}

/** The control that was in use when the question was asked (kept outside the reactive state: a DOM node must not be proxied). */
let openerElement: HTMLElement | null = null;

/** The control focus returns to when the question is answered "no" (Esc included): see {@link captureOpener}. */
export function confirmOpener(): HTMLElement | null {
  return openerElement;
}

/**
 * The control to give focus back to: the focused element, or, when that sits in a menu or popover that closes with the
 * choice (the Project switcher's item), the control that opened it (D-103: Esc on the leave guard returns to the opener).
 */
function captureOpener(): HTMLElement | null {
  if (typeof document === "undefined") return null;
  const active = document.activeElement instanceof HTMLElement && document.activeElement !== document.body ? document.activeElement : null;
  if (active && !active.closest("[data-radix-popper-content-wrapper]")) return active;
  return document.querySelector<HTMLElement>('[aria-expanded="true"]') ?? active;
}

const state = reactive<{ current: ConfirmState | null }>({ current: null });
export const confirmState = readonly(state);

let counter = 0;
let resolveCurrent: ((answer: boolean) => void) | null = null;

/** Asks the question and resolves with the answer: `true` to go ahead, `false` on cancel, Escape, or backdrop. */
export function askConfirm(options: ConfirmOptions): Promise<boolean> {
  answerConfirm(false);
  return new Promise((resolve) => {
    resolveCurrent = resolve;
    openerElement = captureOpener();
    state.current = { ...options, id: ++counter };
  });
}

export function answerConfirm(answer: boolean): void {
  const resolve = resolveCurrent;
  resolveCurrent = null;
  state.current = null;
  resolve?.(answer);
}
