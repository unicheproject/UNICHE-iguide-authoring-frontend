import { reactive, readonly } from "vue";
import { say } from "@/lib/announcer";

/*
 * Whether the CMS is offline (`12` §6 "offline CMS", DECISIONS.md D-040, D-078). Offline is asserted when the browser
 * reports `navigator.onLine === false`, or after two consecutive requests got no response at all (one aborted or
 * failed request is not enough). Cleared when a request is answered again. While offline, `platform/api.ts` refuses
 * changes before sending them; reads still go out, so the first answered one clears the state. Controls in the shell
 * chrome use `offlineReason` as their `disabledReason` (`aria-disabled` with the reason), never a native `disabled`.
 */
const state = reactive({ offline: typeof navigator !== "undefined" && navigator.onLine === false });
export const connection = readonly(state);

/** The reason mutating controls give while offline, or `undefined` when they may be used. */
export function offlineReason(): string | undefined {
  return state.offline ? "You are offline. Changes are disabled until the connection is back." : undefined;
}

let failures = 0;

/** Called by the API layer: no response at all. */
export function markOffline(): void {
  failures += 1;
  if (state.offline) return;
  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    state.offline = true;
  } else if (failures >= 2) {
    state.offline = true;
  } else {
    return;
  }
  // The banner is the one alert (`role="alert"` announces it); a second assertive message here would read it twice (C2-11).
}

/** Called by the API layer: the backend answered, whatever the status. */
export function markOnline(): void {
  failures = 0;
  if (!state.offline) return;
  state.offline = false;
  say("Back online");
}

if (typeof window !== "undefined") {
  window.addEventListener("offline", () => {
    failures = 2;
    markOffline();
  });
}
