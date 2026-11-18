<script setup lang="ts">
/**
 * The foot of a list: "Showing 2 of 55 points of interest" and the legend of the translation icons (so the icons are
 * never the only explanation). `total` is the count of the active status segment, so the denominator matches what the
 * segment control says (`segmentTotal`). It has no "Clear filters": the toolbar carries the one (D-091, C2-40). Not
 * live: the count is announced by `useResultAnnouncer`. With `paged`, the table's pager already says "Showing 51-100
 * of 184", so the foot only adds what the pager does not: how many rows the filters left out of the segment. Round 3:
 * `loading` renders an empty line of the same height (render the foot while loading and pass it).
 */
import { Check, Circle, CircleDot } from "lucide-vue-next";
import { computed } from "vue";

const props = defineProps<{
  shown: number;
  /** Rows of the active status segment, before search and the other filters. */
  total: number;
  /** What the rows are, plural: "points of interest". */
  noun: string;
  /** Kept for callers that still pass it; the foot no longer has a clear button. */
  filtered?: boolean;
  /** Show the translation legend (lists with translation state). */
  legend?: boolean;
  /** The table pages its rows and says the range itself. */
  paged?: boolean;
  /** The rows are loading: the foot holds its height (one line) so the rows arriving do not push anything (C3-91). */
  loading?: boolean;
}>();
defineEmits<{ clear: [] }>();

const sentence = computed(() => {
  if (props.paged) return props.shown < props.total ? `${props.total - props.shown} of ${props.total} ${props.noun} in this status are hidden by filters` : "";
  return `Showing ${props.shown} of ${props.total} ${props.noun}`;
});
</script>

<template>
  <footer v-if="loading" class="px-4 py-3 text-compact text-muted-foreground" aria-hidden="true"><span class="invisible">Loading</span></footer>
  <footer v-else-if="sentence || legend" class="flex flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 text-compact text-muted-foreground">
    <p v-if="sentence" class="tabular">{{ sentence }}</p>
    <p v-if="legend" class="flex flex-wrap items-center gap-x-4 gap-y-1">
      <span class="font-semibold text-ink-2">Translations</span>
      <span class="inline-flex items-center gap-1"><Check class="size-4 text-success" aria-hidden="true" />Complete</span>
      <span class="inline-flex items-center gap-1"><CircleDot class="size-4 text-warning" aria-hidden="true" />Partly</span>
      <span class="inline-flex items-center gap-1"><Circle class="size-4" aria-hidden="true" />Missing</span>
    </p>
  </footer>
</template>
