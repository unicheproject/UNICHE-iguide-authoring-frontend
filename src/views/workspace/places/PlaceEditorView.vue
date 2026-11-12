<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import EditorShell from "@/components/editor/EditorShell.vue";
import TranslationsPanel, { type TextFieldGroup, type TextFieldMeta } from "@/components/editor/TranslationsPanel.vue";
import TriggersCard from "@/components/editor/TriggersCard.vue";
import MediaSlots, { type MediaSlot } from "@/components/media/MediaSlots.vue";
import { listTargetTriggers, saveWithTriggers, triggerToForm, type Trigger, type TriggerForm } from "@/platform/triggers";
import { SLUG_PATTERN } from "@/lib/format";
import {
  changePlaceStatus,
  fetchPlaceReferences,
  fetchPlace,
  listPlaces,
  PLACE_TEXT_FIELDS,
  PLACE_TYPES_BY_SETTING,
  placeFromResponse,
  placeTitle,
  placeWorkingCopyPayload,
  updatePlace,
  type Place,
  type PlaceTranslation,
  type UpdatePlaceInput,
  type PlaceSetting,
  type PlaceType,
} from "@/platform/places";
import { useCurrentProject } from "@/workspace/currentProject";
import {
  describeTranslationPath,
  ensureTextRows,
  numberText,
  optionalText,
  textsForApi,
  textsFrom,
  type Texts,
} from "@/workspace/formFields";
import type { ResourceReference } from "@/platform/references";
import { referenceLink } from "@/workspace/referenceLinks";
import { heroBlock, mediaBlocks, previewLanguages, textBlocks, textIn, type PreviewBlock, type PreviewModel } from "@/workspace/preview";
import { filledFields, translationStatus } from "@/workspace/translationStatus";
import { useProjectLanguages } from "@/workspace/useProjectLanguages";
import { useResourceEditor } from "@/workspace/useResourceEditor";
import { placeTypeLabel, settingForType } from "./placeTree";
import NewFloorPlanDialog from "../maps/NewFloorPlanDialog.vue";
import NewMapDialog from "../maps/NewMapDialog.vue";
import GeoMapCanvas, { type Bounds, type CanvasMarker } from "@/components/map/GeoMapCanvas.vue";
import { listAssets, type Asset, type MediaBinding } from "@/platform/assets";
import { listFloorPlans, type FloorPlan } from "@/platform/floorPlans";
import { listMaps, mapFromResponse, mapWorkingCopyPayload, updateMap, type GeoMap, type UpdateMapInput } from "@/platform/maps";
import { applyWorkingCopy, fetchWorkingCopy, saveWorkingCopy, type WorkingCopyResponse } from "@/platform/workingCopies";
import { fetchSpatialLink, setSpatialLink, type SpatialLink } from "@/platform/places";
import { showToast } from "@/stores/toast";
import { ApiError } from "@/platform/api";

const props = defineProps<{ placeId: string }>();
const project = useCurrentProject();
const projectId = computed(() => project.value.id);
const { languages, defaultLanguage, loading: languagesLoading } = useProjectLanguages(projectId);
const languageCodes = () => languages.value.map((l) => l.languageCode);

type TextKey = keyof PlaceTranslation;

const TEXT_META: Record<TextKey, TextFieldMeta> = {
  title: { label: "Title", multiline: false },
  summary: { label: "Summary", multiline: true, helper: "One or two sentences shown in lists and cards." },
  description: { label: "Description", multiline: true },
  visitorInformation: { label: "Visitor information", multiline: true, helper: "Opening hours, tickets, how to get there." },
  accessibilityInformation: { label: "Accessibility information", multiline: true, helper: "Step-free access, surfaces, seating, assistance." },
};
const GROUPS: TextFieldGroup[] = [{ id: "main", label: null, keys: [...PLACE_TEXT_FIELDS] }];
const FIELD_NAMES: Record<string, string> = {
  slug: "Slug",
  type: "Type",
  // The setting follows the type (DECISIONS.md D-057); the backend names it `environment` (`03` §5).
  setting: "Type",
  environment: "Type",
  parentPlaceId: "Parent place",
  internalName: "Internal name",
};

// A Place's media (owner request 2026-11-04, backend D-041): a primary image for its page and cards, and a gallery.
const MEDIA_SLOTS: MediaSlot[] = [
  { usage: "HERO_IMAGE", label: "Primary image", accept: ["IMAGE"], recommended: true },
  { usage: "GALLERY_IMAGE", label: "Gallery", accept: ["IMAGE"], multiple: true },
];

// Other Places, for the "Inside" choice.
const allPlaces = ref<Place[]>([]);
// The media library: the media slots' names and previews, and the new floor plan's image choice.
const libraryAssets = ref<Asset[]>([]);

const form = reactive({
  slug: "",
  type: "SITE" as PlaceType,
  parentPlaceId: "",
  internalName: "",
  featured: false,
  translations: {} as Record<string, Texts<TextKey>>,
  triggers: [] as TriggerForm[],
  media: [] as MediaBinding[],
});
// Whether "Place setup" shows the parent choice: a sub-place, or about to become one.
const subPlace = ref(false);
// The triggers as last loaded or saved; the form is reset from them with the Place.
const savedTriggers = ref<Trigger[]>([]);

/** The editable state from the form, for a DRAFT save and a working copy alike. */
function input(place: Place): Omit<UpdatePlaceInput, "version"> {
  return {
    slug: form.slug,
    type: form.type,
    setting: chosenSetting.value,
    parentPlaceId: form.parentPlaceId || null,
    internalName: optionalText(form.internalName),
    // Places are located through their map, not by coordinates of their own; stored values pass through.
    latitude: place.latitude,
    longitude: place.longitude,
    featured: form.featured,
    translations: textsForApi(PLACE_TEXT_FIELDS, languageCodes(), form.translations),
    media: form.media.map((m) => ({ ...m })),
  };
}

const editor = useResourceEditor<Place>({
  kind: "place",
  source: () => props.placeId,
  languages,
  defaultLanguage,
  async load() {
    const [place, places, triggers, library] = await Promise.all([
      fetchPlace(projectId.value, props.placeId),
      listPlaces(projectId.value),
      listTargetTriggers(projectId.value, "PLACE", props.placeId),
      listAssets(projectId.value),
    ]);
    allPlaces.value = places;
    libraryAssets.value = library;
    savedTriggers.value = triggers;
    return place;
  },
  async save(place, version) {
    // Triggers are rows of their own and do not move the Place's version: saved first, put back when it is refused.
    const { saved, triggers } = await saveWithTriggers(projectId.value, "PLACE", place.id, form.triggers, () =>
      updatePlace(projectId.value, place.id, { version, ...input(place) }),
    );
    savedTriggers.value = triggers;
    allPlaces.value = allPlaces.value.map((p) => (p.id === saved.id ? saved : p));
    return saved;
  },
  workingCopy: {
    kind: "places",
    projectId: () => projectId.value,
    payload: (place) => placeWorkingCopyPayload(input(place)),
    // Triggers are not in the working copy (backend D-026): "Save draft" saves them live around it.
    async around(place, save) {
      const { saved, triggers } = await saveWithTriggers(projectId.value, "PLACE", place.id, form.triggers, save);
      savedTriggers.value = triggers;
      return saved;
    },
    fromResponse: placeFromResponse,
  },
  changeStatus: (place, target, version) => changePlaceStatus(projectId.value, place.id, target, version),
  loadReferences: (place) => fetchPlaceReferences(projectId.value, place.id),
  resetForm(place) {
    form.slug = place.slug;
    form.type = place.type;
    form.parentPlaceId = place.parentPlaceId ?? "";
    subPlace.value = !!place.parentPlaceId;
    form.internalName = place.internalName ?? "";
    form.featured = place.featured;
    form.translations = Object.fromEntries(
      Object.entries(place.translations).map(([code, t]) => [code, textsFrom(PLACE_TEXT_FIELDS, t)]),
    );
    form.triggers = savedTriggers.value.map(triggerToForm);
    form.media = place.media.map((m) => ({ ...m }));
  },
  ensureLanguageRows: () => ensureTextRows(PLACE_TEXT_FIELDS, languageCodes(), form.translations),
  formState: () => form,
  validate() {
    const found: Record<string, string> = {};
    if (!SLUG_PATTERN.test(form.slug)) found.slug = "Use lowercase Latin letters, digits, and single hyphens.";
    if (subPlace.value && !form.parentPlaceId) found.parentPlaceId = "Choose the parent place, or make it a top-level place.";
    return found;
  },
  describePath: (path) =>
    /^media\[/.test(path) ? "Media" : /^triggers\[/.test(path) ? "How visitors reach it" : describeTranslationPath(path, languages.value, TEXT_META) ?? FIELD_NAMES[path] ?? path,
});

const heading = computed(() => (editor.resource ? placeTitle(editor.resource, null, defaultLanguage.value) : "Place"));
/*
 * "Place setup" (`12` §3 Place, DECISIONS.md D-030, D-057): the level of the creation dialog, editable, then the map
 * or floor plan link. The setting is not shown: it follows the type (`settingForType`). It cannot change while a
 * map or floor plan is linked (the backend refuses it, `environment` LINKED), so the type offers only the types of
 * the saved setting then; the link step follows the saved setting, since linking applies at once.
 */
const parentTitle = computed(() => {
  const parentId = editor.resource?.parentPlaceId;
  const parent = parentId ? allPlaces.value.find((p) => p.id === parentId) : undefined;
  return parentId ? (parent ? placeTitle(parent, null, defaultLanguage.value) : "another place") : null;
});
const subtitle = computed(() => {
  const place = editor.resource;
  if (!place) return "";
  const level = parentTitle.value ? `inside ${parentTitle.value}` : "top-level place";
  return `${placeTypeLabel(place.type)} · ${level} · ${place.slug}`;
});
// A trigger that opens this place links to its own "How visitors reach it" card.
const toReference = (r: ResourceReference) => referenceLink(projectId.value, r, { resourceType: "PLACE", resourceId: props.placeId });

/** The parent choices: Places that are not archived, not this one, and not inside it (no cycles, `03` §5). */
const parentChoices = computed(() => {
  const inside = new Set<string>([props.placeId]);
  for (let grew = true; grew; ) {
    grew = false;
    for (const p of allPlaces.value) {
      if (p.parentPlaceId && inside.has(p.parentPlaceId) && !inside.has(p.id)) {
        inside.add(p.id);
        grew = true;
      }
    }
  }
  return allPlaces.value
    .filter((p) => !inside.has(p.id) && (p.status !== "ARCHIVED" || p.id === form.parentPlaceId))
    .map((p) => ({ id: p.id, label: placeTitle(p, null, defaultLanguage.value) }));
});
function chooseLevel(sub: boolean) {
  subPlace.value = sub;
  form.parentPlaceId = sub ? form.parentPlaceId || parentChoices.value[0]?.id || "" : "";
}
/** The setting the Place has now; the link step works on it until a changed setting is saved. */
const savedSetting = computed<PlaceSetting>(() => editor.resource?.setting ?? "OUTDOOR");
/** The setting the form's type gives; an unchanged type keeps the saved setting, whatever it is. */
const chosenSetting = computed<PlaceSetting>(() => {
  const place = editor.resource;
  if (!place) return "OUTDOOR";
  return form.type === place.type ? place.setting : settingForType(form.type, place.setting);
});
const settingChanged = computed(() => !!editor.resource && chosenSetting.value !== editor.resource.setting);
const settingLocked = computed(() => !!(link.value.mapId || link.value.floorPlanId));
const settingError = computed(() => editor.fieldError("setting") ?? editor.fieldError("environment"));
/** Every type, outdoor ones first; while a map or floor plan is linked, only the types that keep its setting. */
const typeChoices = computed(() => {
  const fitting = settingLocked.value
    ? PLACE_TYPES_BY_SETTING[savedSetting.value]
    : [...PLACE_TYPES_BY_SETTING.OUTDOOR.filter((t) => t !== "OTHER"), ...PLACE_TYPES_BY_SETTING.INDOOR];
  return fitting.includes(form.type) ? fitting : [form.type, ...fitting];
});
// The map or floor plan the Place's page shows; linking applies at once (mockup place setup).
const maps = ref<GeoMap[]>([]);
const floorPlans = ref<FloorPlan[]>([]);
const link = ref<SpatialLink>({ mapId: null, floorPlanId: null });
const linking = ref(false);
const creatingLink = ref(false);

async function loadSpatial() {
  try {
    [maps.value, floorPlans.value, link.value] = await Promise.all([
      listMaps(projectId.value),
      listFloorPlans(projectId.value),
      fetchSpatialLink(projectId.value, props.placeId),
    ]);
  } catch (e) {
    if (!(e instanceof ApiError)) throw e;
  }
}
watch(() => props.placeId, loadSpatial, { immediate: true });

const linkedId = computed(() => (savedSetting.value === "INDOOR" ? link.value.floorPlanId : link.value.mapId) ?? "");

// The linked map is shown on this page, below its choice, as visitors see it.
const linkedMap = computed(() =>
  editor.resource && savedSetting.value === "OUTDOOR" && link.value.mapId
    ? (maps.value.find((m) => m.id === link.value.mapId) ?? null)
    : null,
);
// An ACTIVE map with pending changes is shown as they would read after apply, so a crop saved here shows here.
const pendingMap = ref<{ copy: WorkingCopyResponse; map: GeoMap } | null>(null);
const shownMap = computed(() => (pendingMap.value && pendingMap.value.map.id === linkedMap.value?.id ? pendingMap.value.map : linkedMap.value));
const linkedMapView = computed(() =>
  shownMap.value
    ? { lat: shownMap.value.initialLatitude, lng: shownMap.value.initialLongitude, zoom: shownMap.value.initialZoom }
    : { lat: 0, lng: 0, zoom: 2 },
);
const linkedMapBounds = computed<Bounds | null>(() => {
  const m = shownMap.value;
  if (!m || m.minLatitude === null || m.minLongitude === null || m.maxLatitude === null || m.maxLongitude === null) return null;
  return [
    [m.minLatitude, m.minLongitude],
    [m.maxLatitude, m.maxLongitude],
  ];
});
const linkedMapMarkers = computed<CanvasMarker[]>(() =>
  (shownMap.value?.placements ?? []).map((p, i) => {
    const place = p.resourceType === "PLACE" ? allPlaces.value.find((x) => x.id === p.resourceId) : undefined;
    return {
      key: `${p.resourceType}:${p.resourceId}`,
      lat: p.latitude,
      lng: p.longitude,
      label: String(i + 1),
      title: place ? placeTitle(place, null, defaultLanguage.value) : p.resourceType === "POI" ? "Point of Interest" : "Place",
    };
  }),
);
const linkOptions = computed(() => {
  const list = savedSetting.value === "INDOOR" ? floorPlans.value : maps.value;
  return list
    .filter((x) => x.status !== "ARCHIVED")
    .map((x) => {
      const other = x.placeId && x.placeId !== props.placeId ? allPlaces.value.find((p) => p.id === x.placeId) : undefined;
      return { id: x.id, label: x.internalName + (other ? ` · linked to ${placeTitle(other, null, defaultLanguage.value)}` : "") };
    });
});
const linkNote = computed(() => {
  const current = (savedSetting.value === "INDOOR" ? floorPlans.value : maps.value).find((x) => x.id === linkedId.value);
  if (current) return `Visitors open this place on “${current.internalName}”.`;
  return savedSetting.value === "INDOOR"
    ? "Link an existing floor plan, or add a new one, to position indoor Points of Interest."
    : "Link an existing map, or create one by searching for the area.";
});

// The Place as visitors would open it, from the live form (`12` §3 Resource editors, DECISIONS.md D-014).
const preview = computed<PreviewModel | null>(() => {
  if (!editor.resource) return null;
  const { language, fallbackName, codes } = previewLanguages(languages.value, editor.activeLanguage, defaultLanguage.value);
  const blocks: PreviewBlock[] = [
    ...heroBlock(form.media, libraryAssets.value, codes),
    { type: "facts", items: [{ label: "", value: placeTypeLabel(form.type) }, ...(parentTitle.value ? [{ label: "In", value: parentTitle.value }] : [])] },
    ...textBlocks(form.translations, [
      { key: "summary", label: "Summary" },
      { key: "description", label: "Description" },
      { key: "visitorInformation", label: "Visitor information", heading: "Visit" },
      { key: "accessibilityInformation", label: "Accessibility information", heading: "Accessibility" },
    ], codes),
    ...mediaBlocks(form.media, libraryAssets.value, codes),
  ];
  if (linkedMap.value) blocks.push({ type: "map", view: linkedMapView.value, bounds: linkedMapBounds.value, markers: linkedMapMarkers.value });
  return { kindLabel: "Place", language, fallbackName, title: textIn(form.translations, "title", codes), blocks };
});

async function changeLink(id: string) {
  linking.value = true;
  try {
    link.value = await setSpatialLink(projectId.value, props.placeId, savedSetting.value === "INDOOR" ? { mapId: null, floorPlanId: id || null } : { mapId: id || null, floorPlanId: null });
    await loadSpatial();
    showToast(id ? "Linked" : "Unlinked", id ? "The place page shows it now." : "The place no longer shows a map or floor plan.");
  } catch (e) {
    if (!(e instanceof ApiError)) throw e;
    showToast("The link was not changed", e.platformUnavailable ? "The UNICHE platform is not reachable." : Object.values(e.fieldMessages()).join(" ") || e.message, "error");
  } finally {
    linking.value = false;
  }
}

async function startNewLink() {
  if (savedSetting.value === "INDOOR" && !libraryAssets.value.length) libraryAssets.value = await listAssets(projectId.value);
  creatingLink.value = true;
}

async function onLinkCreated() {
  creatingLink.value = false;
  await loadSpatial();
  showToast("Created and linked", "The place page shows it now.");
}

/*
 * The linked map's area is cropped here too, as in the map editor's "Edit bounds". A DRAFT map is saved at once; an
 * ACTIVE one gets the crop in its pending changes (`03` §1), which "Apply" here or the map editor make live.
 */
const mapCanvas = ref<InstanceType<typeof GeoMapCanvas> | null>(null);
const editingArea = ref(false);
const areaDraft = ref<Bounds | null>(null);
const savingArea = ref(false);
const areaEditable = computed(() => linkedMap.value?.status === "DRAFT" || linkedMap.value?.status === "ACTIVE");
const applyingMap = ref(false);

async function loadPendingMap(m: GeoMap | null) {
  pendingMap.value = null;
  if (!m || m.status !== "ACTIVE" || !m.hasWorkingCopy) return;
  try {
    const copy = await fetchWorkingCopy(projectId.value, "maps", m.id);
    if (linkedMap.value?.id === m.id && copy.resource) pendingMap.value = { copy, map: mapFromResponse(copy.resource) };
  } catch (e) {
    if (!(e instanceof ApiError)) throw e;
  }
}
watch(() => [linkedMap.value?.id, linkedMap.value?.status, linkedMap.value?.hasWorkingCopy] as const, () => loadPendingMap(linkedMap.value), {
  immediate: true,
});

function mapError(e: ApiError): string {
  if (e.code === "VERSION_CONFLICT") return "Someone changed the map meanwhile. Reload the page and crop it again.";
  if (e.platformUnavailable) return "The UNICHE platform is not reachable.";
  return Object.values(e.fieldMessages()).join(" ") || e.message;
}

async function applyMap() {
  const m = linkedMap.value;
  if (!m) return;
  applyingMap.value = true;
  try {
    await applyWorkingCopy(projectId.value, "maps", m.id);
    maps.value = await listMaps(projectId.value);
    showToast("Map changes applied", `Visitors now see the new “${m.internalName}”.`);
  } catch (e) {
    if (!(e instanceof ApiError)) throw e;
    showToast("The map changes were not applied", mapError(e), "error");
  } finally {
    applyingMap.value = false;
  }
}

function startAreaEdit() {
  const v = linkedMapView.value;
  areaDraft.value = linkedMapBounds.value ?? [
    [v.lat - 0.02, v.lng - 0.03],
    [v.lat + 0.02, v.lng + 0.03],
  ];
  editingArea.value = true;
}

function cancelAreaEdit() {
  editingArea.value = false;
  areaDraft.value = null;
}

async function saveArea() {
  const m = shownMap.value;
  const live = linkedMap.value;
  const b = areaDraft.value;
  if (!m || !live || !b) return;
  const [[south, west], [north, east]] = b;
  // The initial view stays where it was when it lies inside the new area (the backend refuses it outside), and
  // opens at least as close as the area fills the canvas.
  const inside = m.initialLatitude >= south && m.initialLatitude <= north && m.initialLongitude >= west && m.initialLongitude <= east;
  const fit = mapCanvas.value?.zoomFor(b) ?? m.initialZoom;
  const fields: Omit<UpdateMapInput, "version"> = {
    internalName: m.internalName,
    placeId: m.placeId,
    initialLatitude: inside ? m.initialLatitude : Number(((south + north) / 2).toFixed(6)),
    initialLongitude: inside ? m.initialLongitude : Number(((west + east) / 2).toFixed(6)),
    initialZoom: Math.min(22, Math.max(m.initialZoom, fit)),
    minLatitude: south,
    minLongitude: west,
    maxLatitude: north,
    maxLongitude: east,
    showPois: m.showPois,
    showRoutes: m.showRoutes,
    hiddenCategoryIds: m.hiddenCategoryIds,
    visitorFilter: m.visitorFilter,
    placements: m.placements,
  };
  savingArea.value = true;
  try {
    if (live.status === "ACTIVE") {
      // Into the pending changes, on top of what is already pending there.
      const copy = pendingMap.value?.copy ?? null;
      const saved = await saveWorkingCopy(projectId.value, "maps", live.id, {
        baseVersion: copy?.baseVersion ?? live.version,
        workingCopyVersion: copy?.version ?? null,
        payload: await mapWorkingCopyPayload(projectId.value, fields),
      });
      if (saved.errors.length) {
        showToast("The map area was not saved", saved.errors.map((x) => x.message).join(" "), "error");
        return;
      }
      maps.value = maps.value.map((x) => (x.id === live.id ? { ...x, hasWorkingCopy: true } : x));
      if (saved.resource) pendingMap.value = { copy: saved, map: mapFromResponse(saved.resource) };
      cancelAreaEdit();
      showToast("Map area saved to pending changes", `Visitors still see the previous area of “${live.internalName}” until you apply.`);
      return;
    }
    const saved = await updateMap(projectId.value, live.id, { version: live.version, ...fields });
    maps.value = maps.value.map((x) => (x.id === saved.id ? saved : x));
    cancelAreaEdit();
    showToast("Map area saved", `“${saved.internalName}” now shows only this area.`);
  } catch (e) {
    if (!(e instanceof ApiError)) throw e;
    showToast("The map area was not saved", mapError(e), "error");
  } finally {
    savingArea.value = false;
  }
}
watch(linkedMap, (m, before) => {
  if (m?.id !== before?.id) cancelAreaEdit();
});


// The Translations panel counts the fields the content list counts for its completion dots.
const translationRows = computed(() => translationStatus(languages.value, PLACE_TEXT_FIELDS.length, (code) => filledFields(form.translations[code], PLACE_TEXT_FIELDS)));
</script>

<template>
  <EditorShell
    tabbed
    :editor="editor"
    back-label="Places"
    :back-to="{ name: 'places', params: { projectId } }"
    :title="heading"
    :subtitle="subtitle"
    activation-hint="Activate it once the default-language title is set."
    :reference-link="toReference"
    :pending="languagesLoading"
    :translations="translationRows"
    :preview="preview"
  >
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
      title-required-hint="Required in the default language before the place can be activated."
    />

    <MediaSlots
      :project-id="projectId"
      :slots="MEDIA_SLOTS"
      :media="form.media"
      :assets="libraryAssets"
      :languages="languages"
      :default-language="defaultLanguage"
      :readonly="!editor.editable"
      :field-error="editor.fieldError"
      @uploaded="libraryAssets.unshift($event)"
    />

    <TriggersCard
      :triggers="form.triggers"
      :readonly="!editor.editable"
      :field-error="editor.fieldError"
      :position="{ latitude: numberText(editor.resource?.latitude), longitude: numberText(editor.resource?.longitude) }"
      position-label="Use the place's position"
    />

    <section class="overflow-hidden rounded-lg border bg-card" aria-labelledby="place-setup-heading">
      <div class="flex flex-wrap items-baseline gap-2 border-b px-5 py-3.5">
        <h2 id="place-setup-heading" class="text-[11px] font-extrabold uppercase tracking-[0.09em] text-muted-foreground">Place setup</h2>
        <span v-if="linkedMap" class="text-xs text-muted-foreground">{{ linkedMap.internalName }} · as visitors open it</span>
      </div>
      <div class="flex flex-col gap-4 px-5 py-[18px]">
        <div class="flex flex-col gap-2" role="group" aria-labelledby="setup-level-label">
          <span id="setup-level-label" class="small-label">1 · Level</span>
          <div class="grid max-w-[560px] grid-cols-2 gap-2.5">
            <button
              v-for="level in ([[false, 'Top-level place', 'Stands on its own'], [true, 'Sub-place', 'Sits inside another place']] as const)"
              :key="String(level[0])"
              type="button"
              :aria-pressed="subPlace === level[0]"
              :disabled="!editor.editable || (level[0] && !parentChoices.length)"
              class="flex flex-col gap-1 rounded-lg border-[1.5px] px-3.5 py-3 text-left disabled:opacity-50"
              :class="subPlace === level[0] ? 'border-primary bg-[#f5f0fb]' : 'border-gray-200 bg-white hover:border-primary'"
              @click="chooseLevel(level[0])"
            >
              <span class="text-[13px] font-bold">
                <span v-if="subPlace === level[0]" aria-hidden="true" class="text-primary">✓ </span>{{ level[1] }}
              </span>
              <span class="text-xs text-muted-foreground">{{ level[2] }}</span>
            </button>
          </div>
          <template v-if="subPlace">
            <label for="f-parent" class="small-label">Parent place</label>
            <select
              id="f-parent"
              v-model="form.parentPlaceId"
              :disabled="!editor.editable"
              class="field-input max-w-[560px]"
              :aria-invalid="editor.fieldError('parentPlaceId') ? 'true' : undefined"
              :aria-describedby="editor.fieldError('parentPlaceId') ? 'err-PlaceEditorView-1' : undefined"
              :class="{ invalid: editor.fieldError('parentPlaceId') }"
            >
              <option value="" disabled>Choose the parent place…</option>
              <option v-for="o in parentChoices" :key="o.id" :value="o.id">{{ o.label }}</option>
            </select>
            <span v-if="editor.fieldError('parentPlaceId')" id="err-PlaceEditorView-1" class="text-xs font-semibold text-destructive">⚠ {{ editor.fieldError("parentPlaceId") }}</span>
          </template>
        </div>

        <div class="flex flex-col gap-1.5">
          <label for="f-link" class="small-label">2 · {{ savedSetting === "INDOOR" ? "Floor plan" : "Map" }}</label>
          <select
            id="f-link"
            :value="linkedId"
            :disabled="linking || settingChanged || !editor.resource || editor.resource.status === 'ARCHIVED'"
            class="field-input max-w-[520px]"
            @change="changeLink(($event.target as HTMLSelectElement).value)"
          >
            <option value="">{{ savedSetting === "INDOOR" ? "No floor plan" : "No map" }}</option>
            <option v-for="o in linkOptions" :key="o.id" :value="o.id">{{ o.label }}</option>
          </select>
          <span v-if="settingChanged" class="text-xs text-[#855400]">
            A {{ placeTypeLabel(form.type).toLowerCase() }} uses a {{ chosenSetting === "INDOOR" ? "floor plan" : "map" }}: save first, then link one.
          </span>
          <span v-else class="text-xs text-muted-foreground">{{ linkNote }}</span>
          <div v-if="editor.resource && !settingChanged" class="flex flex-wrap gap-3">
            <RouterLink
              v-if="linkedId"
              :to="savedSetting === 'INDOOR' ? { name: 'floor-plan-editor', params: { projectId, planId: linkedId } } : { name: 'map-editor', params: { projectId, mapId: linkedId } }"
              class="text-[11px] font-bold text-primary no-underline"
            >
              Open {{ savedSetting === "INDOOR" ? "floor plan" : "map" }}
            </RouterLink>
            <button v-else type="button" class="text-[11px] font-bold text-primary" @click="startNewLink">
              New {{ savedSetting === "INDOOR" ? "floor plan" : "map" }}
            </button>
          </div>
        </div>
      </div>
      <div v-if="linkedMap" class="flex flex-col gap-2 px-3 pb-3">
        <div class="flex flex-wrap items-center gap-2 px-2">
          <span class="flex-1 text-xs text-muted-foreground">
            {{
              editingArea
                ? linkedMap.status === "ACTIVE"
                  ? "Drag the corners or the centre handle. The new area waits in the map's pending changes until you apply it."
                  : "Drag the corners or the centre handle. Visitors see only the area inside."
                : pendingMap
                  ? "Pending changes: visitors still see the map as it was until you apply them."
                  : areaEditable
                    ? "Visitors see only this area."
                    : "This map is archived: restore it in the map editor to change its area."
            }}
          </span>
          <template v-if="editingArea">
            <button type="button" class="dialog-secondary" :disabled="savingArea" @click="cancelAreaEdit">Cancel</button>
            <button type="button" class="dialog-primary bg-primary" :disabled="savingArea" @click="saveArea">
              {{ savingArea ? "Saving…" : "Save map area" }}
            </button>
          </template>
          <template v-else-if="areaEditable">
            <button type="button" class="dialog-secondary" @click="startAreaEdit">Edit map area</button>
            <button v-if="pendingMap" type="button" class="dialog-primary bg-primary" :disabled="applyingMap" @click="applyMap">
              {{ applyingMap ? "Applying…" : "Apply map changes" }}
            </button>
          </template>
        </div>
        <GeoMapCanvas
          ref="mapCanvas"
          :key="linkedMap.id"
          :view="linkedMapView"
          :bounds="editingArea ? areaDraft : linkedMapBounds"
          :edit-bounds="editingArea"
          :markers="linkedMapMarkers"
          limit-to-bounds
          height="360px"
          :label="`Map ${linkedMap.internalName}`"
          @bounds-change="areaDraft = $event"
        />
      </div>
    </section>

    <section class="overflow-hidden rounded-lg border bg-card">
      <div class="border-b px-5 py-3.5">
        <h2 class="text-[11px] font-extrabold uppercase tracking-[0.09em] text-muted-foreground">Details</h2>
      </div>
      <div class="flex flex-col gap-3.5 px-5 py-[18px]">
        <div class="flex flex-col gap-1.5">
          <label for="f-type" class="small-label">Type</label>
          <select
            id="f-type"
            v-model="form.type"
            :disabled="!editor.editable"
            class="field-input max-w-[420px]"
            :class="{ invalid: settingError }"
            :aria-invalid="settingError ? 'true' : undefined"
            aria-describedby="f-type-help"
          >
            <option v-for="t in typeChoices" :key="t" :value="t">{{ placeTypeLabel(t) }}</option>
          </select>
          <span v-if="settingError" id="f-type-help" class="text-xs font-semibold text-destructive">⚠ {{ settingError }}</span>
          <span v-else-if="settingLocked" id="f-type-help" class="text-xs text-muted-foreground">
            To make it a {{ savedSetting === "INDOOR" ? "site or area" : "building, floor, or room" }}, unlink the
            {{ savedSetting === "INDOOR" ? "floor plan" : "map" }} in Place setup first.
          </span>
          <span v-else id="f-type-help" class="text-xs text-muted-foreground">
            Buildings, floors, and rooms use a floor plan; the other types use a geographic map.
          </span>
        </div>
        <div class="flex flex-col gap-1.5">
          <label for="f-slug" class="small-label">Slug</label>
          <input
            id="f-slug"
            v-model="form.slug"
            :readonly="!editor.editable"
            spellcheck="false"
            class="field-input font-mono text-[13px]"
            :class="{ invalid: editor.fieldError('slug') }"
            aria-describedby="f-slug-help"
          />
          <span v-if="editor.fieldError('slug')" id="f-slug-help" class="text-xs font-semibold text-destructive">⚠ {{ editor.fieldError("slug") }}</span>
          <span v-else id="f-slug-help" class="text-xs text-muted-foreground">
            The place's address in the app and its QR target. Changing it breaks printed QR codes.
          </span>
        </div>
        <div class="flex flex-col gap-1.5">
          <label for="f-internal" class="small-label">Internal name</label>
          <input id="f-internal" v-model="form.internalName" :readonly="!editor.editable" class="field-input" aria-describedby="f-internal-help" />
          <span id="f-internal-help" class="text-xs text-muted-foreground">Only authors see it, for example an inventory number.</span>
        </div>
        <label class="flex items-center gap-2.5 text-[13px] font-semibold">
          <input v-model="form.featured" type="checkbox" :disabled="!editor.editable" class="h-4 w-4 accent-primary" />
          Featured: highlighted in the visitor app's lists
        </label>
      </div>
    </section>

  </EditorShell>

  <NewMapDialog
    v-if="creatingLink && savedSetting === 'OUTDOOR'"
    :project-id="projectId"
    :places="allPlaces"
    :linked-place-ids="maps.flatMap((m) => (m.placeId ? [m.placeId] : []))"
    :default-language="defaultLanguage"
    :initial-query="heading"
    :initial-place-id="placeId"
    @close="creatingLink = false"
    @created="onLinkCreated"
  />
  <NewFloorPlanDialog
    v-if="creatingLink && savedSetting === 'INDOOR'"
    :project-id="projectId"
    :assets="libraryAssets"
    :places="allPlaces"
    :linked-place-ids="floorPlans.flatMap((f) => (f.placeId ? [f.placeId] : []))"
    :default-language="defaultLanguage"
    :initial-place-id="placeId"
    @close="creatingLink = false"
    @created="onLinkCreated"
    @uploaded="libraryAssets.unshift($event)"
  />
</template>
