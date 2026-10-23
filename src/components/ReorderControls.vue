<script setup lang="ts" generic="T extends Orderable">
/**
 * The reorder controls of one list row: a drag handle for the pointer and "Move up" / "Move down" buttons for the
 * keyboard (AGENTS.md section 4 rule 7). The row itself is the drop target (`dragover`, `drop` from
 * `useReorder`). Hidden while the list cannot be reordered, such as during a search.
 */
import type { Orderable, Reorder } from "@/workspace/useReorder";

defineProps<{
  reorder: Reorder<T>;
  item: T;
  /** The row's name for the buttons' accessible labels. */
  title: string;
}>();
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
    <div class="flex flex-col">
      <button
        type="button"
        class="px-1 text-[9px] leading-[11px] text-gray-500 hover:text-primary disabled:opacity-25"
        :aria-label="`Move ${title} up`"
        :disabled="!reorder.canMove(item, -1)"
        @click="reorder.moveBy(item, -1)"
      >
        ▲
      </button>
      <button
        type="button"
        class="px-1 text-[9px] leading-[11px] text-gray-500 hover:text-primary disabled:opacity-25"
        :aria-label="`Move ${title} down`"
        :disabled="!reorder.canMove(item, 1)"
        @click="reorder.moveBy(item, 1)"
      >
        ▼
      </button>
    </div>
  </div>
</template>
