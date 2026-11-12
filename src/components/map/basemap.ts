/**
 * The base map under every CMS map: the OpenMapTiles "OSM Bright" style, served without a key by OpenFreeMap and
 * drawn as vector tiles by MapLibre GL inside Leaflet (DECISIONS.md D-064). Where WebGL is not available the map
 * falls back to the public OpenStreetMap raster tiles, so it still shows. Prototyping only, as the OpenStreetMap
 * tiles were (`09` §22).
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

function webglAvailable(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return !!(canvas.getContext("webgl2") ?? canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

/** Adds the base map to a Leaflet map, below its markers, lines and areas. */
export function addBasemap(map: L.Map): void {
  // The vector style is drawn up to street level; without a tile layer Leaflet would allow any zoom.
  map.setMaxZoom(19);
  if (webglAvailable()) {
    try {
      maplibreGL({ style: STYLE_URL, attributionControl: false }).addTo(map);
      map.attributionControl?.addAttribution(ATTRIBUTION);
      return;
    } catch {
      // Fall through to the raster tiles.
    }
  }
  L.tileLayer(FALLBACK_TILES, { maxZoom: 19, attribution: FALLBACK_ATTRIBUTION }).addTo(map);
}
