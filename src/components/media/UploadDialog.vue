<script setup lang="ts">
/**
 * "Upload files" (mockup C-02, D-032, D-080): accepted formats and limits stated before anything starts, a drop zone and
 * "Choose files" for several files, one row per file (progress, cancel, retry only where it can help, request id, held
 * back files that look like a copy or are an unusual type), a visually hidden `role="log"` that keeps every message in
 * order for screen readers (start, each result, the final "5 uploaded, 1 failed"), and "Describe now" for new images
 * without alternative text. The formats table folds away once files are added. Focus opens on the heading (AppDialog);
 * after "Upload anyway" or "Skip" it moves to the next file waiting for a decision, else to "Choose files". The close X
 * is in the header and "Close" in the footer; closing while files run asks first. "Cancel remaining" removes itself, so focus
 * moves to the first cancelled file's "Retry", else to "Choose files"; a row's own Cancel/Retry is handled by the row
 * (D-103). The dialog's top edge is the platform dialog's anchored one (it does not move as rows arrive).
 */
import { Images, Upload } from "lucide-vue-next";
import { computed, nextTick, onMounted, ref, watch } from "vue";
import AppDialog from "@/components/AppDialog.vue";
import { Button } from "@/components/ui/button";
import Checkbox from "@/components/ui/checkbox/Checkbox.vue";
import { ACCEPTED_FORMATS, acceptAttributeFor, missingAlternativeText, type Asset, type AssetType } from "@/platform/assets";
import { askConfirm } from "@/stores/confirm";
import { useAssetUpload, type UploadEntry } from "@/workspace/useAssetUpload";
import { useProjectLanguages } from "@/workspace/useProjectLanguages";
import DescribeNowDialog from "./DescribeNowDialog.vue";
import UploadEntryRow from "./UploadEntryRow.vue";
import UploadLimits from "./UploadLimits.vue";

const props = defineProps<{ projectId: string; initialFiles?: File[]; existing?: Asset[] }>();
const emit = defineEmits<{ close: []; uploaded: [asset: Asset] }>();

const { entries, upload, retry, cancel, cancelRemaining, confirmHeld, skipHeld, undoSkip, ensureLimits, limits, limitsFailed, log, busy } = useAssetUpload(
  computed(() => props.projectId),
  (asset) => emit("uploaded", asset),
  { existing: () => props.existing ?? [] },
);
const { languages, defaultLanguage } = useProjectLanguages(computed(() => props.projectId));

const fileInput = ref<HTMLInputElement | null>(null);
const chooseButton = ref<InstanceType<typeof Button> | null>(null);
const rowList = ref<HTMLElement | null>(null);
const dragging = ref(false);
const asFloorPlan = ref(false);
/** The images the stepper walks through, fixed when it opens so saving one does not shift the list. */
const describing = ref<Asset[] | null>(null);

onMounted(async () => {
  await ensureLimits();
  if (props.initialFiles?.length) void upload(props.initialFiles);
});

function onFiles(event: Event) {
  const input = event.target as HTMLInputElement;
  const files = Array.from(input.files ?? []);
  input.value = "";
  if (files.length) void upload(files, { floorPlan: asFloorPlan.value });
}

function onDrop(event: DragEvent) {
  dragging.value = false;
  if (event.dataTransfer?.files.length) void upload(Array.from(event.dataTransfer.files), { floorPlan: asFloorPlan.value });
}

const types: AssetType[] = ACCEPTED_FORMATS.map((f) => f.type);
const accept = computed(() => (asFloorPlan.value ? "image/*" : acceptAttributeFor(types)));
const anyRunning = computed(() => busy());
const summary = computed(() => {
  const done = entries.value.filter((e) => e.state === "done").length;
  const failed = entries.value.filter((e) => e.state === "error").length;
  return entries.value.length ? `${done} of ${entries.value.length} uploaded${failed ? ` · ${failed} failed` : ""}` : "";
});

/** Uploaded images (not floor plans) with no alternative text in the default language. */
const toDescribe = computed(() =>
  entries.value
    .map((e) => e.asset)
    .filter((a): a is Asset => !!a && a.type === "IMAGE" && missingAlternativeText(a, defaultLanguage.value)),
);
const defaultName = computed(() => languages.value.find((l) => l.isDefault)?.displayName ?? defaultLanguage.value ?? "");

function described(asset: Asset) {
  const entry = entries.value.find((e) => e.asset?.id === asset.id);
  if (entry) entry.asset = asset;
  emit("uploaded", asset);
}

/** After a decision on a held file: focus the next file that waits for one, else "Choose files" (never `<body>`). */
async function focusAfterDecision(entry: UploadEntry) {
  const index = entries.value.indexOf(entry);
  await nextTick();
  const rows = [...(rowList.value?.querySelectorAll<HTMLElement>('li[data-state="held"]') ?? [])];
  const keys = entries.value.map((e, i) => (e.state === "held" ? i : -1)).filter((i) => i >= 0);
  const nextIndex = keys.find((i) => i > index) ?? keys[0];
  const target = nextIndex === undefined ? undefined : rows[keys.indexOf(nextIndex)]?.querySelector<HTMLElement>("button");
  (target ?? (chooseButton.value?.$el as HTMLElement | undefined))?.focus();
}
function confirm(entry: UploadEntry) {
  confirmHeld(entry);
  void focusAfterDecision(entry);
}
function skip(entry: UploadEntry) {
  skipHeld(entry);
  void focusAfterDecision(entry);
}

/** "Undo skip" removes its own button: focus goes to the row's new "Upload anyway". */
async function undo(entry: UploadEntry) {
  undoSkip(entry);
  await nextTick();
  const row = rowList.value?.children[entries.value.indexOf(entry)];
  (row?.querySelector<HTMLElement>("button") ?? (chooseButton.value?.$el as HTMLElement | undefined))?.focus();
}

// The last file finished while the button had focus: it goes away, so focus moves on before the DOM changes.
watch(
  anyRunning,
  (running) => {
    if (!running && document.activeElement?.hasAttribute("data-cancel-remaining")) (chooseButton.value?.$el as HTMLElement | undefined)?.focus();
  },
  { flush: "pre" },
);

/** "Cancel remaining": the button goes with the last running file, so focus lands on the first Retry, else "Choose files". */
async function stopRemaining() {
  cancelRemaining();
  await nextTick();
  const retry = rowList.value?.querySelector<HTMLElement>('li[data-state="cancelled"] button');
  (retry ?? (chooseButton.value?.$el as HTMLElement | undefined))?.focus();
}

async function close() {
  if (
    anyRunning.value &&
    !(await askConfirm({
      title: "Stop the uploads?",
      body: "Some files are still uploading. Closing cancels them; files already uploaded stay in the media library.",
      confirmLabel: "Cancel uploads and close",
      cancelLabel: "Keep uploading",
      danger: true,
    }))
  ) {
    return;
  }
  cancelRemaining();
  emit("close");
}
</script>

<template>
  <AppDialog title="Upload files" size="lg" @close="close">
    <div
      class="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 rounded-lg border-2 border-dashed px-4 py-3 text-center text-sm"
      :class="dragging ? 'border-primary bg-accent text-primary' : 'border-input text-ink-2'"
      @dragover.prevent="dragging = true"
      @dragleave.self="dragging = false"
      @drop.prevent="onDrop"
    >
      <Upload class="size-5 text-muted-foreground" aria-hidden="true" />
      <p>Drop files here, or</p>
      <Button ref="chooseButton" variant="secondary" data-upload-choose @click="fileInput?.click()">Choose files</Button>
      <input ref="fileInput" type="file" multiple class="sr-only" tabindex="-1" aria-label="Files to upload" :accept="accept || undefined" @change="onFiles" />
      <Checkbox v-model="asFloorPlan">Upload images as floor plans</Checkbox>
    </div>

    <div class="mt-4">
      <UploadLimits :limits="limits" :failed="limitsFailed" :types="types" :collapsed="entries.length > 0" @reload="ensureLimits" />
      <p class="mt-1 text-xs text-muted-foreground">You can add several files at once. Other file types are held back until you confirm them.</p>
    </div>

    <ul v-if="entries.length" ref="rowList" class="mt-4 max-h-[min(40dvh,18rem)] overflow-y-auto rounded-lg border border-border" aria-label="Files">
      <UploadEntryRow
        v-for="entry in entries"
        :key="entry.key"
        :entry="entry"
        :project-id="projectId"
        @retry="retry(entry)"
        @cancel="cancel(entry)"
        @confirm="confirm(entry)"
        @skip="skip(entry)"
        @undo-skip="undo(entry)"
      />
    </ul>

    <!-- Every message in order for screen readers: a log is a live region whose additions are read one after another. The rows show the same on screen. -->
    <div role="log" aria-label="Upload activity" aria-live="polite" class="sr-only">
      <p v-for="item in log" :key="item.id">{{ item.text }}</p>
    </div>

    <template #actions>
      <span class="tabular mr-auto self-center text-xs text-muted-foreground">{{ summary }}</span>
      <Button v-if="toDescribe.length" variant="secondary" @click="describing = [...toDescribe]">
        <Images aria-hidden="true" />Describe now ({{ toDescribe.length }})
      </Button>
      <Button v-if="anyRunning" variant="secondary" data-cancel-remaining @click="stopRemaining">Cancel remaining</Button>
      <Button variant="primary" @click="close">Close</Button>
    </template>
  </AppDialog>
  <DescribeNowDialog
    v-if="describing"
    :project-id="projectId"
    :assets="describing"
    :language-code="defaultLanguage ?? ''"
    :language-name="defaultName"
    @close="describing = null"
    @saved="described"
  />
</template>
