import { reactive, readonly } from "vue";

/*
 * The app's two live regions (`App.vue` renders them): polite for completion and navigation messages, assertive for
 * errors that need attention now (`14` §4). Screen readers announce a live region only when its text changes, so a
 * repeated message is cleared first.
 */
const state = reactive({ polite: "", assertive: "" });
export const announcements = readonly(state);

type Mode = "polite" | "assertive";
const timers: Partial<Record<Mode, ReturnType<typeof setTimeout>>> = {};

/** Announces `text` to assistive technology; `assertive` interrupts, `polite` (default) waits. */
export function say(text: string, mode: Mode = "polite"): void {
  clearTimeout(timers[mode]);
  state[mode] = "";
  timers[mode] = setTimeout(() => {
    state[mode] = text;
  }, 60);
}

/** `useAnnouncer().say(text, mode?)` for components; the same function as {@link say}. */
export function useAnnouncer(): { say: typeof say } {
  return { say };
}
