<script setup lang="ts">
import { computed, nextTick, reactive, ref } from "vue";
import EditorShell from "@/components/editor/EditorShell.vue";
import { ArrowDown, ArrowUp, GripVertical, Heading as HeadingIcon, Image as ImageIcon, Link2, Pilcrow, Plus, X } from "lucide-vue-next";
import AssetPickerDialog from "@/components/media/AssetPickerDialog.vue";
import AssetThumb from "@/components/media/AssetThumb.vue";
import TranslationsPanel, { type TextFieldGroup, type TextFieldMeta } from "@/components/editor/TranslationsPanel.vue";
import { listTargetTriggers, saveWithTriggers, triggerToForm, type Trigger, type TriggerForm } from "@/platform/triggers";
import ResourcePickerDialog from "@/components/ResourcePickerDialog.vue";
import type { PickerKind } from "@/components/resourcePicker";
import StatusChip from "@/components/StatusChip.vue";
import { SLUG_PATTERN } from "@/lib/format";
import { listAssets, missingAlternativeText, type Asset, type MediaBinding } from "@/platform/assets";
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
  type GuideItemType,
  type GuideTranslation,
  type StoryBlock,
  type UpdateGuideInput,
} from "@/platform/guides";
import { blocksFromElements, elementsFromBlocks, newElement, type ElementForm, type ElementKind } from "./guideElements";
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
import { guideStoryBlocks, heroBlock, mediaBlocks, previewLanguages, textIn, type PreviewBlock, type PreviewModel } from "@/workspace/preview";
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
// Only the title is edited here; the summary is kept as loaded and saved unchanged (D-065).
const GROUPS: TextFieldGroup[] = [{ id: "main", label: null, keys: ["title"] }];

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

const form = reactive({
  slug: "",
  internalName: "",
  estimatedReadingMinutes: "",
  featured: false,
  translations: {} as Record<string, Texts<TextKey>>,
  elements: [] as ElementForm[],
  // Not edited on this screen any more (D-065): kept as loaded so a save leaves them as they are.
  media: [] as MediaBinding[],
  triggers: [] as TriggerForm[],
});
// The triggers as last loaded or saved; the form is reset from them with the Guide.
const savedTriggers = ref<Trigger[]>([]);

/** The story as the API takes it, and which request paths belong to which element. */
const layout = computed(() => blocksFromElements(form.elements, languageCodes()));

/** The editable state from the form, for a DRAFT save and a working copy alike. */
function input(): Omit<UpdateGuideInput, "version"> {
  return {
    slug: form.slug,
    internalName: optionalText(form.internalName),
    estimatedReadingMinutes: optionalNumber(form.estimatedReadingMinutes),
    featured: form.featured,
    translations: textsForApi(TEXT_KEYS, languageCodes(), form.translations),
    blocks: blocksFromElements(form.elements, languageCodes()).blocks,
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
    // Triggers are rows of their own and do not move the Guide's version: saved first, put back when it is refused.
    const { saved, triggers } = await saveWithTriggers(projectId.value, "GUIDE", guide.id, form.triggers, () =>
      updateGuide(projectId.value, guide.id, { version, ...input() }),
    );
    savedTriggers.value = triggers;
    return saved;
  },
  workingCopy: {
    kind: "guides",
    projectId: () => projectId.value,
    payload: () => guideWorkingCopyPayload(input()),
    // Triggers are not in the working copy (backend D-026): "Save draft" saves them live around it.
    async around(guide, save) {
      const { saved, triggers } = await saveWithTriggers(projectId.value, "GUIDE", guide.id, form.triggers, save);
      savedTriggers.value = triggers;
      return saved;
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
    const order = defaultLanguage.value ? [defaultLanguage.value, ...languageCodes()] : languageCodes();
    form.elements = elementsFromBlocks(guide.blocks, order);
    form.media = guide.media.filter((m) => m.usage !== "INLINE").map((m) => ({ ...m }));
    form.triggers = savedTriggers.value.map(triggerToForm);
  },
  ensureLanguageRows() {
    ensureTextRows(TEXT_KEYS, languageCodes(), form.translations);
    for (const element of form.elements) ensureElementLanguages(element);
  },
  formState: () => form,
  validate() {
    const found: Record<string, string> = {};
    if (!SLUG_PATTERN.test(form.slug)) found.slug = "Use lowercase Latin letters, digits, and single hyphens.";
    const minutes = form.estimatedReadingMinutes.trim();
    if (minutes && !isWholeNumber(minutes, 1, 600)) found.estimatedReadingMinutes = "A whole number of minutes between 1 and 600.";
    for (const e of form.elements) {
      const at = layout.value.paths.get(e.key)?.[0];
      if (e.kind === "reference" && !e.resourceId && at) found[`${at}.resourceId`] = "Choose what the reference points to.";
    }
    return found;
  },
  describePath(path) {
    if (/^triggers\[/.test(path)) return "How visitors reach it";
    if (/^media\[/.test(path)) return "Media";
    if (/^blocks\[/.test(path)) {
      const index = elementIndexOfPath(path);
      const lang = /translations\.([^.]+)/.exec(path)?.[1];
      const language = lang ? languages.value.find((l) => l.languageCode === lang)?.displayName ?? lang : null;
      if (index < 0) return `Story${language ? ` (${language})` : ""}`;
      return `Story, ${elementName(form.elements[index], index)}${language ? ` (${language})` : ""}`;
    }
    return describeTranslationPath(path, languages.value, TEXT_META) ?? FIELD_NAMES[path] ?? path;
  },
});

function ensureElementLanguages(element: ElementForm) {
  for (const code of languageCodes()) {
    if (element.texts[code] === undefined) element.texts[code] = "";
    if (element.captions[code] === undefined) element.captions[code] = "";
  }
}

const toReference = (r: ResourceReference) => referenceLink(projectId.value, r, { resourceType: "GUIDE", resourceId: props.guideId });
const heading = computed(() => (editor.resource ? guideTitle(editor.resource, defaultLanguage.value) : "Guide"));
const subtitle = computed(() => (editor.resource ? `Guide · ${editor.resource.slug}` : ""));
// The Guide as visitors would read it, from the live form, elements in the order written (`12` §3, DECISIONS.md D-014).
// The primary image and gallery are still drawn when the Guide has them, since visitors see them.
const preview = computed<PreviewModel | null>(() => {
  if (!editor.resource) return null;
  const { language, fallbackName, codes } = previewLanguages(languages.value, editor.activeLanguage, defaultLanguage.value);
  const blocks: PreviewBlock[] = [
    ...heroBlock(form.media, assets.value, codes),
    { type: "facts", items: form.estimatedReadingMinutes.trim() ? [{ label: "Reading", value: `${form.estimatedReadingMinutes.trim()} min` }] : [] },
    ...guideStoryBlocks(layout.value.blocks, assets.value, codes, (block) => {
      if (!block.resourceType || !block.resourceId) return null;
      return { title: relatables.value[block.resourceType]?.get(block.resourceId)?.title ?? "Unavailable item", subtitle: itemTypeLabel(block.resourceType) };
    }),
    ...mediaBlocks(form.media, assets.value, codes),
  ];
  return { kindLabel: "Guide", language, fallbackName, title: textIn(form.translations, "title", codes), blocks };
});

const activeLanguageInfo = computed(() => editor.activeLanguageInfo);
const activeCode = computed(() => activeLanguageInfo.value?.languageCode ?? null);

const suggestedMinutes = computed(() => {
  const code = defaultLanguage.value;
  if (!code) return null;
  const nodes: StoryBlock[] = form.elements.flatMap((e): StoryBlock[] =>
    e.kind === "paragraph" ? [{ type: "paragraph", text: e.texts[code] ?? "" }] : e.kind === "heading" ? [{ type: "heading", level: e.level, text: e.texts[code] ?? "" }] : [],
  );
  return nodes.some((n) => n.type !== "image" && n.text.trim()) ? readingMinutes(nodes) : null;
});

// Story elements ----------------------------------------------------------------------------------------

const KIND_LABELS: Record<Exclude<ElementKind, "reference">, string> = { paragraph: "Paragraph", heading: "Heading", image: "Image" };

function itemInfo(e: ElementForm): Relatable | undefined {
  return e.resourceType && e.resourceId ? relatables.value[e.resourceType]?.get(e.resourceId) : undefined;
}

function itemTypeLabel(type: GuideItemType): string {
  return ITEM_TYPES.find((t) => t.type === type)?.label ?? type;
}

function kindLabel(e: ElementForm): string {
  if (e.kind !== "reference") return KIND_LABELS[e.kind];
  return e.resourceType ? itemTypeLabel(e.resourceType) : "Reference";
}

function elementName(e: ElementForm | undefined, index: number): string {
  if (!e) return `element ${index + 1}`;
  if (e.kind === "reference") return `reference ${itemInfo(e)?.title ?? ""}`.trim();
  return `${KIND_LABELS[e.kind].toLowerCase()} ${index + 1}`;
}

function itemLink(e: ElementForm) {
  const params = { projectId: projectId.value };
  if (!e.resourceId) return null;
  if (e.resourceType === "POI") return { name: "poi-editor", params: { ...params, poiId: e.resourceId } };
  if (e.resourceType === "ROUTE") return { name: "route-editor", params: { ...params, routeId: e.resourceId } };
  if (e.resourceType === "PLACE") return { name: "place-editor", params: { ...params, placeId: e.resourceId } };
  if (e.resourceType === "EVENT") return { name: "event-editor", params: { ...params, eventId: e.resourceId } };
  return null;
}

/** A reference visitors cannot open: the target is a draft, archived, or gone (`DANGLING_REFERENCE`). */
function referenceWarning(e: ElementForm): string | null {
  if (e.kind !== "reference" || !e.resourceType || !e.resourceId) return null;
  const info = itemInfo(e);
  const noun = itemTypeLabel(e.resourceType).toLowerCase();
  if (!info) return `The ${noun} is no longer available. Remove the reference or choose another one.`;
  if (info.status === "ACTIVE") return null;
  return info.status === "ARCHIVED"
    ? `The ${noun} is archived: visitors don't see this reference. Remove it or restore the ${noun}.`
    : `The ${noun} is a draft: visitors don't see this reference until it is activated.`;
}

/** The element whose request paths hold `path`, by the longest matching path. */
function elementIndexOfPath(path: string): number {
  let best = -1;
  let length = 0;
  form.elements.forEach((e, i) => {
    for (const p of layout.value.paths.get(e.key) ?? []) {
      if ((path === p || path.startsWith(`${p}.`)) && p.length > length) {
        best = i;
        length = p.length;
      }
    }
  });
  return best;
}

/** The element's own errors in the active language, and those of no language. */
function elementError(e: ElementForm): string | undefined {
  const errors = new Set<string>();
  for (const p of layout.value.paths.get(e.key) ?? []) {
    const lang = /\.translations\.([^.]+)/.exec(p)?.[1];
    if (lang && lang !== activeCode.value) continue;
    for (const suffix of ["", ".text", ".level", ".assetId"]) {
      const error = editor.fieldError(p + suffix);
      if (error) errors.add(error);
    }
  }
  return errors.size ? [...errors].join(" ") : undefined;
}

/** Where focus goes for an error at a path: the element's own field in the active language. */
function elementPath(e: ElementForm): string | undefined {
  const paths = layout.value.paths.get(e.key) ?? [];
  return paths.find((p) => activeCode.value && p.includes(`.translations.${activeCode.value}.text.blocks[`)) ?? paths[0];
}

const announcement = ref("");

/** Focuses the moved row's button; at the end of the list that one is disabled, so its counterpart takes focus. */
function focusMoved(id: string) {
  const button = document.getElementById(id) as HTMLButtonElement | null;
  const other = id.endsWith("-up") ? document.getElementById(id.replace(/-up$/, "-down")) : id.endsWith("-down") ? document.getElementById(id.replace(/-down$/, "-up")) : null;
  (button && !button.disabled ? button : other ?? button)?.focus();
}

function moveTo(index: number, target: number, focusId?: (key: string) => string) {
  if (target < 0 || target >= form.elements.length || target === index) return;
  const [element] = form.elements.splice(index, 1);
  form.elements.splice(target, 0, element);
  announcement.value = `Moved ${elementName(element, target)} to position ${target + 1} of ${form.elements.length}.`;
  if (focusId) void nextTick(() => focusMoved(focusId(element.key)));
}

/** Moves an element and keeps keyboard focus on the same button, so repeated presses keep moving it. */
function move(index: number, delta: number) {
  moveTo(index, index + delta, (key) => `ge-move-${key}-${delta < 0 ? "up" : "down"}`);
}

function setPosition(index: number, event: Event) {
  moveTo(index, Number((event.target as HTMLSelectElement).value) - 1, (key) => `ge-position-${key}`);
}

const dragging = ref<string | null>(null);
const dropTarget = ref<{ key: string; after: boolean } | null>(null);

function dragStart(key: string, event: DragEvent) {
  dragging.value = key;
  event.dataTransfer?.setData("text/plain", key);
  if (event.dataTransfer) event.dataTransfer.effectAllowed = "move";
}

function dragOver(key: string, event: DragEvent) {
  if (!dragging.value || dragging.value === key) return;
  event.preventDefault();
  const box = (event.currentTarget as HTMLElement).getBoundingClientRect();
  dropTarget.value = { key, after: event.clientY > box.top + box.height / 2 };
}

function drop() {
  const from = form.elements.findIndex((e) => e.key === dragging.value);
  const target = dropTarget.value;
  dragEnd();
  if (from < 0 || !target) return;
  let to = form.elements.findIndex((e) => e.key === target.key) + (target.after ? 1 : 0);
  if (from < to) to--;
  moveTo(from, to);
}

function dragEnd() {
  dragging.value = null;
  dropTarget.value = null;
}

/** Where the add buttons insert: after the element at `insertAt - 1`, or at the end while null. */
const insertAt = ref<number | null>(null);

function takeInsertPosition(): number {
  const at = insertAt.value ?? form.elements.length;
  insertAt.value = null;
  return at;
}

function insert(element: ElementForm, at: number) {
  ensureElementLanguages(element);
  form.elements.splice(at, 0, element);
  announcement.value = `Added ${elementName(element, at)} at position ${at + 1}.`;
}

async function addText(kind: "paragraph" | "heading") {
  const element = newElement(kind);
  insert(element, takeInsertPosition());
  await nextTick();
  document.getElementById(`ge-field-${element.key}`)?.focus();
}

function removeElement(index: number) {
  const [element] = form.elements.splice(index, 1);
  announcement.value = `Removed ${elementName(element, index)}.`;
}

function setLevel(e: ElementForm, level: 2 | 3) {
  if (e.level === level) return;
  e.level = level;
  announcement.value = `The heading is now level ${level}.`;
}

// Images: a new image element at `at`, or another image for the element at `replace`.
const pickingImage = ref<{ at: number; replace: number | null } | null>(null);
const assetById = computed(() => new Map(assets.value.map((a) => [a.id, a])));

function startImage(replace: number | null = null) {
  pickingImage.value = { at: replace === null ? takeInsertPosition() : 0, replace };
}

function pickImage(asset: Asset) {
  const target = pickingImage.value;
  pickingImage.value = null;
  if (!target) return;
  if (target.replace !== null) {
    const element = form.elements[target.replace];
    if (element) element.assetId = asset.id;
    return;
  }
  insert(newElement("image", { assetId: asset.id }), target.at);
}

/** What visitors who cannot see the image get in the active language. */
function altText(asset: Asset): string | null {
  return (activeCode.value && asset.translations[activeCode.value]?.alternativeText?.trim()) || null;
}

// The reference picker: a new reference at `at`, or another target for the element at `replace`.
const picking = ref<{ at: number; replace: number | null; kind: GuideItemType } | null>(null);
const pickerKinds: PickerKind<GuideItemType>[] = ITEM_TYPES.map((t) => ({ type: t.type, plural: t.plural }));
const pickerCandidates = computed(() =>
  Object.fromEntries(ITEM_TYPES.map((t) => [t.type, [...(relatables.value[t.type]?.values() ?? [])]])) as Record<GuideItemType, Relatable[]>,
);

function startReference(replace: number | null = null, kind: GuideItemType = "POI") {
  picking.value = { at: replace === null ? takeInsertPosition() : 0, replace, kind };
}

function pickReference(kind: GuideItemType, resource: Relatable) {
  const target = picking.value;
  picking.value = null;
  if (!target) return;
  if (target.replace !== null) {
    const element = form.elements[target.replace];
    if (element) Object.assign(element, { resourceType: kind, resourceId: resource.id });
    return;
  }
  insert(newElement("reference", { resourceType: kind, resourceId: resource.id }), target.at);
}

const textElements = computed(() => form.elements.filter((e) => e.kind === "paragraph" || e.kind === "heading"));

// The Translations panel counts the title and, when the Guide has text, the story (every paragraph and heading written).
const translationRows = computed(() =>
  translationStatus(languages.value, textElements.value.length ? 2 : 1, (code) =>
    filledFields(form.translations[code], ["title"] as const) +
    (textElements.value.length && textElements.value.every((e) => (e.texts[code] ?? "").trim()) ? 1 : 0),
  ),
);

const ADD_ACTIONS: { kind: ElementKind; label: string; icon: typeof Pilcrow }[] = [
  { kind: "paragraph", label: "Paragraph", icon: Pilcrow },
  { kind: "heading", label: "Heading", icon: HeadingIcon },
  { kind: "image", label: "Image", icon: ImageIcon },
  { kind: "reference", label: "Reference", icon: Link2 },
];
const KIND_ICONS: Record<ElementKind, typeof Pilcrow> = { paragraph: Pilcrow, heading: HeadingIcon, image: ImageIcon, reference: Link2 };

function add(kind: ElementKind) {
  if (kind === "image") startImage();
  else if (kind === "reference") startReference();
  else void addText(kind);
}
</script>

<template>
  <EditorShell
    tabbed
    :editor="editor"
    back-label="Guides"
    :back-to="{ name: 'guides', params: { projectId } }"
    :title="heading"
    :subtitle="subtitle"
    activation-hint="Activate it once it has a default-language title and a story, every paragraph and heading written in the default language."
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
      <div class="flex flex-wrap items-baseline gap-x-2.5 gap-y-1 border-b px-5 py-3.5">
        <h2 id="story-heading" class="text-[11px] font-extrabold uppercase tracking-[0.09em] text-muted-foreground">
          Story{{ activeLanguageInfo ? ` · ${activeLanguageInfo.displayName}` : "" }}
        </h2>
        <span class="flex-1 text-[11px] text-muted-foreground">Paragraphs, headings, images and references, in the order visitors read them</span>
      </div>
      <p v-if="editor.fieldError('blocks')" class="border-b border-gray-100 px-5 py-3 text-xs font-semibold text-destructive">
        ⚠ {{ editor.fieldError("blocks") }}
      </p>
      <p class="sr-only" aria-live="polite">{{ announcement }}</p>
      <ol>
        <template v-for="(element, index) in form.elements" :key="element.key">
          <li
            class="element border-b border-gray-100 px-5 py-3.5"
            :class="{
              'opacity-50': dragging === element.key,
              'shadow-[inset_0_2px_0_hsl(var(--primary))]': dropTarget?.key === element.key && !dropTarget.after,
              'shadow-[inset_0_-2px_0_hsl(var(--primary))]': dropTarget?.key === element.key && dropTarget.after,
            }"
            :data-path="elementPath(element)"
            tabindex="-1"
            @dragover="dragOver(element.key, $event)"
            @dragleave="dropTarget?.key === element.key && (dropTarget = null)"
            @drop.prevent="drop"
          >
            <div class="flex flex-wrap items-center gap-x-2 gap-y-1.5">
              <span
                v-if="editor.editable && form.elements.length > 1"
                class="-ml-1 cursor-grab select-none rounded p-0.5 text-gray-400 hover:bg-muted hover:text-gray-700 active:cursor-grabbing"
                draggable="true"
                aria-hidden="true"
                title="Drag to reorder"
                @dragstart="dragStart(element.key, $event)"
                @dragend="dragEnd"
              >
                <GripVertical class="h-4 w-4" />
              </span>
              <span class="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-extrabold tabular-nums text-white" aria-hidden="true">
                {{ index + 1 }}
              </span>
              <component :is="KIND_ICONS[element.kind]" class="h-3.5 w-3.5 flex-none text-muted-foreground" aria-hidden="true" />
              <label
                v-if="element.kind === 'paragraph' || element.kind === 'heading'"
                :for="`ge-field-${element.key}`"
                class="text-[10px] font-extrabold uppercase tracking-[0.08em] text-muted-foreground"
              >
                {{ kindLabel(element) }}<span v-if="element.kind === 'heading'">, level {{ element.level }}</span>
              </label>
              <span v-else class="text-[10px] font-extrabold uppercase tracking-[0.08em] text-muted-foreground">{{ kindLabel(element) }}</span>
              <div v-if="element.kind === 'heading'" class="flex gap-1" role="group" :aria-label="`Level of heading ${index + 1}`">
                <button
                  v-for="level in ([2, 3] as const)"
                  :key="level"
                  type="button"
                  :disabled="!editor.editable"
                  :aria-pressed="element.level === level"
                  :aria-label="`Level ${level}`"
                  class="rounded-full border px-2 py-px text-[10px] font-bold disabled:cursor-default"
                  :class="element.level === level ? 'border-primary bg-primary text-white' : 'bg-card text-gray-700'"
                  @click="setLevel(element, level)"
                >
                  H{{ level }}
                </button>
              </div>
              <span class="min-w-2 flex-1"></span>
              <div v-if="editor.editable" class="ml-auto flex flex-none items-center gap-0.5">
                <label v-if="form.elements.length > 1" :for="`ge-position-${element.key}`" class="sr-only">Position of {{ elementName(element, index) }}</label>
                <select
                  v-if="form.elements.length > 1"
                  :id="`ge-position-${element.key}`"
                  :value="index + 1"
                  title="Position"
                  class="field-input element-position"
                  @change="setPosition(index, $event)"
                >
                  <option v-for="n in form.elements.length" :key="n" :value="n">{{ n }}</option>
                </select>
                <button
                  :id="`ge-move-${element.key}-up`"
                  type="button"
                  class="icon-button"
                  :disabled="index === 0"
                  :aria-label="`Move ${elementName(element, index)} up`"
                  title="Move up"
                  @click="move(index, -1)"
                >
                  <ArrowUp class="h-3.5 w-3.5" aria-hidden="true" />
                </button>
                <button
                  :id="`ge-move-${element.key}-down`"
                  type="button"
                  class="icon-button"
                  :disabled="index === form.elements.length - 1"
                  :aria-label="`Move ${elementName(element, index)} down`"
                  title="Move down"
                  @click="move(index, 1)"
                >
                  <ArrowDown class="h-3.5 w-3.5" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  class="icon-button"
                  :class="{ 'bg-accent text-primary': insertAt === index + 1 }"
                  :aria-expanded="insertAt === index + 1"
                  :aria-label="`Insert after ${elementName(element, index)}`"
                  title="Insert after"
                  @click="insertAt = insertAt === index + 1 ? null : index + 1"
                >
                  <Plus class="h-3.5 w-3.5" aria-hidden="true" />
                </button>
                <button type="button" class="icon-button hover:!text-destructive" :aria-label="`Remove ${elementName(element, index)}`" title="Remove" @click="removeElement(index)">
                  <X class="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </div>
            </div>

            <div class="mt-2 sm:pl-[34px]">
              <textarea
                v-if="element.kind === 'paragraph' && activeCode"
                :id="`ge-field-${element.key}`"
                v-model="element.texts[activeCode]"
                :readonly="!editor.editable"
                :lang="activeCode"
                :dir="activeLanguageInfo!.direction.toLowerCase()"
                :placeholder="`Write the paragraph in ${activeLanguageInfo!.displayName}`"
                class="field-input min-h-[96px] resize-y leading-relaxed"
                :aria-invalid="elementError(element) ? 'true' : undefined"
                :aria-describedby="elementError(element) ? `ge-error-${element.key}` : undefined"
                :class="{ invalid: elementError(element) }"
              ></textarea>
              <input
                v-else-if="element.kind === 'heading' && activeCode"
                :id="`ge-field-${element.key}`"
                v-model="element.texts[activeCode]"
                :readonly="!editor.editable"
                :lang="activeCode"
                :dir="activeLanguageInfo!.direction.toLowerCase()"
                :placeholder="`Heading in ${activeLanguageInfo!.displayName}`"
                class="field-input font-bold"
                :aria-invalid="elementError(element) ? 'true' : undefined"
                :aria-describedby="elementError(element) ? `ge-error-${element.key}` : undefined"
                :class="[element.level === 2 ? 'text-[17px]' : 'text-[15px]', { invalid: elementError(element) }]"
              />
              <div v-else-if="element.kind === 'image'" class="flex items-center gap-3">
                <AssetThumb v-if="element.assetId && assetById.get(element.assetId)" :asset="assetById.get(element.assetId)!" height="72px" class="w-28 flex-none" />
                <div class="min-w-0 flex-1">
                  <div class="truncate text-xs font-bold">{{ (element.assetId && assetById.get(element.assetId)?.internalName) || "Unavailable image" }}</div>
                  <template v-if="element.assetId && assetById.get(element.assetId) && activeLanguageInfo">
                    <div v-if="missingAlternativeText(assetById.get(element.assetId)!, activeLanguageInfo.languageCode)" class="mt-1 text-[11px] font-semibold text-destructive">
                      ⚠ No alternative text in {{ activeLanguageInfo.displayName }}
                    </div>
                    <div v-else-if="assetById.get(element.assetId)!.decorative" class="mt-1 text-[11px] text-muted-foreground">Decorative: screen readers skip it.</div>
                    <div v-else-if="altText(assetById.get(element.assetId)!)" class="mt-1 text-[11px] text-gray-700">
                      <span class="font-semibold text-muted-foreground">Alternative text ({{ activeLanguageInfo.languageCode }}):</span>
                      {{ altText(assetById.get(element.assetId)!) }}
                    </div>
                  </template>
                  <div class="mt-1.5 flex gap-3">
                    <RouterLink v-if="element.assetId" :to="{ name: 'asset-editor', params: { projectId, assetId: element.assetId } }" class="text-[11px] font-bold text-primary no-underline hover:underline">
                      Edit image
                    </RouterLink>
                    <button v-if="editor.editable" type="button" class="text-[11px] font-bold text-primary hover:underline" @click="startImage(index)">Replace</button>
                  </div>
                </div>
              </div>
              <div v-else-if="element.kind === 'reference'" class="flex flex-col gap-2">
                <div class="flex flex-wrap items-center gap-2 rounded-lg border bg-muted/40 px-3 py-2.5">
                  <RouterLink v-if="itemInfo(element) && itemLink(element)" :to="itemLink(element)!" class="min-w-0 flex-1 truncate text-[13px] font-bold">
                    {{ itemInfo(element)!.title }}
                  </RouterLink>
                  <span v-else class="min-w-0 flex-1 text-[13px] text-muted-foreground">
                    {{ element.resourceId ? "Unavailable item" : "Nothing chosen yet" }}
                  </span>
                  <StatusChip v-if="itemInfo(element) && itemInfo(element)!.status !== 'ACTIVE'" :status="itemInfo(element)!.status" />
                  <button
                    v-if="editor.editable"
                    type="button"
                    class="text-[11px] font-bold text-primary hover:underline"
                    @click="startReference(index, element.resourceType && element.resourceType !== 'PAGE' ? element.resourceType : 'POI')"
                  >
                    Change
                  </button>
                </div>
                <p v-if="referenceWarning(element)" class="text-xs font-semibold text-[#855400]">⚠ {{ referenceWarning(element) }}</p>
                <div v-if="activeLanguageInfo" class="flex flex-col gap-1">
                  <label :for="`ge-caption-${element.key}`" class="small-label">
                    Caption · {{ activeLanguageInfo.displayName }}
                    <span class="font-normal normal-case tracking-normal text-muted-foreground">· optional</span>
                  </label>
                  <input
                    :id="`ge-caption-${element.key}`"
                    v-model="element.captions[activeLanguageInfo.languageCode]"
                    :readonly="!editor.editable"
                    :lang="activeLanguageInfo.languageCode"
                    :dir="activeLanguageInfo.direction.toLowerCase()"
                    placeholder="Why the reader should open it"
                    class="field-input"
                  />
                </div>
              </div>
              <p v-if="elementError(element)" :id="`ge-error-${element.key}`" class="mt-1.5 text-xs font-semibold text-destructive">⚠ {{ elementError(element) }}</p>
            </div>
          </li>
          <li v-if="editor.editable && insertAt === index + 1" class="flex flex-wrap items-center gap-2 border-b border-gray-100 bg-accent/40 px-5 py-2.5">
            <span class="text-[11px] font-semibold text-muted-foreground">Insert after {{ index + 1 }}:</span>
            <button v-for="action in ADD_ACTIONS" :key="action.kind" type="button" class="add-element" @click="add(action.kind)">
              <component :is="action.icon" class="h-3.5 w-3.5" aria-hidden="true" />{{ action.label }}
            </button>
          </li>
        </template>
      </ol>
      <p v-if="!form.elements.length" class="px-5 py-4 text-[13px] text-muted-foreground">
        Nothing written yet. Start with a paragraph, and add references to the points of interest, routes, places, or
        events where the story talks about them.
      </p>
      <div v-if="editor.editable" class="flex flex-wrap items-center gap-2 px-5 py-3.5">
        <span class="sr-only">Add at the end:</span>
        <button v-for="action in ADD_ACTIONS" :key="action.kind" type="button" class="add-element" @click="insertAt = null; add(action.kind)">
          <component :is="action.icon" class="h-3.5 w-3.5" aria-hidden="true" />+ {{ action.label }}
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
            :aria-invalid="editor.fieldError('slug') ? 'true' : undefined"
            :aria-describedby="editor.fieldError('slug') ? 'err-GuideEditorView-1' : undefined"
            :class="{ invalid: editor.fieldError('slug') }"
          />
          <span v-if="editor.fieldError('slug')" id="err-GuideEditorView-1" class="text-xs font-semibold text-destructive">⚠ {{ editor.fieldError("slug") }}</span>
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
              :aria-invalid="editor.fieldError('estimatedReadingMinutes') ? 'true' : undefined"
              :aria-describedby="editor.fieldError('estimatedReadingMinutes') ? 'err-GuideEditorView-2' : undefined"
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
        <span v-if="editor.fieldError('estimatedReadingMinutes')" id="err-GuideEditorView-2" class="text-xs font-semibold text-destructive">
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

  <ResourcePickerDialog
    v-if="picking"
    :title="picking.replace !== null ? 'Change the reference' : 'Add a reference'"
    :kinds="pickerKinds"
    :candidates="pickerCandidates"
    :initial-kind="picking.kind"
    note="Pages can be referenced once they exist in iGuide."
    @pick="pickReference"
    @close="picking = null"
  />
  <AssetPickerDialog
    v-if="pickingImage"
    :project-id="projectId"
    :title="pickingImage.replace !== null ? 'Replace the image' : 'Add an image to the story'"
    :assets="assets"
    :accept="['IMAGE']"
    :default-language="defaultLanguage"
    @close="pickingImage = null"
    @pick="pickImage"
    @uploaded="assets.unshift($event)"
  />
</template>

<style scoped>
.element-position {
  width: auto;
  padding: 2px 6px;
  font-size: 12px;
}
.icon-button {
  display: inline-flex;
  height: 26px;
  width: 26px;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  color: hsl(var(--muted-foreground));
}
.icon-button:hover:not(:disabled) {
  background: hsl(var(--muted));
  color: hsl(var(--foreground));
}
.icon-button:disabled {
  opacity: 0.3;
}
.add-element {
  display: inline-flex;
  align-items: center;
  gap: 6px;
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
.add-element:hover {
  border-color: hsl(var(--primary) / 0.4);
  color: hsl(var(--primary));
}
</style>
