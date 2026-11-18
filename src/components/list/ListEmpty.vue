<script setup lang="ts">
/**
 * Both empty states of a list. `filters` empty: the kind has no rows yet, so the one-sentence purpose (default slot)
 * teaches what the list is for. With `filters`: "No <noun> match" and the active filters as removable `FilterChip`s;
 * when `counts` and `status` are given it also says what the other statuses hold ("1 match in Archived"), so a search
 * that looks empty is never a dead end (C3-47). The one "Clear filters" is the toolbar's, right above (C2-40). Loading
 * and error are the view's (`ListTable loading`, `ListLoadError`).
 *
 * One New button (D-110): a list whose page header carries it passes `header-action`, and the empty state then leaves
 * its own `actions` slot out instead of repeating the button. Other lists keep the slot.
 */
import type { Component } from "vue";
import { computed } from "vue";
import EmptyState from "@/components/ui/empty-state/EmptyState.vue";
import type { ActiveFilter } from "@/workspace/listFilters";
import FilterChip from "./FilterChip.vue";
import { LIST_STATUS_OPTIONS, type ListStatus } from "./useListQuery";

const props = defineProps<{
  /** Plural, sentence case: "points of interest". */
  noun: string;
  /** Heading when the kind is empty, such as "No points of interest yet". */
  emptyTitle: string;
  icon?: Component;
  /** True when rows exist but the filters hide them all. */
  filtered?: boolean;
  filters?: ActiveFilter[];
  /** Segment counts of the rows that pass every filter but the status (`statusCounts`); null while unknown. */
  counts?: Record<ListStatus, number> | null;
  /** The status segment in force. */
  status?: ListStatus;
  /** The page header already has the create button. */
  headerAction?: boolean;
}>();
defineEmits<{ clear: [] }>();

/** The other segments that would show matches, in words: "1 match in Archived", "2 matches in Draft and 1 match in Archived". */
const elsewhere = computed(() => {
  const { counts, status } = props;
  if (!counts || !status) return "";
  const hidden = LIST_STATUS_OPTIONS.filter((o) => o.value !== status && o.value !== "NOT_ARCHIVED" && counts[o.value] > 0)
    // "Not archived" already holds Active and Draft.
    .filter((o) => status !== "NOT_ARCHIVED" || o.value === "ARCHIVED")
    .map((o) => `${counts[o.value]} ${counts[o.value] === 1 ? "match" : "matches"} in ${o.label}`);
  if (!hidden.length) return "";
  return hidden.length > 1 ? `${hidden.slice(0, -1).join(", ")} and ${hidden[hidden.length - 1]}` : hidden[0];
});
</script>

<template>
  <div v-if="filtered" class="flex flex-col items-center gap-3 px-6 py-10 text-center">
    <h2 class="text-base font-bold">No {{ noun }} match</h2>
    <p v-if="elsewhere" class="text-sm font-medium text-foreground">{{ elsewhere }}.</p>
    <ul v-if="filters?.length" class="m-0 flex list-none flex-wrap justify-center gap-1.5 p-0" aria-label="Active filters">
      <li v-for="f in filters" :key="f.key"><FilterChip :label="f.label" @remove="f.clear()" /></li>
    </ul>
    <p class="text-sm text-ink-2">Remove a filter, or use Clear filters in the toolbar above.</p>
  </div>
  <EmptyState v-else :title="emptyTitle" :icon="icon">
    <slot />
    <template v-if="$slots.actions && !headerAction" #actions><slot name="actions" /></template>
  </EmptyState>
</template>
