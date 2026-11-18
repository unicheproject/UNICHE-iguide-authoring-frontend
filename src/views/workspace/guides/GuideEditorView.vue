<script setup lang="ts">
import { computed, nextTick, reactive, ref, watch } from "vue";
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
import { Heading as HeadingIcon, Image as ImageIcon, Link2, Pilcrow, Plus, TriangleAlert } from "lucide-vue-next";
import AssetPickerDialog from "@/components/media/AssetPickerDialog.vue";
import AssetThumb from "@/components/media/AssetThumb.vue";
import TranslationsPanel, { type TextFieldGroup, type TextFieldMeta } from "@/components/editor/TranslationsPanel.vue";
import { checkTriggers, listTargetTriggers, saveWithTriggers, triggerToForm, type Trigger, type TriggerForm } from "@/platform/triggers";
import ResourcePickerDialog from "@/components/ResourcePickerDialog.vue";
import type { PickerKind } from "@/components/resourcePicker";
import StatusChip from "@/components/StatusChip.vue";
import { SLUG_PATTERN } from "@/lib/format";
import { completenessOf, storyGaps } from "@/platform/completeness";
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
    checkTriggers(form.triggers, found);
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

/** Structural controls (reorder, insert, remove, replace) belong to the default language; other tabs only translate. */
const structural = computed(() => activeLanguageInfo.value?.isDefault ?? true);
const defaultLanguageInfo = computed(() => languages.value.find((l) => l.isDefault) ?? null);
const elementBase = (key: string) => `ge-${key}`;

/** Focuses the control that moved the row; at the end of the list that button is disabled, so its counterpart takes focus. */
function focusMoved(key: string, via: "up" | "down" | "handle" | "position") {
  const id = (suffix: string) => document.getElementById(`${elementBase(key)}-${suffix}`) as HTMLButtonElement | null;
  const same = via === "handle" ? id("handle") : via === "position" ? id("position") : id(via === "up" ? "move-up" : "move-down");
  const other = via === "up" ? id("move-down") : via === "down" ? id("move-up") : null;
  (same && !same.disabled ? same : other ?? same)?.focus();
}

function moveTo(index: number, target: number, via?: "up" | "down" | "handle" | "position") {
  if (target < 0 || target >= form.elements.length || target === index) return;
  const [element] = form.elements.splice(index, 1);
  form.elements.splice(target, 0, element);
  announcement.value = `Moved ${elementName(element, target)} to position ${target + 1} of ${form.elements.length}.`;
  if (via) void nextTick(() => focusMoved(element.key, via));
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

function insert(element: ElementForm, at: number, announce = true) {
  ensureElementLanguages(element);
  form.elements.splice(at, 0, element);
  // One message per action: a text block takes focus, so the field's own label ("Paragraph (block 3)") says it.
  if (announce) announcement.value = `Added ${elementName(element, at)} at position ${at + 1}.`;
}

async function addText(kind: "paragraph" | "heading") {
  const element = newElement(kind);
  insert(element, takeInsertPosition(), false);
  await nextTick();
  document.getElementById(`ge-field-${element.key}`)?.focus();
}

/** Remove with Undo: the next row takes focus, the removal is announced, Undo puts the element back. */
const elementUndo = useUndoRemove<ElementForm>({
  list: () => form.elements,
  describe: (element, index) => `${kindLabel(element)} ${index + 1}${itemInfo(element) ? `, ${itemInfo(element)!.title}` : ""}`,
  noun: "block",
  // Focus goes to Undo, next to the list (C2-70, D-098); Ctrl+Z works from anywhere.
  focusAt(index, remaining) {
    const undo = document.querySelector<HTMLElement>("#story [data-removed-bar] [data-undo]");
    if (undo) return undo.focus();
    const rows = document.querySelectorAll<HTMLElement>("[data-element-row]");
    const row = rows[Math.min(index, remaining - 1)];
    (row?.querySelector<HTMLElement>("[data-focus-target]") ?? row ?? document.getElementById("add-element-end"))?.focus();
  },
  focusRestored(element) {
    const row = document.getElementById(`ge-row-${element.key}`);
    (row?.querySelector<HTMLElement>("[data-focus-target]") ?? row)?.focus();
  },
});
// A reload or an Apply replaces the form, so the old positions mean nothing.
watch(() => editor.resource, () => elementUndo.clear());

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

/** The live form's completeness (D-090, G-039): an empty story, or one of only empty blocks, is a warning, never "Complete". */
const completeness = computed(() =>
  completenessOf({
    languages: languages.value,
    base: translationRows.value.map((r) => ({ languageCode: r.language.languageCode, filled: r.filled, total: r.total })),
    gaps: textElements.value.length ? [] : storyGaps([]),
  }),
);

const ADD_ACTIONS: { kind: ElementKind; label: string; icon: typeof Pilcrow }[] = [
  { kind: "paragraph", label: "Paragraph", icon: Pilcrow },
  { kind: "heading", label: "Heading", icon: HeadingIcon },
  { kind: "image", label: "Image", icon: ImageIcon },
  { kind: "reference", label: "Reference", icon: Link2 },
];
const KIND_ICONS: Record<ElementKind, typeof Pilcrow> = { paragraph: Pilcrow, heading: HeadingIcon, image: ImageIcon, reference: Link2 };

const railSections = [{ id: "texts", label: "Texts" }];
const detailsCount = computed(() => `${[form.slug, form.estimatedReadingMinutes, form.internalName, form.featured ? "x" : ""].filter(Boolean).length} of 4 set`);

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
        title-required-hint="Required in the default language before the guide can be activated."
      />
    </div>

    <EditorSection
      id="story"
      :title="structural ? 'Story' : `Story in ${activeLanguageInfo?.displayName ?? ''}`"
      :count="form.elements.length ? `${form.elements.length}` : undefined"
      :description="structural ? 'Paragraphs, headings, images and references, in the order visitors read them.' : 'Only the texts are translated here. Switch to the default language to add, remove or reorder the story.'"
      data-path="blocks"
      tabindex="-1"
    >
      <Alert v-if="editor.fieldError('blocks')" tone="danger">{{ editor.fieldError("blocks") }}</Alert>
      <p class="sr-only" aria-live="polite">{{ announcement }}</p>
      <ol v-if="form.elements.length" class="flex flex-col gap-3">
        <template v-for="(element, index) in form.elements" :key="element.key">
          <li
            :id="`ge-row-${element.key}`"
            data-element-row
            class="rounded-md border border-border bg-card p-3"
            :class="{
              'opacity-50': dragging === element.key,
              'shadow-drop-before': dropTarget?.key === element.key && !dropTarget.after,
              'shadow-drop-after': dropTarget?.key === element.key && dropTarget.after,
            }"
            :data-path="elementPath(element)"
            tabindex="-1"
            @dragover="dragOver(element.key, $event)"
            @dragleave="dropTarget?.key === element.key && (dropTarget = null)"
            @drop.prevent="drop"
          >
            <div class="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span class="flex size-7 flex-none items-center justify-center rounded-full bg-primary text-xs font-bold tabular text-primary-foreground" aria-hidden="true">{{ index + 1 }}</span>
              <component :is="KIND_ICONS[element.kind]" class="size-4 flex-none text-muted-foreground" aria-hidden="true" />
              <span v-if="element.kind === 'image' || element.kind === 'reference'" class="text-sm font-semibold">{{ kindLabel(element) }}</span>
              <div v-if="element.kind === 'heading' && structural" class="flex gap-1" role="group" :aria-label="`Level of heading ${index + 1}`">
                <Button
                  v-for="level in ([2, 3] as const)"
                  :key="level"
                  :variant="element.level === level ? 'primary' : 'secondary'"
                  size="sm"
                  :disabled="!editor.editable"
                  :aria-pressed="element.level === level"
                  @click="setLevel(element, level)"
                >
                  H{{ level }}<span class="sr-only"> (level {{ level }})</span>
                </Button>
              </div>
              <span class="min-w-2 flex-1"></span>
              <ReorderControls
                v-if="editor.editable && structural"
                :id-base="elementBase(element.key)"
                :index="index"
                :count="form.elements.length"
                :name="elementName(element, index)"
                @move="(delta, via) => moveTo(index, index + delta, via)"
                @position="(n) => moveTo(index, n - 1, 'position')"
                @remove="elementUndo.remove(index)"
                @dragstart="dragStart(element.key, $event)"
                @dragend="dragEnd"
              >
                <Button
                  variant="ghost"
                  size="icon"
                  :label="`Insert after ${elementName(element, index)}`"
                  title="Insert after"
                  class="size-8 [@media(pointer:coarse)]:size-11"
                  :class="{ 'bg-accent text-primary': insertAt === index + 1 }"
                  :aria-expanded="insertAt === index + 1"
                  @click="insertAt = insertAt === index + 1 ? null : index + 1"
                >
                  <Plus aria-hidden="true" />
                </Button>
              </ReorderControls>
            </div>

            <div class="mt-3">
              <SourcePairField
                v-if="(element.kind === 'paragraph' || element.kind === 'heading') && activeLanguageInfo && activeCode"
                v-model="element.texts[activeCode]"
                :id="`ge-field-${element.key}`"
                focus-target
                :label="element.kind === 'paragraph' ? `Paragraph (block ${index + 1})` : `Heading (block ${index + 1})`"
                :multiline="element.kind === 'paragraph'"
                :min-rows="3"
                :readonly="!editor.editable"
                :language="activeLanguageInfo"
                :source-language="defaultLanguageInfo"
                :source-text="defaultLanguage ? (element.texts[defaultLanguage] ?? '') : ''"
                :placeholder="element.kind === 'paragraph' ? `Write the paragraph in ${activeLanguageInfo.displayName}` : `Heading in ${activeLanguageInfo.displayName}`"
                :control-class="element.kind === 'heading' ? (element.level === 2 ? 'text-base font-bold' : 'text-sm font-bold') : undefined"
                :error="elementError(element)"
              />
              <div v-else-if="element.kind === 'image'" class="flex flex-wrap items-center gap-3">
                <AssetThumb v-if="element.assetId && assetById.get(element.assetId)" :asset="assetById.get(element.assetId)!" height="72px" class="w-28 flex-none" />
                <div class="min-w-0 flex-1">
                  <div class="truncate text-sm font-semibold">{{ (element.assetId && assetById.get(element.assetId)?.internalName) || "Unavailable image" }}</div>
                  <template v-if="element.assetId && assetById.get(element.assetId) && activeLanguageInfo">
                    <p v-if="missingAlternativeText(assetById.get(element.assetId)!, activeLanguageInfo.languageCode)" class="mt-1 flex items-start gap-1.5 text-xs font-medium text-destructive">
                      <TriangleAlert class="mt-px size-4 shrink-0" aria-hidden="true" />No alternative text in {{ activeLanguageInfo.displayName }}
                    </p>
                    <p v-else-if="assetById.get(element.assetId)!.decorative" class="mt-1 text-xs text-muted-foreground">Decorative: screen readers skip it.</p>
                    <p v-else-if="altText(assetById.get(element.assetId)!)" class="mt-1 text-xs text-ink-2">
                      <span class="font-semibold text-muted-foreground">Alternative text ({{ activeLanguageInfo.languageCode }}):</span>
                      {{ altText(assetById.get(element.assetId)!) }}
                    </p>
                  </template>
                  <div class="mt-1 flex flex-wrap gap-x-4">
                    <RouterLink v-if="element.assetId" :to="{ name: 'asset-editor', params: { projectId, assetId: element.assetId } }" class="inline-flex min-h-control items-center text-sm font-semibold" data-focus-target>Edit image</RouterLink>
                    <Button v-if="editor.editable && structural" variant="link" class="hit-44" @click="startImage(index)">Replace<span class="sr-only"> image {{ index + 1 }}</span></Button>
                  </div>
                </div>
              </div>
              <div v-else-if="element.kind === 'reference'" class="flex flex-col gap-3">
                <div class="flex flex-wrap items-center gap-2 rounded-md border border-border bg-muted px-3 py-2">
                  <RouterLink v-if="itemInfo(element) && itemLink(element)" :to="itemLink(element)!" data-focus-target class="inline-flex min-h-control min-w-0 flex-1 items-center truncate font-semibold">
                    {{ itemInfo(element)!.title }}
                  </RouterLink>
                  <span v-else class="min-w-0 flex-1 text-sm text-muted-foreground">
                    {{ element.resourceId ? "Unavailable item" : "Nothing chosen yet" }}
                  </span>
                  <StatusChip v-if="itemInfo(element) && itemInfo(element)!.status !== 'ACTIVE'" :status="itemInfo(element)!.status" />
                  <Button
                    v-if="editor.editable && structural"
                    variant="secondary"
                    size="sm"
                    @click="startReference(index, element.resourceType && element.resourceType !== 'PAGE' ? element.resourceType : 'POI')"
                  >
                    Change<span class="sr-only"> reference {{ index + 1 }}</span>
                  </Button>
                </div>
                <p v-if="referenceWarning(element)" class="flex items-start gap-1.5 text-xs font-medium text-warning">
                  <TriangleAlert class="mt-px size-4 shrink-0" aria-hidden="true" />{{ referenceWarning(element) }}
                </p>
                <SourcePairField
                  v-if="activeLanguageInfo"
                  v-model="element.captions[activeLanguageInfo.languageCode]"
                  :id="`ge-caption-${element.key}`"
                  label="Caption (optional)"
                  :readonly="!editor.editable"
                  :language="activeLanguageInfo"
                  :source-language="defaultLanguageInfo"
                  :source-text="defaultLanguage ? (element.captions[defaultLanguage] ?? '') : ''"
                  placeholder="Why the reader should open it"
                />
              </div>
              <p v-if="elementError(element) && (element.kind === 'image' || element.kind === 'reference')" :id="`ge-error-${element.key}`" class="mt-1.5 flex items-start gap-1.5 text-xs font-medium text-destructive">
                <TriangleAlert class="mt-px size-4 shrink-0" aria-hidden="true" />{{ elementError(element) }}
              </p>
            </div>
          </li>
          <li v-if="editor.editable && structural && insertAt === index + 1" class="flex flex-wrap items-center gap-2 rounded-md bg-accent px-3 py-2">
            <span class="text-sm font-semibold text-ink-2">Insert after {{ index + 1 }}:</span>
            <Button v-for="action in ADD_ACTIONS" :key="action.kind" variant="secondary" size="sm" @click="add(action.kind)">
              <component :is="action.icon" aria-hidden="true" />{{ action.label }}
            </Button>
          </li>
        </template>
      </ol>
      <p v-else class="text-sm text-muted-foreground">
        Nothing written yet. Start with a paragraph, and add references to the points of interest, routes, places, or
        events where the story talks about them.
      </p>
      <RemovedBar v-if="elementUndo.last.value" :label="elementUndo.last.value.label" noun="block" :count="elementUndo.removed.value.length" @undo="elementUndo.undo()" @dismiss="elementUndo.clear()" />
      <div v-if="editor.editable && structural" class="flex flex-wrap items-center gap-2" role="group" aria-label="Add to the end of the story">
        <Button v-for="action in ADD_ACTIONS" :id="action.kind === 'paragraph' ? 'add-element-end' : undefined" :key="action.kind" variant="secondary" size="sm" @click="insertAt = null; add(action.kind)">
          <component :is="action.icon" aria-hidden="true" />Add {{ action.label.toLowerCase() }}
        </Button>
      </div>
    </EditorSection>

    <EditorSection v-if="structural" id="details" title="Details" :count="detailsCount" collapsible :default-open="false">
      <FormField id="f-slug" label="Slug" hint="Part of the item's web address and QR targets. Changing it breaks printed QR codes." :error="editor.fieldError('slug')" v-slot="f">
        <Input :id="f.id" v-model="form.slug" :readonly="!editor.editable" spellcheck="false" class="mono" :aria-describedby="f.describedBy" :invalid="f.invalid" />
      </FormField>
      <div class="flex flex-col gap-2">
        <FormField id="f-estimatedReadingMinutes" label="Reading time (minutes)" :error="editor.fieldError('estimatedReadingMinutes')" v-slot="f">
          <Input :id="f.id" v-model="form.estimatedReadingMinutes" :readonly="!editor.editable" inputmode="numeric" class="sm:max-w-40" :aria-describedby="f.describedBy" :invalid="f.invalid" />
        </FormField>
        <p v-if="suggestedMinutes" class="text-xs text-muted-foreground">
          The default-language story reads in about {{ suggestedMinutes }} min.
          <Button v-if="editor.editable && form.estimatedReadingMinutes !== String(suggestedMinutes)" variant="link" class="ml-1" @click="form.estimatedReadingMinutes = String(suggestedMinutes)">Use it</Button>
        </p>
      </div>
      <FormField id="f-internalName" label="Internal name" hint="For authors only; visitors never see it." v-slot="f">
        <Input :id="f.id" v-model="form.internalName" :readonly="!editor.editable" :aria-describedby="f.describedBy" />
      </FormField>
      <Checkbox v-model="form.featured" :disabled="!editor.editable">Featured: highlighted in the visitor app's lists</Checkbox>
    </EditorSection>
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
