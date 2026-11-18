<script setup lang="ts">
/**
 * One upload in a list (D-032, D-080): file name, type and size, its state in words plus an icon, progress while it
 * runs, the reason when it failed or waits, and only the actions that can help: Cancel while it waits or runs, Retry
 * after a failure that a second try can fix (a refused file cannot be retried), "Upload anyway" and Skip for a file
 * held back as an unusual type or a copy. A failed row shows the platform's request id; a finished row links to its
 * Asset when `projectId` is given. Used by the upload dialog, the Asset picker and "Replace file".
 * Button names start with their visible text ("Upload anyway, tool.exe"; WCAG 2.5.3). A skipped file offers "Undo skip"
 * where the parent listens to `undo-skip`; a server failure (5xx, platform down) shows `ProblemAlert`, not server text.
 * Focus has a successor (D-103): when the button that has focus goes away because the file's state changed (Cancel
 * becomes Retry, Retry becomes Cancel, a finished file has no button), focus stays in the row on its new first button;
 * a row left without a button hands focus to `focusSuccessor` (the next or previous row's action, else the element
 * with `data-upload-choose`), never `<body>`.
 */
import { Check, CircleAlert, CircleSlash, Clock, Loader } from "lucide-vue-next";
import { computed, getCurrentInstance, nextTick, ref, watch } from "vue";
import { ProblemAlert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { focusSuccessor } from "@/lib/focus";
import { formatBytes } from "@/lib/format";
import { assetTypeLabel } from "@/platform/assets";
import type { UploadEntry } from "@/workspace/useAssetUpload";

const props = defineProps<{ entry: UploadEntry; projectId?: string }>();
const emit = defineEmits<{ retry: []; cancel: []; confirm: []; skip: []; "undo-skip": [] }>();

const skipped = computed(() => props.entry.state === "cancelled" && props.entry.message === "Skipped.");
/** Whether the parent handles `undo-skip`; otherwise a skipped file keeps the old Retry. */
const canUndoSkip = computed(() => !!getCurrentInstance()?.vnode.props?.["onUndo-skip"] || !!getCurrentInstance()?.vnode.props?.onUndoSkip);

const root = ref<HTMLElement | null>(null);
// Before the DOM changes: does focus sit on a button of this row, and will the new state still have one?
watch(
  () => props.entry.state,
  (next) => {
    const el = root.value;
    if (!el || !el.contains(document.activeElement) || document.activeElement?.tagName !== "BUTTON") return;
    if (["queued", "uploading", "held", "error", "cancelled"].includes(next)) {
      void nextTick(() => {
        if (document.activeElement && document.activeElement !== document.body && el.contains(document.activeElement)) return;
        const button = el.querySelector<HTMLElement>("button");
        if (button) button.focus();
        else focusSuccessor(el, ["[data-upload-choose]"]);
      });
    } else {
      focusSuccessor(el, ["[data-upload-choose]"]);
    }
  },
  { flush: "pre" },
);

const state = computed(() => {
  switch (props.entry.state) {
    case "queued":
      return { text: "Waiting", icon: Clock, tone: "text-muted-foreground" };
    case "held":
      return { text: "Needs your decision", icon: CircleAlert, tone: "text-warning" };
    case "uploading":
      return { text: `${Math.round(props.entry.progress * 100)} %`, icon: Loader, tone: "text-ink-2" };
    case "done":
      return { text: "Uploaded", icon: Check, tone: "text-success" };
    case "cancelled":
      return { text: props.entry.message === "Skipped." ? "Skipped" : "Cancelled", icon: CircleSlash, tone: "text-muted-foreground" };
    default:
      return { text: "Failed", icon: CircleAlert, tone: "text-destructive" };
  }
});
</script>

<template>
  <li ref="root" class="border-b border-border px-3 py-2.5 text-sm last:border-b-0" :data-state="entry.state">
    <div class="flex flex-wrap items-center gap-x-3 gap-y-1">
      <component :is="state.icon" class="size-4 flex-none" :class="[state.tone, entry.state === 'uploading' ? 'motion-safe:animate-spin' : '']" aria-hidden="true" />
      <span class="min-w-[8rem] flex-1">
        <RouterLink
          v-if="entry.state === 'done' && entry.asset && projectId"
          :to="{ name: 'asset-editor', params: { projectId, assetId: entry.asset.id } }"
          class="block break-words font-semibold"
        >
          {{ entry.file.name }}
        </RouterLink>
        <span v-else class="block break-words font-semibold">{{ entry.file.name }}</span>
        <span class="block text-xs text-muted-foreground">{{ assetTypeLabel(entry.type) }} · {{ formatBytes(entry.file.size) }}</span>
      </span>
      <span class="tabular min-w-28 whitespace-nowrap text-right text-xs font-semibold" :class="state.tone">{{ state.text }}</span>
      <span class="flex flex-wrap justify-end gap-1">
        <Button v-if="entry.state === 'queued' || entry.state === 'uploading'" variant="ghost" size="sm" :aria-label="`Cancel, ${entry.file.name}`" @click="emit('cancel')">Cancel</Button>
        <template v-else-if="entry.state === 'held'">
          <Button variant="secondary" size="sm" :aria-label="`Upload anyway, ${entry.file.name}`" @click="emit('confirm')">Upload anyway</Button>
          <Button variant="ghost" size="sm" :aria-label="`Skip, ${entry.file.name}`" @click="emit('skip')">Skip</Button>
        </template>
        <Button v-else-if="skipped && canUndoSkip" variant="secondary" size="sm" :aria-label="`Undo skip, ${entry.file.name}`" @click="emit('undo-skip')">Undo skip</Button>
        <Button v-else-if="(entry.state === 'error' && entry.retryable) || entry.state === 'cancelled'" variant="secondary" size="sm" :aria-label="`Retry, ${entry.file.name}`" @click="emit('retry')">
          Retry
        </Button>
      </span>
    </div>
    <div
      v-if="entry.state === 'uploading'"
      class="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted"
      role="progressbar"
      :aria-label="`Uploading ${entry.file.name}`"
      :aria-valuenow="Math.round(entry.progress * 100)"
      aria-valuemin="0"
      aria-valuemax="100"
    >
      <div class="h-full bg-primary transition-[width]" :style="{ width: `${entry.progress * 100}%` }"></div>
    </div>
    <ProblemAlert v-if="entry.state === 'error' && entry.error" :error="entry.error" action="upload the file" class="mt-2" />
    <p v-else-if="entry.message && (entry.state === 'error' || entry.state === 'held')" class="mt-1 text-xs font-medium" :class="entry.state === 'error' ? 'text-destructive' : 'text-warning'">
      {{ entry.message }}
      <RouterLink v-if="entry.hold?.existing && projectId" :to="{ name: 'asset-editor', params: { projectId, assetId: entry.hold.existing.id } }">Open it</RouterLink>
    </p>
    <p v-if="entry.state === 'error' && !entry.retryable" class="mt-0.5 text-xs text-muted-foreground">Retrying cannot help: choose a different file.</p>
    <p v-if="entry.requestId && entry.state === 'error' && !entry.error" class="mt-0.5 text-xs text-muted-foreground">Request id <span class="mono">{{ entry.requestId }}</span></p>
  </li>
</template>
