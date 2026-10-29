<script setup lang="ts">
/**
 * One upload in a list (mockup C-02; DECISIONS.md D-032): file name, type and size, its state or progress, the reason
 * when it failed, Retry (disabled when the file is too large, since retrying cannot help) and Cancel while it waits
 * or runs. Used by the upload dialog, the Asset picker, and "Replace file".
 */
import { assetTypeLabel, formatBytes } from "@/platform/assets";
import type { UploadEntry } from "@/workspace/useAssetUpload";

defineProps<{ entry: UploadEntry }>();
const emit = defineEmits<{ retry: []; cancel: [] }>();

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
</script>

<template>
  <li class="border-b border-gray-100 px-3.5 py-2.5 text-xs last:border-b-0">
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
        v-if="entry.state === 'queued' || entry.state === 'uploading'"
        type="button"
        class="text-[11px] font-bold text-gray-600"
        :aria-label="`Cancel ${entry.file.name}`"
        @click="emit('cancel')"
      >
        Cancel
      </button>
      <button
        v-else-if="entry.state === 'error' || entry.state === 'cancelled'"
        type="button"
        class="text-[11px] font-bold text-primary disabled:cursor-not-allowed disabled:text-gray-300"
        :disabled="entry.tooLarge"
        :title="entry.tooLarge ? 'The file must be smaller to upload' : undefined"
        :aria-label="`Retry ${entry.file.name}`"
        @click="emit('retry')"
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
</template>
