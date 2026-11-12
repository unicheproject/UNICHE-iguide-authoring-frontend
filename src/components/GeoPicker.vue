<script setup lang="ts">
/**
 * Where a Resource sits, on OpenStreetMap tiles: framed on the map of the area it belongs to (`area`, such as its
 * Place's Geographic Map) or else on every saved coordinate of the Project, with the other Resources as hollow dots
 * and this one as the pin. Clicking or dragging moves the pin and reports the new coordinates; the arrow keys nudge
 * it, so the picker also works without a pointer.
 */
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { addBasemap } from "@/components/map/basemap";
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";

export interface GeoPoint {
  lat: number;
  lng: number;
  title?: string;
}

/** South-west and north-east corners. */
export type GeoArea = [[number, number], [number, number]];

const props = defineProps<{
  label: string;
  /** Current values of the coordinate fields; empty or unparseable means "no pin". */
  latitude: string;
  longitude: string;
  /** Other Resources shown as dots. */
  others: GeoPoint[];
  /** Points that frame the view when there is no `area`; they do not move while the author picks. */
  anchors: GeoPoint[];
  /** The area the Resource belongs to, outlined and framed. */
  area?: GeoArea | null;
  disabled?: boolean;
}>();
const emit = defineEmits<{ pick: [lat: string, lng: string] }>();

const DECIMALS = 5;
/** A nudge moves the pin by this share of the visible span. */
const NUDGE = 0.02;

const host = ref<HTMLDivElement | null>(null);
let map: L.Map | null = null;
let dotsLayer: L.LayerGroup | null = null;
let areaLayer: L.LayerGroup | null = null;
let pin: L.Marker | null = null;

function typed(): GeoPoint | null {
  const lat = Number(props.latitude.trim());
  const lng = Number(props.longitude.trim());
  if (!props.latitude.trim() || !props.longitude.trim() || Number.isNaN(lat) || Number.isNaN(lng)) return null;
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  return { lat, lng };
}

const hasFrame = computed(() => !!props.area || props.anchors.length > 0 || props.others.length > 0 || !!typed());
const interactive = computed(() => !props.disabled && hasFrame.value);

const pick = (lat: number, lng: number) => emit("pick", lat.toFixed(DECIMALS), lng.toFixed(DECIMALS));

/** Frames the area, else every known point, else the typed coordinates. */
function frame() {
  if (!map) return;
  if (props.area) {
    map.fitBounds(L.latLngBounds(props.area), { padding: [8, 8], animate: false });
    return;
  }
  const points = [...props.anchors, ...props.others];
  const own = typed();
  if (!points.length && own) points.push(own);
  if (!points.length) {
    map.setView([38.3, 23.8], 5, { animate: false });
    return;
  }
  map.fitBounds(L.latLngBounds(points.map((p) => [p.lat, p.lng] as [number, number])), { padding: [24, 24], maxZoom: 17, animate: false });
}

function drawArea() {
  if (!areaLayer) return;
  areaLayer.clearLayers();
  if (props.area) L.rectangle(props.area, { color: "#b05fd6", weight: 2, dashArray: "6 5", fill: false, interactive: false }).addTo(areaLayer);
}

function drawDots() {
  if (!dotsLayer) return;
  dotsLayer.clearLayers();
  for (const p of props.others) {
    const dot = L.circleMarker([p.lat, p.lng], { radius: 4, weight: 1.5, color: "#9ca3af", fillColor: "#fff", fillOpacity: 1, interactive: !!p.title });
    if (p.title) dot.bindTooltip(p.title);
    dot.addTo(dotsLayer);
  }
}

const pinIcon = L.divIcon({
  className: "",
  iconSize: [18, 18],
  iconAnchor: [9, 9],
  html: '<span style="display:block;width:18px;height:18px;border-radius:50%;background:#4c1d8b;border:3px solid #fff;box-shadow:0 2px 7px rgba(0,0,0,0.3)"></span>',
});

function drawPin() {
  if (!map) return;
  const at = typed();
  if (!at) {
    pin?.remove();
    pin = null;
    return;
  }
  if (!pin) {
    pin = L.marker([at.lat, at.lng], { icon: pinIcon, draggable: interactive.value, keyboard: false, zIndexOffset: 1000, title: "This point of interest" });
    pin.on("dragend", () => {
      const ll = pin!.getLatLng();
      pick(ll.lat, ll.lng);
    });
    pin.addTo(map);
  } else {
    pin.setLatLng([at.lat, at.lng]);
  }
  if (pin.dragging) {
    if (interactive.value) pin.dragging.enable();
    else pin.dragging.disable();
  }
}

onMounted(() => {
  if (!host.value) return;
  map = L.map(host.value, { keyboard: false, zoomSnap: 0.25, zoomDelta: 0.5, wheelPxPerZoomLevel: 120 });
  addBasemap(map);
  areaLayer = L.layerGroup().addTo(map);
  dotsLayer = L.layerGroup().addTo(map);
  map.on("click", (e: L.LeafletMouseEvent) => {
    if (interactive.value) pick(e.latlng.lat, e.latlng.lng);
  });
  frame();
  drawArea();
  drawDots();
  drawPin();
});

onBeforeUnmount(() => {
  map?.remove();
  map = null;
  pin = null;
});

// The frame follows the area and the saved points, never the pin the author is moving.
const frameKey = computed(() =>
  JSON.stringify([props.area ?? null, props.anchors.map((p) => [p.lat, p.lng]), props.others.map((p) => [p.lat, p.lng])]),
);
watch(frameKey, () => {
  frame();
  drawArea();
  drawDots();
});
watch(() => [props.latitude, props.longitude, props.disabled], drawPin);

function onKeydown(event: KeyboardEvent) {
  if (!interactive.value || !map) return;
  const moves: Record<string, [number, number]> = {
    ArrowLeft: [-NUDGE, 0],
    ArrowRight: [NUDGE, 0],
    ArrowUp: [0, NUDGE],
    ArrowDown: [0, -NUDGE],
  };
  const move = moves[event.key];
  if (!move) return;
  event.preventDefault();
  const view = map.getBounds();
  const start = typed() ?? { lat: view.getCenter().lat, lng: view.getCenter().lng };
  pick(start.lat + move[1] * (view.getNorth() - view.getSouth()), start.lng + move[0] * (view.getEast() - view.getWest()));
}

const note = computed(() => {
  if (!hasFrame.value) return { text: "No coordinates in this Project yet. Type the first ones, or click the map to place it.", warn: true };
  if (props.disabled) return { text: "Read-only while the point of interest is not a draft.", warn: false };
  if (!typed()) return { text: "No coordinates yet. Click the map to place it, or type them.", warn: true };
  return { text: "Click the map or drag the pin to move it; the arrow keys nudge it.", warn: false };
});
</script>

<template>
  <div class="flex min-w-0 flex-col gap-2">
    <span class="text-[10px] font-extrabold uppercase tracking-[0.09em] text-muted-foreground">{{ label }}</span>
    <div
      ref="host"
      class="picker relative z-0 h-[260px] overflow-hidden rounded-lg border-[1.5px] bg-muted"
      :class="interactive ? 'cursor-crosshair' : 'cursor-default'"
      :tabindex="interactive ? 0 : -1"
      role="group"
      :aria-label="`${label}: pin position. Arrow keys move the pin; the latitude and longitude fields set it exactly.`"
      @keydown="onKeydown"
    ></div>
    <span class="text-[11px]" :class="note.warn ? 'text-[#855400]' : 'text-muted-foreground'">{{ note.text }}</span>
  </div>
</template>

<style scoped>
.picker:focus-visible {
  outline: 2px solid #4c1d8b;
  outline-offset: 2px;
}
.picker.cursor-crosshair :deep(.leaflet-grab) {
  cursor: crosshair;
}
</style>
