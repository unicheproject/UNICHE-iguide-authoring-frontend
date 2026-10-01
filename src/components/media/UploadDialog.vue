<script setup lang="ts">
/**
 * "Upload files" (mockup C-02): a drop zone, the per-type limits before anything starts, and one row per
 * file with its progress, queue state, or reason for failing. The result of each upload is announced to
 * screen readers through a polite live region.
 */
import { computed, onMounted, ref } from "vue";
import AppDialog from "@/components/AppDialog.vue";
import { assetTypeLabel, formatBytes, type Asset, type AssetType } from "@/platform/assets";
import { useAssetUpload, type UploadEntry } from "@/workspace/useAssetUpload";

const props = defineProps<{ projectId: string; initialFiles?: File[] }>();
const emit = defineEmits<{ close: []; uploaded: [asset: Asset] }>();

const announcement = ref("");
const { entries, upload, retry, cancelRemaining, ensureLimits, limits, busy } = useAssetUpload(
  computed(() => props.projectId),
  (asset) => {
    announcement.value = `${asset.originalFilename} uploaded.`;
    emit("uploaded", asset);
  },
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

const LIMIT_ROWS: AssetType[] = ["IMAGE", "AUDIO", "VIDEO", "DOCUMENT", "THREE_D_MODEL"];

function stateText(entry: UploadEntry): string {
  switch (entry.state) {
    case "queued":
      return "Queued";
    case "uploading":
      return `${Math.round(entry.progress * 100)} %`;
    case "done":
      return "Done";
    case "cancelled":
      return "Cancelled";
    default:
      return "Failed";
  }
}

const anyRunning = computed(() => busy());
const summary = computed(() => {
  const done = entries.value.filter((e) => e.state === "done").length;
  const failed = entries.value.filter((e) => e.state === "error").length;
  return entries.value.length ? `${done} of ${entries.value.length} uploaded${failed ? ` · ${failed} failed` : ""}` : "";
});

function close() {
  if (anyRunning.value && !window.confirm("Some files are still uploading. Cancel them and close?")) return;
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

    <table v-if="limits" class="mt-3 w-full text-[11px] text-muted-foreground">
      <caption class="sr-only">Largest file per type</caption>
      <tbody class="flex flex-wrap gap-x-4 gap-y-1">
        <tr v-for="t in LIMIT_ROWS" :key="t" class="flex gap-1.5">
          <th scope="row" class="font-semibold">{{ assetTypeLabel(t) }}</th>
          <td>{{ formatBytes(limits.perType[t]) }}</td>
        </tr>
      </tbody>
    </table>

    <ul v-if="entries.length" class="mt-4 max-h-[300px] overflow-y-auto rounded-lg border">
      <li v-for="entry in entries" :key="entry.key" class="border-b border-gray-100 px-3.5 py-2.5 text-xs last:border-b-0">
        <div class="flex items-center gap-3">
          <span
            class="flex h-5 w-5 flex-none items-center justify-center rounded-full text-[11px] font-bold"
            :class="{
              'bg-[#0f7a6e] text-white': entry.state === 'done',
              'bg-destructive text-white': entry.state === 'error',
              'bg-muted text-muted-foreground': entry.state === 'queued' || entry.state === 'cancelled' || entry.state === 'uploading',
            }"
            aria-hidden="true"
          >
            {{ entry.state === "done" ? "✓" : entry.state === "error" ? "!" : "" }}
          </span>
          <span class="min-w-0 flex-1">
            <span class="block truncate font-semibold">{{ entry.file.name }}</span>
            <span class="block text-[11px] text-muted-foreground">{{ assetTypeLabel(entry.type) }} · {{ formatBytes(entry.file.size) }}</span>
          </span>
          <span
            class="w-16 text-right tabular-nums"
            :class="entry.state === 'error' ? 'font-bold text-destructive' : entry.state === 'done' ? 'font-bold text-[#0f7a6e]' : 'text-muted-foreground'"
          >
            {{ stateText(entry) }}
          </span>
          <button
            v-if="entry.state === 'error' || entry.state === 'cancelled'"
            type="button"
            class="text-[11px] font-bold text-primary disabled:cursor-not-allowed disabled:text-gray-300"
            :disabled="entry.tooLarge"
            :title="entry.tooLarge ? 'The file must be smaller to upload' : undefined"
            @click="retry(entry)"
          >
            Retry
          </button>
        </div>
        <div
          v-if="entry.state === 'uploading'"
          class="mt-1.5 h-1 overflow-hidden rounded bg-muted"
          role="progressbar"
          :aria-label="`Uploading ${entry.file.name}`"
          :aria-valuenow="Math.round(entry.progress * 100)"
          aria-valuemin="0"
          aria-valuemax="100"
        >
          <div class="h-full bg-primary transition-[width]" :style="{ width: `${entry.progress * 100}%` }"></div>
        </div>
        <p v-if="entry.message && entry.state === 'error'" class="mt-1 pl-8 font-semibold text-destructive">{{ entry.message }}</p>
      </li>
    </ul>

    <!-- Announces each finished upload; the visible list carries the same information. -->
    <p class="sr-only" aria-live="polite">{{ announcement }}</p>

    <template #actions>
      <span class="mr-auto self-center text-[11px] text-muted-foreground">{{ summary }}</span>
      <button v-if="anyRunning" type="button" class="dialog-secondary" @click="cancelRemaining">Cancel remaining</button>
      <button type="button" class="dialog-primary bg-primary" @click="close">Done</button>
    </template>
  </AppDialog>
</template>
