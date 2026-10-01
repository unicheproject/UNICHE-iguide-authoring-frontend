<script setup lang="ts">
import { computed, reactive, ref } from "vue";
import GeoPicker, { type GeoPoint } from "@/components/GeoPicker.vue";
import EditorShell from "@/components/editor/EditorShell.vue";
import TranslationsPanel, { type TextFieldGroup, type TextFieldMeta } from "@/components/editor/TranslationsPanel.vue";
import MediaSlots, { type MediaSlot } from "@/components/media/MediaSlots.vue";
import { SLUG_PATTERN } from "@/lib/format";
import { listAssets, type Asset, type MediaBinding } from "@/platform/assets";
import { assignableCategories, listCategories, type Category } from "@/platform/categories";
import { listPlaces, type Place } from "@/platform/places";
import {
  changePoiStatus,
  fetchPoi,
  fetchPoiReferences,
  listPois,
  POI_CODE_PATTERN,
  poiTitle,
  updatePoi,
  type Poi,
  type PoiTranslation,
} from "@/platform/pois";
import type { ResourceReference } from "@/platform/references";
import { useCurrentProject } from "@/workspace/currentProject";
import {
  checkCoordinates,
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
import { referenceLink } from "@/workspace/referenceLinks";
import { useProjectLanguages } from "@/workspace/useProjectLanguages";
import { useResourceEditor } from "@/workspace/useResourceEditor";
import { parentOptions } from "../places/placeTree";

const props = defineProps<{ poiId: string }>();
const project = useCurrentProject();
const projectId = computed(() => project.value.id);
const { languages, defaultLanguage, loading: languagesLoading } = useProjectLanguages(projectId);
const languageCodes = () => languages.value.map((l) => l.languageCode);

type TextKey = keyof PoiTranslation;
const TEXT_KEYS: TextKey[] = ["title", "summary", "description", "instructions", "accessibilityInformation", "seoTitle", "seoDescription"];

const TEXT_META: Record<TextKey, TextFieldMeta> = {
  title: { label: "Title", multiline: false },
  summary: { label: "Summary", multiline: true, helper: "Short text shown in lists; aim for a reading level a twelve-year-old follows." },
  description: { label: "Description", multiline: true },
  instructions: { label: "Instructions", multiline: true, helper: "How to find it and what to do when standing there." },
  accessibilityInformation: {
    label: "Accessibility information",
    multiline: true,
    helper: "Physical access, sensory conditions, quiet spaces, assistance, what is not accessible.",
  },
  seoTitle: { label: "Title for search and sharing", multiline: false, helper: "Leave empty to use the title." },
  seoDescription: { label: "Description for search and sharing", multiline: true, helper: "Leave empty to use the summary." },
};
const GROUPS: TextFieldGroup[] = [
  { id: "main", label: null, keys: ["title", "summary", "description"] },
  { id: "secondary", label: "More texts", keys: ["instructions", "accessibilityInformation"], open: true },
  { id: "seo", label: "Search and sharing", keys: ["seoTitle", "seoDescription"], open: false },
];
// The mockup's media slots of a Point of Interest.
const MEDIA_SLOTS: MediaSlot[] = [
  { usage: "HERO_IMAGE", label: "Primary image", accept: ["IMAGE"], recommended: true },
  { usage: "VIDEO", label: "Video", accept: ["VIDEO"] },
  { usage: "AUDIO_NARRATION", label: "Audio narration", accept: ["AUDIO"], perLanguage: true },
  { usage: "GALLERY_IMAGE", label: "Gallery", accept: ["IMAGE"], multiple: true },
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
});

const editor = useResourceEditor<Poi>({
  kind: "point of interest",
  source: () => props.poiId,
  languages,
  defaultLanguage,
  async load() {
    const [poi, allPlaces, pois, library, allCategories] = await Promise.all([
      fetchPoi(projectId.value, props.poiId),
      listPlaces(projectId.value),
      listPois(projectId.value),
      listAssets(projectId.value),
      listCategories(projectId.value),
    ]);
    places.value = allPlaces;
    categories.value = allCategories;
    allPois.value = pois;
    assets.value = library;
    return poi;
  },
  save: (poi, version) =>
    updatePoi(projectId.value, poi.id, {
      version,
      slug: form.slug,
      placeId: form.placeId || null,
      categoryId: form.categoryId || null,
      code: optionalText(form.code),
      internalName: optionalText(form.internalName),
      latitude: optionalNumber(form.latitude),
      longitude: optionalNumber(form.longitude),
      estimatedVisitMinutes: optionalNumber(form.estimatedVisitMinutes),
      featured: form.featured,
      translations: textsForApi(TEXT_KEYS, languageCodes(), form.translations),
      media: form.media.map((m) => ({ ...m })),
    }),
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
    checkCoordinates(form.latitude, form.longitude, found);
    const minutes = form.estimatedVisitMinutes.trim();
    if (minutes && !isWholeNumber(minutes, 1, 1440)) found.estimatedVisitMinutes = "A whole number of minutes between 1 and 1440.";
    return found;
  },
  describePath: (path) =>
    /^media\[/.test(path) ? "Media" : (describeTranslationPath(path, languages.value, TEXT_META) ?? FIELD_NAMES[path] ?? path),
});

const toReference = (r: ResourceReference) => referenceLink(projectId.value, r);

const heading = computed(() => (editor.resource ? poiTitle(editor.resource, defaultLanguage.value) : "Point of interest"));
const subtitle = computed(() => {
  const p = editor.resource;
  return p ? ["Point of interest", p.code ? `exhibit ${p.code}` : null, p.slug].filter(Boolean).join(" · ") : "";
});
const placeChoices = computed(() => parentOptions(places.value, defaultLanguage.value));
const categoryChoices = computed(() => assignableCategories(categories.value, "POI", defaultLanguage.value));
const categoryMissing = computed(() => !!form.categoryId && !categoryChoices.value.some((o) => o.id === form.categoryId));
const placeMissing = computed(() => !!form.placeId && !placeChoices.value.some((o) => o.id === form.placeId));

// Site map: the other points of interest as dots; the area comes from every saved coordinate in the
// Project, so it stays put while the author moves this pin.
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
function onMapPick(lat: string, lng: string) {
  form.latitude = lat;
  form.longitude = lng;
}
</script>

<template>
  <EditorShell
    :editor="editor"
    back-label="Points of Interest"
    :back-to="{ name: 'pois', params: { projectId } }"
    :title="heading"
    :subtitle="subtitle"
    activation-hint="Activate it once the default-language title is set."
    :reference-link="toReference"
    :pending="languagesLoading"
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
      title-required-hint="Required in the default language before it can be activated."
    />

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

    <section class="overflow-hidden rounded-lg border bg-card">
      <div class="border-b px-5 py-3.5">
        <h2 class="text-[11px] font-extrabold uppercase tracking-[0.09em] text-muted-foreground">Placement</h2>
      </div>
      <div class="flex flex-wrap items-start gap-[18px] px-5 py-[18px]">
        <div class="flex min-w-0 flex-[1_1_220px] flex-col gap-3.5">
          <div class="flex flex-col gap-1.5">
            <label for="f-place" class="small-label">Place</label>
            <select
              id="f-place"
              v-model="form.placeId"
              :disabled="!editor.editable"
              class="field-input"
              :class="{ invalid: editor.fieldError('placeId') }"
            >
              <option value="">Not inside a Place</option>
              <option v-if="placeMissing" :value="form.placeId">(archived or unavailable place)</option>
              <option v-for="o in placeChoices" :key="o.id" :value="o.id">{{ o.label }}</option>
            </select>
            <span v-if="editor.fieldError('placeId')" class="text-xs font-semibold text-destructive">⚠ {{ editor.fieldError("placeId") }}</span>
            <span v-else class="text-xs text-muted-foreground">Which building, floor or gallery holds it.</span>
          </div>
          <div class="flex flex-col gap-1.5">
            <label for="f-category" class="small-label">Category</label>
            <select
              id="f-category"
              v-model="form.categoryId"
              :disabled="!editor.editable"
              class="field-input"
              :class="{ invalid: editor.fieldError('categoryId') }"
            >
              <option value="">Uncategorised</option>
              <option v-if="categoryMissing" :value="form.categoryId">(archived or unavailable category)</option>
              <option v-for="o in categoryChoices" :key="o.id" :value="o.id">{{ o.label }}</option>
            </select>
            <span v-if="editor.fieldError('categoryId')" class="text-xs font-semibold text-destructive">⚠ {{ editor.fieldError("categoryId") }}</span>
            <span v-else class="text-xs text-muted-foreground">Drives filtering and grouping in the app.</span>
          </div>
          <div class="flex gap-2.5">
            <div class="flex min-w-0 flex-1 flex-col gap-1.5">
              <label for="f-lat" class="small-label">Latitude</label>
              <input
                id="f-lat"
                v-model="form.latitude"
                :readonly="!editor.editable"
                inputmode="decimal"
                placeholder="—"
                class="field-input font-mono text-[13px]"
                :class="{ invalid: editor.fieldError('latitude') }"
              />
              <span v-if="editor.fieldError('latitude')" class="text-xs font-semibold text-destructive">⚠ {{ editor.fieldError("latitude") }}</span>
            </div>
            <div class="flex min-w-0 flex-1 flex-col gap-1.5">
              <label for="f-lng" class="small-label">Longitude</label>
              <input
                id="f-lng"
                v-model="form.longitude"
                :readonly="!editor.editable"
                inputmode="decimal"
                placeholder="—"
                class="field-input font-mono text-[13px]"
                :class="{ invalid: editor.fieldError('longitude') }"
              />
              <span v-if="editor.fieldError('longitude')" class="text-xs font-semibold text-destructive">⚠ {{ editor.fieldError("longitude") }}</span>
            </div>
          </div>
        </div>
        <GeoPicker
          class="flex-[1_1_260px]"
          label="Site map"
          :latitude="form.latitude"
          :longitude="form.longitude"
          :others="mapOthers"
          :anchors="mapAnchors"
          :disabled="!editor.editable"
          @pick="onMapPick"
        />
      </div>
    </section>

    <section class="overflow-hidden rounded-lg border bg-card">
      <div class="border-b px-5 py-3.5">
        <h2 class="text-[11px] font-extrabold uppercase tracking-[0.09em] text-muted-foreground">Details</h2>
      </div>
      <div class="flex flex-col gap-3.5 px-5 py-[18px]">
        <div class="flex flex-wrap gap-3">
          <div class="flex min-w-[160px] flex-1 flex-col gap-1.5">
            <label for="f-code" class="small-label">Exhibit code</label>
            <input
              id="f-code"
              v-model="form.code"
              :readonly="!editor.editable"
              spellcheck="false"
              placeholder="KN-001"
              class="field-input font-mono text-[13px]"
              :class="{ invalid: editor.fieldError('code') }"
            />
            <span v-if="editor.fieldError('code')" class="text-xs font-semibold text-destructive">⚠ {{ editor.fieldError("code") }}</span>
            <span v-else class="text-xs text-muted-foreground">The number a visitor types to open this object.</span>
          </div>
          <div class="flex min-w-[160px] flex-1 flex-col gap-1.5">
            <label for="f-minutes" class="small-label">Estimated visit minutes</label>
            <input
              id="f-minutes"
              v-model="form.estimatedVisitMinutes"
              :readonly="!editor.editable"
              inputmode="numeric"
              placeholder="—"
              class="field-input font-mono text-[13px]"
              :class="{ invalid: editor.fieldError('estimatedVisitMinutes') }"
            />
            <span v-if="editor.fieldError('estimatedVisitMinutes')" class="text-xs font-semibold text-destructive">
              ⚠ {{ editor.fieldError("estimatedVisitMinutes") }}
            </span>
          </div>
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
          />
          <span v-if="editor.fieldError('slug')" class="text-xs font-semibold text-destructive">⚠ {{ editor.fieldError("slug") }}</span>
          <span v-else class="text-xs text-muted-foreground">Used in URLs and QR targets. Changing it breaks printed QR codes.</span>
        </div>
        <div class="flex flex-col gap-1.5">
          <label for="f-internal" class="small-label">Internal name</label>
          <input id="f-internal" v-model="form.internalName" :readonly="!editor.editable" class="field-input" />
          <span class="text-xs text-muted-foreground">Only authors see it, for example an inventory number.</span>
        </div>
        <label class="flex items-center gap-2.5 text-[13px] font-semibold">
          <input v-model="form.featured" type="checkbox" :disabled="!editor.editable" class="h-4 w-4 accent-primary" />
          Featured: highlighted in the visitor app's lists
        </label>
      </div>
    </section>

  </EditorShell>
</template>
