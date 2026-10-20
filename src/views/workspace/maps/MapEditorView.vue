<script setup lang="ts">
import { computed, reactive, ref } from "vue";
import CategoryIcon from "@/components/CategoryIcon.vue";
import EditorShell from "@/components/editor/EditorShell.vue";
import GeoMapCanvas, { type Bounds, type CanvasMarker, type LatLng } from "@/components/map/GeoMapCanvas.vue";
import { categoryTree, listCategories, type Category, type CategoryScope } from "@/platform/categories";
import { changeMapStatus, fetchMap, fetchMapReferences, updateMap, type GeoMap, type PlaceableType } from "@/platform/maps";
import { listPlaces, placeTitle, type Place } from "@/platform/places";
import { listPois, poiTitle, type Poi } from "@/platform/pois";
import type { ResourceReference } from "@/platform/references";
import { listRoutes, type Route } from "@/platform/routes";
import { showToast } from "@/stores/toast";
import { useCurrentProject } from "@/workspace/currentProject";
import { referenceLink } from "@/workspace/referenceLinks";
import { useProjectLanguages } from "@/workspace/useProjectLanguages";
import { useResourceEditor } from "@/workspace/useResourceEditor";

const props = defineProps<{ mapId: string }>();
const project = useCurrentProject();
const projectId = computed(() => project.value.id);
const { languages, defaultLanguage, loading: languagesLoading } = useProjectLanguages(projectId);

const pois = ref<Poi[]>([]);
const places = ref<Place[]>([]);
const routes = ref<Route[]>([]);
const categories = ref<Category[]>([]);
const canvas = ref<InstanceType<typeof GeoMapCanvas> | null>(null);

interface PlacementForm {
  key: string;
  resourceType: PlaceableType;
  resourceId: string;
  lat: string;
  lng: string;
}

const form = reactive({
  internalName: "",
  placeId: "",
  lat: "",
  lng: "",
  zoom: "",
  minLat: "",
  minLng: "",
  maxLat: "",
  maxLng: "",
  showPois: true,
  showRoutes: true,
  hiddenCategoryIds: [] as string[],
  visitorFilter: true,
  placements: [] as PlacementForm[],
});

const num = (v: string) => (v.trim() === "" ? null : Number(v));
const str = (v: number | null) => (v === null || v === undefined ? "" : String(v));
const FIELD_NAMES: Record<string, string> = {
  internalName: "Name",
  placeId: "Linked Place",
  initialLatitude: "Initial latitude",
  initialLongitude: "Initial longitude",
  initialZoom: "Initial zoom",
  minLatitude: "Bounds",
  maxLatitude: "Max latitude",
  maxLongitude: "Max longitude",
  hiddenCategoryIds: "Visibility",
};

const editor = useResourceEditor<GeoMap>({
  kind: "map",
  source: () => props.mapId,
  languages,
  defaultLanguage,
  async load() {
    const [map, allPois, allPlaces, allRoutes, allCategories] = await Promise.all([
      fetchMap(projectId.value, props.mapId),
      listPois(projectId.value),
      listPlaces(projectId.value),
      listRoutes(projectId.value),
      listCategories(projectId.value),
    ]);
    pois.value = allPois;
    places.value = allPlaces;
    routes.value = allRoutes;
    categories.value = allCategories;
    return map;
  },
  save: (map, version) =>
    updateMap(projectId.value, map.id, {
      version,
      internalName: form.internalName.trim(),
      placeId: form.placeId || null,
      initialLatitude: Number(form.lat),
      initialLongitude: Number(form.lng),
      initialZoom: Number(form.zoom),
      minLatitude: num(form.minLat),
      minLongitude: num(form.minLng),
      maxLatitude: num(form.maxLat),
      maxLongitude: num(form.maxLng),
      showPois: form.showPois,
      showRoutes: form.showRoutes,
      hiddenCategoryIds: [...form.hiddenCategoryIds],
      visitorFilter: form.visitorFilter,
      placements: form.placements.map((p) => ({ resourceType: p.resourceType, resourceId: p.resourceId, latitude: Number(p.lat), longitude: Number(p.lng) })),
    }),
  changeStatus: (map, target, version) => changeMapStatus(projectId.value, map.id, target, version),
  loadReferences: (map) => fetchMapReferences(projectId.value, map.id),
  // A map has no text of its own; it stays editable until archived, like an Asset.
  isEditable: (map) => map.status !== "ARCHIVED",
  resetForm(map) {
    form.internalName = map.internalName;
    form.placeId = map.placeId ?? "";
    form.lat = str(map.initialLatitude);
    form.lng = str(map.initialLongitude);
    form.zoom = str(map.initialZoom);
    form.minLat = str(map.minLatitude);
    form.minLng = str(map.minLongitude);
    form.maxLat = str(map.maxLatitude);
    form.maxLng = str(map.maxLongitude);
    form.showPois = map.showPois;
    form.showRoutes = map.showRoutes;
    form.hiddenCategoryIds = [...map.hiddenCategoryIds];
    form.visitorFilter = map.visitorFilter;
    form.placements = map.placements.map((p) => ({
      key: `${p.resourceType}:${p.resourceId}`,
      resourceType: p.resourceType,
      resourceId: p.resourceId,
      lat: str(p.latitude),
      lng: str(p.longitude),
    }));
  },
  ensureLanguageRows: () => {},
  formState: () => form,
  validate() {
    const found: Record<string, string> = {};
    if (!form.internalName.trim()) found.internalName = "Enter a name.";
    const lat = Number(form.lat);
    const lng = Number(form.lng);
    const zoom = Number(form.zoom);
    if (!form.lat.trim() || Number.isNaN(lat) || Math.abs(lat) > 90) found.initialLatitude = "A number between -90 and 90.";
    if (!form.lng.trim() || Number.isNaN(lng) || Math.abs(lng) > 180) found.initialLongitude = "A number between -180 and 180.";
    if (!form.zoom.trim() || Number.isNaN(zoom) || zoom < 0 || zoom > 22) found.initialZoom = "A zoom between 0 and 22.";
    const bounds = [form.minLat, form.minLng, form.maxLat, form.maxLng];
    const set = bounds.filter((b) => b.trim()).length;
    if (set !== 0 && set !== 4) found.minLatitude = "Set all four bounds, or none.";
    if (set === 4 && bounds.some((b) => Number.isNaN(Number(b)))) found.minLatitude = "The bounds must be numbers.";
    form.placements.forEach((p, i) => {
      const plat = Number(p.lat);
      const plng = Number(p.lng);
      if (!p.lat.trim() || Number.isNaN(plat) || Math.abs(plat) > 90) found[`placements[${i}].latitude`] = "Latitude between -90 and 90.";
      if (!p.lng.trim() || Number.isNaN(plng) || Math.abs(plng) > 180) found[`placements[${i}].longitude`] = "Longitude between -180 and 180.";
    });
    return found;
  },
  describePath(path) {
    const placement = /^placements\[(\d+)\]/.exec(path);
    if (placement) {
      const p = form.placements[Number(placement[1])];
      return p ? title(p.resourceType, p.resourceId) : `Placement ${Number(placement[1]) + 1}`;
    }
    return FIELD_NAMES[path] ?? path;
  },
});

const toReference = (r: ResourceReference) => referenceLink(projectId.value, r);
const readonly = computed(() => !editor.editable);

// Resources ---------------------------------------------------------------------------------------------

const poiById = computed(() => new Map(pois.value.map((p) => [p.id, p])));
const placeById = computed(() => new Map(places.value.map((p) => [p.id, p])));

function title(type: PlaceableType, id: string): string {
  if (type === "POI") {
    const poi = poiById.value.get(id);
    return poi ? poiTitle(poi, defaultLanguage.value) : "Unavailable point of interest";
  }
  const place = placeById.value.get(id);
  return place ? placeTitle(place, null, defaultLanguage.value) : "Unavailable place";
}

const kindLabel = (type: PlaceableType) => (type === "POI" ? "Point of Interest" : "Place");

const unplaced = computed(() => {
  const placed = new Set(form.placements.map((p) => p.key));
  return [
    ...pois.value.filter((p) => p.status !== "ARCHIVED").map((p) => ({ type: "POI" as const, id: p.id, lat: p.latitude, lng: p.longitude })),
    ...places.value.filter((p) => p.status !== "ARCHIVED").map((p) => ({ type: "PLACE" as const, id: p.id, lat: p.latitude, lng: p.longitude })),
  ].filter((r) => !placed.has(`${r.type}:${r.id}`));
});

/** Puts the item at its own coordinates, or at the centre of the initial view. */
function place(type: PlaceableType, id: string, lat: number | null, lng: number | null) {
  form.placements.push({
    key: `${type}:${id}`,
    resourceType: type,
    resourceId: id,
    lat: lat !== null ? String(lat) : form.lat,
    lng: lng !== null ? String(lng) : form.lng,
  });
  showToast(
    "Placed on the map",
    lat !== null ? `${title(type, id)} sits at its own coordinates.` : `${title(type, id)} sits at the initial view; drag it or type exact coordinates.`,
  );
}

function onMarkerMove(key: string, lat: number, lng: number) {
  const p = form.placements.find((x) => x.key === key);
  if (!p || readonly.value) return;
  p.lat = String(lat);
  p.lng = String(lng);
}

// Visibility (mockup "Visibility" and "Visitors can filter") ---------------------------------------------

const hidden = computed(() => new Set(form.hiddenCategoryIds));

function categoryOf(type: PlaceableType | "ROUTE", id: string): Category | undefined {
  const categoryId = type === "POI" ? poiById.value.get(id)?.categoryId : type === "ROUTE" ? routes.value.find((r) => r.id === id)?.categoryId : null;
  return categoryId ? categories.value.find((c) => c.id === categoryId) : undefined;
}

/** Whether the map's visibility settings show the item; Places always show. */
function shownBySettings(type: PlaceableType | "ROUTE", id: string): boolean {
  if (type === "PLACE") return true;
  if (type === "POI" && !form.showPois) return false;
  if (type === "ROUTE" && !form.showRoutes) return false;
  const c = categoryOf(type, id);
  return !c || (!hidden.value.has(c.id) && !(c.parentCategoryId && hidden.value.has(c.parentCategoryId)));
}

// The visitor filter bar, previewed above the map.
const filter = reactive({ type: "" as "" | "POI" | "ROUTE", category: "" });

function shownByFilter(type: PlaceableType | "ROUTE", id: string): boolean {
  if (!form.visitorFilter || editingBounds.value || type === "PLACE") return true;
  if (filter.type && filter.type !== type) return false;
  if (filter.category) {
    const c = categoryOf(type, id);
    return !!c && (c.id === filter.category || c.parentCategoryId === filter.category);
  }
  return true;
}

function toggleCategory(id: string) {
  if (readonly.value) return;
  form.hiddenCategoryIds = hidden.value.has(id) ? form.hiddenCategoryIds.filter((x) => x !== id) : [...form.hiddenCategoryIds, id];
}

const groups = computed(() =>
  (["POI", "ROUTE"] as CategoryScope[]).map((scope) => {
    const items = scope === "POI" ? pois.value.filter((p) => p.status !== "ARCHIVED") : routes.value.filter((r) => r.status !== "ARCHIVED");
    const on = scope === "POI" ? form.showPois : form.showRoutes;
    const tree = categoryTree(categories.value, scope);
    return {
      scope,
      name: scope === "POI" ? "Points of Interest" : "Routes",
      on,
      stateLabel: on ? `${items.length} shown` : "hidden",
      cats: tree.map(({ category, depth }) => {
        const ids = [category.id, ...tree.filter((t) => t.category.parentCategoryId === category.id).map((t) => t.category.id)];
        return {
          category,
          depth,
          on: !hidden.value.has(category.id),
          muted: !!category.parentCategoryId && hidden.value.has(category.parentCategoryId),
          count: items.filter((r) => r.categoryId && ids.includes(r.categoryId)).length,
        };
      }),
    };
  }),
);

function toggleGroup(scope: CategoryScope) {
  if (readonly.value) return;
  if (scope === "POI") form.showPois = !form.showPois;
  else form.showRoutes = !form.showRoutes;
}

const filterTypes = computed(() => [
  { key: "" as const, label: "All" },
  ...(form.showPois ? [{ key: "POI" as const, label: "Points of Interest" }] : []),
  ...(form.showRoutes ? [{ key: "ROUTE" as const, label: "Routes" }] : []),
]);
const filterCategories = computed(() =>
  (filter.type ? [filter.type] : (["POI", "ROUTE"] as const))
    .filter((scope) => (scope === "POI" ? form.showPois : form.showRoutes))
    .flatMap((scope) => categoryTree(categories.value, scope))
    .filter(({ category }) => !hidden.value.has(category.id) && !(category.parentCategoryId && hidden.value.has(category.parentCategoryId)))
    .map(({ category }) => category),
);

// Canvas -------------------------------------------------------------------------------------------------

const editingBounds = ref(false);

const view = computed(() => ({ lat: Number(form.lat) || 0, lng: Number(form.lng) || 0, zoom: Number(form.zoom) || 2 }));
const bounds = computed<Bounds | null>(() => {
  const values = [form.minLat, form.minLng, form.maxLat, form.maxLng].map(Number);
  if ([form.minLat, form.minLng, form.maxLat, form.maxLng].some((v) => !v.trim()) || values.some(Number.isNaN)) return null;
  return [
    [values[0], values[1]],
    [values[2], values[3]],
  ];
});

const markers = computed<CanvasMarker[]>(() =>
  form.placements
    .map((p, i) => ({ p, i }))
    .filter(({ p }) => shownByFilter(p.resourceType, p.resourceId))
    .map(({ p, i }) => ({
      key: p.key,
      lat: Number(p.lat),
      lng: Number(p.lng),
      label: String(i + 1),
      title: title(p.resourceType, p.resourceId),
      draggable: !readonly.value,
      muted: !shownBySettings(p.resourceType, p.resourceId),
    })),
);

/** Route lines through the stops' positions on this map, or their own coordinates. */
const lines = computed<LatLng[][]>(() => {
  const onMap = new Map(form.placements.filter((p) => p.resourceType === "POI").map((p) => [p.resourceId, [Number(p.lat), Number(p.lng)] as LatLng]));
  return routes.value
    .filter((r) => r.status !== "ARCHIVED" && shownBySettings("ROUTE", r.id) && shownByFilter("ROUTE", r.id))
    .map((r) =>
      r.stops.flatMap((s) => {
        const at = onMap.get(s.poiId);
        if (at) return [at];
        const poi = poiById.value.get(s.poiId);
        return poi && poi.latitude !== null && poi.longitude !== null ? [[poi.latitude, poi.longitude] as LatLng] : [];
      }),
    )
    .filter((l) => l.length > 1);
});

const shownSummary = computed(() => `${markers.value.length} of ${form.placements.length} placed shown`);

function onBoundsChange(b: Bounds) {
  if (readonly.value) return;
  form.minLat = String(b[0][0]);
  form.minLng = String(b[0][1]);
  form.maxLat = String(b[1][0]);
  form.maxLng = String(b[1][1]);
}

function toggleBounds() {
  if (editingBounds.value && bounds.value) {
    // Done: the initial view changes only as far as the new bounds require. Its centre must lie inside
    // them (the backend rejects it otherwise), and visitors cannot zoom out past the bounds anyway.
    // Re-framing every time zoomed the editor out after each adjustment.
    const [[s, w], [n, e]] = bounds.value;
    const lat = Number(form.lat);
    const lng = Number(form.lng);
    if (Number.isNaN(lat) || Number.isNaN(lng) || lat < s || lat > n || lng < w || lng > e) {
      form.lat = ((s + n) / 2).toFixed(6);
      form.lng = ((w + e) / 2).toFixed(6);
    }
    const fit = canvas.value?.zoomFor(bounds.value);
    const zoom = Number(form.zoom);
    if (fit !== undefined && (Number.isNaN(zoom) || zoom < fit - 0.5)) form.zoom = String(fit);
  }
  editingBounds.value = !editingBounds.value;
}

function setInitialView() {
  const current = canvas.value?.currentView();
  if (!current || readonly.value) return;
  form.lat = String(current.lat);
  form.lng = String(current.lng);
  form.zoom = String(current.zoom);
  showToast("Initial view set", `Visitors open the map at ${current.lat}, ${current.lng} at zoom ${current.zoom}.`);
}

// Linked Place ---------------------------------------------------------------------------------------------

const outdoorPlaces = computed(() =>
  places.value
    .filter((p) => p.status !== "ARCHIVED" && (p.setting === "OUTDOOR" || p.id === form.placeId))
    .map((p) => ({ id: p.id, label: placeTitle(p, null, defaultLanguage.value) })),
);
const placeNote = computed(() => {
  const p = form.placeId ? placeById.value.get(form.placeId) : undefined;
  return p ? `Shown on the ${placeTitle(p, null, defaultLanguage.value)} page in the visitor app.` : "Not linked. The map is reachable from Navigation only.";
});

const subtitle = computed(() => {
  const n = form.placements.length;
  return `Geographic map · ${n === 1 ? "1 placed Resource" : `${n} placed Resources`} · zoom ${form.zoom}`;
});

function errorAt(index: number): string | undefined {
  const prefix = `placements[${index}]`;
  const messages = Object.entries(editor.errors).filter(([p]) => p.startsWith(prefix)).map(([, m]) => m);
  return messages.length ? messages.join(" ") : undefined;
}

function box(on: boolean) {
  return on ? "border-primary bg-primary text-white" : "border-gray-300 bg-white text-transparent";
}
</script>

<template>
  <EditorShell
    :editor="editor"
    back-label="Maps & Floor Plans"
    :back-to="{ name: 'maps', params: { projectId } }"
    :title="editor.resource?.internalName ?? 'Map'"
    :subtitle="subtitle"
    activation-hint="Activate it once its bounds are set, so visitors see a framed area."
    :reference-link="toReference"
    :pending="languagesLoading"
  >
    <section class="overflow-hidden rounded-lg border bg-card">
      <div class="flex flex-wrap items-center gap-2 border-b px-4 py-2.5">
        <button type="button" class="map-tool" aria-label="Zoom out" @click="canvas?.zoomBy(-0.5)">−</button>
        <button type="button" class="map-tool" aria-label="Zoom in" @click="canvas?.zoomBy(0.5)">+</button>
        <span class="text-[11px] text-muted-foreground">zoom {{ form.zoom }}</span>
        <button type="button" class="map-tool px-3" :disabled="readonly || editingBounds" @click="setInitialView">Set initial view</button>
        <span class="flex-1 text-[11px] text-muted-foreground">
          {{ editingBounds ? "Editing bounds · drag the corners or the centre handle" : "Visitor view · the map is limited to the bounds" }}
        </span>
        <button type="button" class="map-tool px-3" :class="{ 'border-primary text-primary': editingBounds }" :disabled="readonly" @click="toggleBounds">
          {{ editingBounds ? "Done" : "Edit bounds" }}
        </button>
      </div>
      <div v-if="form.visitorFilter && !editingBounds" class="flex flex-wrap items-center gap-1.5 border-b border-gray-100 px-4 py-2" aria-label="Visitor filter preview">
        <span class="mr-1 text-[10px] font-extrabold uppercase tracking-[0.08em] text-muted-foreground">Visitor filter</span>
        <button
          v-for="t in filterTypes"
          :key="t.key"
          type="button"
          class="rounded-full border px-2.5 py-1 text-[10px] font-bold"
          :class="filter.type === t.key ? 'border-primary bg-primary text-white' : 'bg-white text-gray-700'"
          @click="filter.type = t.key; filter.category = ''"
        >
          {{ t.label }}
        </button>
        <span v-if="filterCategories.length" class="mx-1 h-4 w-px bg-gray-200" aria-hidden="true"></span>
        <button
          v-for="c in filterCategories"
          :key="c.id"
          type="button"
          class="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-bold"
          :class="filter.category === c.id ? 'border-primary bg-primary text-white' : 'bg-white text-gray-700'"
          @click="filter.category = filter.category === c.id ? '' : c.id"
        >
          <CategoryIcon :category="c" :size="12" />{{ c.translations[defaultLanguage ?? '']?.name || c.code }}
        </button>
        <span class="ml-auto text-[10px] text-muted-foreground">{{ shownSummary }}</span>
      </div>
      <div class="p-3">
        <GeoMapCanvas
          v-if="editor.resource"
          ref="canvas"
          :view="view"
          :bounds="bounds"
          :edit-bounds="editingBounds"
          limit-to-bounds
          :markers="markers"
          :lines="lines"
          label="Map"
          @bounds-change="onBoundsChange"
          @marker-move="onMarkerMove"
        />
      </div>
    </section>

    <div class="grid grid-cols-[repeat(auto-fit,minmax(min(100%,300px),1fr))] gap-[18px]">
      <section class="overflow-hidden rounded-lg border bg-card">
        <div class="border-b px-4 py-3">
          <h2 class="text-[11px] font-extrabold uppercase tracking-[0.09em] text-muted-foreground">Placed ({{ form.placements.length }})</h2>
        </div>
        <ol>
          <li v-for="(p, index) in form.placements" :key="p.key" class="border-b border-gray-100 px-4 py-2.5 last:border-b-0">
            <div class="flex items-center gap-2">
              <span class="flex h-5 w-5 flex-none items-center justify-center rounded-full bg-primary text-[10px] font-extrabold text-white">{{ index + 1 }}</span>
              <span class="min-w-0 flex-1">
                <span class="block truncate text-xs font-bold">{{ title(p.resourceType, p.resourceId) }}</span>
                <span class="block text-[10px] text-muted-foreground">{{ kindLabel(p.resourceType) }}</span>
              </span>
              <button v-if="!readonly" type="button" class="text-[10px] font-bold text-destructive" @click="form.placements.splice(index, 1)">Remove from map</button>
            </div>
            <div class="mt-1.5 flex gap-2 pl-7">
              <input v-model="p.lat" :readonly="readonly" :aria-label="`Latitude of ${title(p.resourceType, p.resourceId)}`" inputmode="decimal" class="field-input compact" />
              <input v-model="p.lng" :readonly="readonly" :aria-label="`Longitude of ${title(p.resourceType, p.resourceId)}`" inputmode="decimal" class="field-input compact" />
            </div>
            <p v-if="errorAt(index)" class="mt-1 pl-7 text-[11px] font-semibold text-destructive">⚠ {{ errorAt(index) }}</p>
          </li>
        </ol>
        <p v-if="!form.placements.length" class="px-4 py-3 text-xs text-muted-foreground">Nothing placed yet. Place items from the Unplaced list.</p>
      </section>

      <section class="overflow-hidden rounded-lg border bg-card">
        <div class="border-b px-4 py-3">
          <h2 class="text-[11px] font-extrabold uppercase tracking-[0.09em] text-muted-foreground">Unplaced ({{ unplaced.length }})</h2>
        </div>
        <ul class="max-h-[420px] overflow-y-auto">
          <li v-for="u in unplaced" :key="`${u.type}:${u.id}`" class="flex items-center gap-2 border-b border-gray-100 px-4 py-2.5 last:border-b-0">
            <span class="min-w-0 flex-1">
              <span class="block truncate text-xs font-bold">{{ title(u.type, u.id) }}</span>
              <span class="block text-[10px] text-muted-foreground">{{ kindLabel(u.type) }}{{ u.lat !== null ? " · has coordinates" : "" }}</span>
            </span>
            <button v-if="!readonly" type="button" class="text-[10px] font-bold uppercase tracking-[0.06em] text-primary" @click="place(u.type, u.id, u.lat, u.lng)">Place</button>
          </li>
        </ul>
        <p v-if="!unplaced.length" class="px-4 py-3 text-xs text-muted-foreground">Every point of interest and place is on the map.</p>
      </section>
    </div>

    <section class="overflow-hidden rounded-lg border bg-card">
      <div class="border-b px-5 py-3.5">
        <h2 class="text-[11px] font-extrabold uppercase tracking-[0.09em] text-muted-foreground">Details</h2>
      </div>
      <div class="flex flex-col gap-1.5 px-5 py-[18px]">
        <label for="m-name" class="small-label">Name</label>
        <input id="m-name" v-model="form.internalName" :readonly="readonly" class="field-input" :class="{ invalid: editor.fieldError('internalName') }" />
        <span class="text-xs text-muted-foreground">
          Only authors see it; visitors see the places and points of interest on it.
          <template v-if="editor.resource?.area"> Area: {{ editor.resource.area }}.</template>
        </span>
      </div>
    </section>

    <template #aside>
      <section class="overflow-hidden rounded-lg border bg-card">
        <div class="border-b px-3.5 py-[11px]">
          <span class="text-[10px] font-extrabold uppercase tracking-[0.1em] text-muted-foreground">Visibility</span>
        </div>
        <div class="flex flex-col gap-3 px-3.5 py-3">
          <div v-for="g in groups" :key="g.scope">
            <button type="button" class="flex w-full items-center gap-2 text-left" :disabled="readonly" :aria-pressed="g.on" @click="toggleGroup(g.scope)">
              <span class="flex h-[18px] w-[18px] items-center justify-center rounded border-[1.5px] text-[10px]" :class="box(g.on)">✓</span>
              <span class="flex-1 text-xs font-bold">{{ g.name }}</span>
              <span class="text-[10px] text-muted-foreground">{{ g.stateLabel }}</span>
            </button>
            <div class="mt-1.5 flex flex-col gap-1 pl-6" :style="{ opacity: g.on ? 1 : 0.45 }">
              <span class="text-[9px] font-extrabold uppercase tracking-[0.08em] text-muted-foreground">By category</span>
              <button
                v-for="c in g.cats"
                :key="c.category.id"
                type="button"
                class="flex items-center gap-1.5 text-left text-[11px]"
                :style="{ paddingLeft: `${c.depth * 18}px`, opacity: c.muted ? 0.45 : 1 }"
                :disabled="readonly"
                :aria-pressed="c.on"
                @click="toggleCategory(c.category.id)"
              >
                <span class="flex h-4 w-4 flex-none items-center justify-center rounded border-[1.5px] text-[9px]" :class="box(c.on)">✓</span>
                <CategoryIcon :category="c.category" :size="13" />
                <span class="flex-1 truncate">{{ c.category.translations[defaultLanguage ?? '']?.name || c.category.code }}</span>
                <span class="text-[10px] text-muted-foreground">{{ c.count }}</span>
              </button>
              <span v-if="!g.cats.length" class="text-[11px] text-muted-foreground">No categories yet</span>
            </div>
          </div>
          <span class="text-[11px] text-muted-foreground">Visitors see what is switched on here. Places always show.</span>
        </div>
      </section>

      <section class="overflow-hidden rounded-lg border bg-card">
        <div class="border-b px-3.5 py-[11px]">
          <span class="text-[10px] font-extrabold uppercase tracking-[0.1em] text-muted-foreground">Visitor filter</span>
        </div>
        <div class="flex flex-col gap-2 px-3.5 py-3">
          <button type="button" class="flex items-center gap-2 text-left" :disabled="readonly" :aria-pressed="form.visitorFilter" @click="form.visitorFilter = !form.visitorFilter">
            <span class="flex h-[18px] w-[18px] items-center justify-center rounded border-[1.5px] text-[10px]" :class="box(form.visitorFilter)">✓</span>
            <span class="text-xs font-bold">Visitors can filter</span>
          </button>
          <span class="text-[11px] text-muted-foreground">A filter bar on the map lets visitors narrow what is switched on here, by type and category.</span>
        </div>
      </section>

      <section class="overflow-hidden rounded-lg border bg-card">
        <div class="border-b px-3.5 py-[11px]">
          <span class="text-[10px] font-extrabold uppercase tracking-[0.1em] text-muted-foreground">Linked Place</span>
        </div>
        <div class="flex flex-col gap-1.5 px-3.5 py-3">
          <select v-model="form.placeId" :disabled="readonly" aria-label="Linked Place" class="field-input compact" :class="{ invalid: editor.fieldError('placeId') }">
            <option value="">No place</option>
            <option v-for="p in outdoorPlaces" :key="p.id" :value="p.id">{{ p.label }}</option>
          </select>
          <span v-if="editor.fieldError('placeId')" class="text-[11px] font-semibold text-destructive">⚠ {{ editor.fieldError("placeId") }}</span>
          <span v-else class="text-[11px] text-muted-foreground">{{ placeNote }}</span>
        </div>
      </section>

      <section class="overflow-hidden rounded-lg border bg-card">
        <div class="border-b px-3.5 py-[11px]">
          <span class="text-[10px] font-extrabold uppercase tracking-[0.1em] text-muted-foreground">Initial view</span>
        </div>
        <div class="grid grid-cols-3 gap-2 px-3.5 py-3">
          <label class="flex flex-col gap-1 text-[10px] font-bold text-muted-foreground">Latitude<input v-model="form.lat" :readonly="readonly" class="field-input compact" :class="{ invalid: editor.fieldError('initialLatitude') }" /></label>
          <label class="flex flex-col gap-1 text-[10px] font-bold text-muted-foreground">Longitude<input v-model="form.lng" :readonly="readonly" class="field-input compact" :class="{ invalid: editor.fieldError('initialLongitude') }" /></label>
          <label class="flex flex-col gap-1 text-[10px] font-bold text-muted-foreground">Zoom<input v-model="form.zoom" :readonly="readonly" class="field-input compact" :class="{ invalid: editor.fieldError('initialZoom') }" /></label>
        </div>
      </section>

      <section class="overflow-hidden rounded-lg border bg-card">
        <div class="border-b px-3.5 py-[11px]">
          <span class="text-[10px] font-extrabold uppercase tracking-[0.1em] text-muted-foreground">Bounds</span>
        </div>
        <div class="grid grid-cols-2 gap-2 px-3.5 py-3">
          <label class="flex flex-col gap-1 text-[10px] font-bold text-muted-foreground">Min latitude<input v-model="form.minLat" :readonly="readonly" class="field-input compact" /></label>
          <label class="flex flex-col gap-1 text-[10px] font-bold text-muted-foreground">Max latitude<input v-model="form.maxLat" :readonly="readonly" class="field-input compact" /></label>
          <label class="flex flex-col gap-1 text-[10px] font-bold text-muted-foreground">Min longitude<input v-model="form.minLng" :readonly="readonly" class="field-input compact" /></label>
          <label class="flex flex-col gap-1 text-[10px] font-bold text-muted-foreground">Max longitude<input v-model="form.maxLng" :readonly="readonly" class="field-input compact" /></label>
          <span v-if="editor.fieldError('minLatitude')" class="col-span-2 text-[11px] font-semibold text-destructive">⚠ {{ editor.fieldError("minLatitude") }}</span>
          <span class="col-span-2 text-[11px] text-muted-foreground">Use “Edit bounds” on the map, or type values. Visitors see only this area.</span>
        </div>
      </section>
    </template>
  </EditorShell>
</template>

<style scoped>
.compact {
  padding: 6px 8px;
  font-size: 12px;
}
.map-tool {
  border: 1px solid #e5e7eb;
  border-radius: 999px;
  background: #fff;
  padding: 4px 10px;
  font-size: 11px;
  font-weight: 700;
  color: #374151;
}
.map-tool:disabled {
  opacity: 0.5;
}
</style>
