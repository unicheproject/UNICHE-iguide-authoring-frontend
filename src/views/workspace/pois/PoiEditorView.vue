<script setup lang="ts">
import { computed, reactive, ref } from "vue";
import FilteredSelect from "@/components/editor/FilteredSelect.vue";
import OtherSettings from "@/components/editor/OtherSettings.vue";
import { say } from "@/lib/announcer";
import GeoPicker, { type GeoArea, type GeoPoint } from "@/components/GeoPicker.vue";
import EditorSection from "@/components/editor/EditorSection.vue";
import { MapPin } from "lucide-vue-next";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { FormField } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { parseDecimal } from "@/components/map/coordinates";
import { listMaps, type GeoMap } from "@/platform/maps";
import EditorShell from "@/components/editor/EditorShell.vue";
import TranslationsPanel, { type TextFieldGroup, type TextFieldMeta } from "@/components/editor/TranslationsPanel.vue";
import TriggersCard from "@/components/editor/TriggersCard.vue";
import MediaSlots, { type MediaSlot } from "@/components/media/MediaSlots.vue";
import { SLUG_PATTERN } from "@/lib/format";
import { listAssets, type Asset, type MediaBinding } from "@/platform/assets";
import { assignableCategories, listCategories, type Category } from "@/platform/categories";
import { listPlaces, placeTitle, type Place } from "@/platform/places";
import { checkTriggers, describeTriggerPath, listTargetTriggers, saveWithTriggers, reconcileTriggers, triggerToForm, type PartialTriggers, type Trigger, type TriggerForm } from "@/platform/triggers";
import {
  changePoiStatus,
  checkPoiPosition,
  coordinateBlurError,
  fetchPoi,
  fetchPoiReferences,
  listPois,
  POI_CODE_PATTERN,
  poiFromResponse,
  poiTitle,
  poiWorkingCopyPayload,
  updatePoi,
  type Poi,
  type PoiTranslation,
  type UpdatePoiInput,
} from "@/platform/pois";
import type { ResourceReference } from "@/platform/references";
import { useCurrentProject } from "@/workspace/currentProject";
import {
  describeTranslationPath,
  ensureTextRows,
  isWholeNumber,
  numberText,
  optionalText,
  textsForApi,
  textsFrom,
  type Texts,
} from "@/workspace/formFields";
import { referenceLink } from "@/workspace/referenceLinks";
import { heroBlock, mediaBlocks, previewLanguages, textBlocks, textIn, type PreviewBlock, type PreviewModel } from "@/workspace/preview";
import { POI_TEXT_FIELDS } from "@/platform/pois";
import { filledFields, translationStatus } from "@/workspace/translationStatus";
import { useProjectLanguages } from "@/workspace/useProjectLanguages";
import { partialSentence, useResourceEditor } from "@/workspace/useResourceEditor";
import { parentOptions } from "../places/placeTree";

const props = defineProps<{ poiId: string }>();
const project = useCurrentProject();
const projectId = computed(() => project.value.id);
const { languages, defaultLanguage, loading: languagesLoading } = useProjectLanguages(projectId);
const languageCodes = () => languages.value.map((l) => l.languageCode);

type TextKey = keyof PoiTranslation;
const TEXT_KEYS: TextKey[] = ["title", "summary", "description", "instructions", "accessibilityInformation"];

const TEXT_META: Record<TextKey, TextFieldMeta> = {
  title: { label: "Title", multiline: false },
  summary: { label: "Summary", multiline: true, half: true, helper: "Short text shown in lists; aim for a reading level a twelve-year-old follows." },
  description: { label: "Description", multiline: true, half: true },
  instructions: { label: "Instructions", multiline: true, helper: "How to find it and what to do when standing there." },
  accessibilityInformation: {
    label: "Accessibility information",
    multiline: true,
    helper: "Physical access, sensory conditions, quiet spaces, assistance, what is not accessible.",
  },
};
const GROUPS: TextFieldGroup[] = [
  { id: "main", label: null, keys: ["title", "summary", "description"] },
  // `12` §3: instructions and accessibility information sit in a collapsed "Practical details" card.
  { id: "practical", label: "Practical details", keys: ["instructions", "accessibilityInformation"], open: false },
];
// The media slots of a Point of Interest; the audio narration is one group in the Media card with a file per language.
const MEDIA_SLOTS: MediaSlot[] = [
  { usage: "HERO_IMAGE", label: "Primary image", accept: ["IMAGE"], recommended: true },
  { usage: "VIDEO", label: "Video", accept: ["VIDEO"] },
  { usage: "AUDIO_NARRATION", label: "Audio narration", accept: ["AUDIO"], perLanguage: true },
  { usage: "GALLERY_IMAGE", label: "Gallery", accept: ["IMAGE"], multiple: true },
  // `03` lines 521-531: a 3D model (GLB, view only) always comes with a poster image describing the object.
  {
    usage: "MODEL",
    label: "3D model",
    accept: ["THREE_D_MODEL"],
    requires: "MODEL_POSTER",
    hint: "A GLB file visitors can turn in a viewer.",
  },
  {
    usage: "MODEL_POSTER",
    label: "3D model poster",
    accept: ["IMAGE"],
    hint: "Shown while the model loads; its alternative text describes the object.",
  },
];

const FIELD_NAMES: Record<string, string> = {
  slug: "Slug",
  placeId: "Place",
  categoryId: "Category",
  code: "Exhibit code",
  latitude: "Latitude",
  longitude: "Longitude",
  estimatedVisitMinutes: "Estimated visit minutes",
  internalName: "Internal name",
};

// Places for the Place choice, and the other points of interest for the site map.
const places = ref<Place[]>([]);
const categories = ref<Category[]>([]);
const allPois = ref<Poi[]>([]);
// The media library, for the slots' names and previews.
const assets = ref<Asset[]>([]);

const form = reactive({
  slug: "",
  placeId: "",
  categoryId: "",
  code: "",
  internalName: "",
  latitude: "",
  longitude: "",
  estimatedVisitMinutes: "",
  featured: false,
  translations: {} as Record<string, Texts<TextKey>>,
  media: [] as MediaBinding[],
  triggers: [] as TriggerForm[],
});
// The triggers as last loaded or saved; the form is reset from them with the POI.
const savedTriggers = ref<Trigger[]>([]);

/** What the last save stored of the trigger rows, kept for `onPartialSave` (the editor calls it right after). */
let lastPartial: PartialTriggers | null = null;
/**
 * A save that stored the point of interest but not every trigger row says so in one sentence once the editor has shown
 * its own summary (a refused row's fields are linked there); the rows stay in the form for another try (C2-73).
 */
function sayPartial(notice: PartialTriggers) {
  lastPartial = notice;
  if (notice.validation) return;
  setTimeout(() => editor.reportPartial(partialSentence("point of interest", notice.names), notice.requestId), 0);
}

/** The editable state from the form, for a DRAFT save and a working copy alike. */
function input(): Omit<UpdatePoiInput, "version"> {
  return {
    slug: form.slug,
    placeId: form.placeId || null,
    categoryId: form.categoryId || null,
    code: optionalText(form.code),
    internalName: optionalText(form.internalName),
    // Unreadable text is reported by validate() and never reaches the API as NaN.
    latitude: parseDecimal(form.latitude),
    longitude: parseDecimal(form.longitude),
    estimatedVisitMinutes: form.estimatedVisitMinutes.trim() && isWholeNumber(form.estimatedVisitMinutes.trim(), 1, 1440) ? Number(form.estimatedVisitMinutes.trim()) : null,
    featured: form.featured,
    translations: textsForApi(TEXT_KEYS, languageCodes(), form.translations),
    media: form.media.map((m) => ({ ...m })),
  };
}

const editor = useResourceEditor<Poi>({
  kind: "point of interest",
  source: () => props.poiId,
  languages,
  defaultLanguage,
  async load() {
    const [poi, allPlaces, pois, library, allCategories, triggers, allMaps] = await Promise.all([
      fetchPoi(projectId.value, props.poiId),
      listPlaces(projectId.value),
      listPois(projectId.value),
      listAssets(projectId.value),
      listCategories(projectId.value),
      listTargetTriggers(projectId.value, "POI", props.poiId),
      listMaps(projectId.value),
    ]);
    maps.value = allMaps;
    savedTriggers.value = triggers;
    places.value = allPlaces;
    categories.value = allCategories;
    allPois.value = pois;
    assets.value = library;
    return poi;
  },
  // C3-20: the saved rows become the saved triggers (marked saved, never re-sent); only the failed rows stay as typed.
  onPartialSave() {
    if (!lastPartial) return;
    form.triggers = reconcileTriggers(form.triggers, lastPartial);
    savedTriggers.value = lastPartial.triggers;
    lastPartial = null;
  },
  async save(poi, version) {
    // Triggers are rows of their own and do not move the POI's version: saved first, put back when it is refused.
    const { saved, triggers } = await saveWithTriggers(
      projectId.value,
      "POI",
      poi.id,
      form.triggers,
      () => updatePoi(projectId.value, poi.id, { version, ...input() }),
      { partial: true, onPartial: sayPartial },
    );
    savedTriggers.value = triggers;
    return saved;
  },
  workingCopy: {
    kind: "pois",
    projectId: () => projectId.value,
    payload: () => poiWorkingCopyPayload(input()),
    // Triggers are not in the working copy (backend D-026): "Save draft" saves them live around it.
    async around(poi, save) {
      const { saved, triggers } = await saveWithTriggers(projectId.value, "POI", poi.id, form.triggers, save);
      savedTriggers.value = triggers;
      return saved;
    },
    fromResponse: poiFromResponse,
  },
  changeStatus: (poi, target, version) => changePoiStatus(projectId.value, poi.id, target, version),
  loadReferences: (poi) => fetchPoiReferences(projectId.value, poi.id),
  resetForm(poi) {
    form.slug = poi.slug;
    form.placeId = poi.placeId ?? "";
    form.categoryId = poi.categoryId ?? "";
    form.code = poi.code ?? "";
    form.internalName = poi.internalName ?? "";
    form.latitude = numberText(poi.latitude);
    form.longitude = numberText(poi.longitude);
    form.estimatedVisitMinutes = numberText(poi.estimatedVisitMinutes);
    form.featured = poi.featured;
    form.translations = Object.fromEntries(Object.entries(poi.translations).map(([code, t]) => [code, textsFrom(TEXT_KEYS, t)]));
    form.media = poi.media.map((m) => ({ ...m }));
    form.triggers = savedTriggers.value.map(triggerToForm);
  },
  ensureLanguageRows: () => ensureTextRows(TEXT_KEYS, languageCodes(), form.translations),
  formState: () => form,
  validate() {
    const found: Record<string, string> = {};
    if (!SLUG_PATTERN.test(form.slug)) found.slug = "Use lowercase Latin letters, digits, and single hyphens.";
    const code = form.code.trim();
    if (code && (code.length > 32 || !POI_CODE_PATTERN.test(code))) {
      found.code = "Letters, digits, and single hyphens, at most 32 characters.";
    }
    checkPoiPosition(form.latitude, form.longitude, found);
    checkTriggers(form.triggers, found);
    const minutes = form.estimatedVisitMinutes.trim();
    if (minutes && !isWholeNumber(minutes, 1, 1440)) found.estimatedVisitMinutes = "A whole number of minutes between 1 and 1440.";
    const model = form.media.findIndex((m) => m.usage === "MODEL");
    if (model >= 0 && !form.media.some((m) => m.usage === "MODEL_POSTER")) {
      found[`media[${model}].usage`] = "Add a 3D model poster image too.";
    }
    return found;
  },
  describePath: (path) =>
    /^media\[/.test(path) ? "Media" : (describeTriggerPath(path, form.triggers) ?? describeTranslationPath(path, languages.value, TEXT_META) ?? FIELD_NAMES[path] ?? path),
});

// A trigger that opens this poi links to its own "How visitors reach it" card.
const toReference = (r: ResourceReference) => referenceLink(projectId.value, r, { resourceType: "POI", resourceId: props.poiId });

const heading = computed(() => (editor.resource ? poiTitle(editor.resource, defaultLanguage.value) : "Point of interest"));
const subtitle = computed(() => {
  const p = editor.resource;
  return p ? ["Point of interest", p.code ? `exhibit ${p.code}` : null, p.slug].filter(Boolean).join(" · ") : "";
});
const placeChoices = computed(() => parentOptions(places.value, defaultLanguage.value));
const categoryChoices = computed(() => assignableCategories(categories.value, "POI", defaultLanguage.value));

// Site map: the other points of interest as dots; the area comes from every saved coordinate in the
// Project, so it stays put while the author moves this pin.
// The Point of Interest as visitors would open it, from the live form (`12` §3, DECISIONS.md D-014).
const preview = computed<PreviewModel | null>(() => {
  if (!editor.resource) return null;
  const { language, fallbackName, codes } = previewLanguages(languages.value, editor.activeLanguage, defaultLanguage.value);
  const place = places.value.find((p) => p.id === form.placeId);
  const facts = [
    ...(form.code.trim() ? [{ label: "No.", value: form.code.trim() }] : []),
    ...(form.estimatedVisitMinutes.trim() ? [{ label: "Visit", value: `${form.estimatedVisitMinutes.trim()} min` }] : []),
    ...(place ? [{ label: "In", value: placeTitle(place, editor.activeLanguage, defaultLanguage.value) }] : []),
  ];
  const blocks: PreviewBlock[] = [
    ...heroBlock(form.media, assets.value, codes),
    { type: "facts", items: facts },
    ...textBlocks(form.translations, [
      { key: "summary", label: "Summary" },
      { key: "description", label: "Description" },
      { key: "instructions", label: "Instructions", heading: "When you are there" },
      { key: "accessibilityInformation", label: "Accessibility information", heading: "Accessibility" },
    ], codes),
    ...mediaBlocks(form.media, assets.value, codes),
  ];
  return { kindLabel: "Point of interest", language, fallbackName, title: textIn(form.translations, "title", codes), blocks };
});
function toPoint(lat: number | null, lng: number | null, title?: string): GeoPoint[] {
  return lat !== null && lng !== null ? [{ lat, lng, title }] : [];
}
const mapOthers = computed(() =>
  allPois.value
    .filter((p) => p.id !== props.poiId && p.status !== "ARCHIVED")
    .flatMap((p) => toPoint(p.latitude, p.longitude, poiTitle(p, defaultLanguage.value))),
);
const mapAnchors = computed(() => [
  ...(editor.resource ? toPoint(editor.resource.latitude, editor.resource.longitude) : []),
  ...places.value.filter((p) => p.status !== "ARCHIVED").flatMap((p) => toPoint(p.latitude, p.longitude)),
]);
/*
 * The site map is framed on the area the point of interest belongs to: the Geographic Map of its Place, or of the
 * nearest parent Place that has one (owner request 2026-11-04). Without one, every saved coordinate frames it.
 */
const maps = ref<GeoMap[]>([]);
const areaMap = computed(() => {
  const seen = new Set<string>();
  let placeId: string | null = form.placeId || null;
  while (placeId && !seen.has(placeId)) {
    seen.add(placeId);
    const id = placeId;
    const found = maps.value.find((m) => m.placeId === id && m.status !== "ARCHIVED" && m.minLatitude !== null);
    if (found) return found;
    placeId = places.value.find((p) => p.id === id)?.parentPlaceId ?? null;
  }
  return null;
});
const mapArea = computed<GeoArea | null>(() => {
  const m = areaMap.value;
  return m && m.minLatitude !== null && m.minLongitude !== null && m.maxLatitude !== null && m.maxLongitude !== null
    ? [[m.minLatitude, m.minLongitude], [m.maxLatitude, m.maxLongitude]]
    : null;
});
function onMapPick(lat: string, lng: string) {
  form.latitude = lat;
  form.longitude = lng;
  liveCoordinate.latitude = liveCoordinate.longitude = null;
}
/** A decimal comma that was accepted is shown as the point the API uses, once the author leaves the field. */
function tidyCoordinate(key: "latitude" | "longitude") {
  const value = parseDecimal(form[key]);
  if (value !== null && form[key].includes(",")) form[key] = String(value);
}
/** What is wrong with a coordinate as typed, found on leaving its field and not only on Save (C2-69). */
/** Whether the placement map is shown; it opens on request so the card stays short (C2-67). */
const mapOpen = ref(false);
const liveCoordinate = reactive<{ latitude: string | null; longitude: string | null }>({ latitude: null, longitude: null });
const COORDINATE_NAMES = { latitude: "Latitude", longitude: "Longitude" } as const;
function checkCoordinate(key: "latitude" | "longitude") {
  tidyCoordinate(key);
  for (const axis of ["latitude", "longitude"] as const) {
    const message = coordinateBlurError(axis, form.latitude, form.longitude);
    // Only the field that was left says it aloud; the other one is cleared when it has become fine.
    if (axis === key && message) say(`${COORDINATE_NAMES[axis]}: ${message}`);
    if (axis === key || !message) liveCoordinate[axis] = message;
  }
}
/** Typing in a coordinate takes its blur error away; it is checked again on leaving. */
const clearCoordinate = (key: "latitude" | "longitude") => (liveCoordinate[key] = null);

/** The Placement section's one-line state in the rail: what is missing for the item to be found on the map. */
const placementState = computed(() => (form.latitude.trim() && form.longitude.trim() ? undefined : "No position yet"));
/** How many of the Details fields hold something, for the collapsed section's count. */
const detailsCount = computed(() => {
  const filled = [form.code, form.estimatedVisitMinutes, form.internalName].filter((v) => v.trim()).length + (form.featured ? 1 : 0);
  return `${filled} of 4 set`;
});
/** The Texts rail state: the languages that still lack texts. */
const textsState = computed(() => {
  const gaps = translationRows.value.filter((r) => r.filled < r.total);
  if (!gaps.length) return "Complete";
  return gaps.length === 1 ? `${gaps[0].language.displayName} incomplete` : `${gaps.length} languages incomplete`;
});
const railSections = computed(() => [{ id: "texts", label: "Texts", state: textsState.value }]);
/** A language other than the default is being translated: the language-independent cards fold away (C2-55). */
const otherFolded = computed(() => !!editor.activeLanguage && editor.activeLanguage !== defaultLanguage.value);

// The Translations panel counts the fields the content list counts for its completion dots.
const translationRows = computed(() => translationStatus(languages.value, POI_TEXT_FIELDS.length, (code) => filledFields(form.translations[code], POI_TEXT_FIELDS)));
</script>

<template>
  <EditorShell
    tabbed
    :editor="editor"
    back-label="Points of Interest"
    :back-to="{ name: 'pois', params: { projectId } }"
    :title="heading"
    :subtitle="subtitle"
    activation-hint="Activate it once the default-language title is set."
    :reference-link="toReference"
    :pending="languagesLoading"
    :translations="translationRows"
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
        title-required-hint="Required in the default language before it can be activated."
      />
    </div>

    <OtherSettings :folded="otherFolded" :section-ids="['placement', 'media', 'triggers', 'details']" summary="Placement, Media, How visitors reach it, Details">
      <EditorSection id="placement" title="Placement" :state="placementState">
        <div class="grid items-start gap-x-4 gap-y-3 md:grid-cols-2">
          <FormField id="f-place" label="Place" :error="editor.fieldError('placeId')" v-slot="f">
            <FilteredSelect :id="f.id" v-model="form.placeId" :options="placeChoices" empty-label="Not inside a Place" missing-label="(archived or unavailable place)" filter-label="Filter places" :disabled="!editor.editable" :aria-describedby="f.describedBy" :invalid="f.invalid" />
          </FormField>
          <FormField id="f-category" label="Category" :error="editor.fieldError('categoryId')" v-slot="f">
            <FilteredSelect :id="f.id" v-model="form.categoryId" :options="categoryChoices" empty-label="Uncategorised" missing-label="(archived or unavailable category)" filter-label="Filter categories" :disabled="!editor.editable" :aria-describedby="f.describedBy" :invalid="f.invalid" />
          </FormField>
          <FormField id="f-lat" label="Latitude" :error="editor.fieldError('latitude') ?? liveCoordinate.latitude" v-slot="f">
            <Input :id="f.id" v-model="form.latitude" :readonly="!editor.editable" inputmode="decimal" placeholder="e.g. 37.9715" class="font-mono text-compact" :aria-describedby="f.describedBy" :invalid="f.invalid" data-path="latitude" @input="clearCoordinate('latitude')" @blur="checkCoordinate('latitude')" />
          </FormField>
          <FormField id="f-lng" label="Longitude" :error="editor.fieldError('longitude') ?? liveCoordinate.longitude" v-slot="f">
            <Input :id="f.id" v-model="form.longitude" :readonly="!editor.editable" inputmode="decimal" placeholder="e.g. 23.7257" class="font-mono text-compact" :aria-describedby="f.describedBy" :invalid="f.invalid" data-path="longitude" @input="clearCoordinate('longitude')" @blur="checkCoordinate('longitude')" />
          </FormField>
        </div>
        <div class="flex flex-wrap items-center gap-x-3 gap-y-1">
          <Button variant="secondary" size="sm" type="button" :aria-expanded="mapOpen" aria-controls="placement-map" @click="mapOpen = !mapOpen">
            <MapPin aria-hidden="true" />{{ mapOpen ? "Hide the map" : form.latitude.trim() && form.longitude.trim() ? "Edit position on the map" : "Set position on the map" }}
          </Button>
          <span class="text-xs text-muted-foreground">Degrees, with a point or a comma. The pin and these fields stay in sync.</span>
        </div>
        <div v-if="mapOpen" id="placement-map">
          <GeoPicker
            :height="220"
            :label="areaMap ? areaMap.internalName : 'Site map'"
            :area="mapArea"
            :latitude="form.latitude"
            :longitude="form.longitude"
            :others="mapOthers"
            :anchors="mapAnchors"
            :disabled="!editor.editable"
            @pick="onMapPick"
          />
        </div>
      </EditorSection>

      <MediaSlots
        :project-id="projectId"
        :slots="MEDIA_SLOTS"
        :media="form.media"
        :assets="assets"
        :languages="languages"
        :default-language="defaultLanguage"
        :readonly="!editor.editable"
        :field-error="editor.fieldError"
        :item-status="editor.resource?.status"
        @uploaded="assets.unshift($event)"
      />

      <TriggersCard
        :triggers="form.triggers"
        :readonly="!editor.editable"
        :field-error="editor.fieldError"
        :position="{ latitude: form.latitude, longitude: form.longitude }"
        position-label="Use this point's position"
      />

      <EditorSection id="details" title="Details" collapsible :default-open="false" :count="detailsCount">
        <div class="grid gap-4 sm:grid-cols-2">
          <FormField id="f-code" label="Exhibit code" hint="The number a visitor types to open this object." :error="editor.fieldError('code')" v-slot="f">
            <Input :id="f.id" v-model="form.code" :readonly="!editor.editable" spellcheck="false" placeholder="e.g. KN-001" class="font-mono text-compact" :aria-describedby="f.describedBy" :invalid="f.invalid" />
          </FormField>
          <FormField id="f-minutes" label="Estimated visit minutes" :error="editor.fieldError('estimatedVisitMinutes')" v-slot="f">
            <Input :id="f.id" v-model="form.estimatedVisitMinutes" :readonly="!editor.editable" inputmode="numeric" placeholder="e.g. 5" class="font-mono text-compact" :aria-describedby="f.describedBy" :invalid="f.invalid" />
          </FormField>
          <FormField id="f-slug" label="Slug" hint="Part of the item's web address and of its QR targets. Changing it breaks printed QR codes." :error="editor.fieldError('slug')" class="sm:col-span-2" v-slot="f">
            <Input :id="f.id" v-model="form.slug" :readonly="!editor.editable" spellcheck="false" class="font-mono text-compact" :aria-describedby="f.describedBy" :invalid="f.invalid" />
          </FormField>
          <FormField id="f-internal" label="Internal name" hint="Only authors see it, for example an inventory number." class="sm:col-span-2" v-slot="f">
            <Input :id="f.id" v-model="form.internalName" :readonly="!editor.editable" :aria-describedby="f.describedBy" />
          </FormField>
        </div>
        <Checkbox v-model="form.featured" :disabled="!editor.editable" description="Highlighted in the visitor app's lists.">Featured</Checkbox>
      </EditorSection>
    </OtherSettings>
  </EditorShell>
</template>
