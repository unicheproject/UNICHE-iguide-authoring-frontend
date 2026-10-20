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

const state = reactive<{ current: ConfirmState | null }>({ current: null });
export const confirmState = readonly(state);

let counter = 0;
let resolveCurrent: ((answer: boolean) => void) | null = null;

/** Asks the question and resolves with the answer: `true` to go ahead, `false` on cancel, Escape, or backdrop. */
export function askConfirm(options: ConfirmOptions): Promise<boolean> {
  answerConfirm(false);
  return new Promise((resolve) => {
    resolveCurrent = resolve;
    state.current = { ...options, id: ++counter };
  });
}

export function answerConfirm(answer: boolean): void {
  const resolve = resolveCurrent;
  resolveCurrent = null;
  state.current = null;
  resolve?.(answer);
}
