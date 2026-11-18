<script setup lang="ts">
/**
 * A removable filter chip (D-110, C3-99): the one chip for "Status: Draft", "Needs translation in Italiano" and the
 * filters named in an empty list. The whole chip is the button that removes the filter ("Remove filter <label>");
 * the x is drawn, never the only cue, because the label says what is on. 32 px high (44 on a coarse pointer).
 * Without `removable` it is a plain chip.
 */
import { X } from "lucide-vue-next";

withDefaults(
  defineProps<{
    label: string;
    /** Default true. */
    removable?: boolean;
  }>(),
  { removable: true },
);
const emit = defineEmits<{ remove: [] }>();
</script>

<template>
  <button
    v-if="removable"
    type="button"
    class="inline-flex min-h-8 max-w-full items-center gap-1 rounded-full border border-input bg-card py-1 pl-3 pr-2 text-xs font-semibold text-ink-2 transition-ui duration-1 hover:bg-surface-hover active:bg-surface-active [@media(pointer:coarse)]:min-h-11"
    :aria-label="`Remove filter ${label}`"
    @click="emit('remove')"
  >
    <span class="min-w-0 truncate" :title="label">{{ label }}</span><X class="size-4 shrink-0" aria-hidden="true" />
  </button>
  <span v-else class="inline-flex min-h-8 max-w-full items-center rounded-full border border-input bg-card px-3 py-1 text-xs font-semibold text-ink-2">
    <span class="min-w-0 truncate" :title="label">{{ label }}</span>
  </span>
</template>
