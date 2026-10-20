<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import EditorShell from "@/components/editor/EditorShell.vue";
import TranslationsPanel, { type TextFieldGroup, type TextFieldMeta } from "@/components/editor/TranslationsPanel.vue";
import { SLUG_PATTERN } from "@/lib/format";
import {
  changePlaceStatus,
  fetchPlaceReferences,
  fetchPlace,
  listPlaces,
  PLACE_TEXT_FIELDS,
  PLACE_SETTING_LABELS,
  PLACE_TYPES_BY_SETTING,
  placeTitle,
  updatePlace,
  type Place,
  type PlaceTranslation,
  type PlaceSetting,
  type PlaceType,
} from "@/platform/places";
import { useCurrentProject } from "@/workspace/currentProject";
import {
  describeTranslationPath,
  ensureTextRows,
  optionalText,
  textsForApi,
  textsFrom,
  type Texts,
} from "@/workspace/formFields";
import type { ResourceReference } from "@/platform/references";
import { referenceLink } from "@/workspace/referenceLinks";
import { previewLanguages, textBlocks, textIn, type PreviewBlock, type PreviewModel } from "@/workspace/preview";
import { filledFields, translationStatus } from "@/workspace/translationStatus";
import { useProjectLanguages } from "@/workspace/useProjectLanguages";
import { useResourceEditor } from "@/workspace/useResourceEditor";
import { placeTypeLabel } from "./placeTree";
import NewFloorPlanDialog from "../maps/NewFloorPlanDialog.vue";
import NewMapDialog from "../maps/NewMapDialog.vue";
import GeoMapCanvas, { type Bounds, type CanvasMarker } from "@/components/map/GeoMapCanvas.vue";
import { listAssets, type Asset } from "@/platform/assets";
import { listFloorPlans, type FloorPlan } from "@/platform/floorPlans";
import { listMaps, type GeoMap } from "@/platform/maps";
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
  setting: "Setting",
  parentPlaceId: "Parent place",
  internalName: "Internal name",
};

// Other Places, for the "Inside" choice.
const allPlaces = ref<Place[]>([]);

const form = reactive({
  slug: "",
  type: "SITE" as PlaceType,
  setting: "OUTDOOR" as PlaceSetting,
  parentPlaceId: "",
  internalName: "",
  featured: false,
  translations: {} as Record<string, Texts<TextKey>>,
});

const editor = useResourceEditor<Place>({
  kind: "place",
  source: () => props.placeId,
  languages,
  defaultLanguage,
  async load() {
    const [place, places] = await Promise.all([fetchPlace(projectId.value, props.placeId), listPlaces(projectId.value)]);
    allPlaces.value = places;
    return place;
  },
  async save(place, version) {
    const saved = await updatePlace(projectId.value, place.id, {
      version,
      slug: form.slug,
      type: form.type,
      setting: form.setting,
      parentPlaceId: form.parentPlaceId || null,
      internalName: optionalText(form.internalName),
      // Places are located through their map, not by coordinates of their own; stored values pass through.
      latitude: place.latitude,
      longitude: place.longitude,
      featured: form.featured,
      translations: textsForApi(PLACE_TEXT_FIELDS, languageCodes(), form.translations),
    });
    allPlaces.value = allPlaces.value.map((p) => (p.id === saved.id ? saved : p));
    return saved;
  },
  changeStatus: (place, target, version) => changePlaceStatus(projectId.value, place.id, target, version),
  loadReferences: (place) => fetchPlaceReferences(projectId.value, place.id),
  resetForm(place) {
    form.slug = place.slug;
    form.type = place.type;
    form.setting = place.setting;
    form.parentPlaceId = place.parentPlaceId ?? "";
    form.internalName = place.internalName ?? "";
    form.featured = place.featured;
    form.translations = Object.fromEntries(
      Object.entries(place.translations).map(([code, t]) => [code, textsFrom(PLACE_TEXT_FIELDS, t)]),
    );
  },
  ensureLanguageRows: () => ensureTextRows(PLACE_TEXT_FIELDS, languageCodes(), form.translations),
  formState: () => form,
  validate() {
    const found: Record<string, string> = {};
    if (!SLUG_PATTERN.test(form.slug)) found.slug = "Use lowercase Latin letters, digits, and single hyphens.";
    return found;
  },
  describePath: (path) => describeTranslationPath(path, languages.value, TEXT_META) ?? FIELD_NAMES[path] ?? path,
});

const heading = computed(() => (editor.resource ? placeTitle(editor.resource, null, defaultLanguage.value) : "Place"));
/*
 * The setting and the level are chosen when the Place is created and do not change in the editor (owner
 * decision, 2026-10-16): a Place that should be indoor instead of outdoor, or inside another one, is
 * archived and created again. They are shown in the subtitle; the save sends them back unchanged.
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
  return `${placeTypeLabel(place.type)} · ${PLACE_SETTING_LABELS[place.setting].label} · ${level} · ${place.slug}`;
});
const toReference = (r: ResourceReference) => referenceLink(projectId.value, r);
const typeChoices = computed(() => {
  const fitting = PLACE_TYPES_BY_SETTING[form.setting];
  return fitting.includes(form.type) ? fitting : [form.type, ...fitting];
});
// The map or floor plan the Place's page shows; linking applies at once (mockup place setup).
const maps = ref<GeoMap[]>([]);
const floorPlans = ref<FloorPlan[]>([]);
const link = ref<SpatialLink>({ mapId: null, floorPlanId: null });
const linking = ref(false);
const creatingLink = ref(false);
const libraryAssets = ref<Asset[]>([]);

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

const linkedId = computed(() => (form.setting === "INDOOR" ? link.value.floorPlanId : link.value.mapId) ?? "");

// The linked map is shown on this page, below its choice, as visitors see it.
const linkedMap = computed(() =>
  editor.resource && form.setting === "OUTDOOR" && link.value.mapId
    ? (maps.value.find((m) => m.id === link.value.mapId) ?? null)
    : null,
);
const linkedMapView = computed(() =>
  linkedMap.value
    ? { lat: linkedMap.value.initialLatitude, lng: linkedMap.value.initialLongitude, zoom: linkedMap.value.initialZoom }
    : { lat: 0, lng: 0, zoom: 2 },
);
const linkedMapBounds = computed<Bounds | null>(() => {
  const m = linkedMap.value;
  if (!m || m.minLatitude === null || m.minLongitude === null || m.maxLatitude === null || m.maxLongitude === null) return null;
  return [
    [m.minLatitude, m.minLongitude],
    [m.maxLatitude, m.maxLongitude],
  ];
});
const linkedMapMarkers = computed<CanvasMarker[]>(() =>
  (linkedMap.value?.placements ?? []).map((p, i) => {
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
  const list = form.setting === "INDOOR" ? floorPlans.value : maps.value;
  return list
    .filter((x) => x.status !== "ARCHIVED")
    .map((x) => {
      const other = x.placeId && x.placeId !== props.placeId ? allPlaces.value.find((p) => p.id === x.placeId) : undefined;
      return { id: x.id, label: x.internalName + (other ? ` · linked to ${placeTitle(other, null, defaultLanguage.value)}` : "") };
    });
});
const linkNote = computed(() => {
  const current = (form.setting === "INDOOR" ? floorPlans.value : maps.value).find((x) => x.id === linkedId.value);
  if (current) return `Visitors open this place on “${current.internalName}”.`;
  return form.setting === "INDOOR"
    ? "Link an existing floor plan, or add a new one, to position indoor Points of Interest."
    : "Link an existing map, or create one by searching for the area.";
});

// The Place as visitors would open it, from the live form (`12` §3 Resource editors, DECISIONS.md D-014).
const preview = computed<PreviewModel | null>(() => {
  if (!editor.resource) return null;
  const { language, fallbackName, codes } = previewLanguages(languages.value, editor.activeLanguage, defaultLanguage.value);
  const blocks: PreviewBlock[] = [
    { type: "facts", items: [{ label: "", value: placeTypeLabel(form.type) }, ...(parentTitle.value ? [{ label: "In", value: parentTitle.value }] : [])] },
    ...textBlocks(form.translations, [
      { key: "summary", label: "Summary" },
      { key: "description", label: "Description" },
      { key: "visitorInformation", label: "Visitor information", heading: "Visit" },
      { key: "accessibilityInformation", label: "Accessibility information", heading: "Accessibility" },
    ], codes),
  ];
  if (linkedMap.value) blocks.push({ type: "map", view: linkedMapView.value, bounds: linkedMapBounds.value, markers: linkedMapMarkers.value });
  return { kindLabel: "Place", language, fallbackName, title: textIn(form.translations, "title", codes), blocks };
});

async function changeLink(id: string) {
  linking.value = true;
  try {
    link.value = await setSpatialLink(projectId.value, props.placeId, form.setting === "INDOOR" ? { mapId: null, floorPlanId: id || null } : { mapId: id || null, floorPlanId: null });
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
  if (form.setting === "INDOOR" && !libraryAssets.value.length) libraryAssets.value = await listAssets(projectId.value);
  creatingLink.value = true;
}

async function onLinkCreated() {
  creatingLink.value = false;
  await loadSpatial();
  showToast("Created and linked", "The place page shows it now.");
}


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

    <section class="overflow-hidden rounded-lg border bg-card" aria-labelledby="place-link-heading">
      <div class="flex flex-wrap items-baseline gap-2 border-b px-5 py-3.5">
        <h2 id="place-link-heading" class="text-[11px] font-extrabold uppercase tracking-[0.09em] text-muted-foreground">
          {{ form.setting === "INDOOR" ? "Floor plan" : "Map" }}
        </h2>
        <span v-if="linkedMap" class="text-xs text-muted-foreground">{{ linkedMap.internalName }} · as visitors open it</span>
      </div>
      <div class="flex flex-col gap-1.5 px-5 py-[18px]">
        <select
          id="f-link"
          :value="linkedId"
          :aria-label="form.setting === 'INDOOR' ? 'Floor plan' : 'Map'"
          :disabled="linking || !editor.resource || editor.resource.status === 'ARCHIVED'"
          class="field-input max-w-[520px]"
          @change="changeLink(($event.target as HTMLSelectElement).value)"
        >
          <option value="">{{ form.setting === "INDOOR" ? "No floor plan" : "No map" }}</option>
          <option v-for="o in linkOptions" :key="o.id" :value="o.id">{{ o.label }}</option>
        </select>
        <span class="text-xs text-muted-foreground">{{ linkNote }}</span>
        <div v-if="editor.resource" class="flex flex-wrap gap-3">
          <RouterLink
            v-if="linkedId && form.setting === 'INDOOR'"
            :to="{ name: 'floor-plan-editor', params: { projectId, planId: linkedId } }"
            class="text-[11px] font-bold text-primary no-underline"
          >
            Open floor plan
          </RouterLink>
          <button v-else-if="!linkedId" type="button" class="text-[11px] font-bold text-primary" @click="startNewLink">
            New {{ form.setting === "INDOOR" ? "floor plan" : "map" }}
          </button>
        </div>
      </div>
      <div v-if="linkedMap" class="px-3 pb-3">
        <GeoMapCanvas
          :key="linkedMap.id"
          :view="linkedMapView"
          :bounds="linkedMapBounds"
          :markers="linkedMapMarkers"
          height="360px"
          :label="`Map ${linkedMap.internalName}`"
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
          <select id="f-type" v-model="form.type" :disabled="!editor.editable" class="field-input max-w-[420px]">
            <option v-for="t in typeChoices" :key="t" :value="t">{{ placeTypeLabel(t) }}</option>
          </select>
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
    v-if="creatingLink && form.setting === 'OUTDOOR'"
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
    v-if="creatingLink && form.setting === 'INDOOR'"
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
