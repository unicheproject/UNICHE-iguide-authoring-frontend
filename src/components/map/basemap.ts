/**
 * The base map under every CMS map: the OpenMapTiles "OSM Bright" vector style, served without a key by OpenFreeMap
 * and drawn by MapLibre GL inside Leaflet (DECISIONS.md D-064; D-081 corrects the earlier note that called it raw
 * OpenStreetMap tiles). Where WebGL is not available the map falls back to the public OpenStreetMap raster tiles, so
 * it still shows. Prototyping only (`09` §22). The tile host is a recorded exception to "authoring API and IdP only"
 * (D-081, Q-003 stays open for production hosting).
 *
 * The base map reports a {@link TileState} so the canvas can show "loading" and, when the style or a tile request
 * fails, an error with Retry instead of a blank grey box (C1-93).
 */
import L from "leaflet";
import { maplibreGL } from "@maplibre/maplibre-gl-leaflet";
import { setWorkerUrl } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
// MapLibre 6 parses tiles in a worker loaded from a file of its own, which Vite has to bundle and serve.
import workerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url";

setWorkerUrl(workerUrl);

const STYLE_URL = "https://tiles.openfreemap.org/styles/bright";
const ATTRIBUTION =
  '<a href="https://openfreemap.org" target="_blank" rel="noopener">OpenFreeMap</a> · ' +
  '© <a href="https://www.openmaptiles.org/" target="_blank" rel="noopener">OpenMapTiles</a> · ' +
  '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors';

const FALLBACK_TILES = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const FALLBACK_ATTRIBUTION = '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

/** Milliseconds without the first draw after which the base map counts as failed. */
const LOAD_TIMEOUT_MS = 15000;

/** State of the base map: drawing, drawn, or failed (style or tile request). */
export type TileState = "loading" | "ready" | "error";

/** Handle on the base map of one canvas. */
export interface Basemap {
  /** Loads the base map again after a failure. */
  retry(): void;
  /** Removes the base map and its listeners. */
  dispose(): void;
}

function webglAvailable(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return !!(canvas.getContext("webgl2") ?? canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

/**
 * Adds the base map to a Leaflet map, below its markers, lines and areas. `onState` is called with `loading` at once
 * and again whenever the state changes.
 */
export function addBasemap(map: L.Map, onState: (state: TileState) => void = () => undefined): Basemap {
  // The vector style is drawn up to street level; without a tile layer Leaflet would allow any zoom.
  map.setMaxZoom(19);
  const useGl = webglAvailable();
  let layer: L.Layer | null = null;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let attempt = 0;
  let state: TileState = "loading";

  const set = (next: TileState, forAttempt: number) => {
    if (forAttempt !== attempt) return;
    if (timer && next !== "loading") {
      clearTimeout(timer);
      timer = null;
    }
    // A late "ready" from a half-failed load must not hide the error.
    if (state === "error" && next === "ready") return;
    if (state === next) return;
    state = next;
    onState(next);
  };

  const remove = () => {
    if (timer) clearTimeout(timer);
    timer = null;
    if (layer) {
      map.removeLayer(layer);
      layer = null;
    }
  };

  const start = () => {
    remove();
    attempt += 1;
    const mine = attempt;
    state = "loading";
    onState("loading");
    timer = setTimeout(() => set("error", mine), LOAD_TIMEOUT_MS);
    if (useGl) {
      try {
        const gl = maplibreGL({ style: STYLE_URL, attributionControl: false });
        gl.addTo(map);
        layer = gl;
        // The layer builds its MapLibre map once Leaflet's map is ready, which is after this call when the view is
        // set later: wait for the layer's own `add` event instead of reading it now.
        const attach = () => {
          const glMap = gl.getMaplibreMap();
          // MapLibre labels its own canvas as a second "Map" region; the Leaflet region is the one landmark (C3-76).
          const hideCanvas = () => {
            const canvas = glMap.getCanvas();
            canvas.removeAttribute("role");
            canvas.removeAttribute("aria-label");
            canvas.setAttribute("aria-hidden", "true");
            canvas.setAttribute("tabindex", "-1");
          };
          hideCanvas();
          glMap.on("load", hideCanvas);
          glMap.on("error", () => set("error", mine));
          glMap.on("idle", () => {
            hideCanvas();
            set("ready", mine);
          });
        };
        if (gl.getMaplibreMap()) attach();
        else gl.once("add", attach);
        map.attributionControl?.addAttribution(ATTRIBUTION);
        return;
      } catch {
        // Fall through to the raster tiles.
      }
    }
    const tiles = L.tileLayer(FALLBACK_TILES, { maxZoom: 19, attribution: FALLBACK_ATTRIBUTION });
    tiles.on("tileerror", () => set("error", mine));
    tiles.on("load", () => set("ready", mine));
    tiles.addTo(map);
    layer = tiles;
  };

  start();
  return {
    retry: start,
    dispose: () => {
      attempt += 1;
      remove();
    },
  };
}

/** A design token (`--primary`) as a colour Leaflet's SVG attributes accept, which cannot use CSS variables. */
export function cssColour(name: string): string {
  return `hsl(${getComputedStyle(document.documentElement).getPropertyValue(name).trim()})`;
}
