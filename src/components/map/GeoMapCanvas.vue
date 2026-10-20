<script setup lang="ts">
/**
 * A Leaflet map on OpenStreetMap tiles, as the CMS mockup draws maps (its `syncMaps`, `boundsEditor`, and
 * `maskOf`). In visitor view it is limited to the bounds; while editing the bounds, a rectangle with corner
 * handles and a centre handle can be dragged, with the outside dimmed. Markers are numbered and can be
 * dragged; route lines are drawn under them.
 */
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { onBeforeUnmount, onMounted, ref, watch } from "vue";

export type LatLng = [number, number];
/** South-west and north-east corners. */
export type Bounds = [LatLng, LatLng];

export interface CanvasMarker {
  key: string;
  lat: number;
  lng: number;
  label: string;
  title: string;
  draggable?: boolean;
  /** Muted markers are placed but hidden from visitors by the map's visibility. */
  muted?: boolean;
}

const props = withDefaults(
  defineProps<{
    view: { lat: number; lng: number; zoom: number };
    bounds: Bounds | null;
    editBounds?: boolean;
    /** Keep the map inside the bounds, as visitors see it. */
    limitToBounds?: boolean;
    markers?: CanvasMarker[];
    lines?: LatLng[][];
    height?: string;
    /** Fit the bounds whenever this changes, such as a newly picked search result. */
    fitKey?: string | number;
    /** Accessible name of the map region. */
    label: string;
  }>(),
  { editBounds: false, limitToBounds: false, markers: () => [], lines: () => [], height: "460px", fitKey: "" },
);
const emit = defineEmits<{
  boundsChange: [bounds: Bounds];
  markerMove: [key: string, lat: number, lng: number];
  viewChange: [view: { lat: number; lng: number; zoom: number }];
}>();

const host = ref<HTMLDivElement | null>(null);
let map: L.Map | null = null;
let layer: L.LayerGroup | null = null;
let dragging = false;

const TILE_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const ATTRIBUTION = '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

onMounted(() => {
  if (!host.value) return;
  map = L.map(host.value, { zoomControl: true, zoomSnap: 0.25, zoomDelta: 0.5, wheelPxPerZoomLevel: 120 });
  L.tileLayer(TILE_URL, { maxZoom: 19, attribution: ATTRIBUTION }).addTo(map);
  layer = L.layerGroup().addTo(map);
  map.setView([props.view.lat, props.view.lng], props.view.zoom);
  map.on("moveend", () => {
    if (!map) return;
    const c = map.getCenter();
    emit("viewChange", { lat: round(c.lat, 6), lng: round(c.lng, 6), zoom: Math.round(map.getZoom() * 100) / 100 });
  });
  redraw();
  applyLimits();
  setTimeout(() => map?.invalidateSize(), 60);
});

onBeforeUnmount(() => {
  map?.remove();
  map = null;
});

function round(value: number, digits: number): number {
  const f = 10 ** digits;
  return Math.round(value * f) / f;
}

/** Visitor view keeps the map within the bounds; editing frees it. */
function applyLimits() {
  if (!map) return;
  if (props.bounds && props.limitToBounds && !props.editBounds) {
    const lb = L.latLngBounds(props.bounds);
    map.setMinZoom(0);
    map.setMaxBounds(lb.pad(0.02));
    map.options.maxBoundsViscosity = 1;
    map.setMinZoom(Math.max(0, map.getBoundsZoom(lb) - 0.5));
  } else {
    map.setMaxBounds(null as unknown as L.LatLngBounds);
    map.setMinZoom(0);
    map.options.maxBoundsViscosity = 0;
  }
}

function maskOf(b: Bounds, opacity: number) {
  return L.polygon(
    [
      [
        [89, -179.9],
        [89, 179.9],
        [-89, 179.9],
        [-89, -179.9],
      ],
      [
        [b[0][0], b[0][1]],
        [b[1][0], b[0][1]],
        [b[1][0], b[1][1]],
        [b[0][0], b[1][1]],
      ],
    ],
    { stroke: false, fillColor: "#030712", fillOpacity: opacity, interactive: false },
  );
}

/** The mockup's bounds editor: corner handles resize, the centre handle moves the whole area. */
function boundsEditor(target: L.LayerGroup, bounds: Bounds) {
  let sw: LatLng = [...bounds[0]];
  let ne: LatLng = [...bounds[1]];
  const mask = maskOf([sw, ne], 0.28).addTo(target);
  const rect = L.rectangle([sw, ne], { color: "#b05fd6", weight: 2, dashArray: "6 5", fill: false }).addTo(target);
  const handleIcon = (cursor: string) =>
    L.divIcon({
      className: "",
      iconSize: [14, 14],
      iconAnchor: [7, 7],
      html: `<span style="display:block;width:14px;height:14px;background:#fff;border:2.5px solid #4c1d8b;border-radius:3px;box-shadow:0 1px 4px rgba(0,0,0,0.3);cursor:${cursor}"></span>`,
    });
  const moveIcon = L.divIcon({
    className: "",
    iconSize: [26, 26],
    iconAnchor: [13, 13],
    html: '<span title="Drag to move the area" style="width:26px;height:26px;border-radius:50%;background:#fff;border:2px solid #4c1d8b;color:#4c1d8b;font-size:14px;display:flex;align-items:center;justify-content:center;box-shadow:0 1px 4px rgba(0,0,0,0.3);cursor:move">✥</span>',
  });
  const corners = (): LatLng[] => [
    [sw[0], sw[1]],
    [ne[0], sw[1]],
    [ne[0], ne[1]],
    [sw[0], ne[1]],
  ];
  const centre = (): LatLng => [(sw[0] + ne[0]) / 2, (sw[1] + ne[1]) / 2];
  const cursors = ["nesw-resize", "nwse-resize", "nesw-resize", "nwse-resize"];
  const handles = corners().map((c, i) =>
    L.marker(c, { icon: handleIcon(cursors[i]), draggable: true, zIndexOffset: 1000, title: "Drag to resize bounds", keyboard: false }).addTo(target),
  );
  const mover = L.marker(centre(), { icon: moveIcon, draggable: true, zIndexOffset: 900, keyboard: false }).addTo(target);
  const refresh = (skip?: number | "m") => {
    rect.setBounds([sw, ne]);
    mask.setLatLngs([
      [
        [89, -179.9],
        [89, 179.9],
        [-89, 179.9],
        [-89, -179.9],
      ],
      [
        [sw[0], sw[1]],
        [ne[0], sw[1]],
        [ne[0], ne[1]],
        [sw[0], ne[1]],
      ],
    ]);
    corners().forEach((c, i) => {
      if (i !== skip) handles[i].setLatLng(c);
    });
    if (skip !== "m") mover.setLatLng(centre());
  };
  const opposite = [2, 3, 0, 1];
  const done = () => {
    refresh();
    dragging = false;
    emit("boundsChange", [
      [round(sw[0], 5), round(sw[1], 5)],
      [round(ne[0], 5), round(ne[1], 5)],
    ]);
  };
  handles.forEach((h, i) => {
    h.on("dragstart", () => (dragging = true));
    h.on("drag", (e) => {
      const p = (e.target as L.Marker).getLatLng();
      const o = corners()[opposite[i]];
      sw = [Math.min(p.lat, o[0]), Math.min(p.lng, o[1])];
      ne = [Math.max(p.lat, o[0]), Math.max(p.lng, o[1])];
      refresh(i);
    });
    h.on("dragend", done);
  });
  let start: { c: LatLng; sw: LatLng; ne: LatLng } | null = null;
  mover.on("dragstart", () => {
    dragging = true;
    start = { c: centre(), sw: [...sw], ne: [...ne] };
  });
  mover.on("drag", (e) => {
    if (!start) return;
    const p = (e.target as L.Marker).getLatLng();
    const dLat = p.lat - start.c[0];
    const dLng = p.lng - start.c[1];
    sw = [start.sw[0] + dLat, start.sw[1] + dLng];
    ne = [start.ne[0] + dLat, start.ne[1] + dLng];
    refresh("m");
  });
  mover.on("dragend", done);
}

function markerIcon(m: CanvasMarker) {
  const bg = m.muted ? "#9ca3af" : "#4c1d8b";
  return L.divIcon({
    className: "",
    iconSize: [26, 26],
    iconAnchor: [13, 13],
    html: `<span style="width:26px;height:26px;border-radius:50%;background:${bg};color:#fff;font:800 11px Montserrat,sans-serif;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,0.25);border:2px solid #fff">${m.label}</span>`,
  });
}

function redraw() {
  if (!map || !layer || dragging) return;
  layer.clearLayers();
  if (props.bounds) {
    if (props.editBounds) boundsEditor(layer, props.bounds);
    else maskOf(props.bounds, 0.12).addTo(layer);
  }
  for (const line of props.lines) {
    if (line.length > 1) L.polyline(line, { color: "#b05fd6", weight: 4, opacity: 0.85, lineJoin: "round", interactive: false }).addTo(layer);
  }
  for (const m of props.markers) {
    if (Number.isNaN(m.lat) || Number.isNaN(m.lng)) continue;
    const marker = L.marker([m.lat, m.lng], { icon: markerIcon(m), draggable: !!m.draggable, title: m.title, alt: m.title });
    marker.on("dragstart", () => (dragging = true));
    marker.on("dragend", (e) => {
      dragging = false;
      const ll = (e.target as L.Marker).getLatLng();
      emit("markerMove", m.key, round(ll.lat, 6), round(ll.lng, 6));
    });
    marker.addTo(layer);
  }
}

watch(() => [props.bounds, props.editBounds, props.markers, props.lines], redraw, { deep: true });
watch(() => [props.bounds, props.editBounds, props.limitToBounds], applyLimits, { deep: true });
watch(
  () => props.fitKey,
  () => {
    if (map && props.bounds) map.fitBounds(L.latLngBounds(props.bounds), { padding: [36, 36] });
  },
);
/**
 * Starting to edit the bounds keeps the author's zoom; the map only jumps to the area when none of it is
 * on screen, so there is something to drag.
 */
watch(
  () => props.editBounds,
  (editing) => {
    if (!editing || !map || !props.bounds) return;
    const area = L.latLngBounds(props.bounds);
    if (!map.getBounds().intersects(area)) map.fitBounds(area, { padding: [40, 40], animate: false });
  },
);
/**
 * Follows view changes made outside the map, such as typed coordinates. The source is a string so the
 * watcher fires only when the numbers change: a parent passing an inline `view` object hands over a new
 * object on every render, and comparing arrays by identity reset the author's zoom each time.
 */
watch(
  () => `${props.view.lat},${props.view.lng},${props.view.zoom}`,
  () => {
    if (!map) return;
    const c = map.getCenter();
    if (Math.abs(c.lat - props.view.lat) > 0.00006 || Math.abs(c.lng - props.view.lng) > 0.00006 || Math.abs(map.getZoom() - props.view.zoom) > 0.011) {
      map.setView([props.view.lat, props.view.lng], props.view.zoom, { animate: false });
    }
  },
);

defineExpose({
  /** The zoom that fits the bounds in this canvas, for a new map's initial view. */
  zoomFor(bounds: Bounds): number {
    return map ? Math.round(map.getBoundsZoom(L.latLngBounds(bounds)) * 100) / 100 : 14;
  },
  currentView(): { lat: number; lng: number; zoom: number } | null {
    if (!map) return null;
    const c = map.getCenter();
    return { lat: round(c.lat, 6), lng: round(c.lng, 6), zoom: Math.round(map.getZoom() * 100) / 100 };
  },
  zoomBy(delta: number) {
    map?.setZoom(map.getZoom() + delta);
  },
});
</script>

<template>
  <div ref="host" class="relative z-0 w-full overflow-hidden rounded-lg border bg-muted" :style="{ height }" role="region" :aria-label="label"></div>
</template>
