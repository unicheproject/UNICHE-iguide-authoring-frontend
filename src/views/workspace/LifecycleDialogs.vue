<script setup lang="ts" generic="T extends LifecycleRow">
/**
 * The dialogs of a list row's lifecycle (`useListLifecycle`): the shared activation confirm and the Deactivate / Archive
 * confirm with its where-used list. Mount once per list view, beside the table.
 */
import ActivateDialog from "@/components/editor/ActivateDialog.vue";
import StatusChangeDialog from "@/components/StatusChangeDialog.vue";
import { Undo2, X } from "lucide-vue-next";
import { computed, onBeforeUnmount, ref, watch } from "vue";
import { focusSuccessor } from "@/lib/focus";
import { useToastOffset } from "@/lib/toastOffset";
import { Button } from "@/components/ui/button";
import { connection } from "@/stores/connection";
import { describeFieldPath, shortTitle, type ListLifecycle, type LifecycleRow } from "./useListLifecycle";

const props = defineProps<{ lifecycle: ListLifecycle<T> }>();

// The Undo of an Archive stays for 15 s (a polite status), then goes; the archived row stays findable under "Archived".
let timer: ReturnType<typeof setTimeout> | undefined;
watch(
  () => props.lifecycle.undo,
  (undo) => {
    clearTimeout(timer);
    if (undo) timer = setTimeout(() => props.lifecycle.dismissUndo(undoBar.value), 15000);
  },
);
onBeforeUnmount(() => clearTimeout(timer));
const undoBar = ref<HTMLElement | null>(null);
useToastOffset(computed(() => undoBar.value));

/** Undo brings the row back; the bar is going, so its kebab takes focus (the transition focuses it once the row is back). */
async function undoAndFocus() {
  focusSuccessor(undoBar.value, ["[data-row-id] button[aria-label^='Actions for ']", "#main"]);
  await props.lifecycle.undoArchive();
}
</script>

<template>
  <StatusChangeDialog
    v-if="lifecycle.activating && lifecycle.activationBlock"
    :heading="`Activate ${shortTitle(lifecycle.name(lifecycle.activating.row))}?`"
    :blocked-heading="`Can't activate ${shortTitle(lifecycle.name(lifecycle.activating.row))} yet`"
    body="Visitors will see it on their next refresh."
    action-label="Activate"
    :blocked-reason="lifecycle.activationBlock.reason"
    :review-to="lifecycle.activationBlock.to"
    :link-for="() => null"
    @close="lifecycle.close()"
    @confirm="lifecycle.close()"
  />
  <ActivateDialog
    v-else-if="lifecycle.activating"
    :title="lifecycle.name(lifecycle.activating.row)"
    :kind="lifecycle.noun"
    :lines="lifecycle.activationLines"
    :dirty="false"
    :busy="lifecycle.pendingId === lifecycle.activating.row.id"
    :offline="connection.offline"
    :refusal="lifecycle.activating.refusal"
    :describe-path="describeFieldPath"
    @close="lifecycle.close()"
    @confirm="lifecycle.transition(lifecycle.activating!.row, 'ACTIVE')"
    @goto="lifecycle.gotoField()"
    @review="lifecycle.gotoField()"
  />
  <StatusChangeDialog
    v-if="lifecycle.confirm"
    :heading="lifecycle.confirm.target === 'ARCHIVED' ? `Archive ${shortTitle(lifecycle.name(lifecycle.confirm.row))}?` : `Deactivate ${shortTitle(lifecycle.name(lifecycle.confirm.row))}?`"
    :blocked-heading="`Can't ${lifecycle.confirm.target === 'ARCHIVED' ? 'archive' : 'deactivate'} ${shortTitle(lifecycle.name(lifecycle.confirm.row))}`"
    :body="
      lifecycle.confirm.target === 'ARCHIVED'
        ? `An archived ${lifecycle.noun} leaves the visitor app and the default list. Choose Archived in the list to find it; restoring it makes it a draft again.`
        : 'Visitors stop seeing it on their next refresh. It becomes a draft you can edit.'
    "
    :action-label="lifecycle.confirm.target === 'ARCHIVED' ? 'Archive' : 'Deactivate'"
    :danger="lifecycle.confirm.target === 'ARCHIVED'"
    :busy="lifecycle.pendingId === lifecycle.confirm.row.id"
    :load-references="() => lifecycle.loadReferences(lifecycle.confirm!.row.id)"
    :blocked-by="lifecycle.confirm.blockedBy ?? null"
    :link-for="lifecycle.linkFor"
    @close="lifecycle.close()"
    @confirm="lifecycle.transition(lifecycle.confirm!.row, lifecycle.confirm!.target)"
  />
  <div
    v-if="lifecycle.undo"
    ref="undoBar"
    class="sticky bottom-4 z-raised mt-3 flex flex-wrap items-center gap-2 rounded-md border border-input bg-card px-3 py-1.5 text-sm shadow-2"
    role="group"
    aria-label="Archived"
  >
    <span class="min-w-0 flex-1 break-words" role="status">
      <span class="font-semibold">{{ shortTitle(lifecycle.undo.title) }}</span> archived. It is under Archived now.
    </span>
    <Button variant="secondary" size="sm" @click="undoAndFocus">
      <Undo2 aria-hidden="true" />Undo<span class="sr-only"> archiving {{ shortTitle(lifecycle.undo.title) }}</span>
    </Button>
    <Button variant="ghost" size="icon" label="Dismiss" @click="lifecycle.dismissUndo(undoBar)"><X aria-hidden="true" /></Button>
  </div>
</template>
