<script setup lang="ts">
/**
 * Map of a Route: the geographic Map of the Place its stops belong to, on OpenStreetMap tiles, with the stops as
 * numbered pins joined in stop order (`12` §3 Route; DECISIONS.md D-063). The Place's area stays clear and the
 * rest is lightly dimmed, as in the Map editor. Without such a Map the tiles are framed on the stops alone. An
 * indoor Route keeps the schematic drawing, since its stops sit on floor plans, not on a geographic map. Stops
 * whose Point of Interest has no coordinates are left out of the drawing and listed by name under it. Display
 * only; the stop list next to it is where the order changes.
 */
import { computed } from "vue";
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

const markers = computed<CanvasMarker[]>(() =>
  placed.value.map((s) => ({ key: String(s.number), lat: s.lat, lng: s.lng, label: String(s.number), title: `${s.number}. ${s.title}` })),
);

const lines = computed<LatLng[][]>(() => {
  const path: LatLng[] = placed.value.map((s) => [s.lat, s.lng]);
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

const mapLabel = computed(() => {
  const where = props.placeMap ? `${props.placeMap.name}` : "OpenStreetMap";
  return `Route map on ${where}, ${placed.value.length} of ${props.stops.length} stops drawn in order${props.loop ? ", returning to the first" : ""}`;
});

const note = computed(() => {
  if (!props.stops.length) return { text: "Add stops to draw the route on the map.", warn: false };
  if (!placed.value.length) return { text: "None of the stops has coordinates yet. Set them on each point of interest:", warn: true };
  if (unplaced.value.length) return { text: "Not drawn, because their point of interest has no coordinates:", warn: true };
  return { text: props.loop ? "Stops are joined in order; the route returns to its first stop." : "Stops are joined in order.", warn: false };
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
  <div>
    <template v-if="!indoor">
      <div v-if="placeMap || stops.length" class="mb-2.5 flex min-h-6 flex-wrap items-center gap-x-3 gap-y-1 text-xs">
        <MapPinned class="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
        <template v-if="placeMap">
          <span class="font-bold text-foreground">{{ placeMap.name }}</span>
          <span v-if="placeMap.placeTitle" class="text-muted-foreground">Map of {{ placeMap.placeTitle }}</span>
          <RouterLink
            :to="{ name: 'map-editor', params: { projectId, mapId: placeMap.id } }"
            class="ml-auto font-bold text-primary underline-offset-4 hover:underline"
          >
            Open map
          </RouterLink>
        </template>
        <span v-else-if="stops.length" class="text-muted-foreground">
          The stops' Place has no map yet, so the route is drawn on OpenStreetMap.
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
        height="380px"
        :label="mapLabel"
      />
      <div
        v-else
        class="flex h-[180px] flex-col items-center justify-center gap-2 rounded-lg border border-dashed bg-muted/50 px-6 text-center"
      >
        <MapPinned class="h-6 w-6 text-muted-foreground" aria-hidden="true" />
        <p class="max-w-[44ch] text-xs text-muted-foreground">
          Pick the first stop below. The map of its Place opens here, and each next stop is joined to the one before.
        </p>
      </div>
    </template>

    <div
      v-else
      class="schematic relative h-[210px] overflow-hidden rounded-lg border-[1.5px]"
      role="img"
      :aria-label="`Route map with ${placed.length} placed stops in order`"
    >
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" class="absolute inset-0 h-full w-full" aria-hidden="true">
        <polyline
          v-if="pins.length > 1"
          :points="schematicLine"
          fill="none"
          stroke="#4c1d8b"
          stroke-width="0.7"
          stroke-dasharray="2.2 1.6"
          vector-effect="non-scaling-stroke"
        />
      </svg>
      <span
        v-for="pin in pins"
        :key="pin.number"
        :title="`${pin.number}. ${pin.title}`"
        class="absolute -ml-2.5 -mt-2.5 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-primary text-[10px] font-extrabold text-white shadow-[0_2px_6px_rgba(0,0,0,0.28)]"
        :style="{ left: `${pin.x}%`, top: `${pin.y}%` }"
      >
        {{ pin.number }}
      </span>
    </div>

    <p v-if="frame || indoor" class="mt-2 text-[11px]" :class="note.warn ? 'text-[#855400]' : 'text-muted-foreground'">{{ note.text }}</p>
    <ul v-if="unplaced.length" class="mt-1 flex flex-col gap-0.5 text-[11px] text-[#855400]">
      <li v-for="stop in unplaced" :key="stop.number">{{ stop.number }}. {{ stop.title }}</li>
    </ul>
    <p v-if="outside.length" class="mt-1 text-[11px] text-[#855400]">
      Outside the map's area, so visitors may not see them on it:
      {{ outside.map((s) => `${s.number}. ${s.title}`).join(", ") }}
    </p>
  </div>
</template>

<style scoped>
.schematic {
  background:
    repeating-linear-gradient(0deg, #f3f4f6 0 19px, #eceef1 19px 20px),
    repeating-linear-gradient(90deg, transparent 0 19px, #eceef1 19px 20px);
}
</style>
