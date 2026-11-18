<script setup lang="ts">
/**
 * Empty list or section: an icon, a 16/700 title, one sentence of purpose, and one primary action (slot `actions`).
 * It teaches what the area is for rather than saying "nothing here".
 */
import type { Component } from "vue";

defineProps<{ title: string; icon?: Component }>();
</script>

<template>
  <div class="flex flex-col items-center gap-2 rounded-lg border border-dashed border-input bg-card px-6 py-10 text-center">
    <component :is="icon" v-if="icon" class="size-6 text-muted-foreground" aria-hidden="true" />
    <h2 class="text-base font-bold">{{ title }}</h2>
    <p v-if="$slots.default" class="max-w-prose text-sm text-muted-foreground"><slot /></p>
    <div v-if="$slots.actions" class="mt-2 flex flex-wrap justify-center gap-2"><slot name="actions" /></div>
  </div>
</template>
