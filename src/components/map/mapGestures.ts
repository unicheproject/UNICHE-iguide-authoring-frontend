/**
 * Touch gestures for Leaflet maps (D-096, C2-84). Leaflet marks a map `touch-action: none`, so a swipe that starts on
 * a map scrolls nothing and a finger on a tall map traps the page. On a coarse pointer the map therefore starts "at
 * rest": one finger scrolls the page, the zoom buttons zoom, pins and handles can still be dragged (they declare
 * `touch-action: none` themselves, see the canvas styles). A "Move map" toggle puts the map in pan and pinch mode for
 * as long as the author wants it; a visible line under the map says which mode is on.
 */
import type L from "leaflet";
import { computed, ref, type Ref } from "vue";

/** Whether the primary pointer is a finger. */
export function isCoarsePointer(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;
}

/**
 * Move mode for one map. `apply` must be called once the Leaflet map exists and after each toggle; on a fine pointer
 * it changes nothing (the map always pans), `moveOn` is then always true and `hint` is empty.
 */
export function useMapMoveMode(getMap: () => L.Map | null): {
  coarse: boolean;
  moveOn: Ref<boolean>;
  hint: Ref<string>;
  apply: () => void;
  toggle: () => void;
} {
  const coarse = isCoarsePointer();
  const moveOn = ref(!coarse);
  const hint = computed(() => {
    if (!coarse) return "";
    return moveOn.value
      ? "Move map is on: one finger pans the map and two fingers zoom it. Turn it off to scroll the page."
      : "Swiping scrolls the page. Use the zoom buttons, or turn on Move map to pan the map with a finger.";
  });
  function apply() {
    const map = getMap();
    if (!map || !coarse) return;
    if (moveOn.value) {
      map.dragging.enable();
      map.touchZoom.enable();
    } else {
      map.dragging.disable();
      map.touchZoom.disable();
    }
  }
  function toggle() {
    moveOn.value = !moveOn.value;
    apply();
  }
  return { coarse, moveOn, hint, apply, toggle };
}
