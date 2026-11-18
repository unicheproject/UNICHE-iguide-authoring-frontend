<script setup lang="ts">
/**
 * "N things to fix" summary of a failed save (`14` §4): focusable (`tabindex="-1"`, marked `data-error-summary` as
 * the editors expect), announced as an alert, each item a link that asks the owner to focus its field. Carries the
 * request id (the one `RequestIdRow`); never the rejected value. `summary` has the shape of `editor.summary`.
 *
 * A failure that belongs to no field (every item without a `path`: the platform was busy, a conflict) is not "N things
 * to fix": the caller's "N things to fix" title is replaced by "This could not be completed" (D-105, C3-85).
 */
import { CircleAlert } from "lucide-vue-next";
import { computed } from "vue";
import RequestIdRow from "@/components/ui/alert/RequestIdRow.vue";

export interface ErrorSummaryLine {
  text: string;
  path: string | null;
}

const props = defineProps<{
  summary: { title: string; items: ErrorSummaryLine[]; requestId: string | null };
}>();
const heading = computed(() =>
  /^\d+ things? to fix/.test(props.summary.title) && props.summary.items.length > 0 && props.summary.items.every((item) => !item.path)
    ? "This could not be completed"
    : props.summary.title,
);
defineEmits<{ select: [path: string] }>();
</script>

<template>
  <div
    role="alert"
    data-error-summary
    tabindex="-1"
    class="rounded-lg border border-destructive/30 bg-destructive-tint px-4 py-3 text-destructive"
  >
    <p class="flex items-center gap-2 text-sm font-bold">
      <CircleAlert class="size-5 shrink-0" aria-hidden="true" />{{ heading }}
    </p>
    <ul class="mt-2 list-disc space-y-1 pl-9 text-sm text-foreground">
      <li v-for="(item, i) in summary.items" :key="i">
        <a v-if="item.path" href="#" class="font-medium" @click.prevent="$emit('select', item.path)">{{ item.text }}</a>
        <template v-else>{{ item.text }}</template>
      </li>
    </ul>
    <RequestIdRow v-if="summary.requestId" :id="summary.requestId" class="mt-2" />
  </div>
</template>
