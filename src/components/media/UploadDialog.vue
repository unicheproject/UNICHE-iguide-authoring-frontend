<script setup lang="ts">
/**
 * "Upload files" (mockup C-02): a drop zone, the size limits before anything starts, and one row per file with
 * its progress, queue state, or reason for failing. Every result, failures included, is announced to screen readers
 * through a polite live region (`14` §3, DECISIONS.md D-032).
 */
import { askConfirm } from "@/stores/confirm";
import { computed, onMounted, ref } from "vue";
import AppDialog from "@/components/AppDialog.vue";
import { ASSET_TYPES, type Asset } from "@/platform/assets";
import { useAssetUpload } from "@/workspace/useAssetUpload";
import UploadEntryRow from "./UploadEntryRow.vue";
import UploadLimits from "./UploadLimits.vue";

const props = defineProps<{ projectId: string; initialFiles?: File[] }>();
const emit = defineEmits<{ close: []; uploaded: [asset: Asset] }>();

const { entries, upload, retry, cancel, cancelRemaining, ensureLimits, limits, limitsFailed, announcement, busy } = useAssetUpload(
  computed(() => props.projectId),
  (asset) => emit("uploaded", asset),
);

const fileInput = ref<HTMLInputElement | null>(null);
const dragging = ref(false);
const asFloorPlan = ref(false);

onMounted(async () => {
  await ensureLimits();
  if (props.initialFiles?.length) void upload(props.initialFiles);
});

function onFiles(event: Event) {
  const input = event.target as HTMLInputElement;
  if (input.files?.length) void upload(input.files, { floorPlan: asFloorPlan.value });
  input.value = "";
}

function onDrop(event: DragEvent) {
  dragging.value = false;
  if (event.dataTransfer?.files.length) void upload(event.dataTransfer.files, { floorPlan: asFloorPlan.value });
}


const anyRunning = computed(() => busy());
const summary = computed(() => {
  const done = entries.value.filter((e) => e.state === "done").length;
  const failed = entries.value.filter((e) => e.state === "error").length;
  return entries.value.length ? `${done} of ${entries.value.length} uploaded${failed ? ` · ${failed} failed` : ""}` : "";
});

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
  <AppDialog title="Upload files" width="640px" @close="close">
    <div
      class="flex flex-col items-center gap-2 rounded-lg border-2 border-dashed px-5 py-7 text-center text-[13px]"
      :class="dragging ? 'border-primary bg-primary/[0.04] text-primary' : 'border-gray-200 text-gray-700'"
      @dragover.prevent="dragging = true"
      @dragleave.self="dragging = false"
      @drop.prevent="onDrop"
    >
      <span>
        Drop files here or
        <button type="button" class="font-bold text-primary underline" @click="fileInput?.click()">choose files</button>
      </span>
      <input
        ref="fileInput"
        type="file"
        multiple
        class="sr-only"
        tabindex="-1"
        :accept="asFloorPlan ? 'image/*' : undefined"
        @change="onFiles"
      />
      <label class="flex items-center gap-2 text-xs text-muted-foreground">
        <input v-model="asFloorPlan" type="checkbox" class="h-3.5 w-3.5 accent-primary" />
        Upload images as floor plans
      </label>
    </div>

    <div class="mt-3">
      <UploadLimits :limits="limits" :failed="limitsFailed" :types="ASSET_TYPES" @reload="ensureLimits" />
    </div>

    <ul v-if="entries.length" class="mt-4 max-h-[300px] overflow-y-auto rounded-lg border">
      <UploadEntryRow v-for="entry in entries" :key="entry.key" :entry="entry" @retry="retry(entry)" @cancel="cancel(entry)" />
    </ul>

    <!-- Announces each result; the visible list carries the same information. -->
    <p class="sr-only" aria-live="polite">{{ announcement }}</p>

    <template #actions>
      <span class="mr-auto self-center text-[11px] text-muted-foreground">{{ summary }}</span>
      <button v-if="anyRunning" type="button" class="dialog-secondary" @click="cancelRemaining">Cancel remaining</button>
      <button type="button" class="dialog-primary bg-primary" @click="close">Done</button>
    </template>
  </AppDialog>
</template>
