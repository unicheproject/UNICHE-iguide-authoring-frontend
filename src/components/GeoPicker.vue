<script setup lang="ts">
/**
 * Where a Resource sits, on the OpenFreeMap base map (a failed base map shows "Try again"; the coordinate fields stay usable): framed on the map of the area it belongs to (`area`, such as its
 * Place's Geographic Map) or else on every saved coordinate of the Project, with the other Resources as hollow dots
 * and this one as the pin. Clicking or dragging moves the pin and reports the new coordinates; the arrow keys nudge
 * it, so the picker also works without a pointer.
 *
 * Keyboard model (D-096, C2-58): the map is one Tab stop (the pin group; Plus and Minus zoom, the arrow keys nudge),
 * preceded by a "Skip map" link. The other Resources are not focusable on the map; they are listed by name in the
 * "Nearby points of interest" disclosure under it. Zoom buttons and attribution links stay out of the Tab order and
 * remain usable by pointer.
 */
import { ChevronDown } from "lucide-vue-next";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { addBasemap, cssColour, type Basemap, type TileState } from "@/components/map/basemap";
import { formatCoordinate, parseDecimal } from "@/components/map/coordinates";
import MapMoveButton from "@/components/map/MapMoveButton.vue";
import { useMapMoveMode } from "@/components/map/mapGestures";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import Spinner from "@/components/ui/spinner/Spinner.vue";
import { say } from "@/lib/announcer";
import { computed, onBeforeUnmount, onMounted, ref, useId, watch } from "vue";

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
  /** Map height in px (default 260); the map's own size changes, not the page's. */
  height?: number;
}>();
const emit = defineEmits<{ pick: [lat: string, lng: string] }>();

const DECIMALS = 5;
/** A nudge moves the pin by this share of the visible span. */
const NUDGE = 0.02;

const host = ref<HTMLDivElement | null>(null);
const ids = { after: useId(), nearby: useId() };
const nearbyOpen = ref(false);
/** Other Resources that have a name, for the disclosure; the dots on the map are not focusable. */
const errorCard = ref<InstanceType<typeof Alert> | null>(null);
const nearby = computed(() => props.others.filter((p) => p.title));
let map: L.Map | null = null;
let dotsLayer: L.LayerGroup | null = null;
let areaLayer: L.LayerGroup | null = null;
let pin: L.Marker | null = null;
let basemap: Basemap | null = null;
const tileState = ref<TileState>("loading");
/** On a finger the map starts at rest so a swipe scrolls the page; "Move map" turns panning on (D-096, C2-84). */
const gestures = useMapMoveMode(() => map);
const coarse = typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;

function typed(): GeoPoint | null {
  const lat = parseDecimal(props.latitude);
  const lng = parseDecimal(props.longitude);
  if (lat === null || lng === null) return null;
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  return { lat, lng };
}

const hasFrame = computed(() => !!props.area || props.anchors.length > 0 || props.others.length > 0 || !!typed());
const interactive = computed(() => !props.disabled && hasFrame.value);

const pick = (lat: number, lng: number) => emit("pick", formatCoordinate(lat, DECIMALS), formatCoordinate(lng, DECIMALS));

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
  if (props.area) L.rectangle(props.area, { color: cssColour("--primary"), weight: 2, dashArray: "6 5", fill: false, interactive: false }).addTo(areaLayer);
}

function drawDots() {
  if (!dotsLayer) return;
  dotsLayer.clearLayers();
  for (const p of props.others) {
    const dot = L.circleMarker([p.lat, p.lng], { radius: 4, weight: 1.5, color: cssColour("--muted-foreground"), fillColor: cssColour("--card"), fillOpacity: 1, interactive: false });
    dot.addTo(dotsLayer);
  }
}

const pinSize = coarse ? 44 : 22;
const pinIcon = L.divIcon({
  className: "geo-pin",
  iconSize: [pinSize, pinSize],
  iconAnchor: [pinSize / 2, pinSize / 2],
  html: '<span style="display:block;width:18px;height:18px;border-radius:9999px;background:hsl(var(--primary));border:3px solid hsl(var(--card));box-shadow:0 2px 7px rgba(0,0,0,0.3)"></span>',
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

/** Leaflet draws zoom buttons and attribution links as links; the pin group is the map's one Tab stop (D-096). */
function leaveTabOrder() {
  host.value?.querySelectorAll<HTMLElement>(".leaflet-control a, .leaflet-interactive").forEach((el) => el.setAttribute("tabindex", "-1"));
}

function skipMap() {
  document.getElementById(ids.after)?.focus();
}

function retryTiles() {
  // The card leaves when loading starts: focus goes to the map first, never to the page (C3-09).
  if (host.value && errorCard.value?.$el.contains(document.activeElement)) host.value.focus({ preventScroll: true });
  basemap?.retry();
}

onMounted(() => {
  if (!host.value) return;
  map = L.map(host.value, { keyboard: false, zoomSnap: 0.25, zoomDelta: 0.5, wheelPxPerZoomLevel: 120 });
  basemap = addBasemap(map, (state) => (tileState.value = state));
  areaLayer = L.layerGroup().addTo(map);
  dotsLayer = L.layerGroup().addTo(map);
  map.on("click", (e: L.LeafletMouseEvent) => {
    if (interactive.value) pick(e.latlng.lat, e.latlng.lng);
  });
  frame();
  drawArea();
  drawDots();
  drawPin();
  leaveTabOrder();
  gestures.apply();
});

onBeforeUnmount(() => {
  basemap?.dispose();
  basemap = null;
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
  const factor = event.shiftKey ? 5 : 1;
  if (event.key === "+" || event.key === "=" || event.key === "-") {
    event.preventDefault();
    if (event.key === "-") map.zoomOut();
    else map.zoomIn();
    return;
  }
  const move = moves[event.key];
  if (!move) return;
  event.preventDefault();
  const view = map.getBounds();
  const start = typed() ?? { lat: view.getCenter().lat, lng: view.getCenter().lng };
  const lat = start.lat + move[1] * factor * (view.getNorth() - view.getSouth());
  const lng = start.lng + move[0] * factor * (view.getEast() - view.getWest());
  pick(lat, lng);
  say(`Pin moved to ${formatCoordinate(lat, DECIMALS)}, ${formatCoordinate(lng, DECIMALS)}`);
}

const note = computed(() => {
  if (!hasFrame.value) return { text: "No coordinates in this Project yet. Type the first ones, or click the map to place it.", warn: true };
  if (props.disabled) return { text: "Read-only while the point of interest is not a draft.", warn: false };
  if (!typed()) return { text: `No coordinates yet. ${coarse ? "Tap" : "Click"} the map to place it, or type them.`, warn: true };
  return { text: `${coarse ? "Tap" : "Click"} the map or drag the pin to move it. With the map focused, the arrow keys nudge it (Shift for larger steps) and Plus and Minus zoom.`, warn: false };
});
</script>

<template>
  <div class="flex min-w-0 flex-col gap-2">
    <span class="text-sm font-semibold text-ink-2">{{ label }}</span>
    <a
      v-if="nearby.length"
      :href="`#${ids.after}`"
      class="sr-only focus:not-sr-only focus:self-start focus:rounded-md focus:bg-card focus:px-2 focus:py-1 focus:text-sm"
      @click.prevent="skipMap"
    >Skip map</a>
    <div class="geo-picker relative">
      <div
        ref="host"
        class="picker relative z-0 overflow-hidden rounded-lg border border-input bg-muted"
        :class="interactive ? 'cursor-crosshair' : 'cursor-default'"
        :style="{ height: `${height ?? 260}px` }"
        :tabindex="interactive ? 0 : -1"
        role="group"
        :aria-label="`${label}: pin position. Arrow keys move the pin, Plus and Minus zoom; the latitude and longitude fields set it exactly.`"
        @keydown="onKeydown"
      ></div>
      <div role="status" class="pointer-events-none absolute left-1/2 top-3 z-sticky -translate-x-1/2">
        <div v-if="tileState === 'loading'" class="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-ink-2 shadow-1">
          <Spinner class="size-3.5" />Loading the map background
        </div>
      </div>
      <MapMoveButton v-if="gestures.coarse" :pressed="gestures.moveOn.value" @toggle="gestures.toggle" />
    </div>
    <span v-if="gestures.coarse" class="text-xs text-muted-foreground">{{ gestures.hint.value }}</span>
    <!-- Below the map, not over it, so it never hides the pin. -->
    <Alert v-if="tileState === 'error'" ref="errorCard" tone="warning" title="The map background could not be loaded." class="max-w-md">
      The coordinate fields still work.
      <template #actions><Button size="sm" variant="secondary" @click="retryTiles">Try again</Button></template>
    </Alert>
    <span class="text-xs" :class="note.warn ? 'text-warning' : 'text-muted-foreground'">{{ note.text }}</span>
    <div v-if="nearby.length">
      <button
        :id="ids.after"
        type="button"
        class="flex min-h-control items-center gap-1.5 rounded-md px-1 text-sm font-medium text-primary hover:bg-surface-hover"
        :aria-expanded="nearbyOpen"
        :aria-controls="ids.nearby"
        @click="nearbyOpen = !nearbyOpen"
      >
        <ChevronDown class="size-4 transition-transform" :class="nearbyOpen ? 'rotate-180' : ''" aria-hidden="true" />
        Nearby points of interest ({{ nearby.length }})
      </button>
      <ul v-show="nearbyOpen" :id="ids.nearby" class="mt-1 max-h-40 overflow-y-auto rounded-md border border-border px-3 py-2 text-sm text-ink-2" aria-label="Nearby points of interest">
        <li v-for="(p, i) in nearby" :key="`${p.title}-${i}`">{{ p.title }}</li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.picker:focus-visible {
  outline: 2px solid hsl(var(--ring));
  outline-offset: 2px;
}
.picker.cursor-crosshair :deep(.leaflet-grab) {
  cursor: crosshair;
}
</style>

<style>
.geo-picker .leaflet-marker-draggable {
  touch-action: none;
}
.geo-picker .geo-pin {
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: 0;
}
@media (pointer: coarse) {
  .geo-picker .leaflet-bar a {
    width: 44px;
    height: 44px;
    line-height: 44px;
  }
}
</style>
