<script setup lang="ts">
import { ChevronDown, LocateFixed, Pencil, Trash2 } from "lucide-vue-next";
import { computed, reactive, ref, useId } from "vue";
import CategoryIcon from "@/components/CategoryIcon.vue";
import EditorSection from "@/components/editor/EditorSection.vue";
import EditorShell from "@/components/editor/EditorShell.vue";
import { coordinateError, fanOut, formatCoordinate, isInside, parseDecimal, tidyCoordinate } from "@/components/map/coordinates";
import GeoMapCanvas, { type Bounds, type CanvasMarker, type LatLng } from "@/components/map/GeoMapCanvas.vue";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { HelpHint } from "@/components/ui/help-hint";
import { FormField } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { categoryTree, listCategories, type Category, type CategoryScope } from "@/platform/categories";
import {
  changeMapStatus,
  fetchMap,
  fetchMapReferences,
  mapFromResponse,
  mapWorkingCopyPayload,
  updateMap,
  type GeoMap,
  type PlaceableType,
  type UpdateMapInput,
} from "@/platform/maps";
import { listPlaces, placeTitle, type Place } from "@/platform/places";
import { listPois, poiTitle, type Poi } from "@/platform/pois";
import type { ResourceReference } from "@/platform/references";
import { listRoutes, type Route } from "@/platform/routes";
import { say } from "@/lib/announcer";
import { glossary, hints } from "@/lib/glossary";
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

/** A coordinate field as a number; `null` when empty, `NaN` when it is not a number (validation reports it first). */
const num = (v: string) => (v.trim() === "" ? null : (parseDecimal(v) ?? Number.NaN));
const str = (v: number | null) => (v === null || v === undefined ? "" : formatCoordinate(v));
const FIELD_NAMES: Record<string, string> = {
  internalName: "Name",
  placeId: "Linked Place",
  initialLatitude: "Initial latitude",
  initialLongitude: "Initial longitude",
  initialZoom: "Initial zoom",
  minLatitude: "Min latitude",
  maxLatitude: "Max latitude",
  minLongitude: "Min longitude",
  maxLongitude: "Max longitude",
  hiddenCategoryIds: "Visibility",
};

/** The editable state from the form, for a DRAFT save and a working copy alike. */
function input(): Omit<UpdateMapInput, "version"> {
  return {
    internalName: form.internalName.trim(),
    placeId: form.placeId || null,
    initialLatitude: num(form.lat) ?? Number.NaN,
    initialLongitude: num(form.lng) ?? Number.NaN,
    initialZoom: num(form.zoom) ?? Number.NaN,
    minLatitude: num(form.minLat),
    minLongitude: num(form.minLng),
    maxLatitude: num(form.maxLat),
    maxLongitude: num(form.maxLng),
    showPois: form.showPois,
    showRoutes: form.showRoutes,
    hiddenCategoryIds: [...form.hiddenCategoryIds],
    visitorFilter: form.visitorFilter,
    placements: form.placements.map((p) => ({ resourceType: p.resourceType, resourceId: p.resourceId, latitude: num(p.lat) ?? Number.NaN, longitude: num(p.lng) ?? Number.NaN })),
  };
}

/**
 * Coordinate checks while typing: a field is checked when it loses focus, with the same rules and sentences as the New
 * map dialog, shown under the field, marked invalid and announced politely (C2-69). Save still checks everything.
 */
const blurErrors = reactive<Record<string, string>>({});

/** Checks one coordinate field (`axis` "zoom" for the zoom field); an empty optional field is left to Save. */
function check(path: string, text: string, axis: "latitude" | "longitude" | "zoom", label: string, optional = false) {
  if (optional && !text.trim()) {
    delete blurErrors[path];
    return;
  }
  let error: string | null;
  if (axis === "zoom") {
    const zoom = parseDecimal(text);
    error = zoom === null || zoom < 0 || zoom > 22 ? "A zoom between 0 and 22, such as 14.5." : null;
  } else {
    error = coordinateError(text, axis);
  }
  if (error) {
    blurErrors[path] = error;
    say(`${label}: ${error}`);
  } else {
    delete blurErrors[path];
  }
}

/** A coordinate field as it should read once left (C3-75); a read-only field is never rewritten. */
const tidy = (text: string, digits?: number) => (readonly.value ? text : tidyCoordinate(text, digits));

/** Clears a shown error as soon as the text becomes valid, so the message does not outlive the fix. */
function recheck(path: string, text: string, axis: "latitude" | "longitude" | "zoom") {
  if (!blurErrors[path]) return;
  const ok = axis === "zoom" ? (() => { const z = parseDecimal(text); return z !== null && z >= 0 && z <= 22; })() : !coordinateError(text, axis);
  if (ok) delete blurErrors[path];
}

/** The message under a field: the one from Save, else the one from leaving the field. */
const fe = (path: string): string | undefined => editor.fieldError(path) ?? blurErrors[path];

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
  save: (map, version) => updateMap(projectId.value, map.id, { version, ...input() }),
  workingCopy: {
    kind: "maps",
    projectId: () => projectId.value,
    payload: () => mapWorkingCopyPayload(projectId.value, input()),
    fromResponse: mapFromResponse,
  },
  changeStatus: (map, target, version) => changeMapStatus(projectId.value, map.id, target, version),
  loadReferences: (map) => fetchMapReferences(projectId.value, map.id),
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
    for (const key of Object.keys(blurErrors)) delete blurErrors[key];
    // The numbers on the pins follow the order the author placed them in. The platform returns placements in its own
    // order after a save, which renumbered the pins and the list, so items already shown keep their position and new
    // ones follow (C2-87).
    const before = new Map(form.placements.map((p, i) => [p.key, i]));
    const keyOf = (p: { resourceType: string; resourceId: string }) => `${p.resourceType}:${p.resourceId}`;
    const rank = (p: { resourceType: string; resourceId: string }) => before.get(keyOf(p)) ?? Number.MAX_SAFE_INTEGER;
    form.placements = map.placements
      .map((p, i) => ({ p, i }))
      .sort((a, b) => rank(a.p) - rank(b.p) || a.i - b.i)
      .map(({ p }) => ({
        key: keyOf(p),
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
    const latError = coordinateError(form.lat, "latitude");
    const lngError = coordinateError(form.lng, "longitude");
    if (latError) found.initialLatitude = latError;
    if (lngError) found.initialLongitude = lngError;
    const zoom = parseDecimal(form.zoom);
    if (zoom === null || zoom < 0 || zoom > 22) found.initialZoom = "A zoom between 0 and 22, such as 14.5.";
    const fields: [keyof typeof form & string, string, "latitude" | "longitude"][] = [
      ["minLat", "minLatitude", "latitude"],
      ["minLng", "minLongitude", "longitude"],
      ["maxLat", "maxLatitude", "latitude"],
      ["maxLng", "maxLongitude", "longitude"],
    ];
    const set = fields.filter(([key]) => String(form[key]).trim()).length;
    if (set !== 0 && set !== 4) {
      for (const [key, path] of fields) if (!String(form[key]).trim()) found[path] = "Set all four bounds, or leave all four empty.";
    }
    if (set > 0) {
      for (const [key, path, axis] of fields) {
        const error = String(form[key]).trim() ? coordinateError(String(form[key]), axis) : null;
        if (error) found[path] = error;
      }
    }
    if (set === 4 && !fields.some(([, path]) => found[path])) {
      const [s, w, n, e] = [form.minLat, form.minLng, form.maxLat, form.maxLng].map((v) => parseDecimal(v) as number);
      if (s >= n) found.maxLatitude = "Max latitude must be greater than min latitude.";
      if (w >= e) found.maxLongitude = "Max longitude must be greater than min longitude.";
      const la = parseDecimal(form.lat);
      const lo = parseDecimal(form.lng);
      if (!found.maxLatitude && !found.maxLongitude && !found.initialLatitude && !found.initialLongitude && la !== null && lo !== null && !isInside(la, lo, [[s, w], [n, e]])) {
        found.initialLatitude = "The start view must lie inside the bounds. Use “Set as visitor start view”, or change the bounds.";
      }
    }
    form.placements.forEach((p, i) => {
      const plat = coordinateError(p.lat, "latitude");
      const plng = coordinateError(p.lng, "longitude");
      if (plat) found[`placements[${i}].latitude`] = plat;
      if (plng) found[`placements[${i}].longitude`] = plng;
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

/**
 * Puts the item at its own coordinates, or, when it has none, on a spiral round the start view so several newly placed
 * items do not stack on one spot (C1-98); the author drags or types the exact position.
 */
function place(type: PlaceableType, id: string, lat: number | null, lng: number | null) {
  const own = lat !== null && lng !== null;
  const spot = own ? { lat, lng } : fanOut({ lat: view.value.lat, lng: view.value.lng }, view.value.zoom, placedWithoutOwn.value);
  if (!own) placedWithoutOwn.value += 1;
  form.placements.push({ key: `${type}:${id}`, resourceType: type, resourceId: id, lat: formatCoordinate(spot.lat), lng: formatCoordinate(spot.lng) });
  say(own ? `${title(type, id)} placed at its own coordinates.` : `${title(type, id)} placed near the start view. Drag it or type exact coordinates.`);
}
/** How many items without coordinates were placed in this visit, so each gets its own spot on the spiral. */
const placedWithoutOwn = ref(0);

function onMarkerMove(key: string, lat: number, lng: number) {
  const p = form.placements.find((x) => x.key === key);
  if (!p || readonly.value) return;
  p.lat = formatCoordinate(lat);
  p.lng = formatCoordinate(lng);
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
const filterOpen = ref(false);
const filterPanelId = useId();

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
      unit: scope === "POI" ? ["POI", "POIs"] : ["Route", "Routes"],
      listId: `visibility-${scope}`,
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

/** Category lists longer than this are collapsed behind "By category (N)" (C3-76). */
const LONG_LIST = 6;
const openLists = reactive<Record<string, boolean>>({});

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

const view = computed(() => {
  const lat = parseDecimal(form.lat);
  const lng = parseDecimal(form.lng);
  const zoom = parseDecimal(form.zoom);
  return {
    lat: lat !== null && Math.abs(lat) <= 90 ? lat : 0,
    lng: lng !== null && Math.abs(lng) <= 180 ? lng : 0,
    zoom: zoom !== null && zoom >= 0 && zoom <= 22 ? zoom : 2,
  };
});
/** The bounds, once all four fields hold valid numbers in order; typing a half-finished value never reaches the map. */
const bounds = computed<Bounds | null>(() => {
  const values = [form.minLat, form.minLng, form.maxLat, form.maxLng].map(parseDecimal);
  if (values.some((v) => v === null)) return null;
  const [s, w, n, e] = values as number[];
  if (Math.abs(s) > 90 || Math.abs(n) > 90 || Math.abs(w) > 180 || Math.abs(e) > 180 || s >= n || w >= e) return null;
  return [
    [s, w],
    [n, e],
  ];
});

/** A placement's position as numbers, or null while its fields do not hold valid coordinates. */
function positionOf(p: PlacementForm): LatLng | null {
  const lat = parseDecimal(p.lat);
  const lng = parseDecimal(p.lng);
  return lat === null || lng === null || Math.abs(lat) > 90 || Math.abs(lng) > 180 ? null : [lat, lng];
}

function outside(p: PlacementForm): boolean {
  const at = positionOf(p);
  return !!at && !!bounds.value && !isInside(at[0], at[1], bounds.value);
}

/** Placed items that lie outside the bounds: visitors cannot see them (C1-95). */
const outsideItems = computed(() => form.placements.filter(outside));

const markers = computed<CanvasMarker[]>(() =>
  form.placements
    .map((p, i) => ({ p, i, at: positionOf(p) }))
    .filter(({ p, at }) => at && shownByFilter(p.resourceType, p.resourceId))
    .map(({ p, i, at }) => ({
      key: p.key,
      lat: (at as LatLng)[0],
      lng: (at as LatLng)[1],
      label: String(i + 1),
      title: title(p.resourceType, p.resourceId),
      draggable: !readonly.value,
      muted: !shownBySettings(p.resourceType, p.resourceId),
      warn: outside(p),
    })),
);

/** Route lines through the stops' positions on this map, or their own coordinates. */
const lines = computed<LatLng[][]>(() => {
  const onMap = new Map(form.placements.filter((p) => p.resourceType === "POI" && positionOf(p)).map((p) => [p.resourceId, positionOf(p) as LatLng]));
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

/** What the filter is set to, shown on the disclosure button. */
const filterSummary = computed(() => {
  const type = filterTypes.value.find((t) => t.key === filter.type)?.label ?? "All";
  const category = filter.category ? filterCategories.value.find((c) => c.id === filter.category) : undefined;
  return category ? `${type}, ${category.translations[defaultLanguage.value ?? ""]?.name || category.code}` : type;
});

const shownSummary = computed(() => `${markers.value.length} of ${form.placements.length} placed shown`);

function onBoundsChange(b: Bounds) {
  if (readonly.value) return;
  [form.minLat, form.minLng] = [formatCoordinate(b[0][0]), formatCoordinate(b[0][1])];
  [form.maxLat, form.maxLng] = [formatCoordinate(b[1][0]), formatCoordinate(b[1][1])];
}

function toggleBounds() {
  if (editingBounds.value && bounds.value) {
    // Done: the initial view changes only as far as the new bounds require. Its centre must lie inside
    // them (the backend rejects it otherwise), and visitors cannot zoom out past the bounds anyway.
    // Re-framing every time zoomed the editor out after each adjustment.
    const [[s, w], [n, e]] = bounds.value;
    const lat = parseDecimal(form.lat);
    const lng = parseDecimal(form.lng);
    if (lat === null || lng === null || lat < s || lat > n || lng < w || lng > e) {
      form.lat = formatCoordinate((s + n) / 2);
      form.lng = formatCoordinate((w + e) / 2);
    }
    const fit = canvas.value?.zoomFor(bounds.value);
    const zoom = parseDecimal(form.zoom);
    if (fit !== undefined && (zoom === null || zoom < fit)) form.zoom = formatCoordinate(fit, 2);
  }
  editingBounds.value = !editingBounds.value;
}

/*
 * Pan and zoom set the initial view (`12` §3 Maps): a move the author makes (drag, wheel, keys, the zoom buttons)
 * becomes the view visitors open the map at. The map's own moves, such as fitting the bounds on load, are not the
 * author's and change nothing. The fields under "Initial view" stay, so the view can also be typed (`14` lines
 * 184-185).
 */
let lastGesture = 0;
const gesture = () => (lastGesture = Date.now());

function onViewChange(current: { lat: number; lng: number; zoom: number }) {
  if (readonly.value || editingBounds.value || Date.now() - lastGesture > 1500) return;
  form.lat = formatCoordinate(current.lat);
  form.lng = formatCoordinate(current.lng);
  form.zoom = formatCoordinate(current.zoom, 2);
}

/** Makes the map as it is now the view visitors open at (the same as leaving it there after panning). */
function setStartView() {
  const current = canvas.value?.currentView();
  if (!current || readonly.value) return;
  form.lat = formatCoordinate(current.lat);
  form.lng = formatCoordinate(current.lng);
  form.zoom = formatCoordinate(current.zoom, 2);
  say(`Start view set to ${formatCoordinate(current.lat, 5)}, ${formatCoordinate(current.lng, 5)}, zoom ${formatCoordinate(current.zoom, 2)}.`);
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

const unplacedQuery = ref("");
const unplacedShown = computed(() => {
  const q = unplacedQuery.value.trim().toLowerCase();
  return q ? unplaced.value.filter((u) => title(u.type, u.id).toLowerCase().includes(q)) : unplaced.value;
});

const coarsePointer = typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;
const modeText = computed(() =>
  editingBounds.value
    ? coarsePointer
      ? "Editing the area: drag a corner or the centre handle."
      : "Editing the area: drag a corner or the centre handle, or focus one and use the arrow keys."
    : readonly.value
      ? "Visitor view: the map is limited to the bounds."
      : "Visitor view: visitors open the map where you leave it.",
);
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
    <EditorSection id="map" title="Map and bounds">
      <div class="flex flex-wrap items-end gap-3">
        <FormField id="f-internalName" label="Name" hint="Only authors see it." :error="editor.fieldError('internalName')" class="min-w-[min(100%,16rem)] flex-1" v-slot="f">
          <Input :id="f.id" v-model="form.internalName" :readonly="readonly" :aria-describedby="f.describedBy" :invalid="f.invalid" />
        </FormField>
        <Button :variant="editingBounds ? 'primary' : 'secondary'" :disabled="readonly" :aria-pressed="editingBounds" class="mb-5" @click="toggleBounds">
          <Pencil aria-hidden="true" />{{ editingBounds ? "Done editing bounds" : "Edit bounds" }}
        </Button>
      </div>

      <div class="flex min-w-0 flex-col gap-3">
        <div @pointerdown.capture="gesture" @pointerup.capture="gesture" @wheel.capture="gesture" @keydown.capture="gesture">
          <GeoMapCanvas
            v-if="editor.resource"
            ref="canvas"
            :view="view"
            :bounds="bounds"
            :edit-bounds="editingBounds"
            limit-to-bounds
            :markers="markers"
            :lines="lines"
            height="clamp(360px, 56dvh, 600px)"
            label="Map"
            @bounds-change="onBoundsChange"
            @marker-move="onMarkerMove"
            @view-change="onViewChange"
          />
        </div>
        <p class="text-sm text-muted-foreground">
          {{ modeText }}<template v-if="editor.resource?.area"> Area: {{ editor.resource.area }}.</template>
        </p>
        <Alert v-if="outsideItems.length" tone="warning" :title="`${outsideItems.length} placed ${outsideItems.length === 1 ? 'item lies' : 'items lie'} outside the bounds`">
          {{ outsideItems.slice(0, 4).map((p) => title(p.resourceType, p.resourceId)).join(", ") }}{{ outsideItems.length > 4 ? ` and ${outsideItems.length - 4} more` : "" }}.
          Visitors cannot see items outside the bounds. Move them inside, or widen the bounds. They are drawn with a dashed rim and a warning badge.
        </Alert>
        <div v-if="form.visitorFilter && !editingBounds" class="flex flex-col gap-2">
          <div class="flex flex-wrap items-center gap-x-3 gap-y-1">
            <button
              type="button"
              class="inline-flex min-h-control items-center gap-1.5 rounded-md px-1 text-sm font-semibold text-primary hover:bg-surface-hover"
              :aria-expanded="filterOpen"
              :aria-controls="filterPanelId"
              @click="filterOpen = !filterOpen"
            >
              <ChevronDown class="size-4 transition-transform" :class="filterOpen ? 'rotate-180' : ''" aria-hidden="true" />
              <span>Try the visitor filter<span class="font-normal text-muted-foreground">: {{ filterSummary }}</span></span>
            </button>
            <span class="text-xs text-muted-foreground" aria-live="polite">{{ shownSummary }}</span>
          </div>
          <!-- One disclosure with two radio groups: one Tab stop each, arrow keys inside (C2-85). -->
          <div v-show="filterOpen" :id="filterPanelId" class="grid gap-4 rounded-md border border-border p-3 sm:grid-cols-2">
            <fieldset class="min-w-0">
              <legend class="mb-1 text-sm font-bold">Type</legend>
              <label v-for="t in filterTypes" :key="t.key" class="flex min-h-control cursor-pointer items-center gap-2 text-sm [@media(pointer:coarse)]:min-h-11">
                <input v-model="filter.type" type="radio" name="visitor-filter-type" :value="t.key" class="size-4 accent-primary" @change="filter.category = ''" />
                {{ t.label }}
              </label>
            </fieldset>
            <fieldset class="min-w-0">
              <legend class="mb-1 text-sm font-bold">Category</legend>
              <div class="max-h-56 overflow-y-auto">
                <label class="flex min-h-control cursor-pointer items-center gap-2 text-sm [@media(pointer:coarse)]:min-h-11">
                  <input v-model="filter.category" type="radio" name="visitor-filter-category" value="" class="size-4 accent-primary" />
                  All categories
                </label>
                <label v-for="c in filterCategories" :key="c.id" class="flex min-h-control cursor-pointer items-center gap-2 text-sm [@media(pointer:coarse)]:min-h-11">
                  <input v-model="filter.category" type="radio" name="visitor-filter-category" :value="c.id" class="size-4 accent-primary" />
                  <CategoryIcon :category="c" :size="14" />{{ c.translations[defaultLanguage ?? '']?.name || c.code }}
                </label>
              </div>
            </fieldset>
          </div>
        </div>
        <!-- The legend names only what is drawn (C3-76). -->
        <p v-if="lines.length || markers.length" class="flex items-center gap-2 text-xs text-muted-foreground" data-route-legend>
          <svg v-if="lines.length" width="28" height="8" viewBox="0 0 28 8" aria-hidden="true" class="shrink-0 text-primary"><line x1="0" y1="4" x2="28" y2="4" stroke="currentColor" stroke-width="4" stroke-linecap="round" /></svg>
          <span>
            <template v-if="lines.length">The purple lines are Routes, joining their stops in order.</template>
            <template v-if="markers.length"> Numbered pins are the placed items.</template>
          </span>
        </p>
      </div>

      <div class="grid gap-6 md:grid-cols-2">
        <fieldset class="flex min-w-0 flex-col gap-3">
          <legend class="mb-1 flex items-center gap-1 text-sm font-bold">{{ glossary.bounds }}<HelpHint label="What are map bounds?">{{ hints.bounds }}</HelpHint></legend>
          <p class="text-xs text-muted-foreground">Visitors see only this area. Drag the handles on the map or type values; a comma or a point works as the decimal mark.</p>
          <div class="grid grid-cols-2 gap-3">
            <FormField id="f-minLatitude" label="Min latitude" :error="fe('minLatitude')" v-slot="f">
              <Input :id="f.id" v-model="form.minLat" :readonly="readonly" inputmode="decimal" autocomplete="off" :aria-describedby="f.describedBy" :invalid="f.invalid" :data-path="'minLatitude'" @blur="form.minLat = tidy(form.minLat); check('minLatitude', form.minLat, 'latitude', 'Min latitude', true)" @input="recheck('minLatitude', form.minLat, 'latitude')" />
            </FormField>
            <FormField id="f-maxLatitude" label="Max latitude" :error="fe('maxLatitude')" v-slot="f">
              <Input :id="f.id" v-model="form.maxLat" :readonly="readonly" inputmode="decimal" autocomplete="off" :aria-describedby="f.describedBy" :invalid="f.invalid" :data-path="'maxLatitude'" @blur="form.maxLat = tidy(form.maxLat); check('maxLatitude', form.maxLat, 'latitude', 'Max latitude', true)" @input="recheck('maxLatitude', form.maxLat, 'latitude')" />
            </FormField>
            <FormField id="f-minLongitude" label="Min longitude" :error="fe('minLongitude')" v-slot="f">
              <Input :id="f.id" v-model="form.minLng" :readonly="readonly" inputmode="decimal" autocomplete="off" :aria-describedby="f.describedBy" :invalid="f.invalid" :data-path="'minLongitude'" @blur="form.minLng = tidy(form.minLng); check('minLongitude', form.minLng, 'longitude', 'Min longitude', true)" @input="recheck('minLongitude', form.minLng, 'longitude')" />
            </FormField>
            <FormField id="f-maxLongitude" label="Max longitude" :error="fe('maxLongitude')" v-slot="f">
              <Input :id="f.id" v-model="form.maxLng" :readonly="readonly" inputmode="decimal" autocomplete="off" :aria-describedby="f.describedBy" :invalid="f.invalid" :data-path="'maxLongitude'" @blur="form.maxLng = tidy(form.maxLng); check('maxLongitude', form.maxLng, 'longitude', 'Max longitude', true)" @input="recheck('maxLongitude', form.maxLng, 'longitude')" />
            </FormField>
          </div>
        </fieldset>
        <fieldset class="flex min-w-0 flex-col gap-3">
          <legend class="mb-1 text-sm font-bold">Visitor start view</legend>
          <p class="text-xs text-muted-foreground">Where the map opens for visitors. Panning or zooming the map sets it too.</p>
          <div class="grid grid-cols-2 gap-3">
            <FormField id="f-initialLatitude" label="Latitude" :error="fe('initialLatitude')" v-slot="f">
              <Input :id="f.id" v-model="form.lat" :readonly="readonly" inputmode="decimal" autocomplete="off" :aria-describedby="f.describedBy" :invalid="f.invalid" :data-path="'initialLatitude'" @blur="form.lat = tidy(form.lat); check('initialLatitude', form.lat, 'latitude', 'Latitude')" @input="recheck('initialLatitude', form.lat, 'latitude')" />
            </FormField>
            <FormField id="f-initialLongitude" label="Longitude" :error="fe('initialLongitude')" v-slot="f">
              <Input :id="f.id" v-model="form.lng" :readonly="readonly" inputmode="decimal" autocomplete="off" :aria-describedby="f.describedBy" :invalid="f.invalid" :data-path="'initialLongitude'" @blur="form.lng = tidy(form.lng); check('initialLongitude', form.lng, 'longitude', 'Longitude')" @input="recheck('initialLongitude', form.lng, 'longitude')" />
            </FormField>
            <FormField id="f-initialZoom" label="Zoom" :error="fe('initialZoom')" v-slot="f">
              <Input :id="f.id" v-model="form.zoom" :readonly="readonly" inputmode="decimal" autocomplete="off" :aria-describedby="f.describedBy" :invalid="f.invalid" :data-path="'initialZoom'" @blur="form.zoom = tidy(form.zoom, 2); check('initialZoom', form.zoom, 'zoom', 'Zoom')" @input="recheck('initialZoom', form.zoom, 'zoom')" />
            </FormField>
            <div v-if="!readonly" class="flex items-end pb-px">
              <Button variant="secondary" class="w-full" @click="setStartView"><LocateFixed aria-hidden="true" />Set as start view</Button>
            </div>
          </div>
        </fieldset>
      </div>
    </EditorSection>

    <EditorSection id="placed" title="Placed on this map" :count="`${form.placements.length} placed, ${unplaced.length} not placed`">
      <div class="grid gap-5 md:grid-cols-2">
        <div class="min-w-0">
          <h3 class="mb-2 text-sm font-bold">Placed ({{ form.placements.length }})</h3>
          <ol v-if="form.placements.length" class="divide-y divide-border rounded-md border border-border">
            <li v-for="(p, index) in form.placements" :key="p.key" class="flex flex-col gap-2 p-3">
              <div class="flex items-center gap-2">
                <span class="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground" aria-hidden="true">{{ index + 1 }}</span>
                <span class="min-w-0 flex-1">
                  <span class="block break-words text-sm font-semibold">{{ title(p.resourceType, p.resourceId) }}</span>
                  <span class="block text-xs text-muted-foreground">
                    {{ kindLabel(p.resourceType) }}<template v-if="!shownBySettings(p.resourceType, p.resourceId)"> · Hidden from visitors by Visibility</template
                    ><template v-if="outside(p)"> · Outside the bounds</template>
                  </span>
                </span>
                <Button v-if="!readonly" variant="ghost" size="sm" :label="`Remove ${title(p.resourceType, p.resourceId)} from the map`" @click="form.placements.splice(index, 1)">
                  <Trash2 aria-hidden="true" />Remove
                </Button>
              </div>
              <div class="grid grid-cols-2 gap-3 sm:pl-8">
                <FormField :id="`pl-${index}-lat`" label="Latitude" :error="fe(`placements[${index}].latitude`)" v-slot="f">
                  <Input
                    :id="f.id"
                    v-model="p.lat"
                    :data-path="`placements[${index}].latitude`"
                    @blur="p.lat = tidy(p.lat); check(`placements[${index}].latitude`, p.lat, 'latitude', `Latitude of ${title(p.resourceType, p.resourceId)}`)"
                    @input="recheck(`placements[${index}].latitude`, p.lat, 'latitude')"
                    :readonly="readonly"
                    inputmode="decimal"
                    autocomplete="off"
                    :aria-label="`Latitude of ${title(p.resourceType, p.resourceId)}`"
                    :aria-describedby="f.describedBy"
                    :invalid="f.invalid"
                  />
                </FormField>
                <FormField :id="`pl-${index}-lng`" label="Longitude" :error="fe(`placements[${index}].longitude`)" v-slot="f">
                  <Input
                    :id="f.id"
                    v-model="p.lng"
                    :data-path="`placements[${index}].longitude`"
                    @blur="p.lng = tidy(p.lng); check(`placements[${index}].longitude`, p.lng, 'longitude', `Longitude of ${title(p.resourceType, p.resourceId)}`)"
                    @input="recheck(`placements[${index}].longitude`, p.lng, 'longitude')"
                    :readonly="readonly"
                    inputmode="decimal"
                    autocomplete="off"
                    :aria-label="`Longitude of ${title(p.resourceType, p.resourceId)}`"
                    :aria-describedby="f.describedBy"
                    :invalid="f.invalid"
                  />
                </FormField>
              </div>
            </li>
          </ol>
          <p v-else class="text-sm text-muted-foreground">Nothing placed yet. Place items from the list beside this one, then drag them on the map or type coordinates.</p>
        </div>

        <div class="min-w-0">
          <h3 class="mb-2 text-sm font-bold">Not placed ({{ unplaced.length }})</h3>
          <FormField v-if="unplaced.length > 6" id="unplaced-search" label="Search not placed" v-slot="f">
            <Input :id="f.id" v-model="unplacedQuery" type="search" autocomplete="off" />
          </FormField>
          <ul v-if="unplacedShown.length" class="mt-2 max-h-[26rem] divide-y divide-border overflow-y-auto rounded-md border border-border">
            <li v-for="u in unplacedShown" :key="`${u.type}:${u.id}`" class="flex items-center gap-2 px-3 py-2">
              <span class="min-w-0 flex-1">
                <span class="block break-words text-sm font-semibold">{{ title(u.type, u.id) }}</span>
                <span class="block text-xs text-muted-foreground">{{ kindLabel(u.type) }}{{ u.lat !== null ? " · has coordinates" : " · no coordinates yet" }}</span>
              </span>
              <Button v-if="!readonly" variant="secondary" size="sm" @click="place(u.type, u.id, u.lat, u.lng)">Place<span class="sr-only"> {{ title(u.type, u.id) }}</span></Button>
            </li>
          </ul>
          <p v-else-if="unplaced.length" class="mt-2 text-sm text-muted-foreground">Nothing matches “{{ unplacedQuery }}”.</p>
          <p v-else class="text-sm text-muted-foreground">Every point of interest and place is on the map.</p>
        </div>
      </div>
    </EditorSection>

    <EditorSection id="visibility" title="Visibility" description="Visitors see what is switched on here. Places always show.">
      <div class="grid gap-5 md:grid-cols-2">
        <div v-for="g in groups" :key="g.scope" class="min-w-0">
          <Checkbox :model-value="g.on" :disabled="readonly" :description="g.stateLabel" @update:model-value="toggleGroup(g.scope)">{{ g.name }}</Checkbox>
          <div class="ml-8 mt-1 flex flex-col" :class="g.on ? '' : 'opacity-70'">
            <button
              v-if="g.cats.length > LONG_LIST"
              type="button"
              class="-ml-1 inline-flex min-h-control items-center gap-1.5 self-start rounded-md px-1 text-xs font-semibold text-ink-2 hover:bg-surface-hover active:bg-surface-active"
              :aria-expanded="!!openLists[g.scope]"
              :aria-controls="g.listId"
              @click="openLists[g.scope] = !openLists[g.scope]"
            >
              <ChevronDown class="size-4 transition-transform" :class="openLists[g.scope] ? 'rotate-180' : ''" aria-hidden="true" />
              By category ({{ g.cats.length }})<template v-if="g.cats.some((c) => !c.on)">, {{ g.cats.filter((c) => !c.on).length }} hidden</template>
            </button>
            <p v-else-if="g.cats.length" class="text-xs font-semibold text-muted-foreground">By category ({{ g.cats.length }})</p>
            <div v-show="g.cats.length <= LONG_LIST || openLists[g.scope]" :id="g.listId" class="flex flex-col">
              <Checkbox
                v-for="c in g.cats"
                :key="c.category.id"
                :model-value="c.on"
                :disabled="readonly"
                :style="{ paddingLeft: `${c.depth * 1.25}rem` }"
                @update:model-value="toggleCategory(c.category.id)"
              >
                <span class="inline-flex flex-wrap items-center gap-x-1.5"
                  ><CategoryIcon :category="c.category" :size="14" />{{ c.category.translations[defaultLanguage ?? '']?.name || c.category.code }}
                  <span class="text-xs font-normal text-muted-foreground">· {{ c.count }} {{ c.count === 1 ? g.unit[0] : g.unit[1] }}<template v-if="c.muted"> · parent hidden</template></span></span
                >
              </Checkbox>
            </div>
            <p v-if="!g.cats.length" class="text-sm text-muted-foreground">No categories yet</p>
          </div>
        </div>
      </div>
    </EditorSection>

    <EditorSection id="filter" title="Visitor filter" collapsible :default-open="false" :count="form.visitorFilter ? 'On' : 'Off'">
      <Checkbox v-model="form.visitorFilter" :disabled="readonly" description="A filter bar on the map lets visitors narrow what is switched on in Visibility, by type and category. Try it under the map.">Visitors can filter</Checkbox>
    </EditorSection>

    <EditorSection id="place" title="Linked Place">
      <FormField id="f-placeId" label="Place" :hint="placeNote" :error="editor.fieldError('placeId')" v-slot="f">
        <Select :id="f.id" v-model="form.placeId" :disabled="readonly" :aria-describedby="f.describedBy" :invalid="f.invalid" class="max-w-xl">
          <option value="">No place</option>
          <option v-for="p in outdoorPlaces" :key="p.id" :value="p.id">{{ p.label }}</option>
        </Select>
      </FormField>
    </EditorSection>
  </EditorShell>
</template>
