<script setup lang="ts">
import { List, MapPinOff, Plus, TriangleAlert } from "lucide-vue-next";
import { computed, nextTick, reactive, ref, watch } from "vue";
import ResourcePickerDialog from "@/components/ResourcePickerDialog.vue";
import type { Pickable } from "@/components/resourcePicker";
import RouteMap, { type RouteMapStop, type RoutePlaceMap } from "@/components/RouteMap.vue";
import EditorSection from "@/components/editor/EditorSection.vue";
import EditorShell from "@/components/editor/EditorShell.vue";
import RemovedBar from "@/components/editor/RemovedBar.vue";
import ReorderControls from "@/components/editor/ReorderControls.vue";
import SourcePairField from "@/components/editor/SourcePairField.vue";
import { useUndoRemove } from "@/components/editor/undoRemove";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import FormField from "@/components/ui/field/FormField.vue";
import Input from "@/components/ui/input/Input.vue";
import Select from "@/components/ui/select/Select.vue";
import TranslationsPanel, { type TextFieldGroup, type TextFieldMeta } from "@/components/editor/TranslationsPanel.vue";
import MediaSlots, { type MediaSlot } from "@/components/media/MediaSlots.vue";
import TriggersCard from "@/components/editor/TriggersCard.vue";
import { checkTriggers, listTargetTriggers, saveWithTriggers, triggerToForm, type Trigger, type TriggerForm } from "@/platform/triggers";
import StatusChip from "@/components/StatusChip.vue";
import { SLUG_PATTERN } from "@/lib/format";
import { completenessOf, routeGaps, routeStopSlots } from "@/platform/completeness";
import { listAssets, type Asset, type MediaBinding } from "@/platform/assets";
import { assignableCategories, listCategories, type Category } from "@/platform/categories";
import { listPois, poiTitle, type Poi } from "@/platform/pois";
import { listPlaces, placeTitle, type Place } from "@/platform/places";
import { listMaps, type GeoMap } from "@/platform/maps";
import {
  changeRouteStatus,
  fetchRoute,
  fetchRouteReferences,
  ROUTE_DIFFICULTIES,
  ROUTE_MODES,
  ROUTE_TYPES,
  ROUTE_TYPE_HINTS,
  routeDifficultyLabel,
  routeFromResponse,
  routeTitle,
  routeModeLabel,
  routeTypeLabel,
  routeWorkingCopyPayload,
  updateRoute,
  type Route,
  type RouteDifficulty,
  type RouteMode,
  type RouteStop,
  type RouteStopTranslation,
  type RouteTranslation,
  type RouteType,
  type UpdateRouteInput,
} from "@/platform/routes";
import { useCurrentProject } from "@/workspace/currentProject";
import {
  blankTexts,
  describeTranslationPath,
  ensureTextRows,
  isWholeNumber,
  numberText,
  optionalNumber,
  optionalText,
  textsForApi,
  textsFrom,
  type Texts,
} from "@/workspace/formFields";
import type { ResourceReference } from "@/platform/references";
import { referenceLink } from "@/workspace/referenceLinks";
import { heroBlock, mediaBlocks, previewLanguages, textBlocks, textIn, type PreviewBlock, type PreviewModel } from "@/workspace/preview";
import { ROUTE_TEXT_FIELDS } from "@/platform/routes";
import { filledFields, translationStatus } from "@/workspace/translationStatus";
import { useProjectLanguages } from "@/workspace/useProjectLanguages";
import { useResourceEditor } from "@/workspace/useResourceEditor";

const props = defineProps<{ routeId: string }>();
const project = useCurrentProject();
const projectId = computed(() => project.value.id);
const { languages, defaultLanguage, loading: languagesLoading } = useProjectLanguages(projectId);
const languageCodes = () => languages.value.map((l) => l.languageCode);

type RouteTextKey = keyof RouteTranslation;
type StopTextKey = keyof RouteStopTranslation;
const ROUTE_TEXT_KEYS: RouteTextKey[] = ["title", "summary", "description", "instructions"];
const STOP_TEXT_KEYS: StopTextKey[] = ["titleOverride", "description", "navigationInstructions", "narrative"];

const TEXT_META: Record<RouteTextKey, TextFieldMeta> = {
  title: { label: "Title", multiline: false },
  summary: { label: "Summary", multiline: true, helper: "Short text shown in lists: what the visitor will see and for how long." },
  description: { label: "Description", multiline: true },
  instructions: { label: "Instructions", multiline: true, helper: "Where it starts and what to bring." },
};
const GROUPS: TextFieldGroup[] = [
  { id: "main", label: null, keys: ["title", "summary", "description"] },
  { id: "secondary", label: "More texts", keys: ["instructions"], open: true },
];
// The mockup's media slot of a Route.
const MEDIA_SLOTS: MediaSlot[] = [{ usage: "HERO_IMAGE", label: "Primary image", accept: ["IMAGE"] }];

const FIELD_NAMES: Record<string, string> = {
  slug: "Slug",
  type: "Setting",
  mode: "Mode",
  categoryId: "Category",
  estimatedDurationMinutes: "Route total",
  distanceMeters: "Distance",
  internalName: "Internal name",
  stops: "Stops",
};

// All points of interest: stop titles, statuses, coordinates, and the "Add stop" choice.
const pois = ref<Poi[]>([]);
const poiById = computed(() => new Map(pois.value.map((p) => [p.id, p])));
// The media library, for the slot's name and preview.
const assets = ref<Asset[]>([]);
const categories = ref<Category[]>([]);
// Places and geographic Maps, to draw the Route on the Map of its stops' Place.
const places = ref<Place[]>([]);
const geoMaps = ref<GeoMap[]>([]);

interface StopForm {
  /** Stable list key, also for stops that are not saved yet. */
  key: string;
  id: string | null;
  poiId: string;
  translations: Record<string, Texts<StopTextKey>>;
}

let keyCounter = 0;
const form = reactive({
  slug: "",
  type: "INDOOR" as RouteType,
  difficulty: null as RouteDifficulty | null,
  mode: null as RouteMode | null,
  categoryId: "",
  loop: false,
  estimatedDurationMinutes: "",
  distanceMeters: "",
  internalName: "",
  featured: false,
  translations: {} as Record<string, Texts<RouteTextKey>>,
  stops: [] as StopForm[],
  media: [] as MediaBinding[],
  triggers: [] as TriggerForm[],
});
// The triggers as last loaded or saved; the form is reset from them with the Route.
const savedTriggers = ref<Trigger[]>([]);

function toStopForm(stop: RouteStop): StopForm {
  return {
    key: stop.id ?? `new-${++keyCounter}`,
    id: stop.id,
    poiId: stop.poiId,
    translations: Object.fromEntries(Object.entries(stop.translations).map(([code, t]) => [code, textsFrom(STOP_TEXT_KEYS, t)])),
  };
}

/** The editable state from the form, for a DRAFT save and a working copy alike. */
function input(): Omit<UpdateRouteInput, "version"> {
  return {
    slug: form.slug,
    type: form.type,
    difficulty: form.difficulty,
    mode: form.mode,
    categoryId: form.categoryId || null,
    loop: form.loop,
    estimatedDurationMinutes: optionalNumber(form.estimatedDurationMinutes),
    distanceMeters: optionalNumber(form.distanceMeters),
    internalName: optionalText(form.internalName),
    featured: form.featured,
    translations: textsForApi(ROUTE_TEXT_KEYS, languageCodes(), form.translations),
    stops: form.stops.map((s, i) => ({
      id: s.id,
      poiId: s.poiId,
      position: i,
      translations: textsForApi(STOP_TEXT_KEYS, languageCodes(), s.translations),
    })),
    media: form.media.map((m) => ({ ...m })),
  };
}

const editor = useResourceEditor<Route>({
  kind: "route",
  source: () => props.routeId,
  languages,
  defaultLanguage,
  async load() {
    const [route, allPois, library, allCategories, triggers, allPlaces, allMaps] = await Promise.all([
      fetchRoute(projectId.value, props.routeId),
      listPois(projectId.value),
      listAssets(projectId.value),
      listCategories(projectId.value),
      listTargetTriggers(projectId.value, "ROUTE", props.routeId),
      // The map is a picture of the stops: without Places or Maps the editor still works.
      listPlaces(projectId.value).catch(() => [] as Place[]),
      listMaps(projectId.value).catch(() => [] as GeoMap[]),
    ]);
    places.value = allPlaces;
    geoMaps.value = allMaps;
    savedTriggers.value = triggers;
    pois.value = allPois;
    assets.value = library;
    categories.value = allCategories;
    return route;
  },
  async save(route, version) {
    // Triggers are rows of their own and do not move the Route's version: saved first, put back when it is refused.
    const { saved, triggers } = await saveWithTriggers(projectId.value, "ROUTE", route.id, form.triggers, () =>
      updateRoute(projectId.value, route.id, { version, ...input() }),
    );
    savedTriggers.value = triggers;
    return saved;
  },
  workingCopy: {
    kind: "routes",
    projectId: () => projectId.value,
    payload: () => routeWorkingCopyPayload(input()),
    // Triggers are not in the working copy (backend D-026): "Save draft" saves them live around it.
    async around(route, save) {
      const { saved, triggers } = await saveWithTriggers(projectId.value, "ROUTE", route.id, form.triggers, save);
      savedTriggers.value = triggers;
      return saved;
    },
    fromResponse: routeFromResponse,
  },
  changeStatus: (route, target, version) => changeRouteStatus(projectId.value, route.id, target, version),
  loadReferences: (route) => fetchRouteReferences(projectId.value, route.id),
  resetForm(route) {
    form.slug = route.slug;
    form.type = route.type;
    form.difficulty = route.difficulty;
    form.mode = route.mode;
    form.categoryId = route.categoryId ?? "";
    form.loop = route.loop;
    form.estimatedDurationMinutes = numberText(route.estimatedDurationMinutes);
    form.distanceMeters = numberText(route.distanceMeters);
    form.internalName = route.internalName ?? "";
    form.featured = route.featured;
    form.translations = Object.fromEntries(Object.entries(route.translations).map(([code, t]) => [code, textsFrom(ROUTE_TEXT_KEYS, t)]));
    form.stops = route.stops.map(toStopForm);
    form.media = route.media.map((m) => ({ ...m }));
    form.triggers = savedTriggers.value.map(triggerToForm);
  },
  ensureLanguageRows() {
    ensureTextRows(ROUTE_TEXT_KEYS, languageCodes(), form.translations);
    for (const stop of form.stops) ensureTextRows(STOP_TEXT_KEYS, languageCodes(), stop.translations);
  },
  formState: () => form,
  validate() {
    const found: Record<string, string> = {};
    if (!SLUG_PATTERN.test(form.slug)) found.slug = "Use lowercase Latin letters, digits, and single hyphens.";
    const minutes = form.estimatedDurationMinutes.trim();
    if (minutes && !isWholeNumber(minutes, 1, 10080)) found.estimatedDurationMinutes = "A whole number of minutes between 1 and 10080.";
    const distance = form.distanceMeters.trim();
    if (distance && !isWholeNumber(distance, 1, 1_000_000)) found.distanceMeters = "A whole number of metres between 1 and 1000000.";
    checkTriggers(form.triggers, found);
    return found;
  },
  describePath(path) {
    const stop = /^stops\[(\d+)\]/.exec(path);
    if (stop) return `Stop ${Number(stop[1]) + 1}`;
    if (/^media\[/.test(path)) return "Media";
    if (/^triggers\[/.test(path)) return "How visitors reach it";
    return describeTranslationPath(path, languages.value, TEXT_META) ?? FIELD_NAMES[path] ?? path;
  },
});

// A trigger that opens this route links to its own "How visitors reach it" card.
const toReference = (r: ResourceReference) => referenceLink(projectId.value, r, { resourceType: "ROUTE", resourceId: props.routeId });

const heading = computed(() => (editor.resource ? routeTitle(editor.resource, defaultLanguage.value) : "Route"));
const subtitle = computed(() => (editor.resource ? `${routeTypeLabel(editor.resource.type)} route · ${editor.resource.slug}` : ""));
const activeLanguageInfo = computed(() => editor.activeLanguageInfo);


/** Structural controls (reorder, add, remove, the map) belong to the default language; other tabs only translate. */
const structural = computed(() => activeLanguageInfo.value?.isDefault ?? true);
const defaultLanguageInfo = computed(() => languages.value.find((l) => l.isDefault) ?? null);

// Stops -----------------------------------------------------------------------------------------------

const openStopTexts = reactive<Record<string, boolean>>({});

/** The texts of one stop, in the order a translator meets them. */
const STOP_FIELDS: { key: StopTextKey; label: string; multiline: boolean; hint?: string; placeholder?: string }[] = [
  { key: "navigationInstructions", label: "Walking instructions to this stop", multiline: false, hint: "Shown to visitors who cannot use the map.", placeholder: "Turn left after the fountain…" },
  { key: "titleOverride", label: "Title at this stop", multiline: false, placeholder: "Leave empty to use the point of interest's title" },
  { key: "description", label: "Description", multiline: true },
  { key: "narrative", label: "Narrative", multiline: true, hint: "Narration starts with the stop title, so a visitor listening only knows where they are, and stays under three minutes." },
];
/** Collapsed stop card: the stop's own description; walking instructions, title and narrative are one click away. */
const PRIMARY_STOP_FIELDS = STOP_FIELDS.filter((f) => f.key === "description");

function stopTitle(stop: StopForm): string {
  const override = editor.activeLanguage ? stop.translations[editor.activeLanguage]?.titleOverride.trim() : "";
  if (override) return override;
  const poi = poiById.value.get(stop.poiId);
  return poi ? poiTitle(poi, defaultLanguage.value) : "Unavailable point of interest";
}

// The Route as visitors would open it, from the live form (`12` §3, DECISIONS.md D-014).
const preview = computed<PreviewModel | null>(() => {
  if (!editor.resource) return null;
  const { language, fallbackName, codes } = previewLanguages(languages.value, editor.activeLanguage, defaultLanguage.value);
  const facts = [
    { label: "", value: routeTypeLabel(form.type) },
    ...(form.estimatedDurationMinutes.trim() ? [{ label: "Duration", value: `${form.estimatedDurationMinutes.trim()} min` }] : []),
    ...(form.distanceMeters.trim() ? [{ label: "Distance", value: `${(Number(form.distanceMeters) / 1000).toFixed(1)} km` }] : []),
    ...(form.difficulty ? [{ label: "Difficulty", value: routeDifficultyLabel(form.difficulty) }] : []),
    ...(form.mode ? [{ label: "", value: routeModeLabel(form.mode) }] : []),
    ...(form.loop ? [{ label: "", value: "Loop" }] : []),
  ];
  const stopText = (stop: StopForm) => {
    const own = editor.activeLanguage ? stop.translations[editor.activeLanguage]?.description?.trim() : "";
    return own || undefined;
  };
  const blocks: PreviewBlock[] = [
    ...heroBlock(form.media, assets.value, codes),
    { type: "facts", items: facts },
    ...textBlocks(form.translations, [
      { key: "summary", label: "Summary" },
      { key: "description", label: "Description" },
      { key: "instructions", label: "Instructions", heading: "Before you start" },
    ], codes),
    { type: "list", heading: "Stops", items: form.stops.map((stop) => ({ title: stopTitle(stop), subtitle: stopText(stop) })) },
    ...mediaBlocks(form.media, assets.value, codes),
  ];
  return { kindLabel: "Route", language, fallbackName, title: textIn(form.translations, "title", codes), blocks };
});

function stopError(index: number): string | undefined {
  const prefix = `stops[${index}]`;
  const messages = Object.entries(editor.errors).filter(([p]) => p.startsWith(prefix)).map(([, m]) => m);
  return messages.length ? messages.join(" ") : undefined;
}

/**
 * Stop order (`12` §3 Route, `14` lines 179-181): drag and drop by the labelled handle (which also answers the Up and
 * Down arrow keys), with Move up / Move down and a position choice as the other keyboard ways. Every move is
 * announced. Stops are part of the form, so the order is saved with the Route.
 */
const stopAnnouncement = ref("");
const stopBase = (key: string) => `stop-${key}`;

/** Focuses the control that moved the row; at the end of the list that button is disabled, so its counterpart takes focus. */
function focusMoved(key: string, via: "up" | "down" | "handle" | "position") {
  const id = (suffix: string) => document.getElementById(`${stopBase(key)}-${suffix}`) as HTMLButtonElement | null;
  const same = via === "handle" ? id("handle") : via === "position" ? id("position") : id(via === "up" ? "move-up" : "move-down");
  const other = via === "up" ? id("move-down") : via === "down" ? id("move-up") : null;
  (same && !same.disabled ? same : other ?? same)?.focus();
}

function moveStopTo(index: number, target: number, via?: "up" | "down" | "handle" | "position") {
  if (target < 0 || target >= form.stops.length || target === index) return;
  const [stop] = form.stops.splice(index, 1);
  form.stops.splice(target, 0, stop);
  stopAnnouncement.value = `Moved ${stopTitle(stop)} to position ${target + 1} of ${form.stops.length}.`;
  if (via) void nextTick(() => focusMoved(stop.key, via));
}

const draggingStop = ref<string | null>(null);
const stopDropTarget = ref<{ key: string; after: boolean } | null>(null);

function stopDragStart(key: string, event: DragEvent) {
  draggingStop.value = key;
  event.dataTransfer?.setData("text/plain", key);
  if (event.dataTransfer) event.dataTransfer.effectAllowed = "move";
}

function stopDragOver(key: string, event: DragEvent) {
  if (!draggingStop.value || draggingStop.value === key) return;
  event.preventDefault();
  const box = (event.currentTarget as HTMLElement).getBoundingClientRect();
  stopDropTarget.value = { key, after: event.clientY > box.top + box.height / 2 };
}

function stopDrop() {
  const from = form.stops.findIndex((s) => s.key === draggingStop.value);
  const drop = stopDropTarget.value;
  stopDragEnd();
  if (from < 0 || !drop) return;
  let target = form.stops.findIndex((s) => s.key === drop.key) + (drop.after ? 1 : 0);
  if (from < target) target--;
  moveStopTo(from, target);
}

function stopDragEnd() {
  draggingStop.value = null;
  stopDropTarget.value = null;
}

/**
 * On an ACTIVE Route a stop's link is its position (`11` line 292): the order differs from the live one while the
 * working copy holds a reordering. After Apply (or Discard) the live Route is the form's own order again, so the
 * note goes away by itself.
 */
const stopLinksChange = computed(() => {
  const live = editor.live;
  if (editor.resource?.status !== "ACTIVE" || !live) return false;
  const liveIds = live.stops.flatMap((s) => (s.id ? [s.id] : []));
  // A stop added at the end or the last one removed moves no other stop's link.
  return form.stops.some((s, i) => s.id !== (liveIds[i] ?? null));
});

/** A stop whose point of interest is gone (`DANGLING_REFERENCE` on an ACTIVE Route): said on its own row. */
function stopPoiWarning(stop: StopForm): string | null {
  return poiById.value.get(stop.poiId) ? null : "The point of interest is no longer available. Remove the stop or bind another one.";
}

/** "1", "1 and 3", "1, 3 and 4": stop numbers for a sentence. */
function numberList(numbers: number[]): string {
  return numbers.length > 1 ? `${numbers.slice(0, -1).join(", ")} and ${numbers[numbers.length - 1]}` : String(numbers[0]);
}

/**
 * Stops whose point of interest visitors cannot see, said once for the list instead of on every row (C3-36): the row
 * shows the status chip, this sentence says what it means and which stops it concerns.
 */
const hiddenStopNotes = computed(() => {
  const draft: number[] = [];
  const archived: number[] = [];
  form.stops.forEach((s, i) => {
    const status = poiById.value.get(s.poiId)?.status;
    if (status === "DRAFT") draft.push(i + 1);
    else if (status === "ARCHIVED") archived.push(i + 1);
  });
  const notes: string[] = [];
  const subject = (n: number[]) => `${n.length === 1 ? "Stop" : "Stops"} ${numberList(n)}`;
  if (draft.length) notes.push(`${subject(draft)} ${draft.length === 1 ? "is a draft point of interest" : "are draft points of interest"}: visitors don't see ${draft.length === 1 ? "it" : "them"} until ${draft.length === 1 ? "it is" : "they are"} activated.`);
  if (archived.length) notes.push(`${subject(archived)} ${archived.length === 1 ? "is an archived point of interest" : "are archived points of interest"}: visitors don't see ${archived.length === 1 ? "it" : "them"}. Remove the stop or restore the point of interest.`);
  return notes;
});

/** Remove with Undo: the next row takes focus, the removal is announced, Undo puts the stop back. */
const stopUndo = useUndoRemove<StopForm>({
  list: () => form.stops,
  describe: (stop, index) => `Stop ${index + 1}, ${stopTitle(stop)}`,
  noun: "stop",
  // Focus goes to Undo, next to the list (C2-70, D-098): one Tab from the row it replaces, Ctrl+Z works from anywhere.
  focusAt(index, remaining) {
    const undo = document.querySelector<HTMLElement>("#stops [data-removed-bar] [data-undo]");
    if (undo) return undo.focus();
    const rows = document.querySelectorAll<HTMLElement>("[data-stop-row]");
    const row = rows[Math.min(index, remaining - 1)];
    (row?.querySelector<HTMLElement>("[data-focus-target]") ?? row ?? document.getElementById("add-stop"))?.focus();
  },
  focusRestored(stop) {
    const row = document.getElementById(`stop-row-${stop.key}`);
    (row?.querySelector<HTMLElement>("[data-focus-target]") ?? row)?.focus();
  },
});
// A reload or an Apply replaces the form, so the old positions mean nothing.
watch(() => editor.resource, () => stopUndo.clear());

const categoryChoices = computed(() => assignableCategories(categories.value, "ROUTE", defaultLanguage.value));
const categoryMissing = computed(() => !!form.categoryId && !categoryChoices.value.some((o) => o.id === form.categoryId));
const hasActiveStop = computed(() => form.stops.some((s) => poiById.value.get(s.poiId)?.status === "ACTIVE"));

/** Where a new geo-proximity area starts: the first stop's point of interest, when it has a position. */
const firstStopPosition = computed(() => {
  const poi = form.stops.length ? poiById.value.get(form.stops[0].poiId) : undefined;
  return poi && poi.latitude !== null && poi.longitude !== null
    ? { latitude: String(poi.latitude), longitude: String(poi.longitude) }
    : null;
});

/** Offset between pins that share a position, in degrees (about 25 m): enough to tell them apart at map zoom. */
const FAN_RADIUS = 0.00025;

/** Stops whose point of interest has no position yet: they are not drawn and are listed with a link to fix it. */
const unplacedStops = computed(() =>
  form.stops.flatMap((s, i) => {
    const poi = poiById.value.get(s.poiId);
    return poi && poi.latitude !== null && poi.longitude !== null ? [] : [{ number: i + 1, title: stopTitle(s), poiId: s.poiId }];
  }),
);

/** "Stops 1-3 and 5 have no position": consecutive numbers collapse into a range. */
const unplacedSentence = computed(() => {
  const numbers = unplacedStops.value.map((s) => s.number);
  const parts: string[] = [];
  for (let i = 0; i < numbers.length; ) {
    let j = i;
    while (j + 1 < numbers.length && numbers[j + 1] === numbers[j] + 1) j++;
    if (j > i + 1) parts.push(`${numbers[i]}-${numbers[j]}`);
    else parts.push(...numbers.slice(i, j + 1).map(String));
    i = j + 1;
  }
  const label = parts.length > 1 ? `${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}` : parts[0];
  return `${numbers.length === 1 ? "Stop" : "Stops"} ${label} ${numbers.length === 1 ? "has" : "have"} no position`;
});

/**
 * The pins to draw: placed stops only (the others are listed by the card). On the geographic map `RouteMap` spreads
 * pins that would touch at the current zoom (C3-35). The schematic drawing of an indoor Route has no zoom, so here
 * stops whose point of interest shares a position are fanned out on a small circle (C2-71).
 */
const mapStops = computed<RouteMapStop[]>(() => {
  const placed = form.stops.flatMap((s, i) => {
    const poi = poiById.value.get(s.poiId);
    return poi && poi.latitude !== null && poi.longitude !== null ? [{ number: i + 1, title: stopTitle(s), lat: poi.latitude, lng: poi.longitude }] : [];
  });
  const groups = new Map<string, typeof placed>();
  for (const p of placed) {
    const key = `${p.lat.toFixed(5)},${p.lng.toFixed(5)}`;
    groups.set(key, [...(groups.get(key) ?? []), p]);
  }
  return placed.map((p) => {
    const group = groups.get(`${p.lat.toFixed(5)},${p.lng.toFixed(5)}`)!;
    if (group.length < 2 || form.type !== "INDOOR") return p;
    const angle = (2 * Math.PI * group.indexOf(p)) / group.length - Math.PI / 2;
    // Longitude degrees are shorter away from the equator: keep the circle round on screen.
    return { ...p, lat: p.lat + FAN_RADIUS * Math.sin(angle), lng: p.lng + (FAN_RADIUS * Math.cos(angle)) / Math.max(0.2, Math.cos((p.lat * Math.PI) / 180)) };
  });
});
const fanned = computed(() => {
  if (form.type !== "INDOOR") return false;
  const seen = new Set<string>();
  return form.stops.some((s) => {
    const poi = poiById.value.get(s.poiId);
    if (!poi || poi.latitude === null || poi.longitude === null) return false;
    const key = `${poi.latitude.toFixed(5)},${poi.longitude.toFixed(5)}`;
    if (seen.has(key)) return true;
    seen.add(key);
    return false;
  });
});
/** The stop list as text, behind "Show as list": the map's alternative, with each stop's position or the missing one. */
const showStopList = ref(false);
function stopPosition(stop: StopForm): string | null {
  const poi = poiById.value.get(stop.poiId);
  return poi && poi.latitude !== null && poi.longitude !== null ? `${poi.latitude.toFixed(5)}, ${poi.longitude.toFixed(5)}` : null;
}

/**
 * The Map the Route is drawn on: of the Places that hold its stops, or hold those Places, the one with a geographic
 * Map that covers the most stops; on a tie, the closest Place to the stops. ACTIVE Maps go before DRAFT ones.
 */
const placeMap = computed<RoutePlaceMap | null>(() => {
  const placeById = new Map(places.value.map((p) => [p.id, p]));
  const mapOfPlace = new Map<string, GeoMap>();
  for (const m of geoMaps.value) {
    if (!m.placeId || m.status === "ARCHIVED") continue;
    const current = mapOfPlace.get(m.placeId);
    if (!current || (current.status !== "ACTIVE" && m.status === "ACTIVE")) mapOfPlace.set(m.placeId, m);
  }
  const score = new Map<string, { stops: number; depth: number }>();
  for (const stop of form.stops) {
    let placeId = poiById.value.get(stop.poiId)?.placeId ?? null;
    const seen = new Set<string>();
    for (let depth = 0; placeId && !seen.has(placeId); depth++) {
      seen.add(placeId);
      if (mapOfPlace.has(placeId)) {
        const s = score.get(placeId) ?? { stops: 0, depth: 0 };
        score.set(placeId, { stops: s.stops + 1, depth: s.depth + depth });
      }
      placeId = placeById.get(placeId)?.parentPlaceId ?? null;
    }
  }
  const best = [...score.entries()].sort(([, a], [, b]) => b.stops - a.stops || a.depth / a.stops - b.depth / b.stops)[0];
  if (!best) return null;
  const m = mapOfPlace.get(best[0])!;
  const place = placeById.get(best[0]);
  const hasBounds = m.minLatitude !== null && m.minLongitude !== null && m.maxLatitude !== null && m.maxLongitude !== null;
  return {
    id: m.id,
    name: m.internalName,
    placeTitle: place ? placeTitle(place, defaultLanguage.value, defaultLanguage.value) : null,
    bounds: hasBounds
      ? [
          [m.minLatitude!, m.minLongitude!],
          [m.maxLatitude!, m.maxLongitude!],
        ]
      : null,
    view: { lat: m.initialLatitude, lng: m.initialLongitude, zoom: m.initialZoom },
  };
});

// The stop picker: several picks per visit, filters by status and Place, codes labelled.
const picking = ref(false);
const placeNameById = computed(() => new Map(places.value.map((p) => [p.id, placeTitle(p, defaultLanguage.value, defaultLanguage.value)])));
const pickerCandidates = computed<Record<"POI", Pickable[]>>(() => ({
  POI: pois.value
    .filter((p) => p.status !== "ARCHIVED")
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((p) => ({
      id: p.id,
      title: poiTitle(p, defaultLanguage.value),
      status: p.status,
      code: p.code,
      placeId: p.placeId,
      placeName: p.placeId ? (placeNameById.value.get(p.placeId) ?? null) : null,
    })),
}));
const usedPoiIds = computed(() => new Set(form.stops.map((s) => s.poiId)));

function addStop(_kind: "POI", item: Pickable) {
  const stop: StopForm = {
    key: `new-${++keyCounter}`,
    id: null,
    poiId: item.id,
    translations: Object.fromEntries(languageCodes().map((code) => [code, blankTexts(STOP_TEXT_KEYS)])),
  };
  form.stops.push(stop);
  // No message here: the picker (open while stops are added) announces each pick once.
}

// The Translations panel counts the fields the content list counts for its completion dots.
const translationRows = computed(() => translationStatus(languages.value, ROUTE_TEXT_FIELDS.length, (code) => filledFields(form.translations[code], ROUTE_TEXT_FIELDS)));

/** The live form's completeness (D-090): the route's texts plus every stop text, typed or saved. */
const completeness = computed(() =>
  completenessOf({
    languages: languages.value,
    base: translationRows.value.map((r) => ({ languageCode: r.language.languageCode, filled: r.filled, total: r.total })),
    slots: routeStopSlots(form.stops),
    gaps: routeGaps(form.stops.length),
    blocking:
      form.stops.length && !hasActiveStop.value
        ? [{ key: "active-stop", text: "No stop is an active point of interest yet", path: "stops" }]
        : [],
  }),
);

/** The rail's entries that no `EditorSection` registers: the Texts card is the translations panel itself. */
const railSections = [{ id: "texts", label: "Texts" }];

const detailsCount = computed(() => `${[form.slug, form.internalName, form.featured ? "x" : ""].filter(Boolean).length} of 3 set`);
</script>

<template>
  <EditorShell
    tabbed
    :editor="editor"
    back-label="Routes"
    :back-to="{ name: 'routes', params: { projectId } }"
    :title="heading"
    :subtitle="subtitle"
    activation-hint="Activate it once it has a default-language title and an active stop."
    :reference-link="toReference"
    :pending="languagesLoading"
    :translations="translationRows"
    :completeness="completeness"
    :preview="preview"
    :sections="railSections"
  >
    <div id="texts" class="scroll-mt-4">
      <TranslationsPanel
        v-model:active-language="editor.activeLanguage"
        :project-id="projectId"
        :languages="languages"
        :texts="form.translations"
        :groups="GROUPS"
        :meta="TEXT_META"
        :readonly="!editor.editable"
        :error-languages="editor.languagesWithErrors"
        :field-error="editor.fieldError"
        title-required-hint="Required in the default language before the route can be activated."
      />
    </div>

    <EditorSection
      id="stops"
      :title="structural ? 'Stops' : `Stop texts in ${activeLanguageInfo?.displayName ?? ''}`"
      :count="`${form.stops.length}`"
      :description="structural ? undefined : 'Only the texts are translated here. Switch to the default language to add, remove or reorder stops.'"
      data-path="stops"
      tabindex="-1"
    >
      <!-- Map: the drawing of the stops, pinned above the list on wide, tall screens. -->
      <div v-if="structural" class="route-map-pin z-raised">
        <RouteMap v-if="mapStops.length || !form.stops.length" :stops="mapStops" :loop="form.loop" :place-map="placeMap" :indoor="form.type === 'INDOOR'" :project-id="projectId" />
        <div v-else class="flex min-h-32 flex-col justify-center gap-2 rounded-lg border border-dashed border-input bg-muted/50 px-5 py-4 text-sm">
          <p class="flex items-center gap-2 font-semibold"><MapPinOff class="size-4 shrink-0 text-warning" aria-hidden="true" />The map cannot draw this route yet</p>
          <p class="text-muted-foreground">None of the {{ form.stops.length }} stops has a position. Set it on each point of interest.</p>
        </div>
        <p v-if="unplacedStops.length && mapStops.length" class="mt-1 flex items-start gap-1.5 text-xs font-medium text-warning">
          <TriangleAlert class="mt-px size-4 shrink-0" aria-hidden="true" />{{ unplacedSentence }}, so {{ unplacedStops.length === 1 ? "it is" : "they are" }} not on the map. Set it on the point of interest:
        </p>
        <ul v-if="unplacedStops.length" class="mt-1 flex flex-wrap gap-x-4 text-sm">
          <li v-for="u in unplacedStops" :key="u.number">
            <RouterLink :to="{ name: 'poi-editor', params: { projectId, poiId: u.poiId } }" class="inline-flex min-h-control items-center font-semibold">{{ u.number }}. {{ u.title }}</RouterLink>
          </li>
        </ul>
        <p v-if="fanned" class="mt-1 text-xs text-muted-foreground">Stops at the same position are spread out slightly so each number can be read.</p>
        <Button v-if="form.stops.length" variant="link" class="mt-1" :aria-expanded="showStopList" aria-controls="route-stop-list" @click="showStopList = !showStopList">
          <List aria-hidden="true" />{{ showStopList ? "Hide the list" : "Show as list" }}
        </Button>
        <ol v-if="showStopList" id="route-stop-list" class="mt-1 flex flex-col gap-1 rounded-md border border-border bg-card p-3 text-sm">
          <li v-for="(stop, i) in form.stops" :key="stop.key" class="flex flex-wrap gap-x-2">
            <span class="font-semibold">{{ i + 1 }}. {{ stopTitle(stop) }}</span>
            <span v-if="stopPosition(stop)" class="mono text-muted-foreground">{{ stopPosition(stop) }}</span>
            <span v-else class="text-warning">No position</span>
          </li>
        </ol>
      </div>
      <template v-if="structural">
        <Alert v-if="form.stops.length && !hasActiveStop" tone="danger" title="No active stop">
          At least one stop must be an active point of interest before the route can be activated.
        </Alert>
        <Alert v-else-if="form.stops.length === 1" tone="warning">A route usually has at least two stops. It can still be activated with one.</Alert>
        <Alert v-if="stopLinksChange" tone="warning" title="Stops are in a different order than visitors see">
          A stop's link follows its position, so after you apply, links and QR codes that point to a stop number lead to another stop.
        </Alert>
      </template>
      <p class="sr-only" aria-live="polite">{{ stopAnnouncement }}</p>
      <Alert v-if="editor.fieldError('stops')" tone="danger">{{ editor.fieldError("stops") }}</Alert>
      <p v-for="note in hiddenStopNotes" :key="note" class="flex items-start gap-1.5 text-xs font-medium text-warning" data-hidden-stops>
        <TriangleAlert class="mt-px size-4 shrink-0" aria-hidden="true" />{{ note }}
      </p>
      <ol v-if="form.stops.length" class="flex flex-col gap-3">
        <li
          v-for="(stop, index) in form.stops"
          :id="`stop-row-${stop.key}`"
          :key="stop.key"
          data-stop-row
          tabindex="-1"
          class="rounded-md border border-border bg-card p-3"
          :class="{
            'opacity-50': draggingStop === stop.key,
            'shadow-drop-before': stopDropTarget?.key === stop.key && !stopDropTarget.after,
            'shadow-drop-after': stopDropTarget?.key === stop.key && stopDropTarget.after,
          }"
          @dragover="stopDragOver(stop.key, $event)"
          @dragleave="stopDropTarget?.key === stop.key && (stopDropTarget = null)"
          @drop.prevent="stopDrop"
        >
          <div class="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span class="flex size-7 flex-none items-center justify-center rounded-full bg-primary text-xs font-bold tabular text-primary-foreground" aria-hidden="true">{{ index + 1 }}</span>
            <RouterLink
              :to="{ name: 'poi-editor', params: { projectId, poiId: stop.poiId } }"
              data-focus-target
              class="min-w-0 flex-1 basis-40 break-words font-semibold"
            >
              <span class="sr-only">Stop {{ index + 1 }}: </span>{{ stopTitle(stop) }}
            </RouterLink>
            <StatusChip v-if="poiById.get(stop.poiId) && poiById.get(stop.poiId)!.status !== 'ACTIVE'" :status="poiById.get(stop.poiId)!.status" />
            <ReorderControls
              v-if="editor.editable && structural"
              :id-base="stopBase(stop.key)"
              :index="index"
              :count="form.stops.length"
              :name="`stop ${index + 1}, ${stopTitle(stop)}`"
              @move="(delta, via) => moveStopTo(index, index + delta, via)"
              @position="(n) => moveStopTo(index, n - 1, 'position')"
              @remove="stopUndo.remove(index)"
              @dragstart="stopDragStart(stop.key, $event)"
              @dragend="stopDragEnd"
            />
          </div>
          <p v-if="stopPoiWarning(stop)" class="mt-2 flex items-start gap-1.5 text-xs font-medium text-warning">
            <TriangleAlert class="mt-px size-4 shrink-0" aria-hidden="true" />{{ stopPoiWarning(stop) }}
          </p>
          <div v-if="activeLanguageInfo && stop.translations[activeLanguageInfo.languageCode]" class="mt-3 flex flex-col gap-3">
            <SourcePairField
              v-for="field in structural && !openStopTexts[stop.key] ? PRIMARY_STOP_FIELDS : STOP_FIELDS"
              :key="field.key"
              v-model="stop.translations[activeLanguageInfo.languageCode][field.key]"
              :id="`stop-${field.key}-${stop.key}`"
              :label="field.label"
              :multiline="field.multiline"
              :hint="field.hint"
              :placeholder="field.placeholder"
              :readonly="!editor.editable"
              :language="activeLanguageInfo"
              :source-language="defaultLanguageInfo"
              :source-text="defaultLanguage ? (stop.translations[defaultLanguage]?.[field.key] ?? '') : ''"
            />
            <div v-if="structural">
              <Button variant="link" :aria-expanded="!!openStopTexts[stop.key]" @click="openStopTexts[stop.key] = !openStopTexts[stop.key]">
                {{ openStopTexts[stop.key] ? "Hide the other stop texts" : "More stop texts: walking instructions, title, narrative" }}
              </Button>
            </div>
          </div>
          <p v-if="stopError(index)" class="mt-2 flex items-start gap-1.5 text-xs font-medium text-destructive">
            <TriangleAlert class="mt-px size-4 shrink-0" aria-hidden="true" />{{ stopError(index) }}
          </p>
        </li>
      </ol>
      <p v-else class="text-sm text-muted-foreground">No stops yet. Add the points of interest in the order visitors meet them.</p>
      <RemovedBar v-if="stopUndo.last.value" :label="stopUndo.last.value.label" noun="stop" :count="stopUndo.removed.value.length" @undo="stopUndo.undo()" @dismiss="stopUndo.clear()" />
      <div v-if="structural">
        <Button id="add-stop" variant="secondary" :disabled-reason="editor.editable ? undefined : 'This route cannot be edited'" @click="picking = true">
          <Plus aria-hidden="true" />Add stops
        </Button>
      </div>
    </EditorSection>

    <EditorSection v-if="structural" id="route-settings" title="Route settings">
      <div class="flex flex-col gap-1.5" role="group" aria-labelledby="route-type-label">
        <span id="route-type-label" class="text-sm font-semibold text-ink-2">Setting</span>
        <div class="flex flex-wrap gap-2">
          <Button
            v-for="t in ROUTE_TYPES"
            :key="t"
            :variant="form.type === t ? 'primary' : 'secondary'"
            :aria-pressed="form.type === t"
            :disabled="!editor.editable"
            @click="form.type = t"
          >
            {{ routeTypeLabel(t) }}
          </Button>
        </div>
        <span class="text-xs text-muted-foreground">{{ ROUTE_TYPE_HINTS[form.type] }}.</span>
      </div>
      <div class="flex flex-col gap-1.5" role="group" aria-labelledby="route-mode-label">
        <span id="route-mode-label" class="text-sm font-semibold text-ink-2">Mode</span>
        <div class="flex flex-wrap gap-2">
          <Button
            v-for="m in ROUTE_MODES"
            :key="m"
            :variant="form.mode === m ? 'primary' : 'secondary'"
            :aria-pressed="form.mode === m"
            :disabled="!editor.editable"
            @click="form.mode = form.mode === m ? null : m"
          >
            {{ routeModeLabel(m) }}
          </Button>
        </div>
        <span class="text-xs text-muted-foreground">Choose the selected mode again to leave it unset.</span>
      </div>
      <div class="flex flex-col gap-1.5" role="group" aria-labelledby="route-difficulty-label">
        <span id="route-difficulty-label" class="text-sm font-semibold text-ink-2">Difficulty</span>
        <div class="flex flex-wrap gap-2">
          <Button
            v-for="d in ROUTE_DIFFICULTIES"
            :key="d"
            :variant="form.difficulty === d ? 'primary' : 'secondary'"
            :aria-pressed="form.difficulty === d"
            :disabled="!editor.editable"
            @click="form.difficulty = form.difficulty === d ? null : d"
          >
            {{ routeDifficultyLabel(d) }}
          </Button>
        </div>
        <span class="text-xs text-muted-foreground">Choose the selected difficulty again to leave it unset.</span>
      </div>
      <div class="grid gap-4 sm:grid-cols-2">
        <FormField id="f-estimatedDurationMinutes" label="Route total (minutes)" hint="A whole number of minutes." :error="editor.fieldError('estimatedDurationMinutes')" v-slot="f">
          <Input :id="f.id" v-model="form.estimatedDurationMinutes" :readonly="!editor.editable" inputmode="numeric" :aria-describedby="f.describedBy" :invalid="f.invalid" />
        </FormField>
        <FormField id="f-distanceMeters" label="Distance (metres)" hint="A whole number of metres, for example 2400." :error="editor.fieldError('distanceMeters')" v-slot="f">
          <Input :id="f.id" v-model="form.distanceMeters" :readonly="!editor.editable" inputmode="numeric" :aria-describedby="f.describedBy" :invalid="f.invalid" />
        </FormField>
      </div>
      <FormField id="f-categoryId" label="Category" :error="editor.fieldError('categoryId')" v-slot="f">
        <Select :id="f.id" v-model="form.categoryId" :disabled="!editor.editable" :aria-describedby="f.describedBy" :invalid="f.invalid">
          <option value="">Uncategorised</option>
          <option v-if="categoryMissing" :value="form.categoryId">(archived or unavailable category)</option>
          <option v-for="o in categoryChoices" :key="o.id" :value="o.id">{{ o.label }}</option>
        </Select>
      </FormField>
      <Checkbox v-model="form.loop" :disabled="!editor.editable">Loop: the route ends where it started</Checkbox>
    </EditorSection>

    <div v-if="structural" id="media" class="scroll-mt-4">
      <MediaSlots
        :project-id="projectId"
        :slots="MEDIA_SLOTS"
        :media="form.media"
        :assets="assets"
        :languages="languages"
        :default-language="defaultLanguage"
        :readonly="!editor.editable"
        :field-error="editor.fieldError"
        @uploaded="assets.unshift($event)"
      />
    </div>

    <TriggersCard v-if="structural"
        :triggers="form.triggers"
        :readonly="!editor.editable"
        :field-error="editor.fieldError"
        :position="firstStopPosition"
        position-label="Use the first stop's position"
      />

    <EditorSection v-if="structural" id="details" title="Details" :count="detailsCount" collapsible :default-open="false">
      <FormField id="f-slug" label="Slug" hint="Part of the item's web address and QR targets. Changing it breaks printed QR codes." :error="editor.fieldError('slug')" v-slot="f">
        <Input :id="f.id" v-model="form.slug" :readonly="!editor.editable" spellcheck="false" class="mono" :aria-describedby="f.describedBy" :invalid="f.invalid" />
      </FormField>
      <FormField id="f-internalName" label="Internal name" hint="For authors only; visitors never see it." v-slot="f">
        <Input :id="f.id" v-model="form.internalName" :readonly="!editor.editable" :aria-describedby="f.describedBy" />
      </FormField>
      <Checkbox v-model="form.featured" :disabled="!editor.editable">Featured: highlighted in the visitor app's lists</Checkbox>
    </EditorSection>
  </EditorShell>

  <ResourcePickerDialog
    v-if="picking"
    title="Add stops"
    :kinds="[{ type: 'POI', plural: 'Points of interest' }]"
    :candidates="pickerCandidates"
    multiple
    :used-ids="usedPoiIds"
    used-label="Already a stop"
    note="Stops are ordered as you add them. At least one stop must be an active point of interest before the route can be activated. Draft points of interest can be added, but visitors do not see them until they are active."
    @pick="addStop"
    @close="picking = false"
  />
</template>

<style scoped>
/* The map stays in view above the stop list on wide, tall screens, so a stop is placed while the pins are seen. */
@media (min-width: 1180px) and (min-height: 1000px) {
  .route-map-pin {
    position: sticky;
    top: calc(var(--editor-sticky-h, 6rem) + 0.5rem);
    background: hsl(var(--card));
  }
}
</style>
