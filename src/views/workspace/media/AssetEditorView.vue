<script setup lang="ts">
import { Copy, Download, Info, Replace } from "lucide-vue-next";
import HelpHint from "@/components/ui/help-hint/HelpHint.vue";
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from "vue";
import AssetPreview from "@/components/media/AssetPreview.vue";
import EditorSection from "@/components/editor/EditorSection.vue";
import EditorShell from "@/components/editor/EditorShell.vue";
import OtherSettings from "@/components/editor/OtherSettings.vue";
import UploadEntryRow from "@/components/media/UploadEntryRow.vue";
import UploadLimits from "@/components/media/UploadLimits.vue";
import TranslationsPanel, { type TextFieldGroup, type TextFieldMeta } from "@/components/editor/TranslationsPanel.vue";
import { Button } from "@/components/ui/button";
import Checkbox from "@/components/ui/checkbox/Checkbox.vue";
import FormField from "@/components/ui/field/FormField.vue";
import Input from "@/components/ui/input/Input.vue";
import { say } from "@/lib/announcer";
import { formatBytes, formatDate } from "@/lib/format";
import {
  assetTypeLabel,
  changeAssetStatus,
  fetchAsset,
  fetchAssetDownload,
  fetchAssetReferences,
  formatDuration,
  replaceAssetFile,
  isImage,
  updateAsset,
  type Asset,
  type AssetTranslation,
} from "@/platform/assets";
import { askConfirm } from "@/stores/confirm";
import { assetAltSlots, completenessOf } from "@/platform/completeness";
import { filledFields, translationStatus } from "@/workspace/translationStatus";
import { useAssetUpload } from "@/workspace/useAssetUpload";
import { ApiError } from "@/platform/api";
import { showToast } from "@/stores/toast";
import type { ResourceReference } from "@/platform/references";
import { useCurrentProject } from "@/workspace/currentProject";
import { describeTranslationPath, ensureTextRows, textsForApi, textsFrom, type Texts } from "@/workspace/formFields";
import { referenceLink } from "@/workspace/referenceLinks";
import { useProjectLanguages } from "@/workspace/useProjectLanguages";
import { useResourceEditor } from "@/workspace/useResourceEditor";

const props = defineProps<{ assetId: string }>();
const project = useCurrentProject();
const projectId = computed(() => project.value.id);
const { languages, defaultLanguage, loading: languagesLoading } = useProjectLanguages(projectId);
const languageCodes = () => languages.value.map((l) => l.languageCode);

type TextKey = keyof AssetTranslation;
const TEXT_KEYS: TextKey[] = ["alternativeText", "title", "caption", "credits", "transcript"];
const TEXT_META: Record<TextKey, TextFieldMeta> = {
  alternativeText: {
    label: "Alternative text",
    multiline: true,
    // `14` §2 Alternative text.
    helper:
      "What the image shows and why it is here, in one or two sentences; don't begin with \"image of\". For an object, name it, its material, and the detail to notice.",
  },
  title: { label: "Title", multiline: false },
  caption: { label: "Caption", multiline: true, helper: "Shown under the media in the visitor app." },
  credits: { label: "Credits", multiline: false, helper: "Photographer, rights holder, licence." },
  transcript: {
    label: "Transcript",
    multiline: true,
    // `14` §2 Audio narration and transcripts.
    helper: "Every spoken word, and the sounds that carry meaning, for visitors who cannot listen.",
  },
};

const form = reactive({
  internalName: "",
  decorative: false,
  translations: {} as Record<string, Texts<TextKey>>,
});

const editor = useResourceEditor<Asset>({
  kind: "asset",
  source: () => props.assetId,
  languages,
  defaultLanguage,
  // An asset used by live content stays editable, so a missing alternative text can always be fixed.
  isEditable: (asset) => asset.status !== "ARCHIVED",
  load: () => fetchAsset(projectId.value, props.assetId),
  save: (asset, version) =>
    updateAsset(projectId.value, asset.id, {
      version,
      internalName: form.internalName.trim(),
      decorative: form.decorative,
      translations: textsForApi(TEXT_KEYS, languageCodes(), form.translations) as Record<string, AssetTranslation>,
    }),
  changeStatus: (asset, target, version) => changeAssetStatus(projectId.value, asset.id, target, version),
  loadReferences: (asset) => fetchAssetReferences(projectId.value, asset.id),
  resetForm(asset) {
    form.internalName = asset.internalName;
    form.decorative = asset.decorative;
    form.translations = Object.fromEntries(Object.entries(asset.translations).map(([code, t]) => [code, textsFrom(TEXT_KEYS, t)]));
  },
  ensureLanguageRows: () => ensureTextRows(TEXT_KEYS, languageCodes(), form.translations),
  formState: () => form,
  validate: (): Record<string, string> =>
    form.internalName.trim() ? {} : { internalName: "Enter a name, so authors can find the file." },
  describePath: (path) => describeTranslationPath(path, languages.value, TEXT_META) ?? (path === "internalName" ? "Name" : path),
});

const toReference = (r: ResourceReference) => referenceLink(projectId.value, r);

const asset = computed(() => editor.resource);
// A floor plan is an image too: it takes alternative text (a summary of the plan) and the decorative flag, though only
// an IMAGE needs the text before activation (backend AssetReadiness; `14` §2 Alternative text).
const image = computed(() => (asset.value ? isImage(asset.value) : false));
const plainImage = computed(() => asset.value?.type === "IMAGE");
const floorPlan = computed(() => asset.value?.type === "FLOOR_PLAN");
const timed = computed(() => asset.value?.type === "AUDIO" || asset.value?.type === "VIDEO");

// Only the texts that apply to this kind of file.
const groups = computed<TextFieldGroup[]>(() => [
  { id: "main", label: null, keys: image.value ? ["alternativeText", "title", "caption"] : ["title", "caption"] },
  { id: "more", label: "More texts", keys: timed.value ? ["credits", "transcript"] : ["credits"], open: true },
]);

// Where it is used: the editor lists the references; the library's count can differ (G-030).
const references = ref<ResourceReference[] | null>(null);
watch(
  () => [asset.value?.id, asset.value?.version] as const,
  async ([id], _old, onCleanup) => {
    let stale = false;
    onCleanup(() => (stale = true));
    if (!id) return;
    try {
      const found = await fetchAssetReferences(projectId.value, id);
      if (!stale) references.value = found;
    } catch {
      if (!stale) references.value = null;
    }
  },
  { immediate: true },
);
/** The count the editor shows is the list of places below, read from the references; the library's own counter can differ (G-030). */
const usedCount = computed(() => references.value?.length ?? asset.value?.usageCount ?? 0);
const usedText = computed(() => (usedCount.value === 0 ? "Not used yet" : usedCount.value === 1 ? "1 resource" : `${usedCount.value} resources`));
const usedDiffers = computed(() => !!asset.value && !!references.value && references.value.length !== asset.value.usageCount);
const usedHint = computed(() =>
  usedDiffers.value
    ? `The media library shows ${asset.value?.usageCount} for this file; the list here shows ${usedCount.value}. The library's number comes from a counter that also counts images inside Guide text, which the list of places does not name. Trust the list: it is read for this file.`
    : "The places that use this file are listed under Used in, in the side column.",
);

/** The facts of the file: only those the API gives, with the filename, size and duration an audio, video or PDF needs. */
const facts = computed(() => {
  const a = asset.value;
  if (!a) return [];
  return [
    { label: "File", value: a.originalFilename },
    { label: "Type", value: `${assetTypeLabel(a.type)} (${a.mimeType})` },
    { label: "Size", value: formatBytes(a.sizeBytes) },
    ...(a.width && a.height ? [{ label: "Dimensions", value: `${a.width} × ${a.height} px` }] : []),
    ...(a.durationSeconds ? [{ label: "Duration", value: formatDuration(a.durationSeconds) }] : []),
    { label: "Uploaded", value: formatDate(a.createdAt) },
    { label: "Used in", value: usedText.value, hint: usedHint.value },
  ];
});

const checksumCopied = ref(false);
async function copyChecksum() {
  if (!asset.value) return;
  try {
    await navigator.clipboard.writeText(asset.value.checksum);
    checksumCopied.value = true;
    say("Checksum copied.");
    setTimeout(() => (checksumCopied.value = false), 2500);
  } catch {
    showToast("Could not copy", "Select the checksum and copy it by hand.", "warning");
  }
}

// Layout: from 1180 px the preview leads the sticky side column; below it a thumbnail row leads the form.
const wideQuery = typeof window !== "undefined" ? window.matchMedia("(min-width: 1180px)") : null;
const wide = ref(wideQuery?.matches ?? true);
const onWide = (e: MediaQueryListEvent) => (wide.value = e.matches);
onMounted(() => wideQuery?.addEventListener("change", onWide));
onBeforeUnmount(() => wideQuery?.removeEventListener("change", onWide));
/**
 * The live form's completeness: tab marks, the Translations card, Next missing and "Before you activate" count typing as
 * it happens (D-090). One definition of "Complete", the library row's (C3-37): a title, plus alternative text for an
 * image. The caption is optional and never counts. Only alternative text (or decorative) blocks activation (D-107,
 * `14` §4), so a missing title is a warning, never "no text yet".
 */
const translationRows = computed(() => translationStatus(languages.value, 1, (code) => filledFields(form.translations[code], ["title"] as const)));
const liveCompleteness = computed(() =>
  completenessOf({
    baseBlocks: false,
    languages: languages.value,
    base: translationRows.value.map((s) => ({ languageCode: s.language.languageCode, filled: s.filled, total: s.total })),
    slots: asset.value ? assetAltSlots({ type: asset.value.type, decorative: form.decorative, translations: form.translations }) : [],
  }),
);
const preferredAlt = computed(() => form.translations[defaultLanguage.value ?? ""]?.alternativeText ?? "");

// Replace and download --------------------------------------------------------------------------------------

/*
 * "Replace file" (DECISIONS.md D-032): only for a DRAFT Asset, since visitors may be seeing the file of an ACTIVE one
 * (`03` §1: upload a new Asset and bind it instead; the backend refuses it too). It runs through the upload queue, so
 * the size limit is checked before sending, and progress, Retry, and the announcement are the upload dialog's.
 */
const replaceInput = ref<HTMLInputElement | null>(null);
const replaceBlocked = computed(() =>
  asset.value?.status === "ACTIVE"
    ? "Visitors may be seeing this file, so it can't be replaced. Upload a new file and use it instead."
    : null,
);
const replacer = useAssetUpload(
  projectId,
  async () => {
    await editor.load();
    showToast("File replaced", "Every place that uses the asset now shows the new file. Its texts are unchanged.");
  },
  {
    uploader: (entry, onProgress, signal) =>
      replaceAssetFile(projectId.value, props.assetId, entry.file, editor.resource!.version, onProgress, signal),
  },
);
const replaceEntries = replacer.entries;
const replacing = computed(() => replacer.busy());

function chooseReplacement() {
  if (editor.dirty) {
    showToast("Save first", "Save or undo your changes before replacing the file.", "warning");
    return;
  }
  replaceInput.value?.click();
}

function onReplacement(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = "";
  if (!file || !asset.value) return;
  replacer.dismissFinished();
  void replacer.upload([file], { type: asset.value.type });
}

const downloading = ref(false);
async function download() {
  if (!asset.value) return;
  downloading.value = true;
  try {
    const { url } = await fetchAssetDownload(projectId.value, asset.value.id);
    window.location.assign(url);
  } catch (e) {
    if (!(e instanceof ApiError)) throw e;
    showToast("The download could not start", e.platformUnavailable ? "The UNICHE platform is not reachable." : e.message, "error");
  } finally {
    downloading.value = false;
  }
}

const replaceAccept = computed(() => {
  const type = asset.value?.type;
  return type === "IMAGE" || type === "FLOOR_PLAN" ? "image/*" : type === "AUDIO" ? "audio/*" : type === "VIDEO" ? "video/*" : undefined;
});

const activationHint = computed(() =>
  plainImage.value ? "Activate it once it has alternative text in the default language, or mark it decorative." : "Activate it when it is ready to be used.",
);

/** True while a non-default language is being written: the language-independent controls fold (D-079, C3-52). */
const otherFolded = computed(() => !!editor.activeLanguage && editor.activeLanguage !== defaultLanguage.value);

const decorativeBox = ref<{ $el: HTMLElement } | null>(null);
/** The native box inside the Decorative checkbox. */
const decorativeInput = () => decorativeBox.value?.$el.querySelector<HTMLInputElement>('input[type="checkbox"]') ?? null;
/** Makes the drawn box say what the model says: the native box has already toggled when the change arrives (C3-77). */
function syncDecorative() {
  const input = decorativeInput();
  if (input) input.checked = form.decorative;
}

/**
 * Marking an image decorative is confirmed (`14` §2): screen readers then skip it. The box is controlled: it stays
 * unticked while the question is open, and Esc or "Keep it described" leave it unticked, with the model unchanged.
 */
async function setDecorative(on: boolean) {
  if (!on) {
    form.decorative = false;
    syncDecorative();
    return;
  }
  syncDecorative();
  form.decorative = await askConfirm({
    title: "Mark the image decorative?",
    body: "Screen readers will skip it and it needs no alternative text. Choose this only when removing the image would lose nothing; a primary image of an exhibit is never decorative.",
    confirmLabel: "Mark decorative",
    cancelLabel: "Keep it described",
  });
  await nextTick();
  syncDecorative();
}
</script>

<template>
  <EditorShell
    :editor="editor"
    back-label="Media"
    :back-to="{ name: 'media', params: { projectId } }"
    :title="asset?.internalName ?? 'Asset'"
    :subtitle="asset ? `${assetTypeLabel(asset.type)} · ${asset.originalFilename}` : ''"
    :activation-hint="activationHint"
    :reference-link="toReference"
    :pending="languagesLoading"
    :translations="translationRows"
    :completeness="liveCompleteness"
  >
    <!-- Below 1180 px the preview is one thumbnail row above the form, so the alternative text stays above the fold (C2-80). -->
    <AssetPreview v-if="asset && !wide" :asset="asset" :alt="preferredAlt" compact />

    <TranslationsPanel
      v-if="asset"
      :key="asset.type"
      v-model:active-language="editor.activeLanguage"
      :project-id="projectId"
      :languages="languages"
      :texts="form.translations"
      :groups="groups"
      :meta="TEXT_META"
      :readonly="!editor.editable"
      :error-languages="editor.languagesWithErrors"
      :field-error="editor.fieldError"
      :required-field="plainImage && !form.decorative ? 'alternativeText' : ''"
      title-required-hint="Required in the default language before the image can be activated, unless it is decorative."
    />

    <OtherSettings :folded="otherFolded" :section-ids="['image-settings', 'details']" :summary="image ? 'Decorative image, Details' : 'Details'">
      <EditorSection v-if="image" id="image-settings" title="Image settings">
        <Checkbox
          ref="decorativeBox"
          :model-value="form.decorative"
          :disabled="!editor.editable"
          description="No alternative text is needed. Screen readers skip it. Only when removing the image would lose nothing. It applies to every language."
          @update:model-value="setDecorative"
        >
          Decorative image
        </Checkbox>
        <p v-if="form.decorative" class="flex items-start gap-1.5 text-xs text-muted-foreground">
          <Info class="mt-px size-4 shrink-0" aria-hidden="true" />Alternative text is not required while this is on. Text already written is kept but not used.
        </p>
        <p v-if="floorPlan" class="text-xs text-muted-foreground">
          For a floor plan, the alternative text summarises what the plan shows and points visitors to the list of what is on it.
        </p>
      </EditorSection>

      <EditorSection id="details" title="Details">
        <FormField label="Name" :error="editor.fieldError('internalName')" hint="Only authors see it; it is what the media library searches." v-slot="f">
          <Input :id="f.id" v-model="form.internalName" :readonly="!editor.editable" :aria-describedby="f.describedBy" :invalid="f.invalid" />
        </FormField>
      </EditorSection>
    </OtherSettings>

    <template #aside>
      <div v-if="asset" class="order-first flex flex-col gap-4">
        <AssetPreview v-if="wide" :asset="asset" :alt="preferredAlt" />
        <section class="rounded-lg border border-border bg-card p-4 shadow-1" aria-labelledby="file-heading">
          <h2 id="file-heading" class="mb-2 text-sm font-bold">File</h2>
          <dl class="flex flex-col gap-1.5 text-compact">
            <div v-for="f in facts" :key="f.label" class="min-w-0">
              <dt class="inline font-semibold text-ink-2">{{ f.label }}:</dt>
              <dd class="ml-1 inline break-words">{{ f.value }}<HelpHint v-if="f.hint" label="Why the library may show another number" class="ml-0.5 size-6 align-text-bottom">{{ f.hint }}</HelpHint></dd>
            </div>
          </dl>
          <details class="mt-2 text-compact">
            <summary class="cursor-pointer font-semibold text-ink-2">Checksum</summary>
            <p class="mono mt-1 break-all">{{ asset.checksum }}</p>
            <Button variant="secondary" size="sm" class="mt-1" @click="copyChecksum"><Copy aria-hidden="true" />{{ checksumCopied ? "Copied" : "Copy checksum" }}</Button>
          </details>
          <div class="mt-3 flex flex-wrap gap-2 border-t border-border pt-3">
            <Button
              variant="secondary"
              size="sm"
              :loading="replacing"
              :disabled-reason="!editor.editable ? 'This item cannot be edited' : (replaceBlocked ?? undefined)"
              aria-describedby="replace-help"
              @click="chooseReplacement"
            >
              <Replace aria-hidden="true" />{{ replacing ? "Replacing…" : "Replace file" }}
            </Button>
            <input ref="replaceInput" type="file" class="sr-only" aria-label="Replacement file" tabindex="-1" :accept="replaceAccept" @change="onReplacement" />
            <Button variant="secondary" size="sm" :loading="downloading" @click="download"><Download aria-hidden="true" />Download</Button>
          </div>
          <p id="replace-help" class="mt-2 text-xs text-muted-foreground">
            {{ replaceBlocked ?? `A replacement must be ${assetTypeLabel(asset.type).toLowerCase()} too; texts and every use are kept.` }}
          </p>
          <div v-if="replaceEntries.length" class="mt-3">
            <UploadLimits :limits="replacer.limits.value" :failed="replacer.limitsFailed.value" :types="[asset.type]" @reload="replacer.ensureLimits" />
            <ul class="mt-2 rounded-lg border border-border" aria-label="Replacement">
              <UploadEntryRow v-for="entry in replaceEntries" :key="entry.key" :entry="entry" @retry="replacer.retry(entry)" @cancel="replacer.cancel(entry)" @confirm="replacer.confirmHeld(entry)" @skip="replacer.skipHeld(entry)" />
            </ul>
          </div>
          <div role="log" aria-label="Replacement activity" aria-live="polite" class="sr-only"><p v-for="item in replacer.log.value" :key="item.id">{{ item.text }}</p></div>
        </section>
      </div>
    </template>
  </EditorShell>
</template>
