<script setup lang="ts">
/**
 * "New map" (mockup `nm`): search the area by name on OpenStreetMap Nominatim, pick a result, adjust its
 * bounds by dragging, name the map, and optionally link it to an outdoor Place.
 */
import { computed, ref } from "vue";
import AppDialog from "@/components/AppDialog.vue";
import GeoMapCanvas, { type Bounds } from "@/components/map/GeoMapCanvas.vue";
import { ApiError } from "@/platform/api";
import { createMap, searchArea, type AreaResult, type GeoMap } from "@/platform/maps";
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
  } catch {
    searchError.value = "Search failed. Check the connection and try again.";
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

const bboxText = computed(() => {
  if (!bounds.value) return "";
  const [[s, w], [n, e]] = bounds.value;
  return `${s.toFixed(4)}, ${w.toFixed(4)} → ${n.toFixed(4)}, ${e.toFixed(4)}`;
});

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
  <AppDialog title="New map" width="820px" :busy="creating" @close="emit('close')">
    <p class="mb-4 text-[13px] text-gray-700">
      Search for the area. The map opens framed on it and you can place Points of Interest right away.
    </p>
    <p v-if="formError" role="alert" class="mb-3 text-[13px] font-semibold text-destructive">{{ formError }}</p>

    <form class="mb-3 flex gap-2.5" role="search" @submit.prevent="search">
      <label for="nm-q" class="sr-only">Find area</label>
      <input id="nm-q" v-model="query" type="search" placeholder="Find area, such as Apollonas, Naxos" class="field-input flex-1" />
      <button type="submit" class="dialog-primary bg-primary" :disabled="searching || !query.trim()">{{ searching ? "Searching…" : "Search" }}</button>
    </form>
    <p v-if="searchError" role="alert" class="mb-2 text-xs font-semibold text-destructive">{{ searchError }}</p>
    <p v-else-if="searched && !results.length" class="mb-2 text-xs text-muted-foreground">No areas found. Try a broader name.</p>

    <div class="flex flex-wrap gap-4">
      <div class="flex min-w-[min(100%,240px)] flex-1 flex-col gap-2">
        <ul v-if="results.length" class="max-h-[300px] overflow-y-auto rounded-lg border" aria-label="Results from OpenStreetMap Nominatim">
          <li v-for="r in results" :key="r.placeId" class="border-b border-gray-100 last:border-b-0">
            <button
              type="button"
              class="w-full px-3 py-2.5 text-left text-xs"
              :class="selected?.placeId === r.placeId ? 'bg-[#f5f0fb]' : 'hover:bg-muted'"
              :aria-pressed="selected?.placeId === r.placeId"
              @click="pick(r)"
            >
              <span class="block text-[13px] font-bold">{{ r.name }}</span>
              <span class="block truncate text-muted-foreground">{{ r.rest }}</span>
              <span v-if="r.kind" class="mt-0.5 block text-[10px] font-bold uppercase tracking-[0.06em] text-muted-foreground">{{ r.kind }}</span>
            </button>
          </li>
        </ul>
        <span v-if="results.length" class="text-[10px] text-muted-foreground">Results from OpenStreetMap Nominatim</span>

        <template v-if="selected">
          <label for="nm-name" class="small-label mt-2">Map name</label>
          <input id="nm-name" v-model="name" class="field-input" />
          <label for="nm-place" class="small-label mt-1">Link to Place (optional)</label>
          <select id="nm-place" v-model="placeId" class="field-input">
            <option value="">No place</option>
            <option v-for="p in outdoorPlaces" :key="p.id" :value="p.id">{{ p.label }}</option>
          </select>
          <span class="text-xs text-muted-foreground">The Place page shows this map, and its Points of Interest open on it.</span>
        </template>
      </div>

      <div class="flex min-w-[min(100%,360px)] flex-[2] flex-col gap-1.5">
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
          <span class="text-xs text-muted-foreground">Drag the corners or the centre handle. Visitors only see the area inside the bounds.</span>
          <span class="font-mono text-[11px] text-muted-foreground">{{ bboxText }}</span>
          <button v-if="adjusted" type="button" class="self-start text-[11px] font-bold text-primary" @click="resetBounds">Reset to search result</button>
        </template>
        <span v-else class="text-xs text-muted-foreground">Search and pick a result to frame the map.</span>
      </div>
    </div>

    <template #actions>
      <button type="button" class="dialog-secondary" :disabled="creating" @click="emit('close')">Cancel</button>
      <button type="button" class="dialog-primary bg-primary" :disabled="!selected || creating" @click="create">
        {{ creating ? "Creating…" : "Create map" }}
      </button>
    </template>
  </AppDialog>
</template>
