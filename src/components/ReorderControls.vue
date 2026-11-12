<script setup lang="ts" generic="T extends Orderable">
/**
 * The reorder controls of one list row: a drag handle for the pointer and "Move up" / "Move down" buttons for the
 * keyboard (AGENTS.md section 4 rule 7). The row itself is the drop target (`dragover`, `drop` from
 * `useReorder`). Hidden while the list cannot be reordered, such as during a search.
 */
import { nextTick, ref, watch } from "vue";
import type { Orderable, Reorder } from "@/workspace/useReorder";

const props = defineProps<{
  reorder: Reorder<T>;
  item: T;
  /** The row's name for the buttons' accessible labels. */
  title: string;
}>();

const upButton = ref<HTMLButtonElement | null>(null);
const downButton = ref<HTMLButtonElement | null>(null);
/** The direction last moved with these buttons, so focus returns to them once the order is saved. */
let lastMove: -1 | 1 | null = null;

function move(delta: -1 | 1) {
  lastMove = delta;
  props.reorder.moveBy(props.item, delta);
}

// Every button is disabled while the order saves, which drops focus; put it back on the moved row's button, or on
// the other one when the row reached the end of the list (`14` §4, focus order).
watch(
  () => props.reorder.saving,
  async (saving) => {
    if (saving || lastMove === null) return;
    const delta = lastMove;
    lastMove = null;
    await nextTick();
    const same = delta < 0 ? upButton.value : downButton.value;
    const other = delta < 0 ? downButton.value : upButton.value;
    (same && !same.disabled ? same : other)?.focus();
  },
);
</script>

<template>
  <div v-if="reorder.enabled || reorder.saving" class="flex items-center gap-0.5">
    <span
      class="cursor-grab select-none px-1 text-[15px] leading-none text-gray-400 hover:text-gray-700 active:cursor-grabbing"
      :draggable="reorder.enabled"
      aria-hidden="true"
      title="Drag to reorder"
      @dragstart="reorder.dragStart(item, $event)"
      @dragend="reorder.dragEnd()"
      >⠿</span
    >
    <div class="flex">
      <button
        type="button"
        class="inline-flex h-6 w-6 items-center justify-center rounded text-[10px] text-gray-500 hover:text-primary disabled:opacity-25"
        :aria-label="`Move ${title} up`"
        ref="upButton"
        :disabled="!reorder.canMove(item, -1)"
        @click="move(-1)"
      >
        ▲
      </button>
      <button
        type="button"
        class="inline-flex h-6 w-6 items-center justify-center rounded text-[10px] text-gray-500 hover:text-primary disabled:opacity-25"
        :aria-label="`Move ${title} down`"
        ref="downButton"
        :disabled="!reorder.canMove(item, 1)"
        @click="move(1)"
      >
        ▼
      </button>
    </div>
  </div>
</template>
