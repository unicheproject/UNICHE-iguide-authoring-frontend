import { reactive, readonly } from "vue";

/**
 * Set when the session ended (a `401` that a token refresh could not cure), so `SessionEndedDialog` can say so before
 * the single redirect to sign-in (plan 2.4, D-078). Wiring the redirect is the session package's (P1); this store and
 * the dialog are the shared parts. `unsaved` says whether an editor holds edits that are kept in this browser, so the
 * dialog promises "your edits are kept" only when there are some (C3-92); editors set it with {@link setUnsavedEdits}.
 */
const state = reactive({ ended: false, at: 0, unsaved: false });
export const sessionNotice = readonly(state);

/** Records that the session ended now. */
export function markSessionEnded(): void {
  state.ended = true;
  state.at = Date.now();
}

/** Clears the notice (after the author chose to sign in again). */
export function clearSessionEnded(): void {
  state.ended = false;
}

/** An editor reports whether its form has unsaved edits (kept in the browser as a draft); false when it closes. */
export function setUnsavedEdits(unsaved: boolean): void {
  state.unsaved = unsaved;
}
