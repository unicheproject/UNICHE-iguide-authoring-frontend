<script setup lang="ts">
/**
 * Map of a Route: the geographic Map of the Place its stops belong to, on the OpenFreeMap base map, with the stops as
 * numbered pins joined in stop order (`12` §3 Route; DECISIONS.md D-063). The Place's area stays clear and the
 * rest is lightly dimmed, as in the Map editor. Without such a Map the tiles are framed on the stops alone. An
 * indoor Route keeps the schematic drawing, since its stops sit on floor plans, not on a geographic map. Stops
 * whose Point of Interest has no coordinates are left out of the drawing and listed by name under it. Display
 * only; the stop list next to it is where the order changes.
 */
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { MapPinned } from "lucide-vue-next";
import GeoMapCanvas, { type Bounds, type CanvasMarker, type LatLng } from "@/components/map/GeoMapCanvas.vue";

export interface RouteMapStop {
  number: number;
  title: string;
  lat: number | null;
  lng: number | null;
}

/** The geographic Map of the Route's Place. */
export interface RoutePlaceMap {
  id: string;
  name: string;
  placeTitle: string | null;
  bounds: Bounds | null;
  view: { lat: number; lng: number; zoom: number };
}

const props = withDefaults(
  defineProps<{ stops: RouteMapStop[]; loop: boolean; placeMap?: RoutePlaceMap | null; indoor?: boolean; projectId: string }>(),
  { placeMap: null, indoor: false },
);

/** Smallest frame around the stops, in degrees, so a single stop is not shown at street-corner zoom. */
const MIN_SPAN = 0.004;

const placed = computed(() =>
  props.stops.filter((s): s is RouteMapStop & { lat: number; lng: number } => s.lat !== null && s.lng !== null),
);
const unplaced = computed(() => props.stops.filter((s) => s.lat === null || s.lng === null));

/** Pixel height of the map canvas (`height` on `GeoMapCanvas` below). */
const CANVAS_HEIGHT = 380;
/** Padding `GeoMapCanvas` leaves round the frame when it fits it. */
const FRAME_PADDING = 28;
/** Pins are 26 px wide: centres closer than this overlap, so such pins are fanned out. */
const MIN_PIN_GAP = 30;

const root = ref<HTMLElement | null>(null);
const canvasWidth = ref(640);
let resizeObserver: ResizeObserver | null = null;
onMounted(() => {
  if (!root.value) return;
  canvasWidth.value = root.value.clientWidth || canvasWidth.value;
  resizeObserver = new ResizeObserver(() => (canvasWidth.value = root.value?.clientWidth || canvasWidth.value));
  resizeObserver.observe(root.value);
});
onBeforeUnmount(() => resizeObserver?.disconnect());

/** The zoom the map reports once it has moved; until then the zoom `fitBounds` will choose is estimated. */
const reportedZoom = ref<number | null>(null);

/** Web Mercator, as a fraction of the world: x and y both run 0..1. */
const worldX = (lng: number) => (lng + 180) / 360;
const worldY = (lat: number) => {
  const r = (Math.max(-85, Math.min(85, lat)) * Math.PI) / 180;
  return (1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2;
};
const lngOf = (x: number) => x * 360 - 180;
const latOf = (y: number) => (Math.atan(Math.sinh(Math.PI * (1 - 2 * y))) * 180) / Math.PI;

/** World size in pixels at the current zoom: the reported one, or the estimate of the fit (zoomSnap 0.25). */
const worldSize = computed(() => {
  if (reportedZoom.value !== null) return 256 * 2 ** reportedZoom.value;
  const area = frame.value;
  if (!area) return 256 * 2 ** 14;
  const dx = Math.max(worldX(area[1][1]) - worldX(area[0][1]), 1e-9);
  const dy = Math.max(worldY(area[0][0]) - worldY(area[1][0]), 1e-9);
  const fit = Math.min((canvasWidth.value - 2 * FRAME_PADDING) / dx, (CANVAS_HEIGHT - 2 * FRAME_PADDING) / dy);
  return 256 * 2 ** (Math.floor(Math.log2(fit / 256) * 4) / 4);
});

/**
 * The pins to draw. Pins that would overlap at the current zoom (centres under 30 px apart, which includes stops
 * that share a position) are spread on a small circle round their centre, in stop order, so every number can be
 * read (C3-35). The spread is in pixels, so it is recomputed with the zoom and pins return to their own spot as
 * soon as the map is close enough for them not to touch. The titles and the stop list keep the real positions.
 */
const spread = computed(() => {
  const size = worldSize.value;
  const pts = placed.value.map((s) => ({ s, x: worldX(s.lng) * size, y: worldY(s.lat) * size }));
  const group = pts.map((_, i) => i);
  const find = (i: number): number => (group[i] === i ? i : (group[i] = find(group[i])));
  for (let i = 0; i < pts.length; i++)
    for (let j = i + 1; j < pts.length; j++)
      if (Math.hypot(pts[i].x - pts[j].x, pts[i].y - pts[j].y) < MIN_PIN_GAP) group[find(j)] = find(i);
  const members = new Map<number, number[]>();
  pts.forEach((_, i) => members.set(find(i), [...(members.get(find(i)) ?? []), i]));
  const out = pts.map((p) => ({ number: p.s.number, title: p.s.title, lat: p.s.lat, lng: p.s.lng }));
  const fanned: number[][] = [];
  for (const ids of members.values()) {
    if (ids.length < 2) continue;
    fanned.push(ids.map((i) => pts[i].s.number));
    const cx = ids.reduce((a, i) => a + pts[i].x, 0) / ids.length;
    const cy = ids.reduce((a, i) => a + pts[i].y, 0) / ids.length;
    const radius = Math.max(16, MIN_PIN_GAP / 2 / Math.sin(Math.PI / ids.length));
    ids.forEach((i, k) => {
      const angle = (2 * Math.PI * k) / ids.length - Math.PI / 2;
      out[i].lng = lngOf((cx + radius * Math.cos(angle)) / size);
      out[i].lat = latOf((cy + radius * Math.sin(angle)) / size);
    });
  }
  return { pins: out, fanned };
});

const markers = computed<CanvasMarker[]>(() =>
  spread.value.pins.map((s) => ({ key: String(s.number), lat: s.lat, lng: s.lng, label: String(s.number), title: `${s.number}. ${s.title}` })),
);

const lines = computed<LatLng[][]>(() => {
  const path: LatLng[] = spread.value.pins.map((s) => [s.lat, s.lng]);
  if (props.loop && path.length > 2) path.push(path[0]);
  return path.length > 1 ? [path] : [];
});

/** What the map fits: the Place's area together with every stop, so a stop outside the area is still seen. */
const frame = computed<Bounds | null>(() => {
  const lats = placed.value.map((s) => s.lat);
  const lngs = placed.value.map((s) => s.lng);
  const area = props.placeMap?.bounds;
  if (area) {
    lats.push(area[0][0], area[1][0]);
    lngs.push(area[0][1], area[1][1]);
  }
  if (!lats.length) return null;
  const pad = (min: number, max: number): [number, number] => {
    const extra = Math.max(0, MIN_SPAN - (max - min)) / 2;
    return [min - extra, max + extra];
  };
  const [s, n] = pad(Math.min(...lats), Math.max(...lats));
  const [w, e] = pad(Math.min(...lngs), Math.max(...lngs));
  return [
    [s, w],
    [n, e],
  ];
});

const view = computed(() => {
  if (props.placeMap) return props.placeMap.view;
  const first = placed.value[0];
  return first ? { lat: first.lat, lng: first.lng, zoom: 14 } : { lat: 0, lng: 0, zoom: 2 };
});

const outside = computed(() => {
  const area = props.placeMap?.bounds;
  if (!area) return [];
  return placed.value.filter((s) => s.lat < area[0][0] || s.lat > area[1][0] || s.lng < area[0][1] || s.lng > area[1][1]);
});

/** "Stops 1, 3 and 4": the pins that are drawn apart, for the legend. */
const fannedText = computed(() =>
  spread.value.fanned
    .map((n) => `${n.length > 2 ? n.slice(0, -1).join(", ") : n[0]} and ${n[n.length - 1]}`)
    .map((t) => `Stops ${t}`)
    .join("; "),
);

const mapLabel = computed(() => {
  const where = props.placeMap ? `${props.placeMap.name}` : "the base map";
  return `Route map on ${where}, ${placed.value.length} of ${props.stops.length} stops drawn in order${props.loop ? ", returning to the first" : ""}`;
});

/** One legend line: what the drawing shows, then only what is wrong (stops not drawn). */
const note = computed(() => {
  if (!props.stops.length) return { text: "Add stops to draw the route on the map.", warn: false };
  if (!placed.value.length) return { text: "None of the stops has coordinates yet. Set them on each point of interest:", warn: true };
  if (unplaced.value.length) return { text: "Not drawn, because their point of interest has no coordinates:", warn: true };
  return { text: "", warn: false };
});
const legend = computed(() => {
  const joined = props.loop ? "Numbered pins are the stops; the line joins them in stop order and returns to the first." : "Numbered pins are the stops; the line joins them in stop order.";
  return placed.value.length > 1 ? joined : "";
});

// The schematic drawing of an indoor Route.
const SCHEMATIC_SPAN = 0.002;
const PADDING = 0.2;
const pins = computed(() => {
  const points = placed.value;
  if (!points.length) return [];
  const lats = points.map((p) => p.lat);
  const lngs = points.map((p) => p.lng);
  const span = (min: number, max: number) => Math.max(max - min, SCHEMATIC_SPAN) * (1 + 2 * PADDING);
  const latSpan = span(Math.min(...lats), Math.max(...lats));
  const lngSpan = span(Math.min(...lngs), Math.max(...lngs));
  const maxLat = (Math.min(...lats) + Math.max(...lats)) / 2 + latSpan / 2;
  const minLng = (Math.min(...lngs) + Math.max(...lngs)) / 2 - lngSpan / 2;
  return points.map((p) => ({ ...p, x: ((p.lng - minLng) / lngSpan) * 100, y: ((maxLat - p.lat) / latSpan) * 100 }));
});
const schematicLine = computed(() => {
  const coords = pins.value.map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`);
  if (props.loop && coords.length > 2) coords.push(coords[0]);
  return coords.join(" ");
});
</script>

<template>
  <div ref="root">
    <template v-if="!indoor">
      <div v-if="placeMap || stops.length" class="mb-2.5 flex min-h-6 flex-wrap items-center gap-x-3 gap-y-1 text-sm">
        <MapPinned class="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
        <template v-if="placeMap">
          <span class="font-bold text-foreground">{{ placeMap.name }}</span>
          <span v-if="placeMap.placeTitle" class="text-muted-foreground">Map of {{ placeMap.placeTitle }}</span>
          <RouterLink
            :to="{ name: 'map-editor', params: { projectId, mapId: placeMap.id } }"
            class="ml-auto inline-flex min-h-control items-center font-semibold"
          >
            Open map
          </RouterLink>
        </template>
        <span v-else-if="stops.length" class="text-muted-foreground">
          The stops' Place has no map yet, so the route is drawn on the base map alone.
        </span>
      </div>
      <GeoMapCanvas
        v-if="frame"
        :view="view"
        :bounds="placeMap?.bounds ?? null"
        :frame="frame"
        fit-to-bounds
        :markers="markers"
        :lines="lines"
        :height="`${CANVAS_HEIGHT}px`"
        :label="mapLabel"
        @view-change="reportedZoom = $event.zoom"
      />
      <div
        v-else
        class="flex h-44 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-input bg-muted/50 px-6 text-center"
      >
        <MapPinned class="h-6 w-6 text-muted-foreground" aria-hidden="true" />
        <p class="max-w-prose text-sm text-muted-foreground">
          Pick the first stop below. The map of its Place opens here, and each next stop is joined to the one before.
        </p>
      </div>
    </template>

    <div
      v-else
      class="schematic relative h-52 overflow-hidden rounded-lg border border-input"
      role="img"
      :aria-label="`Route map with ${placed.length} placed stops in order`"
    >
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" class="absolute inset-0 h-full w-full" aria-hidden="true">
        <polyline
          v-if="pins.length > 1"
          :points="schematicLine"
          fill="none"
          stroke="hsl(var(--primary))"
          stroke-width="0.7"
          stroke-dasharray="2.2 1.6"
          vector-effect="non-scaling-stroke"
        />
      </svg>
      <span
        v-for="pin in pins"
        :key="pin.number"
        :title="`${pin.number}. ${pin.title}`"
        class="route-pin absolute flex size-7 items-center justify-center rounded-full border-2 border-card bg-primary text-xs font-bold text-primary-foreground shadow-1"
        :style="{ left: `${pin.x}%`, top: `${pin.y}%` }"
      >
        {{ pin.number }}
      </span>
    </div>

    <p v-if="(frame || indoor) && legend" class="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
      <svg width="28" height="8" viewBox="0 0 28 8" aria-hidden="true" class="shrink-0 text-primary"><line x1="0" y1="4" x2="28" y2="4" stroke="currentColor" stroke-width="4" stroke-linecap="round" /></svg>
      {{ legend }}
    </p>
    <p v-if="!indoor && fannedText" class="mt-1 text-xs text-muted-foreground" data-route-fanned>
      {{ fannedText }} are close together, so their pins are drawn slightly apart. Zoom in to see where each one is.
    </p>
    <p v-if="(frame || indoor) && note.text" class="mt-1 text-xs" :class="note.warn ? 'font-medium text-warning' : 'text-muted-foreground'">{{ note.text }}</p>
    <ul v-if="unplaced.length" class="mt-1 flex flex-col gap-0.5 text-xs text-warning">
      <li v-for="stop in unplaced" :key="stop.number">{{ stop.number }}. {{ stop.title }}</li>
    </ul>
    <p v-if="outside.length" class="mt-1 text-xs text-warning">
      Outside the map's area, so visitors may not see them on it:
      {{ outside.map((s) => `${s.number}. ${s.title}`).join(", ") }}
    </p>
  </div>
</template>

<style scoped>
.schematic {
  background:
    repeating-linear-gradient(0deg, hsl(var(--background)) 0 19px, hsl(var(--muted)) 19px 20px),
    repeating-linear-gradient(90deg, transparent 0 19px, hsl(var(--muted)) 19px 20px);
}
.route-pin {
  transform: translate(-50%, -50%);
}
</style>
