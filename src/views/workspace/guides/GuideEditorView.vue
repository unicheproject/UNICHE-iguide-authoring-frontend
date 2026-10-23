<script setup lang="ts">
import { computed, nextTick, reactive, ref } from "vue";
import AppDialog from "@/components/AppDialog.vue";
import EditorShell from "@/components/editor/EditorShell.vue";
import StoryEditor from "@/components/editor/StoryEditor.vue";
import { blocksForApi, blocksToForm, type StoryBlockForm } from "@/components/editor/StoryEditor";
import TranslationsPanel, { type TextFieldGroup, type TextFieldMeta } from "@/components/editor/TranslationsPanel.vue";
import MediaSlots, { type MediaSlot } from "@/components/media/MediaSlots.vue";
import TriggersCard from "@/components/editor/TriggersCard.vue";
import { listTargetTriggers, syncTriggers, triggerToForm, type Trigger, type TriggerForm } from "@/platform/triggers";
import { SLUG_PATTERN, statusChipStyle } from "@/lib/format";
import { listAssets, type Asset, type MediaBinding } from "@/platform/assets";
import {
  changeGuideStatus,
  fetchGuide,
  fetchGuideReferences,
  guideFromResponse,
  guideTitle,
  guideWorkingCopyError,
  guideWorkingCopyPayload,
  readingMinutes,
  updateGuide,
  type Guide,
  type UpdateGuideInput,
  type GuideItemType,
  type GuideTranslation,
} from "@/platform/guides";
import { eventTitle, listEvents, type CmsEvent } from "@/platform/events";
import { listPlaces, placeTitle, type Place, type ResourceStatus } from "@/platform/places";
import { listPois, poiTitle, type Poi } from "@/platform/pois";
import { listRoutes, routeTitle, type Route } from "@/platform/routes";
import { useCurrentProject } from "@/workspace/currentProject";
import {
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
import { heroBlock, mediaBlocks, previewLanguages, storyImage, textBlocks, textIn, type PreviewBlock, type PreviewModel, type StoryNode } from "@/workspace/preview";
import { filledFields, translationStatus } from "@/workspace/translationStatus";
import { useProjectLanguages } from "@/workspace/useProjectLanguages";
import { useResourceEditor } from "@/workspace/useResourceEditor";

const props = defineProps<{ guideId: string }>();
const project = useCurrentProject();
const projectId = computed(() => project.value.id);
const { languages, defaultLanguage, loading: languagesLoading } = useProjectLanguages(projectId);
const languageCodes = () => languages.value.map((l) => l.languageCode);

type TextKey = Exclude<keyof GuideTranslation, "body">;
const TEXT_KEYS: TextKey[] = ["title", "summary", "seoTitle", "seoDescription"];

const TEXT_META: Record<TextKey | "body", TextFieldMeta> = {
  title: { label: "Title", multiline: false },
  summary: { label: "Summary", multiline: true, helper: "Short text shown in lists and when sharing: what the reader will learn." },
  seoTitle: { label: "Title for search and sharing", multiline: false, helper: "Leave empty to use the title." },
  seoDescription: { label: "Description for search and sharing", multiline: true, helper: "Leave empty to use the summary." },
  body: { label: "Story", multiline: true },
};
const GROUPS: TextFieldGroup[] = [
  { id: "main", label: null, keys: ["title", "summary"] },
  { id: "seo", label: "Search and sharing", keys: ["seoTitle", "seoDescription"], open: false },
];
const MEDIA_SLOTS: MediaSlot[] = [
  { usage: "HERO_IMAGE", label: "Primary image", accept: ["IMAGE"], recommended: true },
  { usage: "GALLERY_IMAGE", label: "Gallery", accept: ["IMAGE"], multiple: true },
];

const FIELD_NAMES: Record<string, string> = {
  slug: "Slug",
  internalName: "Internal name",
  estimatedReadingMinutes: "Reading time",
  items: "Related",
};

const ITEM_TYPES: { type: GuideItemType; label: string; plural: string }[] = [
  { type: "POI", label: "Point of interest", plural: "Points of interest" },
  { type: "ROUTE", label: "Route", plural: "Routes" },
  { type: "PLACE", label: "Place", plural: "Places" },
  { type: "EVENT", label: "Event", plural: "Events" },
];

// Everything a related item can point at, with the media library for the slots and the story's images.
const pois = ref<Poi[]>([]);
const routes = ref<Route[]>([]);
const places = ref<Place[]>([]);
const events = ref<CmsEvent[]>([]);
const assets = ref<Asset[]>([]);

interface Relatable {
  id: string;
  title: string;
  status: ResourceStatus;
}

const relatables = computed<Record<string, Map<string, Relatable>>>(() => {
  const lang = defaultLanguage.value;
  const map = <T extends { id: string; status: ResourceStatus }>(list: T[], title: (item: T) => string) =>
    new Map(list.map((item) => [item.id, { id: item.id, title: title(item), status: item.status }]));
  return {
    POI: map(pois.value, (p) => poiTitle(p, lang)),
    ROUTE: map(routes.value, (r) => routeTitle(r, lang)),
    PLACE: map(places.value, (p) => placeTitle(p, null, lang)),
    EVENT: map(events.value, (e) => eventTitle(e, lang)),
  };
});

interface ItemForm {
  key: string;
  resourceType: GuideItemType;
  resourceId: string;
}

let keyCounter = 0;
const form = reactive({
  slug: "",
  internalName: "",
  estimatedReadingMinutes: "",
  featured: false,
  translations: {} as Record<string, Texts<TextKey>>,
  bodies: {} as Record<string, StoryBlockForm[]>,
  items: [] as ItemForm[],
  media: [] as MediaBinding[],
  triggers: [] as TriggerForm[],
});
// The triggers as last loaded or saved; the form is reset from them with the Guide.
const savedTriggers = ref<Trigger[]>([]);

/** The editable state from the form, for a DRAFT save and a working copy alike. */
function input(): Omit<UpdateGuideInput, "version"> {
  const texts = textsForApi(TEXT_KEYS, languageCodes(), form.translations);
  const translations = Object.fromEntries(
    Object.entries(texts).map(([code, t]) => {
      const blocks = blocksForApi(form.bodies[code] ?? []);
      return [code, { ...t, body: blocks.length ? { blocks } : null }];
    }),
  );
  return {
    slug: form.slug,
    internalName: optionalText(form.internalName),
    estimatedReadingMinutes: optionalNumber(form.estimatedReadingMinutes),
    featured: form.featured,
    translations,
    items: form.items.map(({ resourceType, resourceId }) => ({ resourceType, resourceId })),
    // INLINE bindings follow the story's images; the backend derives them.
    media: form.media.map((m) => ({ ...m })),
  };
}

/** Whether the form has a story, which takes block 0 in a working-copy payload. */
const hasStory = () => Object.values(form.bodies).some((b) => blocksForApi(b ?? []).length > 0);

const editor = useResourceEditor<Guide>({
  kind: "guide",
  source: () => props.guideId,
  languages,
  defaultLanguage,
  async load() {
    const [guide, allPois, allRoutes, allPlaces, allEvents, library, triggers] = await Promise.all([
      fetchGuide(projectId.value, props.guideId),
      listPois(projectId.value),
      listRoutes(projectId.value),
      listPlaces(projectId.value),
      listEvents(projectId.value),
      listAssets(projectId.value),
      listTargetTriggers(projectId.value, "GUIDE", props.guideId),
    ]);
    savedTriggers.value = triggers;
    pois.value = allPois;
    routes.value = allRoutes;
    places.value = allPlaces;
    events.value = allEvents;
    assets.value = library;
    return guide;
  },
  async save(guide, version) {
    // Triggers are rows of their own and do not move the Guide's version, so they go first (as for POIs).
    savedTriggers.value = await syncTriggers(projectId.value, "GUIDE", guide.id, form.triggers);
    return updateGuide(projectId.value, guide.id, { version, ...input() });
  },
  workingCopy: {
    kind: "guides",
    projectId: () => projectId.value,
    async payload(guide) {
      // Triggers are not in the working copy (backend D-026): "Save draft" saves them live, after the body.
      const body = guideWorkingCopyPayload(guide, input());
      savedTriggers.value = await syncTriggers(projectId.value, "GUIDE", guide.id, form.triggers);
      return body;
    },
    fromResponse: guideFromResponse,
    mapError: guideWorkingCopyError,
  },
  changeStatus: (guide, target, version) => changeGuideStatus(projectId.value, guide.id, target, version),
  loadReferences: (guide) => fetchGuideReferences(projectId.value, guide.id),
  resetForm(guide) {
    form.slug = guide.slug;
    form.internalName = guide.internalName ?? "";
    form.estimatedReadingMinutes = numberText(guide.estimatedReadingMinutes);
    form.featured = guide.featured;
    form.translations = Object.fromEntries(Object.entries(guide.translations).map(([code, t]) => [code, textsFrom(TEXT_KEYS, t)]));
    form.bodies = Object.fromEntries(Object.entries(guide.translations).map(([code, t]) => [code, blocksToForm(t.body?.blocks)]));
    form.items = guide.items.map((i) => ({ key: `i-${++keyCounter}`, ...i }));
    form.media = guide.media.filter((m) => m.usage !== "INLINE").map((m) => ({ ...m }));
    form.triggers = savedTriggers.value.map(triggerToForm);
  },
  ensureLanguageRows() {
    ensureTextRows(TEXT_KEYS, languageCodes(), form.translations);
    for (const code of languageCodes()) {
      if (!form.bodies[code]) form.bodies[code] = [];
    }
  },
  formState: () => form,
  validate() {
    const found: Record<string, string> = {};
    if (!SLUG_PATTERN.test(form.slug)) found.slug = "Use lowercase Latin letters, digits, and single hyphens.";
    const minutes = form.estimatedReadingMinutes.trim();
    if (minutes && !isWholeNumber(minutes, 1, 600)) found.estimatedReadingMinutes = "A whole number of minutes between 1 and 600.";
    return found;
  },
  describePath(path) {
    if (/^triggers\[/.test(path)) return "How visitors reach it";
    // Working-copy payload paths: block 0 is the story when there is one, the items follow (guides.ts).
    const story = /^blocks\[(\d+)\]\.translations\.([^.]+)\.text/.exec(path);
    if (story) {
      const language = languages.value.find((l) => l.languageCode === story[2])?.displayName ?? story[2];
      return `Story (${language})`;
    }
    const payloadBlock = /^blocks\[(\d+)\]/.exec(path);
    if (payloadBlock) return `Related item ${Number(payloadBlock[1]) - (hasStory() ? 1 : 0) + 1}`;
    const item = /^items\[(\d+)\]/.exec(path);
    if (item) return `Related item ${Number(item[1]) + 1}`;
    if (/^media\[/.test(path)) return "Media";
    const block = /^translations\.([^.]+)\.body\.blocks\[(\d+)\]/.exec(path);
    if (block) {
      const language = languages.value.find((l) => l.languageCode === block[1])?.displayName ?? block[1];
      return `Story block ${Number(block[2]) + 1} (${language})`;
    }
    return describeTranslationPath(path, languages.value, TEXT_META) ?? FIELD_NAMES[path] ?? path;
  },
});

const toReference = (r: ResourceReference) => referenceLink(projectId.value, r);
const heading = computed(() => (editor.resource ? guideTitle(editor.resource, defaultLanguage.value) : "Guide"));
const subtitle = computed(() => (editor.resource ? `Guide · ${editor.resource.slug}` : ""));
// The Guide as visitors would read it, from the live form (`12` §3, DECISIONS.md D-014).
const preview = computed<PreviewModel | null>(() => {
  if (!editor.resource) return null;
  const { language, fallbackName, codes } = previewLanguages(languages.value, editor.activeLanguage, defaultLanguage.value);
  const own = codes.active ? form.bodies[codes.active] ?? [] : [];
  const story = own.length ? own : codes.fallback ? form.bodies[codes.fallback] ?? [] : [];
  const nodes: StoryNode[] = story.flatMap((b): StoryNode[] => {
    if (b.type === "image") return [{ type: "image", image: storyImage(assets.value, b.assetId, codes) }];
    return b.text.trim() ? [{ type: b.type, text: b.text.trim() }] : [];
  });
  const blocks: PreviewBlock[] = [
    ...heroBlock(form.media, assets.value, codes),
    { type: "facts", items: form.estimatedReadingMinutes.trim() ? [{ label: "Reading", value: `${form.estimatedReadingMinutes.trim()} min` }] : [] },
    ...textBlocks(form.translations, [{ key: "summary", label: "Summary" }], codes),
  ];
  if (nodes.length) {
    if (!own.length && story.length) {
      blocks.push({ type: "text", label: "Story", value: { text: "The story below is in the default language.", missing: true } });
    }
    blocks.push({ type: "story", nodes });
  }
  blocks.push({
    type: "list",
    heading: "Related",
    items: form.items.map((item) => ({ title: relatables.value[item.resourceType]?.get(item.resourceId)?.title ?? "Unavailable item", subtitle: item.resourceType })),
  });
  blocks.push(...mediaBlocks(form.media, assets.value, codes));
  return { kindLabel: "Guide", language, fallbackName, title: textIn(form.translations, "title", codes), blocks };
});

const activeLanguageInfo = computed(() => editor.activeLanguageInfo);

const suggestedMinutes = computed(() => {
  const code = defaultLanguage.value;
  return code && form.bodies[code]?.length ? readingMinutes(form.bodies[code]) : null;
});

// Related items ---------------------------------------------------------------------------------------

function itemInfo(item: ItemForm): Relatable | undefined {
  return relatables.value[item.resourceType]?.get(item.resourceId);
}

function itemTypeLabel(type: GuideItemType): string {
  return ITEM_TYPES.find((t) => t.type === type)?.label ?? type;
}

function itemLink(item: ItemForm) {
  const params = { projectId: projectId.value };
  if (item.resourceType === "POI") return { name: "poi-editor", params: { ...params, poiId: item.resourceId } };
  if (item.resourceType === "ROUTE") return { name: "route-editor", params: { ...params, routeId: item.resourceId } };
  if (item.resourceType === "PLACE") return { name: "place-editor", params: { ...params, placeId: item.resourceId } };
  if (item.resourceType === "EVENT") return { name: "event-editor", params: { ...params, eventId: item.resourceId } };
  return null;
}

function itemError(index: number): string | undefined {
  const prefix = `items[${index}]`;
  const messages = Object.entries(editor.errors).filter(([p]) => p.startsWith(prefix)).map(([, m]) => m);
  return messages.length ? messages.join(" ") : undefined;
}

function moveItem(index: number, delta: number) {
  const target = index + delta;
  if (target < 0 || target >= form.items.length) return;
  const [item] = form.items.splice(index, 1);
  form.items.splice(target, 0, item);
  void nextTick(() => document.getElementById(`item-move-${item.key}-${delta < 0 ? "up" : "down"}`)?.focus());
}

const picking = ref(false);
const pickType = ref<GuideItemType>("POI");
const pickQuery = ref("");
const pickable = computed(() => {
  const used = new Set(form.items.filter((i) => i.resourceType === pickType.value).map((i) => i.resourceId));
  const q = pickQuery.value.trim().toLowerCase();
  return [...(relatables.value[pickType.value]?.values() ?? [])]
    .filter((r) => r.status !== "ARCHIVED" && !used.has(r.id))
    .filter((r) => !q || r.title.toLowerCase().includes(q))
    .sort((a, b) => a.title.localeCompare(b.title));
});

function addItem(resource: Relatable) {
  form.items.push({ key: `i-${++keyCounter}`, resourceType: pickType.value, resourceId: resource.id });
  picking.value = false;
  pickQuery.value = "";
}

// The Translations panel counts the fields the content list counts for its completion dots.
const translationRows = computed(() => translationStatus(languages.value, 3, (code) =>
    filledFields(form.translations[code], ["title", "summary"] as const) +
    ((form.bodies[code] ?? []).some((b) => b.type === "image" || b.text.trim()) ? 1 : 0),
  ));
</script>

<template>
  <EditorShell
    tabbed
    :editor="editor"
    back-label="Guides"
    :back-to="{ name: 'guides', params: { projectId } }"
    :title="heading"
    :subtitle="subtitle"
    activation-hint="Activate it once it has a default-language title and story."
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
      title-required-hint="Required in the default language before the guide can be activated."
    />

    <StoryEditor
      v-if="activeLanguageInfo && form.bodies[activeLanguageInfo.languageCode]"
      :key="activeLanguageInfo.languageCode"
      :project-id="projectId"
      :blocks="form.bodies[activeLanguageInfo.languageCode]"
      :language="activeLanguageInfo"
      :assets="assets"
      :readonly="!editor.editable"
      :field-error="editor.fieldError"
      @uploaded="assets.unshift($event)"
    />

    <TriggersCard :triggers="form.triggers" :readonly="!editor.editable" :field-error="editor.fieldError" />

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
      <div class="flex items-center gap-2.5 border-b px-5 py-3.5">
        <h2 class="flex-1 text-[11px] font-extrabold uppercase tracking-[0.09em] text-muted-foreground">Related ({{ form.items.length }})</h2>
        <span class="text-[11px] text-muted-foreground">Shown after the story, in this order</span>
      </div>
      <p v-if="editor.fieldError('items')" class="border-b border-gray-100 px-5 py-3 text-xs font-semibold text-destructive">
        ⚠ {{ editor.fieldError("items") }}
      </p>
      <ol>
        <li v-for="(item, index) in form.items" :key="item.key" class="border-b border-gray-100 px-5 py-3">
          <div class="flex flex-wrap items-center gap-2.5">
            <span class="w-[118px] flex-none text-[10px] font-extrabold uppercase tracking-[0.08em] text-muted-foreground">
              {{ itemTypeLabel(item.resourceType) }}
            </span>
            <RouterLink v-if="itemInfo(item) && itemLink(item)" :to="itemLink(item)!" class="min-w-[140px] flex-1 text-[13px] font-bold">
              {{ itemInfo(item)!.title }}
            </RouterLink>
            <span v-else class="min-w-[140px] flex-1 text-[13px] text-muted-foreground">Unavailable {{ itemTypeLabel(item.resourceType).toLowerCase() }}</span>
            <span
              v-if="itemInfo(item) && itemInfo(item)!.status !== 'ACTIVE'"
              class="rounded-full px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-[0.07em]"
              :style="statusChipStyle(itemInfo(item)!.status)"
              :title="'Visitors do not see it while it is ' + itemInfo(item)!.status"
            >
              {{ itemInfo(item)!.status }}
            </span>
            <template v-if="editor.editable">
              <button
                :id="`item-move-${item.key}-up`"
                type="button"
                class="px-1 text-[13px] text-muted-foreground disabled:opacity-30"
                :disabled="index === 0"
                :aria-label="`Move related item ${index + 1} up`"
                @click="moveItem(index, -1)"
              >
                ↑
              </button>
              <button
                :id="`item-move-${item.key}-down`"
                type="button"
                class="px-1 text-[13px] text-muted-foreground disabled:opacity-30"
                :disabled="index === form.items.length - 1"
                :aria-label="`Move related item ${index + 1} down`"
                @click="moveItem(index, 1)"
              >
                ↓
              </button>
              <button type="button" class="px-1 text-[13px] text-destructive" :aria-label="`Remove related item ${index + 1}`" @click="form.items.splice(index, 1)">
                ✕
              </button>
            </template>
          </div>
          <p v-if="itemError(index)" class="mt-1.5 text-xs font-semibold text-destructive">⚠ {{ itemError(index) }}</p>
        </li>
      </ol>
      <p v-if="!form.items.length" class="px-5 py-4 text-[13px] text-muted-foreground">
        Nothing related yet. Add the points of interest, routes, places, or events the story talks about.
      </p>
      <div class="px-5 py-3.5">
        <button
          type="button"
          class="rounded-full border bg-muted px-4 py-2 text-[10px] font-bold uppercase tracking-[0.06em] text-gray-700 disabled:opacity-50"
          :disabled="!editor.editable"
          @click="picking = true"
        >
          Add related
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
        <div class="flex flex-wrap items-end gap-4">
          <div class="flex flex-[0_0_170px] flex-col gap-1.5">
            <label for="f-reading" class="small-label">Reading time (min)</label>
            <input
              id="f-reading"
              v-model="form.estimatedReadingMinutes"
              :readonly="!editor.editable"
              inputmode="numeric"
              class="field-input"
              :class="{ invalid: editor.fieldError('estimatedReadingMinutes') }"
            />
          </div>
          <span v-if="suggestedMinutes" class="flex-1 text-xs text-muted-foreground">
            The default-language story reads in about {{ suggestedMinutes }} min.
            <button
              v-if="editor.editable && form.estimatedReadingMinutes !== String(suggestedMinutes)"
              type="button"
              class="ml-1 font-bold text-primary"
              @click="form.estimatedReadingMinutes = String(suggestedMinutes)"
            >
              Use it
            </button>
          </span>
        </div>
        <span v-if="editor.fieldError('estimatedReadingMinutes')" class="text-xs font-semibold text-destructive">
          ⚠ {{ editor.fieldError("estimatedReadingMinutes") }}
        </span>
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

  <AppDialog v-if="picking" title="Add related" @close="picking = false">
    <div class="mb-3 flex flex-wrap gap-1.5" role="group" aria-label="Kind">
      <button
        v-for="t in ITEM_TYPES"
        :key="t.type"
        type="button"
        class="rounded-full border px-[13px] py-1.5 text-[11px]"
        :class="pickType === t.type ? 'border-primary bg-primary font-bold text-white' : 'bg-card font-semibold text-gray-700'"
        :aria-pressed="pickType === t.type"
        @click="pickType = t.type"
      >
        {{ t.plural }}
      </button>
    </div>
    <input
      v-model="pickQuery"
      type="search"
      aria-label="Search by title"
      placeholder="Search by title"
      class="mb-3 w-full rounded-lg border-[1.5px] px-3 py-[9px] text-[13px] focus:border-primary focus:outline-none"
    />
    <ul v-if="pickable.length" class="max-h-[280px] overflow-y-auto rounded-lg border">
      <li v-for="r in pickable" :key="r.id" class="border-b border-gray-100 last:border-b-0">
        <button type="button" class="flex w-full items-center gap-2.5 px-3.5 py-[11px] text-left text-[13px] text-gray-700 hover:bg-muted" @click="addItem(r)">
          <span class="flex-1">{{ r.title }}</span>
          <span class="rounded-full px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-[0.07em]" :style="statusChipStyle(r.status)">{{ r.status }}</span>
        </button>
      </li>
    </ul>
    <p v-else class="text-[13px] text-muted-foreground">Nothing else to add here. Each item can be related once, and archived ones cannot.</p>
    <template #actions>
      <button type="button" class="dialog-secondary" @click="picking = false">Cancel</button>
    </template>
  </AppDialog>
</template>
