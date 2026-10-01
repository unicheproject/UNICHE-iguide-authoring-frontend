<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import EditorShell from "@/components/editor/EditorShell.vue";
import TranslationsPanel, { type TextFieldGroup, type TextFieldMeta } from "@/components/editor/TranslationsPanel.vue";
import { formatDate } from "@/lib/format";
import {
  assetTypeLabel,
  changeAssetStatus,
  fetchAsset,
  fetchAssetDownload,
  fetchAssetReferences,
  fetchAssetUsages,
  formatBytes,
  formatDuration,
  replaceAssetFile,
  usageLabel,
  isImage,
  updateAsset,
  type Asset,
  type AssetTranslation,
  type AssetUsageEntry,
} from "@/platform/assets";
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
    helper: "What the image shows, for visitors who cannot see it. Describe its purpose, not the file.",
  },
  title: { label: "Title", multiline: false },
  caption: { label: "Caption", multiline: true, helper: "Shown under the media in the visitor app." },
  credits: { label: "Credits", multiline: false, helper: "Photographer, rights holder, licence." },
  transcript: { label: "Transcript", multiline: true, helper: "Everything that is said or heard, for visitors who cannot listen." },
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
const image = computed(() => (asset.value ? asset.value.type === "IMAGE" : false));
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

// Where it is used ----------------------------------------------------------------------------------------

const usages = ref<AssetUsageEntry[] | null>(null);
const usagesFailed = ref(false);
async function loadUsages() {
  usagesFailed.value = false;
  try {
    usages.value = await fetchAssetUsages(projectId.value, props.assetId);
  } catch (e) {
    if (!(e instanceof ApiError)) throw e;
    usagesFailed.value = true;
  }
}
watch(() => props.assetId, loadUsages, { immediate: true });

function rolesText(entry: AssetUsageEntry): string {
  return entry.usages.map((u) => (u.languageCode ? `${usageLabel(u.usage)}, ${u.languageCode}` : usageLabel(u.usage))).join(" · ");
}

// Replace and download --------------------------------------------------------------------------------------

const replaceInput = ref<HTMLInputElement | null>(null);
const replacing = ref<number | null>(null);

function chooseReplacement() {
  if (editor.dirty) {
    showToast("Save first", "Save or undo your changes before replacing the file.", "warning");
    return;
  }
  replaceInput.value?.click();
}

async function onReplacement(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = "";
  if (!file || !asset.value) return;
  replacing.value = 0;
  try {
    await replaceAssetFile(projectId.value, asset.value.id, file, asset.value.version, (f) => (replacing.value = f));
    await editor.load();
    showToast("File replaced", "Every place that uses the asset now shows the new file. Its texts are unchanged.");
  } catch (e) {
    if (!(e instanceof ApiError)) throw e;
    const message = e.code === "VERSION_CONFLICT" ? "Someone else changed the asset meanwhile. Reload it and try again." : e.fieldMessages().file ?? e.message;
    showToast("The file was not replaced", e.platformUnavailable ? "The UNICHE platform is not reachable." : message, "error");
  } finally {
    replacing.value = null;
  }
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
  image.value ? "Activate it once it has alternative text in the default language, or mark it decorative." : "Activate it when it is ready to be used.",
);
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
          :disabled="!editor.editable || replacing !== null"
          @click="chooseReplacement"
        >
          {{ replacing !== null ? `Replacing… ${Math.round(replacing * 100)} %` : "Replace file" }}
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
        <span class="text-xs text-muted-foreground">
          A replacement must be {{ assetTypeLabel(asset.type).toLowerCase() }} too; texts and every use are kept.
        </span>
      </div>
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
      :required-field="image && !form.decorative ? 'alternativeText' : ''"
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
          <input v-model="form.decorative" type="checkbox" :disabled="!editor.editable" class="mt-0.5 h-4 w-4 accent-primary" />
          <span>
            Decorative: the image carries no information
            <span class="block text-xs font-normal text-muted-foreground">Screen readers skip it, and it needs no alternative text.</span>
          </span>
        </label>
      </div>
    </section>

    <template #aside>
      <section class="overflow-hidden rounded-lg border bg-card">
        <div class="border-b px-3.5 py-[11px]">
          <span class="text-[10px] font-extrabold uppercase tracking-[0.1em] text-muted-foreground">
            Used in{{ usages ? ` (${usages.length})` : "" }}
          </span>
        </div>
        <div class="px-3.5 py-3">
          <p v-if="usagesFailed" class="text-xs text-[#9a6200]">
            Where it is used could not be loaded.
            <button type="button" class="font-bold text-primary" @click="loadUsages">Try again</button>
          </p>
          <p v-else-if="!usages" class="animate-skeleton text-xs text-muted-foreground">Loading…</p>
          <p v-else-if="!usages.length" class="text-xs text-muted-foreground">Not used yet. It can be archived freely.</p>
          <ul v-else class="flex flex-col gap-2">
            <li v-for="entry in usages" :key="`${entry.resource.resourceType}-${entry.resource.resourceId}`" class="text-xs">
              <RouterLink v-if="toReference(entry.resource)" :to="toReference(entry.resource)!" class="font-bold">{{ entry.resource.title }} ↗</RouterLink>
              <span v-else class="font-bold">{{ entry.resource.title }}</span>
              <span class="block text-[11px] text-muted-foreground">{{ rolesText(entry) }}</span>
            </li>
          </ul>
        </div>
      </section>
    </template>
  </EditorShell>
</template>
