<script setup lang="ts">
/**
 * The Interaction Triggers of one list row as chips under its slug (spec 12 section 3, Content library), or a
 * muted text when it has none, such as "No trigger, only reachable by browsing" for a Point of Interest.
 */
import { TRIGGER_CHIP_CLASS, TRIGGER_LABELS, triggerLabel, type Trigger } from "@/platform/triggers";

defineProps<{
  triggers: Trigger[];
  /** Shown when there are no triggers; nothing is shown when absent. */
  emptyText?: string;
}>();
</script>

<template>
  <div v-if="triggers.length" class="mt-1.5 flex flex-wrap gap-1">
    <span
      v-for="t in triggers"
      :key="t.id"
      class="whitespace-nowrap rounded-full px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-[0.06em]"
      :class="[TRIGGER_CHIP_CLASS[t.triggerType], { 'opacity-60': t.status === 'DRAFT' }]"
      :title="`${TRIGGER_LABELS[t.triggerType]}${t.status === 'DRAFT' ? ' (draft)' : ''}`"
    >
      {{ triggerLabel(t) }}<template v-if="t.status === 'DRAFT'"> (draft)</template>
    </span>
  </div>
  <p v-else-if="emptyText" class="mt-1 text-[11px] italic text-muted-foreground">{{ emptyText }}</p>
</template>
