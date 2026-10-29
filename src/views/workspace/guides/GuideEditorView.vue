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
  guideWorkingCopyPayload,
  readingMinutes,
  updateGuide,
  type Guide,
  type GuideBlock,
  type GuideBlockType,
  type GuideItemType,
  type GuideTranslation,
  type UpdateGuideInput,
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
import { guideStoryBlocks, heroBlock, mediaBlocks, previewLanguages, textBlocks, textIn, type PreviewBlock, type PreviewModel } from "@/workspace/preview";
import { filledFields, translationStatus } from "@/workspace/translationStatus";
import { useProjectLanguages } from "@/workspace/useProjectLanguages";
import { useResourceEditor } from "@/workspace/useResourceEditor";

const props = defineProps<{ guideId: string }>();
const project = useCurrentProject();
const projectId = computed(() => project.value.id);
const { languages, defaultLanguage, loading: languagesLoading } = useProjectLanguages(projectId);
const languageCodes = () => languages.value.map((l) => l.languageCode);

type TextKey = keyof GuideTranslation;
const TEXT_KEYS: TextKey[] = ["title", "summary"];

const TEXT_META: Record<TextKey, TextFieldMeta> = {
  title: { label: "Title", multiline: false },
  summary: { label: "Summary", multiline: true, helper: "Short text shown in lists and when sharing: what the reader will learn." },
};
const GROUPS: TextFieldGroup[] = [
  { id: "main", label: null, keys: ["title", "summary"] },
];
const MEDIA_SLOTS: MediaSlot[] = [
  { usage: "HERO_IMAGE", label: "Primary image", accept: ["IMAGE"], recommended: true },
  { usage: "GALLERY_IMAGE", label: "Gallery", accept: ["IMAGE"], multiple: true },
];

const FIELD_NAMES: Record<string, string> = {
  slug: "Slug",
  internalName: "Internal name",
  estimatedReadingMinutes: "Reading time",
  blocks: "Story",
};

const ITEM_TYPES: { type: GuideItemType; label: string; plural: string }[] = [
  { type: "POI", label: "Point of interest", plural: "Points of interest" },
  { type: "ROUTE", label: "Route", plural: "Routes" },
  { type: "PLACE", label: "Place", plural: "Places" },
  { type: "EVENT", label: "Event", plural: "Events" },
];

// Everything a reference block can point at, with the media library for the slots and the story's images.
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

/**
 * One block of the story as the form edits it (`12` §3 Guide, `03` §11, DECISIONS.md D-031): a TEXT block's rich
 * text per language, or a REFERENCE block's target and caption per language.
 */
interface BlockForm {
  key: string;
  id: string | null;
  blockType: GuideBlockType;
  resourceType: GuideItemType | null;
  resourceId: string | null;
  texts: Record<string, StoryBlockForm[]>;
  captions: Record<string, string>;
}

let keyCounter = 0;
const form = reactive({
  slug: "",
  internalName: "",
  estimatedReadingMinutes: "",
  featured: false,
  translations: {} as Record<string, Texts<TextKey>>,
  blocks: [] as BlockForm[],
  media: [] as MediaBinding[],
  triggers: [] as TriggerForm[],
});
// The triggers as last loaded or saved; the form is reset from them with the Guide.
const savedTriggers = ref<Trigger[]>([]);

function toBlockForm(block: GuideBlock): BlockForm {
  return {
    key: `g-${++keyCounter}`,
    id: block.id,
    blockType: block.blockType,
    resourceType: block.resourceType,
    resourceId: block.resourceId,
    texts: Object.fromEntries(Object.entries(block.translations).map(([code, t]) => [code, blocksToForm(t.text?.blocks)])),
    captions: Object.fromEntries(Object.entries(block.translations).map(([code, t]) => [code, t.caption ?? ""])),
  };
}

/** The blocks as the API takes them, every enabled language carried so an emptied one is cleared. */
function blocksForSave(): GuideBlock[] {
  return form.blocks.map((b) => ({
    id: b.id,
    blockType: b.blockType,
    resourceType: b.blockType === "REFERENCE" ? b.resourceType : null,
    resourceId: b.blockType === "REFERENCE" ? b.resourceId : null,
    translations: Object.fromEntries(
      languageCodes().map((code) => {
        if (b.blockType === "REFERENCE") return [code, { text: null, caption: b.captions[code]?.trim() || null }];
        const nodes = blocksForApi(b.texts[code] ?? []);
        return [code, { text: nodes.length ? { blocks: nodes } : null, caption: null }];
      }),
    ),
  }));
}

/** The editable state from the form, for a DRAFT save and a working copy alike. */
function input(): Omit<UpdateGuideInput, "version"> {
  return {
    slug: form.slug,
    internalName: optionalText(form.internalName),
    estimatedReadingMinutes: optionalNumber(form.estimatedReadingMinutes),
    featured: form.featured,
    translations: textsForApi(TEXT_KEYS, languageCodes(), form.translations),
    blocks: blocksForSave(),
    // INLINE bindings follow the story's images; the backend derives them.
    media: form.media.map((m) => ({ ...m })),
  };
}

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
      const body = guideWorkingCopyPayload(input());
      savedTriggers.value = await syncTriggers(projectId.value, "GUIDE", guide.id, form.triggers);
      return body;
    },
    fromResponse: guideFromResponse,
  },
  changeStatus: (guide, target, version) => changeGuideStatus(projectId.value, guide.id, target, version),
  loadReferences: (guide) => fetchGuideReferences(projectId.value, guide.id),
  resetForm(guide) {
    form.slug = guide.slug;
    form.internalName = guide.internalName ?? "";
    form.estimatedReadingMinutes = numberText(guide.estimatedReadingMinutes);
    form.featured = guide.featured;
    form.translations = Object.fromEntries(Object.entries(guide.translations).map(([code, t]) => [code, textsFrom(TEXT_KEYS, t)]));
    form.blocks = guide.blocks.map(toBlockForm);
    form.media = guide.media.filter((m) => m.usage !== "INLINE").map((m) => ({ ...m }));
    form.triggers = savedTriggers.value.map(triggerToForm);
  },
  ensureLanguageRows() {
    ensureTextRows(TEXT_KEYS, languageCodes(), form.translations);
    for (const block of form.blocks) ensureBlockLanguages(block);
  },
  formState: () => form,
  validate() {
    const found: Record<string, string> = {};
    if (!SLUG_PATTERN.test(form.slug)) found.slug = "Use lowercase Latin letters, digits, and single hyphens.";
    const minutes = form.estimatedReadingMinutes.trim();
    if (minutes && !isWholeNumber(minutes, 1, 600)) found.estimatedReadingMinutes = "A whole number of minutes between 1 and 600.";
    form.blocks.forEach((b, i) => {
      if (b.blockType === "REFERENCE" && !b.resourceId) found[`blocks[${i}].resourceId`] = "Choose what the block points to.";
    });
    return found;
  },
  describePath(path) {
    if (/^triggers\[/.test(path)) return "How visitors reach it";
    if (/^media\[/.test(path)) return "Media";
    const block = /^blocks\[(\d+)\](.*)$/.exec(path);
    if (block) {
      const index = Number(block[1]);
      const kind = form.blocks[index]?.blockType === "REFERENCE" ? "reference" : "text";
      const lang = /translations\.([^.]+)/.exec(block[2])?.[1];
      const language = lang ? languages.value.find((l) => l.languageCode === lang)?.displayName ?? lang : null;
      const node = /\.text\.blocks\[(\d+)\]/.exec(block[2]);
      return `Story block ${index + 1} (${kind}${language ? `, ${language}` : ""})${node ? `, part ${Number(node[1]) + 1}` : ""}`;
    }
    return describeTranslationPath(path, languages.value, TEXT_META) ?? FIELD_NAMES[path] ?? path;
  },
});

function ensureBlockLanguages(block: BlockForm) {
  for (const code of languageCodes()) {
    if (!block.texts[code]) block.texts[code] = [];
    if (block.captions[code] === undefined) block.captions[code] = "";
  }
}

const toReference = (r: ResourceReference) => referenceLink(projectId.value, r);
const heading = computed(() => (editor.resource ? guideTitle(editor.resource, defaultLanguage.value) : "Guide"));
const subtitle = computed(() => (editor.resource ? `Guide · ${editor.resource.slug}` : ""));
// The Guide as visitors would read it, from the live form, blocks in the order written (`12` §3, DECISIONS.md D-014).
const preview = computed<PreviewModel | null>(() => {
  if (!editor.resource) return null;
  const { language, fallbackName, codes } = previewLanguages(languages.value, editor.activeLanguage, defaultLanguage.value);
  const blocks: PreviewBlock[] = [
    ...heroBlock(form.media, assets.value, codes),
    { type: "facts", items: form.estimatedReadingMinutes.trim() ? [{ label: "Reading", value: `${form.estimatedReadingMinutes.trim()} min` }] : [] },
    ...textBlocks(form.translations, [{ key: "summary", label: "Summary" }], codes),
    ...guideStoryBlocks(blocksForSave(), assets.value, codes, (block) => {
      if (!block.resourceType || !block.resourceId) return null;
      return { title: relatables.value[block.resourceType]?.get(block.resourceId)?.title ?? "Unavailable item", subtitle: itemTypeLabel(block.resourceType) };
    }),
    ...mediaBlocks(form.media, assets.value, codes),
  ];
  return { kindLabel: "Guide", language, fallbackName, title: textIn(form.translations, "title", codes), blocks };
});

const activeLanguageInfo = computed(() => editor.activeLanguageInfo);

const suggestedMinutes = computed(() => {
  const code = defaultLanguage.value;
  const nodes = code ? form.blocks.flatMap((b) => (b.blockType === "TEXT" ? b.texts[code] ?? [] : [])) : [];
  return nodes.length ? readingMinutes(nodes) : null;
});

// Story blocks ------------------------------------------------------------------------------------------

function itemInfo(block: BlockForm): Relatable | undefined {
  return block.resourceType && block.resourceId ? relatables.value[block.resourceType]?.get(block.resourceId) : undefined;
}

function itemTypeLabel(type: GuideItemType): string {
  return ITEM_TYPES.find((t) => t.type === type)?.label ?? type;
}

function itemLink(block: BlockForm) {
  const params = { projectId: projectId.value };
  if (!block.resourceId) return null;
  if (block.resourceType === "POI") return { name: "poi-editor", params: { ...params, poiId: block.resourceId } };
  if (block.resourceType === "ROUTE") return { name: "route-editor", params: { ...params, routeId: block.resourceId } };
  if (block.resourceType === "PLACE") return { name: "place-editor", params: { ...params, placeId: block.resourceId } };
  if (block.resourceType === "EVENT") return { name: "event-editor", params: { ...params, eventId: block.resourceId } };
  return null;
}

/** A reference visitors cannot open: the target is a draft, archived, or gone (`DANGLING_REFERENCE`). */
function referenceWarning(block: BlockForm): string | null {
  if (block.blockType !== "REFERENCE" || !block.resourceType || !block.resourceId) return null;
  const info = itemInfo(block);
  const noun = itemTypeLabel(block.resourceType).toLowerCase();
  if (!info) return `The ${noun} is no longer available. Remove the block or choose another one.`;
  if (info.status === "ACTIVE") return null;
  return info.status === "ARCHIVED"
    ? `The ${noun} is archived: visitors don't see this block. Remove it or restore the ${noun}.`
    : `The ${noun} is a draft: visitors don't see this block until it is activated.`;
}

/** The block's own errors; a TEXT block's rich-text errors show inside its text editor. */
function blockError(index: number): string | undefined {
  const at = `blocks[${index}]`;
  const lang = activeLanguageInfo.value?.languageCode;
  const paths = [at, `${at}.blockType`, `${at}.resourceType`, `${at}.resourceId`, ...(lang ? [`${at}.translations.${lang}.caption`] : [])];
  return paths.map((p) => editor.fieldError(p)).filter(Boolean).join(" ") || undefined;
}

const blockAnnouncement = ref("");
const blockName = (block: BlockForm, index: number) =>
  block.blockType === "REFERENCE" ? `reference ${itemInfo(block)?.title ?? ""}`.trim() : `text block ${index + 1}`;

function moveBlockTo(index: number, target: number, focusId?: (key: string) => string) {
  if (target < 0 || target >= form.blocks.length || target === index) return;
  const [block] = form.blocks.splice(index, 1);
  form.blocks.splice(target, 0, block);
  blockAnnouncement.value = `Moved ${blockName(block, target)} to position ${target + 1} of ${form.blocks.length}.`;
  if (focusId) void nextTick(() => document.getElementById(focusId(block.key))?.focus());
}

/** Moves a block and keeps keyboard focus on the same button, so repeated presses keep moving it. */
function moveBlock(index: number, delta: number) {
  moveBlockTo(index, index + delta, (key) => `gblock-move-${key}-${delta < 0 ? "up" : "down"}`);
}

function setBlockPosition(index: number, event: Event) {
  moveBlockTo(index, Number((event.target as HTMLSelectElement).value) - 1, (key) => `gblock-position-${key}`);
}

const draggingBlock = ref<string | null>(null);
const blockDropTarget = ref<{ key: string; after: boolean } | null>(null);

function blockDragStart(key: string, event: DragEvent) {
  draggingBlock.value = key;
  event.dataTransfer?.setData("text/plain", key);
  if (event.dataTransfer) event.dataTransfer.effectAllowed = "move";
}

function blockDragOver(key: string, event: DragEvent) {
  if (!draggingBlock.value || draggingBlock.value === key) return;
  event.preventDefault();
  const box = (event.currentTarget as HTMLElement).getBoundingClientRect();
  blockDropTarget.value = { key, after: event.clientY > box.top + box.height / 2 };
}

function blockDrop() {
  const from = form.blocks.findIndex((b) => b.key === draggingBlock.value);
  const drop = blockDropTarget.value;
  blockDragEnd();
  if (from < 0 || !drop) return;
  let target = form.blocks.findIndex((b) => b.key === drop.key) + (drop.after ? 1 : 0);
  if (from < target) target--;
  moveBlockTo(from, target);
}

function blockDragEnd() {
  draggingBlock.value = null;
  blockDropTarget.value = null;
}

/** Where "+ Text" and "+ Reference" insert: after the block at `insertAt - 1`, or at the end while null. */
const insertAt = ref<number | null>(null);

async function addText() {
  const at = insertAt.value ?? form.blocks.length;
  insertAt.value = null;
  const block: BlockForm = { key: `g-${++keyCounter}`, id: null, blockType: "TEXT", resourceType: null, resourceId: null, texts: {}, captions: {} };
  ensureBlockLanguages(block);
  form.blocks.splice(at, 0, block);
  blockAnnouncement.value = `Added a text block at position ${at + 1}.`;
  await nextTick();
  document.getElementById(`gblock-${block.key}`)?.focus();
}

function removeBlock(index: number) {
  const [block] = form.blocks.splice(index, 1);
  blockAnnouncement.value = `Removed ${blockName(block, index)}.`;
}

// The reference picker: a new reference block at `at`, or another target for the block at `replace`.
const picking = ref<{ at: number; replace: number | null } | null>(null);
const pickType = ref<GuideItemType>("POI");
const pickQuery = ref("");
const pickable = computed(() => {
  const q = pickQuery.value.trim().toLowerCase();
  return [...(relatables.value[pickType.value]?.values() ?? [])]
    .filter((r) => r.status !== "ARCHIVED")
    .filter((r) => !q || r.title.toLowerCase().includes(q))
    .sort((a, b) => a.title.localeCompare(b.title));
});

function startReference(replace: number | null = null) {
  picking.value = { at: insertAt.value ?? form.blocks.length, replace };
  insertAt.value = null;
}

function pickReference(resource: Relatable) {
  const target = picking.value;
  picking.value = null;
  pickQuery.value = "";
  if (!target) return;
  if (target.replace !== null) {
    const block = form.blocks[target.replace];
    if (block) Object.assign(block, { resourceType: pickType.value, resourceId: resource.id });
    return;
  }
  const block: BlockForm = {
    key: `g-${++keyCounter}`,
    id: null,
    blockType: "REFERENCE",
    resourceType: pickType.value,
    resourceId: resource.id,
    texts: {},
    captions: {},
  };
  ensureBlockLanguages(block);
  form.blocks.splice(target.at, 0, block);
  blockAnnouncement.value = `Added a reference to ${resource.title} at position ${target.at + 1}.`;
}

const textCount = computed(() => form.blocks.filter((b) => b.blockType === "TEXT").length);

// The Translations panel counts the fields the content list counts for its completion dots: title, summary, and the
// story when the Guide has text blocks (every text block written).
const translationRows = computed(() =>
  translationStatus(languages.value, textCount.value ? 3 : 2, (code) =>
    filledFields(form.translations[code], ["title", "summary"] as const) +
    (textCount.value && form.blocks.every((b) => b.blockType !== "TEXT" || (b.texts[code] ?? []).some((n) => n.type !== "image" && n.text.trim())) ? 1 : 0),
  ),
);
</script>

<template>
  <EditorShell
    tabbed
    :editor="editor"
    back-label="Guides"
    :back-to="{ name: 'guides', params: { projectId } }"
    :title="heading"
    :subtitle="subtitle"
    activation-hint="Activate it once it has a default-language title and at least one block, every text block written."
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

    <section class="overflow-hidden rounded-lg border bg-card" aria-labelledby="story-heading" data-path="blocks" tabindex="-1">
      <div class="flex flex-wrap items-center gap-2.5 border-b px-5 py-3.5">
        <h2 id="story-heading" class="flex-1 text-[11px] font-extrabold uppercase tracking-[0.09em] text-muted-foreground">
          Story{{ activeLanguageInfo ? ` · ${activeLanguageInfo.displayName}` : "" }}
        </h2>
        <span class="text-[11px] text-muted-foreground">Text and references, in the order visitors read them</span>
      </div>
      <p v-if="editor.fieldError('blocks')" class="border-b border-gray-100 px-5 py-3 text-xs font-semibold text-destructive">
        ⚠ {{ editor.fieldError("blocks") }}
      </p>
      <p class="sr-only" aria-live="polite">{{ blockAnnouncement }}</p>
      <ol>
        <template v-for="(block, index) in form.blocks" :key="block.key">
          <li
            class="border-b border-gray-100 px-5 py-3.5"
            :class="{
              'opacity-50': draggingBlock === block.key,
              'shadow-[inset_0_2px_0_#4c1d8b]': blockDropTarget?.key === block.key && !blockDropTarget.after,
              'shadow-[inset_0_-2px_0_#4c1d8b]': blockDropTarget?.key === block.key && blockDropTarget.after,
            }"
            :data-path="`blocks[${index}]`"
            tabindex="-1"
            @dragover="blockDragOver(block.key, $event)"
            @dragleave="blockDropTarget?.key === block.key && (blockDropTarget = null)"
            @drop.prevent="blockDrop"
          >
            <div class="flex flex-wrap items-center gap-2.5">
              <span
                v-if="editor.editable && form.blocks.length > 1"
                class="cursor-grab select-none text-[15px] leading-none text-gray-400 hover:text-gray-700 active:cursor-grabbing"
                draggable="true"
                aria-hidden="true"
                title="Drag to reorder"
                @dragstart="blockDragStart(block.key, $event)"
                @dragend="blockDragEnd"
                >⠿</span
              >
              <span class="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-extrabold text-white" aria-hidden="true">
                {{ index + 1 }}
              </span>
              <span class="w-[104px] flex-none text-[10px] font-extrabold uppercase tracking-[0.08em] text-muted-foreground">
                {{ block.blockType === "TEXT" ? "Text" : block.resourceType ? itemTypeLabel(block.resourceType) : "Reference" }}
              </span>
              <template v-if="block.blockType === 'REFERENCE'">
                <RouterLink v-if="itemInfo(block) && itemLink(block)" :to="itemLink(block)!" class="min-w-[140px] flex-1 text-[13px] font-bold">
                  {{ itemInfo(block)!.title }}
                </RouterLink>
                <span v-else class="min-w-[140px] flex-1 text-[13px] text-muted-foreground">
                  {{ block.resourceId ? "Unavailable item" : "Nothing chosen yet" }}
                </span>
                <span
                  v-if="itemInfo(block) && itemInfo(block)!.status !== 'ACTIVE'"
                  class="rounded-full px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-[0.07em]"
                  :style="statusChipStyle(itemInfo(block)!.status)"
                >
                  {{ itemInfo(block)!.status }}
                </span>
                <button
                  v-if="editor.editable"
                  type="button"
                  class="text-[11px] font-bold text-primary"
                  :data-path="`blocks[${index}].resourceId`"
                  @click="pickType = block.resourceType && block.resourceType !== 'PAGE' ? block.resourceType : 'POI'; startReference(index)"
                >
                  Change
                </button>
              </template>
              <span v-else class="flex-1"></span>
              <template v-if="editor.editable">
                <select
                  v-if="form.blocks.length > 1"
                  :id="`gblock-position-${block.key}`"
                  :value="index + 1"
                  :aria-label="`Position of story block ${index + 1}`"
                  class="field-input block-position"
                  @change="setBlockPosition(index, $event)"
                >
                  <option v-for="n in form.blocks.length" :key="n" :value="n">{{ n }}</option>
                </select>
                <button
                  :id="`gblock-move-${block.key}-up`"
                  type="button"
                  class="px-1 text-[13px] text-muted-foreground disabled:opacity-30"
                  :disabled="index === 0"
                  :aria-label="`Move story block ${index + 1} up`"
                  @click="moveBlock(index, -1)"
                >
                  ↑
                </button>
                <button
                  :id="`gblock-move-${block.key}-down`"
                  type="button"
                  class="px-1 text-[13px] text-muted-foreground disabled:opacity-30"
                  :disabled="index === form.blocks.length - 1"
                  :aria-label="`Move story block ${index + 1} down`"
                  @click="moveBlock(index, 1)"
                >
                  ↓
                </button>
                <button
                  type="button"
                  class="px-1 text-[11px] font-bold text-primary"
                  :aria-expanded="insertAt === index + 1"
                  :aria-label="`Insert a block after story block ${index + 1}`"
                  @click="insertAt = insertAt === index + 1 ? null : index + 1"
                >
                  + after
                </button>
                <button type="button" class="px-1 text-[13px] text-destructive" :aria-label="`Remove story block ${index + 1}`" @click="removeBlock(index)">✕</button>
              </template>
            </div>

            <p v-if="referenceWarning(block)" class="mt-1.5 pl-[34px] text-xs font-semibold text-[#9a6200]">⚠ {{ referenceWarning(block) }}</p>

            <div v-if="block.blockType === 'TEXT' && activeLanguageInfo && block.texts[activeLanguageInfo.languageCode]" :id="`gblock-${block.key}`" tabindex="-1" class="mt-1">
              <StoryEditor
                :key="`${block.key}:${activeLanguageInfo.languageCode}`"
                embedded
                :project-id="projectId"
                :blocks="block.texts[activeLanguageInfo.languageCode]"
                :language="activeLanguageInfo"
                :assets="assets"
                :readonly="!editor.editable"
                :field-error="editor.fieldError"
                :path="`blocks[${index}].translations.${activeLanguageInfo.languageCode}.text`"
                :empty-text="`No text in ${activeLanguageInfo.displayName} yet. Start with a paragraph; the default language needs text in every text block before the guide can be activated.`"
                @uploaded="assets.unshift($event)"
              />
            </div>
            <div v-else-if="block.blockType === 'REFERENCE' && activeLanguageInfo" class="mt-2.5 flex flex-col gap-1 pl-[34px]">
              <label :for="`gblock-caption-${block.key}`" class="small-label">
                Caption · {{ activeLanguageInfo.displayName }}
                <span class="font-normal normal-case tracking-normal text-muted-foreground">· optional</span>
              </label>
              <input
                :id="`gblock-caption-${block.key}`"
                v-model="block.captions[activeLanguageInfo.languageCode]"
                :readonly="!editor.editable"
                :lang="activeLanguageInfo.languageCode"
                :dir="activeLanguageInfo.direction.toLowerCase()"
                :data-path="`blocks[${index}].translations.${activeLanguageInfo.languageCode}.caption`"
                placeholder="Why the reader should open it"
                class="field-input"
              />
            </div>
            <p v-if="blockError(index)" class="mt-1.5 pl-[34px] text-xs font-semibold text-destructive">⚠ {{ blockError(index) }}</p>
          </li>
          <li v-if="editor.editable && insertAt === index + 1" class="flex flex-wrap items-center gap-2 border-b border-gray-100 px-5 py-2.5">
            <span class="text-[11px] text-muted-foreground">Insert here:</span>
            <button type="button" class="add-block" @click="addText">+ Text</button>
            <button type="button" class="add-block" @click="startReference()">+ Reference</button>
          </li>
        </template>
      </ol>
      <p v-if="!form.blocks.length" class="px-5 py-4 text-[13px] text-muted-foreground">
        No blocks yet. Start with a text block; add references to the points of interest, routes, places, or events the
        story talks about, where it talks about them.
      </p>
      <div v-if="editor.editable" class="flex flex-wrap gap-2 px-5 py-3.5">
        <button type="button" class="add-block" @click="insertAt = null; addText()">+ Text</button>
        <button type="button" class="add-block" @click="insertAt = null; startReference()">+ Reference</button>
      </div>
    </section>

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

  <AppDialog v-if="picking" :title="picking.replace !== null ? 'Change the reference' : 'Add a reference'" @close="picking = null">
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
        <button type="button" class="flex w-full items-center gap-2.5 px-3.5 py-[11px] text-left text-[13px] text-gray-700 hover:bg-muted" @click="pickReference(r)">
          <span class="flex-1">{{ r.title }}</span>
          <span class="rounded-full px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-[0.07em]" :style="statusChipStyle(r.status)">{{ r.status }}</span>
        </button>
      </li>
    </ul>
    <p v-else class="text-[13px] text-muted-foreground">Nothing to add here: archived items cannot be referenced.</p>
    <p class="mt-2 text-[11px] text-muted-foreground">Pages can be referenced once they exist in iGuide.</p>
    <template #actions>
      <button type="button" class="dialog-secondary" @click="picking = null">Cancel</button>
    </template>
  </AppDialog>
</template>

<style scoped>
.block-position {
  width: auto;
  padding: 2px 6px;
  font-size: 12px;
}
.add-block {
  border: 1px solid #e5e7eb;
  border-radius: 9999px;
  background: #f5f5f7;
  padding: 7px 14px;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #374151;
}
</style>
