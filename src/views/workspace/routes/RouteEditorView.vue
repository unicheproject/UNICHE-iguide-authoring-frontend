<script setup lang="ts">
import { computed, nextTick, reactive, ref } from "vue";
import AppDialog from "@/components/AppDialog.vue";
import RouteMap, { type RouteMapStop } from "@/components/RouteMap.vue";
import EditorShell from "@/components/editor/EditorShell.vue";
import TranslationsPanel, { type TextFieldGroup, type TextFieldMeta } from "@/components/editor/TranslationsPanel.vue";
import MediaSlots, { type MediaSlot } from "@/components/media/MediaSlots.vue";
import { SLUG_PATTERN, statusChipStyle } from "@/lib/format";
import { listAssets, type Asset, type MediaBinding } from "@/platform/assets";
import { assignableCategories, listCategories, type Category } from "@/platform/categories";
import { listPois, poiTitle, type Poi } from "@/platform/pois";
import {
  changeRouteStatus,
  fetchRoute,
  fetchRouteReferences,
  ROUTE_DIFFICULTIES,
  ROUTE_MODES,
  ROUTE_TYPES,
  ROUTE_TYPE_HINTS,
  routeDifficultyLabel,
  routeTitle,
  routeModeLabel,
  routeTypeLabel,
  updateRoute,
  type Route,
  type RouteDifficulty,
  type RouteMode,
  type RouteStop,
  type RouteStopTranslation,
  type RouteTranslation,
  type RouteType,
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
const ROUTE_TEXT_KEYS: RouteTextKey[] = ["title", "summary", "description", "instructions", "seoTitle", "seoDescription"];
const STOP_TEXT_KEYS: StopTextKey[] = ["titleOverride", "description", "navigationInstructions", "narrative"];

const TEXT_META: Record<RouteTextKey, TextFieldMeta> = {
  title: { label: "Title", multiline: false },
  summary: { label: "Summary", multiline: true, helper: "Short text shown in lists: what the visitor will see and for how long." },
  description: { label: "Description", multiline: true },
  instructions: { label: "Instructions", multiline: true, helper: "Where it starts and what to bring." },
  seoTitle: { label: "Title for search and sharing", multiline: false, helper: "Leave empty to use the title." },
  seoDescription: { label: "Description for search and sharing", multiline: true, helper: "Leave empty to use the summary." },
};
const GROUPS: TextFieldGroup[] = [
  { id: "main", label: null, keys: ["title", "summary", "description"] },
  { id: "secondary", label: "More texts", keys: ["instructions"], open: true },
  { id: "seo", label: "Search and sharing", keys: ["seoTitle", "seoDescription"], open: false },
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

interface StopForm {
  /** Stable list key, also for stops that are not saved yet. */
  key: string;
  id: string | null;
  poiId: string;
  optional: boolean;
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
});

function toStopForm(stop: RouteStop): StopForm {
  return {
    key: stop.id ?? `new-${++keyCounter}`,
    id: stop.id,
    poiId: stop.poiId,
    optional: stop.optional,
    translations: Object.fromEntries(Object.entries(stop.translations).map(([code, t]) => [code, textsFrom(STOP_TEXT_KEYS, t)])),
  };
}

const editor = useResourceEditor<Route>({
  kind: "route",
  source: () => props.routeId,
  languages,
  defaultLanguage,
  async load() {
    const [route, allPois, library, allCategories] = await Promise.all([
      fetchRoute(projectId.value, props.routeId),
      listPois(projectId.value),
      listAssets(projectId.value),
      listCategories(projectId.value),
    ]);
    pois.value = allPois;
    assets.value = library;
    categories.value = allCategories;
    return route;
  },
  save: (route, version) =>
    updateRoute(projectId.value, route.id, {
      version,
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
        optional: s.optional,
        translations: textsForApi(STOP_TEXT_KEYS, languageCodes(), s.translations),
      })),
      media: form.media.map((m) => ({ ...m })),
    }),
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
    return found;
  },
  describePath(path) {
    const stop = /^stops\[(\d+)\]/.exec(path);
    if (stop) return `Stop ${Number(stop[1]) + 1}`;
    if (/^media\[/.test(path)) return "Media";
    return describeTranslationPath(path, languages.value, TEXT_META) ?? FIELD_NAMES[path] ?? path;
  },
});

const toReference = (r: ResourceReference) => referenceLink(projectId.value, r);

const heading = computed(() => (editor.resource ? routeTitle(editor.resource, defaultLanguage.value) : "Route"));
const subtitle = computed(() => (editor.resource ? `${routeTypeLabel(editor.resource.type)} route · ${editor.resource.slug}` : ""));
const activeLanguageInfo = computed(() => editor.activeLanguageInfo);

// Stops -----------------------------------------------------------------------------------------------

const openStopTexts = reactive<Record<string, boolean>>({});

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

/** Moves a stop and keeps keyboard focus on the same button, so repeated presses keep moving it. */
function moveStop(index: number, delta: number) {
  const target = index + delta;
  if (target < 0 || target >= form.stops.length) return;
  const [stop] = form.stops.splice(index, 1);
  form.stops.splice(target, 0, stop);
  void nextTick(() => document.getElementById(`stop-move-${stop.key}-${delta < 0 ? "up" : "down"}`)?.focus());
}

function removeStop(index: number) {
  form.stops.splice(index, 1);
}

const categoryChoices = computed(() => assignableCategories(categories.value, "ROUTE", defaultLanguage.value));
const categoryMissing = computed(() => !!form.categoryId && !categoryChoices.value.some((o) => o.id === form.categoryId));
const hasActiveStop = computed(() => form.stops.some((s) => poiById.value.get(s.poiId)?.status === "ACTIVE"));

const mapStops = computed<RouteMapStop[]>(() =>
  form.stops.map((s, i) => {
    const poi = poiById.value.get(s.poiId);
    return { number: i + 1, title: stopTitle(s), lat: poi?.latitude ?? null, lng: poi?.longitude ?? null, optional: s.optional };
  }),
);

const picking = ref(false);
const pickQuery = ref("");
const pickable = computed(() => {
  const used = new Set(form.stops.map((s) => s.poiId));
  const q = pickQuery.value.trim().toLowerCase();
  return pois.value
    .filter((p) => p.status !== "ARCHIVED" && !used.has(p.id))
    .filter((p) => !q || poiTitle(p, defaultLanguage.value).toLowerCase().includes(q) || (p.code ?? "").toLowerCase().includes(q))
    .sort((a, b) => a.sortOrder - b.sortOrder);
});

function addStop(poi: Poi) {
  const stop: StopForm = {
    key: `new-${++keyCounter}`,
    id: null,
    poiId: poi.id,
    optional: false,
    translations: Object.fromEntries(languageCodes().map((code) => [code, blankTexts(STOP_TEXT_KEYS)])),
  };
  form.stops.push(stop);
  picking.value = false;
  pickQuery.value = "";
}

function chipClass(selected: boolean) {
  return selected ? "border-primary bg-primary text-white" : "border-gray-200 bg-white text-gray-700 hover:border-primary";
}

// The Translations panel counts the fields the content list counts for its completion dots.
const translationRows = computed(() => translationStatus(languages.value, ROUTE_TEXT_FIELDS.length, (code) => filledFields(form.translations[code], ROUTE_TEXT_FIELDS)));
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
      title-required-hint="Required in the default language before the route can be activated."
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
        <h2 class="text-[11px] font-extrabold uppercase tracking-[0.09em] text-muted-foreground">Route metadata</h2>
      </div>
      <div class="flex flex-col gap-[18px] px-5 py-[18px]">
        <div class="flex flex-col gap-2" role="group" aria-labelledby="route-type-label">
          <span id="route-type-label" class="small-label">Setting</span>
          <div class="flex flex-wrap gap-[7px]">
            <button
              v-for="t in ROUTE_TYPES"
              :key="t"
              type="button"
              :disabled="!editor.editable"
              :aria-pressed="form.type === t"
              class="rounded-full border-[1.5px] px-3.5 py-[7px] text-[11px] font-bold disabled:cursor-default"
              :class="chipClass(form.type === t)"
              @click="form.type = t"
            >
              {{ routeTypeLabel(t) }}
            </button>
          </div>
          <span class="text-xs text-muted-foreground">{{ ROUTE_TYPE_HINTS[form.type] }}.</span>
        </div>
        <div class="flex flex-col gap-2" role="group" aria-labelledby="route-mode-label">
          <span id="route-mode-label" class="small-label">Mode</span>
          <div class="flex flex-wrap gap-[7px]">
            <button
              v-for="m in ROUTE_MODES"
              :key="m"
              type="button"
              :disabled="!editor.editable"
              :aria-pressed="form.mode === m"
              class="rounded-full border-[1.5px] px-3.5 py-[7px] text-[11px] font-bold disabled:cursor-default"
              :class="chipClass(form.mode === m)"
              @click="form.mode = form.mode === m ? null : m"
            >
              {{ routeModeLabel(m) }}
            </button>
          </div>
        </div>
        <div class="flex flex-col gap-2" role="group" aria-labelledby="route-difficulty-label">
          <span id="route-difficulty-label" class="small-label">Difficulty</span>
          <div class="flex flex-wrap gap-[7px]">
            <button
              v-for="d in ROUTE_DIFFICULTIES"
              :key="d"
              type="button"
              :disabled="!editor.editable"
              :aria-pressed="form.difficulty === d"
              class="rounded-full border-[1.5px] px-3.5 py-[7px] text-[11px] font-bold disabled:cursor-default"
              :class="chipClass(form.difficulty === d)"
              @click="form.difficulty = form.difficulty === d ? null : d"
            >
              {{ routeDifficultyLabel(d) }}
            </button>
          </div>
          <span class="text-xs text-muted-foreground">Click the selected difficulty again to leave it unset.</span>
        </div>
        <div class="flex flex-wrap items-end gap-4">
          <div class="flex flex-[0_0_150px] flex-col gap-1.5">
            <label for="rt-minutes" class="small-label">Route total (min)</label>
            <input
              id="rt-minutes"
              v-model="form.estimatedDurationMinutes"
              :readonly="!editor.editable"
              inputmode="numeric"
              class="field-input"
              :class="{ invalid: editor.fieldError('estimatedDurationMinutes') }"
            />
          </div>
          <div class="flex flex-[0_0_150px] flex-col gap-1.5">
            <label for="rt-distance" class="small-label">Distance (m)</label>
            <input
              id="rt-distance"
              v-model="form.distanceMeters"
              :readonly="!editor.editable"
              inputmode="numeric"
              placeholder="e.g. 2400"
              class="field-input"
              :class="{ invalid: editor.fieldError('distanceMeters') }"
            />
          </div>
          <div class="flex min-w-[200px] flex-1 flex-col gap-1.5">
            <label for="rt-category" class="small-label">Category</label>
            <select id="rt-category" v-model="form.categoryId" :disabled="!editor.editable" class="field-input" :class="{ invalid: editor.fieldError('categoryId') }">
              <option value="">Uncategorised</option>
              <option v-if="categoryMissing" :value="form.categoryId">(archived or unavailable category)</option>
              <option v-for="o in categoryChoices" :key="o.id" :value="o.id">{{ o.label }}</option>
            </select>
          </div>
        </div>
        <span v-if="editor.fieldError('categoryId')" class="text-xs font-semibold text-destructive">⚠ {{ editor.fieldError("categoryId") }}</span>
        <span v-if="editor.fieldError('estimatedDurationMinutes')" class="text-xs font-semibold text-destructive">
          ⚠ {{ editor.fieldError("estimatedDurationMinutes") }}
        </span>
        <span v-if="editor.fieldError('distanceMeters')" class="text-xs font-semibold text-destructive">⚠ {{ editor.fieldError("distanceMeters") }}</span>
        <label class="flex items-center gap-2.5 text-[13px] font-semibold">
          <input v-model="form.loop" type="checkbox" :disabled="!editor.editable" class="h-4 w-4 accent-primary" />
          Loop: the route ends where it started
        </label>
      </div>
    </section>

    <section class="overflow-hidden rounded-lg border bg-card">
      <div class="flex items-center gap-2.5 border-b px-5 py-3.5">
        <h2 class="flex-1 text-[11px] font-extrabold uppercase tracking-[0.09em] text-muted-foreground">Stops ({{ form.stops.length }})</h2>
      </div>
      <div class="border-b border-gray-100 px-5 py-4">
        <RouteMap :stops="mapStops" :loop="form.loop" />
      </div>
      <p v-if="!hasActiveStop" class="border-b border-gray-100 px-5 py-3 text-xs font-semibold text-destructive">
        ⚠ At least one stop must be an ACTIVE point of interest before the route can be activated.
      </p>
      <p v-if="editor.fieldError('stops')" class="border-b border-gray-100 px-5 py-3 text-xs font-semibold text-destructive">
        ⚠ {{ editor.fieldError("stops") }}
      </p>
      <ol>
        <li v-for="(stop, index) in form.stops" :key="stop.key" class="border-b border-gray-100 px-5 py-3.5">
          <div class="flex flex-wrap items-center gap-2.5">
            <span class="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-extrabold text-white" aria-hidden="true">
              {{ index + 1 }}
            </span>
            <RouterLink :to="{ name: 'poi-editor', params: { projectId, poiId: stop.poiId } }" class="min-w-[140px] flex-1 text-[13px] font-bold">
              <span class="sr-only">Stop {{ index + 1 }}: </span>{{ stopTitle(stop) }}
            </RouterLink>
            <span
              v-if="poiById.get(stop.poiId) && poiById.get(stop.poiId)!.status !== 'ACTIVE'"
              class="rounded-full px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-[0.07em]"
              :style="statusChipStyle(poiById.get(stop.poiId)!.status)"
              :title="'The point of interest is ' + poiById.get(stop.poiId)!.status"
            >
              {{ poiById.get(stop.poiId)!.status }}
            </span>
            <label class="flex items-center gap-[7px] text-[11px] font-bold uppercase tracking-[0.06em] text-muted-foreground">
              <input v-model="stop.optional" type="checkbox" :disabled="!editor.editable" class="h-4 w-4 accent-primary" />
              Optional
            </label>
            <template v-if="editor.editable">
              <button
                :id="`stop-move-${stop.key}-up`"
                type="button"
                class="px-1 text-[13px] text-muted-foreground disabled:opacity-30"
                :disabled="index === 0"
                :aria-label="`Move stop ${index + 1} up`"
                @click="moveStop(index, -1)"
              >
                ↑
              </button>
              <button
                :id="`stop-move-${stop.key}-down`"
                type="button"
                class="px-1 text-[13px] text-muted-foreground disabled:opacity-30"
                :disabled="index === form.stops.length - 1"
                :aria-label="`Move stop ${index + 1} down`"
                @click="moveStop(index, 1)"
              >
                ↓
              </button>
              <button type="button" class="px-1 text-[13px] text-destructive" :aria-label="`Remove stop ${index + 1}`" @click="removeStop(index)">✕</button>
            </template>
          </div>
          <div v-if="activeLanguageInfo && stop.translations[activeLanguageInfo.languageCode]" class="mt-2.5 flex flex-wrap gap-2.5">
            <input
              v-model="stop.translations[activeLanguageInfo.languageCode].navigationInstructions"
              :readonly="!editor.editable"
              :aria-label="`Walking instructions to stop ${index + 1}, ${activeLanguageInfo.displayName}`"
              :lang="activeLanguageInfo.languageCode"
              :dir="activeLanguageInfo.direction.toLowerCase()"
              placeholder="Walking instructions to this stop"
              class="field-input stop-input w-auto min-w-[180px] flex-1"
            />
            <button
              type="button"
              class="text-[10px] font-bold uppercase tracking-[0.06em] text-primary"
              :aria-expanded="!!openStopTexts[stop.key]"
              @click="openStopTexts[stop.key] = !openStopTexts[stop.key]"
            >
              Stop texts {{ openStopTexts[stop.key] ? "▴" : "▾" }}
            </button>
          </div>
          <div
            v-if="openStopTexts[stop.key] && activeLanguageInfo && stop.translations[activeLanguageInfo.languageCode]"
            class="mt-3 flex flex-col gap-2.5 border-l-2 border-gray-100 pl-3"
          >
            <label class="small-label" :for="`stop-title-${stop.key}`">Title at this stop</label>
            <input
              :id="`stop-title-${stop.key}`"
              v-model="stop.translations[activeLanguageInfo.languageCode].titleOverride"
              :readonly="!editor.editable"
              :lang="activeLanguageInfo.languageCode"
              :dir="activeLanguageInfo.direction.toLowerCase()"
              placeholder="Leave empty to use the point of interest's title"
              class="field-input stop-input"
            />
            <label class="small-label" :for="`stop-desc-${stop.key}`">Description</label>
            <textarea
              :id="`stop-desc-${stop.key}`"
              v-model="stop.translations[activeLanguageInfo.languageCode].description"
              :readonly="!editor.editable"
              :lang="activeLanguageInfo.languageCode"
              :dir="activeLanguageInfo.direction.toLowerCase()"
              class="field-input stop-input min-h-[64px] resize-y"
            ></textarea>
            <label class="small-label" :for="`stop-narr-${stop.key}`">Narrative</label>
            <textarea
              :id="`stop-narr-${stop.key}`"
              v-model="stop.translations[activeLanguageInfo.languageCode].narrative"
              :readonly="!editor.editable"
              :lang="activeLanguageInfo.languageCode"
              :dir="activeLanguageInfo.direction.toLowerCase()"
              class="field-input stop-input min-h-[64px] resize-y"
            ></textarea>
            <span class="text-xs text-muted-foreground">Narration starts with the stop title, so a visitor listening only knows where they are.</span>
          </div>
          <p v-if="stopError(index)" class="mt-2 text-xs font-semibold text-destructive">⚠ {{ stopError(index) }}</p>
        </li>
      </ol>
      <p v-if="!form.stops.length" class="px-5 py-4 text-[13px] text-muted-foreground">
        No stops yet. Add the points of interest in the order visitors meet them.
      </p>
      <div class="px-5 py-3.5">
        <button
          type="button"
          class="rounded-full border bg-muted px-4 py-2 text-[10px] font-bold uppercase tracking-[0.06em] text-gray-700 disabled:opacity-50"
          :disabled="!editor.editable"
          @click="picking = true"
        >
          Add stop
        </button>
      </div>
    </section>

    <section class="overflow-hidden rounded-lg border bg-card">
      <div class="border-b px-5 py-3.5">
        <h2 class="text-[11px] font-extrabold uppercase tracking-[0.09em] text-muted-foreground">Details</h2>
      </div>
      <div class="flex flex-col gap-3.5 px-5 py-[18px]">
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
        </div>
        <label class="flex items-center gap-2.5 text-[13px] font-semibold">
          <input v-model="form.featured" type="checkbox" :disabled="!editor.editable" class="h-4 w-4 accent-primary" />
          Featured: highlighted in the visitor app's lists
        </label>
      </div>
    </section>

  </EditorShell>

  <AppDialog v-if="picking" title="Add a stop" @close="picking = false">
    <p class="mb-3 text-[13px] text-gray-700">
      Stops are ordered. At least one stop must be an active point of interest before the route can be activated.
    </p>
    <input
      v-model="pickQuery"
      type="search"
      aria-label="Search points of interest"
      placeholder="Search by title or exhibit code"
      class="mb-3 w-full rounded-lg border-[1.5px] px-3 py-[9px] text-[13px] focus:border-primary focus:outline-none"
    />
    <ul v-if="pickable.length" class="max-h-[280px] overflow-y-auto rounded-lg border">
      <li v-for="p in pickable" :key="p.id" class="border-b border-gray-100 last:border-b-0">
        <button type="button" class="flex w-full items-center gap-2.5 px-3.5 py-[11px] text-left text-[13px] text-gray-700 hover:bg-muted" @click="addStop(p)">
          <span class="flex-1">{{ poiTitle(p, defaultLanguage) }}</span>
          <span v-if="p.code" class="font-mono text-[10px] text-muted-foreground">{{ p.code }}</span>
          <span class="rounded-full px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-[0.07em]" :style="statusChipStyle(p.status)">{{ p.status }}</span>
        </button>
      </li>
    </ul>
    <p v-else class="text-[13px] text-muted-foreground">
      {{ pois.length ? "No other point of interest matches. Each can be a stop once per route." : "The Project has no points of interest yet." }}
    </p>
    <template #actions>
      <button type="button" class="dialog-secondary" @click="picking = false">Cancel</button>
    </template>
  </AppDialog>
</template>

<style scoped>
/* Stop rows are denser than the main fields. */
.stop-input {
  padding: 8px 10px;
  font-size: 13px;
}
</style>
