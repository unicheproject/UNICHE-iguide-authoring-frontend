<script setup lang="ts">
/**
 * The "Move map" toggle drawn over a map on a coarse pointer (`mapGestures.ts`). It is a real pressed-state button,
 * 44 px, in the map's top-right corner where Leaflet draws nothing, with a short caption that says what a swipe does
 * now (the longer hint sits under the map).
 */
import { Move } from "lucide-vue-next";

defineProps<{ pressed: boolean }>();
defineEmits<{ toggle: [] }>();
</script>

<template>
  <div class="absolute right-3 top-3 z-sticky flex flex-col items-end gap-1">
    <button
      type="button"
      :aria-pressed="pressed"
      class="inline-flex min-h-11 items-center gap-2 rounded-md border px-3 text-sm font-semibold shadow-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      :class="pressed ? 'border-primary bg-primary text-primary-foreground' : 'border-input bg-card text-foreground'"
      @click="$emit('toggle')"
    >
      <Move class="size-4" aria-hidden="true" />Move map
    </button>
    <span class="pointer-events-none rounded bg-card/95 px-1.5 py-0.5 text-xs text-ink-2 shadow-1" aria-hidden="true">
      {{ pressed ? "One finger moves the map" : "Swiping scrolls the page" }}
    </span>
  </div>
</template>
