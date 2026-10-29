<script setup lang="ts">
/**
 * Schematic map of a Route, as in the CMS mockup: numbered pins in stop order joined by a dashed line. Stops
 * whose Point of Interest has no coordinates are left out of the drawing and listed by name under it (`12` §3
 * Route). Display only; the stop list next to it is where the order changes.
 */
import { computed } from "vue";

export interface RouteMapStop {
  number: number;
  title: string;
  lat: number | null;
  lng: number | null;
}

const props = defineProps<{ stops: RouteMapStop[]; loop: boolean }>();

const MIN_SPAN = 0.002;
const PADDING = 0.2;

const placed = computed(() =>
  props.stops.filter((s): s is RouteMapStop & { lat: number; lng: number } => s.lat !== null && s.lng !== null),
);

const pins = computed(() => {
  const points = placed.value;
  if (!points.length) return [];
  const lats = points.map((p) => p.lat);
  const lngs = points.map((p) => p.lng);
  const span = (min: number, max: number) => Math.max(max - min, MIN_SPAN) * (1 + 2 * PADDING);
  const latSpan = span(Math.min(...lats), Math.max(...lats));
  const lngSpan = span(Math.min(...lngs), Math.max(...lngs));
  const maxLat = (Math.min(...lats) + Math.max(...lats)) / 2 + latSpan / 2;
  const minLng = (Math.min(...lngs) + Math.max(...lngs)) / 2 - lngSpan / 2;
  return points.map((p) => ({
    ...p,
    x: ((p.lng - minLng) / lngSpan) * 100,
    y: ((maxLat - p.lat) / latSpan) * 100,
  }));
});

const line = computed(() => {
  const coords = pins.value.map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`);
  if (props.loop && coords.length > 2) coords.push(coords[0]);
  return coords.join(" ");
});

const unplaced = computed(() => props.stops.filter((s) => s.lat === null || s.lng === null));

const note = computed(() => {
  if (!props.stops.length) return { text: "Add stops to draw the route.", warn: false };
  if (!placed.value.length) return { text: "None of the stops has coordinates yet. Set them on each point of interest:", warn: true };
  if (unplaced.value.length) return { text: "Not drawn, because their point of interest has no coordinates:", warn: true };
  return { text: props.loop ? "The route returns to its first stop." : "Stops are drawn in order.", warn: false };
});
</script>

<template>
  <div>
    <div
      class="map relative h-[210px] overflow-hidden rounded-lg border-[1.5px]"
      role="img"
      :aria-label="`Route map with ${placed.length} placed stops in order`"
    >
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" class="absolute inset-0 h-full w-full" aria-hidden="true">
        <polyline
          v-if="pins.length > 1"
          :points="line"
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
    <p class="mt-2 text-[11px]" :class="note.warn ? 'text-[#9a6200]' : 'text-muted-foreground'">{{ note.text }}</p>
    <ul v-if="unplaced.length" class="mt-1 flex flex-col gap-0.5 text-[11px] text-[#9a6200]">
      <li v-for="stop in unplaced" :key="stop.number">{{ stop.number }}. {{ stop.title }}</li>
    </ul>
  </div>
</template>

<style scoped>
.map {
  background:
    repeating-linear-gradient(0deg, #f3f4f6 0 19px, #eceef1 19px 20px),
    repeating-linear-gradient(90deg, transparent 0 19px, #eceef1 19px 20px);
}
</style>
