<script setup lang="ts">
/**
 * The status control of a list: four segments with counts (Not archived, Active, Draft, Archived), one radio group so
 * arrow keys move the choice. The chosen segment carries a check as well as its tint (`14` §4). Counts come from the
 * loaded list and respect the search and the other filters (the view counts the rows that pass everything but the
 * status), so they never claim rows the search hides. While `counts` is null (still loading, or the read failed) the
 * counts are left out instead of showing false zeros (C2-21); with `reserve` (the list is loading) their width is held
 * by invisible digits, so the segments do not widen when the counts arrive (C3-91). Home and End select the first and
 * last segment and never scroll the page (the native radio group would; C3-13).
 */
import { Check } from "lucide-vue-next";
import { ref, useId } from "vue";
import { LIST_STATUS_OPTIONS, type ListStatus } from "./useListQuery";

defineProps<{ counts: Record<ListStatus, number> | null; disabled?: boolean; reserve?: boolean }>();
const model = defineModel<ListStatus>({ required: true });
const name = useId();
const group = ref<HTMLElement | null>(null);

/** Home and End move the choice to the first and last segment; the page does not scroll. */
function onKeydown(event: KeyboardEvent) {
  if (event.key !== "Home" && event.key !== "End") return;
  const radios = [...(group.value?.querySelectorAll<HTMLInputElement>("input[type=radio]:not(:disabled)") ?? [])];
  const target = event.key === "Home" ? radios[0] : radios[radios.length - 1];
  if (!target) return;
  event.preventDefault();
  target.focus({ preventScroll: true });
  target.click();
}
</script>

<template>
  <fieldset class="min-w-0">
    <legend class="sr-only">Status</legend>
    <div ref="group" class="inline-flex max-w-full flex-wrap rounded-md border border-input bg-card p-0.5" @keydown="onKeydown">
      <label
        v-for="o in LIST_STATUS_OPTIONS"
        :key="o.value"
        class="relative inline-flex min-h-8 cursor-pointer items-center gap-1.5 rounded-sm px-3 text-sm transition-ui duration-1 has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-primary [@media(pointer:coarse)]:min-h-11"
        :class="model === o.value ? 'bg-accent font-semibold text-primary' : 'font-medium text-ink-2 hover:bg-surface-hover'"
      >
        <input v-model="model" type="radio" :name="name" :value="o.value" :disabled="disabled" class="sr-only" />
        <Check v-if="model === o.value" class="size-4" aria-hidden="true" :stroke-width="3" />
        {{ o.label }}
        <span v-if="counts" class="tabular text-compact" :class="model === o.value ? 'text-primary' : 'text-muted-foreground'">{{ counts[o.value] }}</span>
        <span v-else-if="reserve" class="tabular invisible text-compact" aria-hidden="true">00</span>
      </label>
    </div>
  </fieldset>
</template>
