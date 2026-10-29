<script setup lang="ts">
import { computed, reactive, ref } from "vue";
import EditorShell from "@/components/editor/EditorShell.vue";
import UploadEntryRow from "@/components/media/UploadEntryRow.vue";
import UploadLimits from "@/components/media/UploadLimits.vue";
import TranslationsPanel, { type TextFieldGroup, type TextFieldMeta } from "@/components/editor/TranslationsPanel.vue";
import { formatDate } from "@/lib/format";
import {
  assetTypeLabel,
  changeAssetStatus,
  fetchAsset,
  fetchAssetDownload,
  fetchAssetReferences,
  formatBytes,
  formatDuration,
  replaceAssetFile,
  isImage,
  updateAsset,
  type Asset,
  type AssetTranslation,
} from "@/platform/assets";
import { askConfirm } from "@/stores/confirm";
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

const facts = computed(() => {
  const a = asset.value;
  if (!a) return [];
  return [
    { label: "Type", value: assetTypeLabel(a.type) },
    { label: "File", value: a.originalFilename },
    { label: "Format", value: a.mimeType },
    { label: "Size", value: formatBytes(a.sizeBytes) },
    ...(a.width && a.height ? [{ label: "Dimensions", value: `${a.width} × ${a.height} px` }] : []),
    ...(a.durationSeconds ? [{ label: "Duration", value: formatDuration(a.durationSeconds) }] : []),
    { label: "Uploaded", value: formatDate(a.createdAt) },
    { label: "Used in", value: a.usageCount === 1 ? "1 resource" : `${a.usageCount} resources` },
    { label: "Checksum", value: `${a.checksum.slice(0, 12)}…` },
  ];
});

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

/** Marking an image decorative is confirmed (`14` §2): screen readers then skip it. */
async function setDecorative(event: Event) {
  const box = event.target as HTMLInputElement;
  if (!box.checked) {
    form.decorative = false;
    return;
  }
  const confirmed = await askConfirm({
    title: "Mark the image decorative?",
    body: "Screen readers will skip it and it needs no alternative text. Choose this only when removing the image would lose nothing; a primary image of an exhibit is never decorative.",
    confirmLabel: "Mark decorative",
    cancelLabel: "Keep it described",
  });
  form.decorative = confirmed;
  box.checked = confirmed;
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
  >
    <section v-if="asset" class="overflow-hidden rounded-lg border bg-card">
      <div class="flex justify-center bg-muted p-3.5">
        <img v-if="isImage(asset)" :src="asset.url" :alt="form.translations[defaultLanguage ?? '']?.alternativeText || ''" class="max-h-[320px] max-w-full rounded object-contain" />
        <audio v-else-if="asset.type === 'AUDIO'" :src="asset.url" controls class="w-full"></audio>
        <video v-else-if="asset.type === 'VIDEO'" :src="asset.url" controls class="max-h-[320px] max-w-full"></video>
        <a v-else :href="asset.url" target="_blank" rel="noopener" class="py-6 text-[13px] font-bold">Open the file ↗</a>
      </div>
      <dl class="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-x-4 gap-y-2.5 px-5 py-4 text-xs">
        <div v-for="f in facts" :key="f.label" class="min-w-0">
          <dt class="text-[10px] font-extrabold uppercase tracking-[0.09em] text-muted-foreground">{{ f.label }}</dt>
          <dd class="break-words font-semibold" :class="{ 'font-mono font-normal': f.label === 'Checksum' }">{{ f.value }}</dd>
        </div>
      </dl>
      <div class="flex flex-wrap items-center gap-2.5 border-t border-gray-100 px-5 py-3">
        <button
          type="button"
          class="rounded-full border bg-muted px-4 py-2 text-[10px] font-bold uppercase tracking-[0.06em] text-gray-700 disabled:opacity-50"
          :disabled="!editor.editable || !!replaceBlocked || replacing"
          aria-describedby="replace-help"
          @click="chooseReplacement"
        >
          {{ replacing ? "Replacing…" : "Replace file" }}
        </button>
        <input ref="replaceInput" type="file" class="sr-only" tabindex="-1" :accept="replaceAccept" @change="onReplacement" />
        <button
          type="button"
          class="rounded-full border bg-muted px-4 py-2 text-[10px] font-bold uppercase tracking-[0.06em] text-gray-700 disabled:opacity-50"
          :disabled="downloading"
          @click="download"
        >
          Download
        </button>
        <span v-if="replaceBlocked" id="replace-help" class="text-xs text-muted-foreground">{{ replaceBlocked }}</span>
        <span v-else id="replace-help" class="text-xs text-muted-foreground">
          A replacement must be {{ assetTypeLabel(asset.type).toLowerCase() }} too; texts and every use are kept.
        </span>
      </div>
      <div v-if="replaceEntries.length" class="border-t border-gray-100 px-5 py-3">
        <UploadLimits :limits="replacer.limits.value" :failed="replacer.limitsFailed.value" :types="[asset.type]" @reload="replacer.ensureLimits" />
        <ul class="mt-2 rounded-lg border">
          <UploadEntryRow
            v-for="entry in replaceEntries"
            :key="entry.key"
            :entry="entry"
            @retry="replacer.retry(entry)"
            @cancel="replacer.cancel(entry)"
          />
        </ul>
      </div>
      <p class="sr-only" aria-live="polite">{{ replacer.announcement.value }}</p>
    </section>

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

    <section class="overflow-hidden rounded-lg border bg-card">
      <div class="border-b px-5 py-3.5">
        <h2 class="text-[11px] font-extrabold uppercase tracking-[0.09em] text-muted-foreground">Details</h2>
      </div>
      <div class="flex flex-col gap-3.5 px-5 py-[18px]">
        <div class="flex flex-col gap-1.5">
          <label for="f-name" class="small-label">Name</label>
          <input
            id="f-name"
            v-model="form.internalName"
            :readonly="!editor.editable"
            class="field-input"
            :class="{ invalid: editor.fieldError('internalName') }"
            aria-describedby="f-name-help"
          />
          <span v-if="editor.fieldError('internalName')" id="f-name-help" class="text-xs font-semibold text-destructive">⚠ {{ editor.fieldError("internalName") }}</span>
          <span v-else id="f-name-help" class="text-xs text-muted-foreground">Only authors see it; it is what the media library searches.</span>
        </div>
        <label v-if="image" class="flex items-start gap-2.5 text-[13px] font-semibold">
          <input
            :checked="form.decorative"
            type="checkbox"
            :disabled="!editor.editable"
            class="mt-0.5 h-4 w-4 accent-primary"
            @change="setDecorative"
          />
          <span>
            Decorative: the image carries no information
            <span class="block text-xs font-normal text-muted-foreground">
              Screen readers skip it, and it needs no alternative text. Only when removing it would lose nothing.
            </span>
          </span>
        </label>
        <p v-if="floorPlan" class="text-xs text-muted-foreground">
          For a floor plan, the alternative text summarises what the plan shows and points visitors to the list of what
          is on it.
        </p>
      </div>
    </section>

  </EditorShell>
</template>
