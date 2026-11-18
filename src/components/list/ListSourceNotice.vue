<script setup lang="ts">
/**
 * The notice for the reads a list can do without (D-110, C3-87): Categories, Places or Triggers failed, the rows are
 * all there, and the notice says what is left out, with the one fixed failure sentence (`describeError`), the one
 * request-id row and "Try again" per source. It reads `query.errors`, so a view only reports
 * (`query.reportError("places", error)`) and renders this once above the list. Nothing renders while every source is
 * fine.
 *
 * Props: `errors` (`query.errors`), `labels` (replaces what a source's failure leaves out, a full sentence).
 * Event `retry` with the source name.
 */
import { computed } from "vue";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { describeError } from "@/lib/errors";
import type { ListSource } from "./useListQuery";

const props = withDefaults(
  defineProps<{
    errors: Record<ListSource, unknown>;
    labels?: Partial<Record<ListSource, string>>;
  }>(),
  { labels: () => ({}) },
);
const emit = defineEmits<{ retry: [source: ListSource] }>();

const WHAT: Record<ListSource, string> = { categories: "Categories", places: "Places", triggers: "Triggers" };
const LEFT_OUT: Record<ListSource, string> = {
  categories: "Category names and the Category filter are left out.",
  places: "Place names are left out.",
  triggers: "Trigger chips are left out.",
};
const failed = computed(() =>
  (Object.keys(WHAT) as ListSource[])
    .filter((s) => props.errors[s])
    .map((s) => ({ source: s, described: describeError(props.errors[s], `load the ${WHAT[s].toLowerCase()}`) })),
);
</script>

<template>
  <div v-if="failed.length" class="mb-4 flex flex-col gap-2">
    <Alert v-for="f in failed" :key="f.source" tone="warning" :title="`${WHAT[f.source]} could not be loaded`" :request-id="f.described.requestId">
      <p>The list is complete. {{ labels[f.source] ?? LEFT_OUT[f.source] }} {{ f.described.body }}</p>
      <template #actions><Button variant="secondary" size="sm" @click="emit('retry', f.source)">Try again</Button></template>
    </Alert>
  </div>
</template>
