<script setup lang="ts">
/**
 * Schematic site map of the CMS mockup: a grid over a geographic area, with the other Resources as hollow
 * dots and this one as the pin. Clicking moves the pin and reports the new coordinates; the arrow keys
 * nudge it, so the picker also works without a pointer. The area is derived from `anchors` until
 * Geographic Maps with their own bounds exist.
 */
import { computed } from "vue";

export interface GeoPoint {
  lat: number;
  lng: number;
  title?: string;
}

const props = defineProps<{
  label: string;
  /** Current values of the coordinate fields; empty or unparseable means "no pin". */
  latitude: string;
  longitude: string;
  /** Other Resources shown as dots. */
  others: GeoPoint[];
  /** Points that define the visible area; they do not move while the author picks. */
  anchors: GeoPoint[];
  disabled?: boolean;
}>();
const emit = defineEmits<{ pick: [lat: string, lng: string] }>();

/** Smallest visible span in degrees, about 200 m, so a single point still gives a usable area. */
const MIN_SPAN = 0.002;
const PADDING = 0.25;
const DECIMALS = 5;
const NUDGE = 0.02;

function typed(): GeoPoint | null {
  const lat = Number(props.latitude.trim());
  const lng = Number(props.longitude.trim());
  if (!props.latitude.trim() || !props.longitude.trim() || Number.isNaN(lat) || Number.isNaN(lng)) return null;
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  return { lat, lng };
}

const bounds = computed(() => {
  // With nothing saved anywhere yet, the typed coordinates are the only reference.
  const fallback = typed();
  const points = [...props.anchors, ...props.others];
  if (!points.length && fallback) points.push(fallback);
  if (!points.length) return null;
  const lats = points.map((p) => p.lat);
  const lngs = points.map((p) => p.lng);
  const span = (min: number, max: number) => Math.max(max - min, MIN_SPAN) * (1 + 2 * PADDING);
  const latSpan = span(Math.min(...lats), Math.max(...lats));
  const lngSpan = span(Math.min(...lngs), Math.max(...lngs));
  const latMid = (Math.min(...lats) + Math.max(...lats)) / 2;
  const lngMid = (Math.min(...lngs) + Math.max(...lngs)) / 2;
  return {
    minLat: latMid - latSpan / 2,
    maxLat: latMid + latSpan / 2,
    minLng: lngMid - lngSpan / 2,
    maxLng: lngMid + lngSpan / 2,
  };
});

function toPosition(lat: number, lng: number) {
  const b = bounds.value;
  if (!b) return null;
  const clamp = (v: number) => Math.min(1, Math.max(0, v));
  return {
    x: clamp((lng - b.minLng) / (b.maxLng - b.minLng)),
    y: clamp((b.maxLat - lat) / (b.maxLat - b.minLat)),
  };
}

function toCoordinates(x: number, y: number): [string, string] {
  const b = bounds.value!;
  const lat = b.maxLat - y * (b.maxLat - b.minLat);
  const lng = b.minLng + x * (b.maxLng - b.minLng);
  return [lat.toFixed(DECIMALS), lng.toFixed(DECIMALS)];
}

const current = computed(() => {
  const point = typed();
  return point ? toPosition(point.lat, point.lng) : null;
});

const dots = computed(() =>
  props.others.flatMap((p) => {
    const pos = toPosition(p.lat, p.lng);
    return pos ? [{ ...pos, title: p.title ?? "" }] : [];
  }),
);

const interactive = computed(() => !props.disabled && !!bounds.value);

function onClick(event: MouseEvent) {
  if (!interactive.value) return;
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
  const x = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
  const y = Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height));
  emit("pick", ...toCoordinates(x, y));
}

function onKeydown(event: KeyboardEvent) {
  if (!interactive.value) return;
  const moves: Record<string, [number, number]> = {
    ArrowLeft: [-NUDGE, 0],
    ArrowRight: [NUDGE, 0],
    ArrowUp: [0, -NUDGE],
    ArrowDown: [0, NUDGE],
  };
  const move = moves[event.key];
  if (!move) return;
  event.preventDefault();
  const start = current.value ?? { x: 0.5, y: 0.5 };
  const x = Math.min(1, Math.max(0, start.x + move[0]));
  const y = Math.min(1, Math.max(0, start.y + move[1]));
  emit("pick", ...toCoordinates(x, y));
}

const note = computed(() => {
  if (!bounds.value) return { text: "No coordinates in this Project yet. Type the first ones on the left, then click to refine.", warn: true };
  if (props.disabled) return { text: "Read-only while the point of interest is not a draft.", warn: false };
  if (!current.value) return { text: "No coordinates yet. Click the map to place it, or type them on the left.", warn: true };
  return { text: "Click anywhere, or use the arrow keys, to move the pin.", warn: false };
});
</script>

<template>
  <div class="flex min-w-0 flex-col gap-2">
    <span class="text-[10px] font-extrabold uppercase tracking-[0.09em] text-muted-foreground">{{ label }}</span>
    <div
      class="map relative h-[190px] overflow-hidden rounded-lg border-[1.5px]"
      :class="interactive ? 'cursor-crosshair' : 'cursor-default'"
      :tabindex="interactive ? 0 : -1"
      role="group"
      :aria-label="`${label}: pin position. Arrow keys move the pin; the latitude and longitude fields set it exactly.`"
      :title="interactive ? 'Click to place this point of interest' : undefined"
      @click="onClick"
      @keydown="onKeydown"
    >
      <span
        v-for="(dot, index) in dots"
        :key="index"
        :title="dot.title"
        class="absolute -ml-1 -mt-1 block h-2 w-2 rounded-full border-[1.5px] border-gray-400 bg-white"
        :style="{ left: `${dot.x * 100}%`, top: `${dot.y * 100}%` }"
      ></span>
      <span
        v-if="current"
        class="absolute -ml-2 -mt-2 block h-4 w-4 rounded-full border-[2.5px] border-white bg-primary shadow-[0_2px_7px_rgba(0,0,0,0.3)]"
        :style="{ left: `${current.x * 100}%`, top: `${current.y * 100}%` }"
        aria-hidden="true"
      ></span>
    </div>
    <span class="text-[11px]" :class="note.warn ? 'text-[#9a6200]' : 'text-muted-foreground'">{{ note.text }}</span>
  </div>
</template>

<style scoped>
/* The mockup's grid paper. */
.map {
  background:
    repeating-linear-gradient(0deg, #f3f4f6 0 19px, #eceef1 19px 20px),
    repeating-linear-gradient(90deg, transparent 0 19px, #eceef1 19px 20px);
}
.map:focus-visible {
  outline: 2px solid #4c1d8b;
  outline-offset: 2px;
}
</style>
