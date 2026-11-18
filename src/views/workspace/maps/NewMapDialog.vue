<script setup lang="ts">
/**
 * "New map" (mockup `nm`): search the area by name on OpenStreetMap Nominatim, pick a result, adjust its
 * bounds by dragging, name the map, and optionally link it to an outdoor Place.
 */
import { computed, reactive, ref, watch } from "vue";
import AppDialog from "@/components/AppDialog.vue";
import { coordinateError, formatCoordinate, parseDecimal, tidyCoordinate } from "@/components/map/coordinates";
import GeoMapCanvas, { type Bounds } from "@/components/map/GeoMapCanvas.vue";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { ApiError } from "@/platform/api";
import { AreaSearchError, createMap, searchArea, type AreaResult, type GeoMap } from "@/platform/maps";
import type { Place } from "@/platform/places";
import { placeTitle } from "@/platform/places";

const props = defineProps<{
  projectId: string;
  places: Place[];
  /** Places that already show a map, not offered for linking. */
  linkedPlaceIds: string[];
  defaultLanguage: string | null;
  initialQuery?: string;
  initialPlaceId?: string | null;
}>();
const emit = defineEmits<{ close: []; created: [map: GeoMap] }>();

const query = ref(props.initialQuery ?? "");
const results = ref<AreaResult[]>([]);
const searching = ref(false);
const searched = ref(false);
const searchError = ref<string | null>(null);
const selected = ref<AreaResult | null>(null);
const bounds = ref<Bounds | null>(null);
const fitKey = ref(0);
const name = ref("");
const placeId = ref(props.initialPlaceId ?? "");
const creating = ref(false);
const formError = ref<string | null>(null);
const canvas = ref<InstanceType<typeof GeoMapCanvas> | null>(null);

const outdoorPlaces = computed(() =>
  props.places
    .filter((p) => p.status !== "ARCHIVED" && p.setting === "OUTDOOR" && (!props.linkedPlaceIds.includes(p.id) || p.id === props.initialPlaceId))
    .map((p) => ({ id: p.id, label: placeTitle(p, null, props.defaultLanguage) })),
);

async function search() {
  const q = query.value.trim();
  if (!q) return;
  searching.value = true;
  searchError.value = null;
  selected.value = null;
  try {
    results.value = await searchArea(q, props.defaultLanguage);
    searched.value = true;
  } catch (err) {
    if (!(err instanceof AreaSearchError)) throw err;
    searchError.value = err.userMessage;
  } finally {
    searching.value = false;
  }
}

function pick(result: AreaResult) {
  const [south, north, west, east] = result.bounds;
  if (!selected.value || !name.value.trim()) name.value = `${result.name} map`;
  selected.value = result;
  bounds.value = [
    [south, west],
    [north, east],
  ];
  fitKey.value++;
}

function resetBounds() {
  if (selected.value) pick(selected.value);
}

const adjusted = computed(() => {
  if (!selected.value || !bounds.value) return false;
  const [south, north, west, east] = selected.value.bounds;
  const [[s, w], [n, e]] = bounds.value;
  return Math.abs(s - south) + Math.abs(n - north) + Math.abs(w - west) + Math.abs(e - east) > 1e-6;
});

// The bounds as text, so they can be typed as well as dragged (the keyboard alternative to the handles).
const boundsText = reactive({ s: "", w: "", n: "", e: "" });
const boundsErrors = reactive<Record<"s" | "w" | "n" | "e", string | null>>({ s: null, w: null, n: null, e: null });
watch(
  bounds,
  (b) => {
    if (!b) return;
    boundsText.s = formatCoordinate(b[0][0]);
    boundsText.w = formatCoordinate(b[0][1]);
    boundsText.n = formatCoordinate(b[1][0]);
    boundsText.e = formatCoordinate(b[1][1]);
    for (const k of ["s", "w", "n", "e"] as const) boundsErrors[k] = null;
  },
  { immediate: true },
);
/**
 * Whether any bounds field reads differently from the bounds on the map: after a typed value that is not valid the map
 * keeps its bounds, so "Reset" must be offered then too (C3-74).
 */
const typedDiffers = computed(() => {
  const b = bounds.value;
  if (!b) return false;
  const now = { s: b[0][0], w: b[0][1], n: b[1][0], e: b[1][1] };
  return (["s", "w", "n", "e"] as const).some((k) => {
    const typed = parseDecimal(boundsText[k]);
    return typed === null || Math.abs(typed - now[k]) > 1e-9;
  });
});
const canReset = computed(() => adjusted.value || typedDiffers.value);

/** Applies the typed bounds once all four are valid and in order; otherwise shows what is wrong next to the field. */
function applyTyped(key?: "s" | "w" | "n" | "e") {
  if (key) boundsText[key] = tidyCoordinate(boundsText[key]);
  const axes = { s: "latitude", n: "latitude", w: "longitude", e: "longitude" } as const;
  let ok = true;
  for (const k of ["s", "w", "n", "e"] as const) {
    boundsErrors[k] = coordinateError(boundsText[k], axes[k]);
    if (boundsErrors[k]) ok = false;
  }
  if (!ok) return;
  const [s, w, n, e] = [boundsText.s, boundsText.w, boundsText.n, boundsText.e].map((t) => parseDecimal(t) as number);
  if (s >= n) boundsErrors.n = "North must be greater than south.";
  if (w >= e) boundsErrors.e = "East must be greater than west.";
  if (s >= n || w >= e) return;
  bounds.value = [
    [s, w],
    [n, e],
  ];
}

async function create() {
  if (!selected.value || !bounds.value) return;
  const [[s, w], [n, e]] = bounds.value;
  creating.value = true;
  formError.value = null;
  try {
    const map = await createMap(props.projectId, {
      internalName: name.value.trim() || selected.value.name,
      placeId: placeId.value || null,
      initialLatitude: Number(((s + n) / 2).toFixed(6)),
      initialLongitude: Number(((w + e) / 2).toFixed(6)),
      initialZoom: Math.min(22, Math.max(0, canvas.value?.zoomFor(bounds.value) ?? 14)),
      minLatitude: s,
      minLongitude: w,
      maxLatitude: n,
      maxLongitude: e,
      area: selected.value.displayName,
      osmId: selected.value.osmId,
    });
    emit("created", map);
  } catch (err) {
    if (!(err instanceof ApiError)) throw err;
    formError.value = err.status === 422 ? Object.values(err.fieldMessages()).join(" ") || err.message : err.message;
  } finally {
    creating.value = false;
  }
}
</script>

<template>
  <AppDialog title="New map" size="xl" :busy="creating" @close="emit('close')">
    <p class="mb-4 text-sm text-ink-2">Search for the area. The map opens framed on it and you can place Points of Interest right away.</p>

    <form role="search" class="mb-3 flex flex-wrap items-end gap-2" @submit.prevent="search">
      <FormField id="nm-q" label="Find area" class="min-w-[min(100%,16rem)] flex-1" v-slot="f">
        <Input :id="f.id" v-model="query" type="search" placeholder="such as Apollonas, Naxos" autocomplete="off" />
      </FormField>
      <Button type="submit" :loading="searching" :disabled-reason="query.trim() ? undefined : 'Type a place name first'">{{ searching ? "Searching" : "Search" }}</Button>
    </form>
    <!-- One reserved message line: a failure or "No areas found" fills it and the dialog does not move (C3-74). -->
    <div class="mb-3 min-h-16" data-message-slot>
      <Alert v-if="formError" tone="danger" class="py-2">{{ formError }}</Alert>
      <Alert v-else-if="searchError" tone="danger" class="py-2">{{ searchError }}</Alert>
      <p v-else-if="searched && !results.length && !searching" class="py-2 text-sm text-muted-foreground" role="status">No areas found. Try a broader name.</p>
    </div>

    <!-- Both columns and their height are there from the start, so the dialog does not jump when results or the bounds fields appear (C2-87). -->
    <div class="grid gap-4 md:min-h-[33rem] md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] md:content-start">
      <div class="flex min-w-0 flex-col gap-3">
        <ul v-if="results.length" class="max-h-72 divide-y divide-border overflow-y-auto rounded-md border border-border" aria-label="Search results">
          <li v-for="r in results" :key="r.placeId">
            <button
              type="button"
              class="min-h-control w-full px-3 py-2 text-left text-sm hover:bg-surface-hover"
              :class="selected?.placeId === r.placeId ? 'bg-accent' : ''"
              :aria-pressed="selected?.placeId === r.placeId"
              @click="pick(r)"
            >
              <span class="block font-semibold">{{ r.name }}</span>
              <span class="block truncate text-xs text-muted-foreground">{{ r.rest }}</span>
              <span v-if="r.kind" class="mt-0.5 block text-xs font-medium text-ink-2">{{ r.kind }}</span>
            </button>
          </li>
        </ul>
        <p v-if="results.length" class="text-xs text-muted-foreground">Results from OpenStreetMap Nominatim.</p>
        <p v-else-if="!searched && !searching" class="text-sm text-muted-foreground">Results appear here.</p>

        <template v-if="selected">
          <FormField id="nm-name" label="Map name" v-slot="f">
            <Input :id="f.id" v-model="name" />
          </FormField>
          <FormField id="nm-place" label="Link to Place (optional)" hint="The Place page shows this map, and its Points of Interest open on it." v-slot="f">
            <Select :id="f.id" v-model="placeId" :aria-describedby="f.describedBy">
              <option value="">No place</option>
              <option v-for="p in outdoorPlaces" :key="p.id" :value="p.id">{{ p.label }}</option>
            </Select>
          </FormField>
        </template>
      </div>

      <div class="flex min-w-0 flex-col gap-3">
        <GeoMapCanvas
          ref="canvas"
          :view="{ lat: 38.3, lng: 23.8, zoom: 5 }"
          :bounds="bounds"
          :edit-bounds="!!bounds"
          :fit-key="fitKey"
          height="340px"
          label="Area of the new map"
          @bounds-change="bounds = $event"
        />
        <template v-if="selected">
          <p class="text-sm text-muted-foreground">Drag the corners or the centre handle, or focus one and use the arrow keys. You can also type the bounds. Visitors only see the area inside them.</p>
          <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <FormField id="nm-s" label="Min latitude" :error="boundsErrors.s" v-slot="f">
              <Input :id="f.id" v-model="boundsText.s" inputmode="decimal" autocomplete="off" :aria-describedby="f.describedBy" :invalid="f.invalid" @change="applyTyped('s')" />
            </FormField>
            <FormField id="nm-n" label="Max latitude" :error="boundsErrors.n" v-slot="f">
              <Input :id="f.id" v-model="boundsText.n" inputmode="decimal" autocomplete="off" :aria-describedby="f.describedBy" :invalid="f.invalid" @change="applyTyped('n')" />
            </FormField>
            <FormField id="nm-w" label="Min longitude" :error="boundsErrors.w" v-slot="f">
              <Input :id="f.id" v-model="boundsText.w" inputmode="decimal" autocomplete="off" :aria-describedby="f.describedBy" :invalid="f.invalid" @change="applyTyped('w')" />
            </FormField>
            <FormField id="nm-e" label="Max longitude" :error="boundsErrors.e" v-slot="f">
              <Input :id="f.id" v-model="boundsText.e" inputmode="decimal" autocomplete="off" :aria-describedby="f.describedBy" :invalid="f.invalid" @change="applyTyped('e')" />
            </FormField>
          </div>
          <Button v-if="canReset" variant="secondary" size="sm" class="self-start" @click="resetBounds">Reset to search result</Button>
        </template>
        <p v-else class="text-sm text-muted-foreground">Search and pick a result to frame the map.</p>
      </div>
    </div>

    <template #actions>
      <Button variant="secondary" :disabled="creating" @click="emit('close')">Cancel</Button>
      <Button :loading="creating" :disabled-reason="selected ? undefined : 'Pick a search result first'" @click="create">{{ creating ? "Creating" : "Create map" }}</Button>
    </template>
  </AppDialog>
</template>
