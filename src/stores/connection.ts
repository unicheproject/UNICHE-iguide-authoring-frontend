import { reactive, readonly } from "vue";

/*
 * Whether the CMS is offline (`12` §6 "offline CMS", DECISIONS.md D-040): set when a request gets no response or the
 * browser reports it lost the network, cleared when a request is answered again. While offline, `platform/api.ts`
 * refuses changes before sending them; reads still go out, so the first answered one clears the state.
 */
const state = reactive({ offline: typeof navigator !== "undefined" && navigator.onLine === false });
export const connection = readonly(state);

/** Called by the API layer: no response at all. */
export function markOffline(): void {
  state.offline = true;
}

/** Called by the API layer: the backend answered, whatever the status. */
export function markOnline(): void {
  state.offline = false;
}

if (typeof window !== "undefined") {
  window.addEventListener("offline", markOffline);
}
