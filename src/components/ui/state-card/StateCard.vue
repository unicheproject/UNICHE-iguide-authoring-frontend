<script setup lang="ts">
/**
 * Full-page or section state (session ended, access denied, not found, platform unreachable): an icon, the `h1`, the
 * cause in plain words (default slot), the next step (slot `actions`), the one request-id row, and operator
 * detail collapsed in `details`. It never speaks to operators in the main text.
 */
import { onBeforeUnmount, onMounted, ref, type Component } from "vue";
import RequestIdRow from "@/components/ui/alert/RequestIdRow.vue";
import { restoreFocus } from "@/lib/focus";

defineProps<{ title: string; icon?: Component; requestId?: string | null }>();
const root = ref<HTMLElement | null>(null);
const heading = ref<HTMLElement | null>(null);

// "Try again" inside the card replaces the card: when focus was in it, it goes on to the page heading or `<main>` once
// the replacement is drawn, never to `<body>` (D-103, C3-09).
onBeforeUnmount(() => {
  if (!root.value?.contains(document.activeElement)) return;
  requestAnimationFrame(() => {
    if (!document.activeElement || document.activeElement === document.body) restoreFocus(null);
  });
});

// A full-page state replaces the page, so its heading is where a screen reader should start (C2-13). Focus is taken
// only from `<body>` or from the page being replaced, never from a field the person is typing in or from a dialog.
onMounted(() => {
  const active = document.activeElement;
  const free = !active || active === document.body || (!!active.closest("main") && !active.matches("input, textarea, select, [contenteditable]"));
  if (free && !document.querySelector('[role="dialog"]')) heading.value?.focus({ preventScroll: true });
});
</script>

<template>
  <div ref="root" class="mx-auto flex w-full max-w-xl flex-col items-start gap-3 rounded-lg border border-border bg-card p-6 shadow-1">
    <component :is="icon" v-if="icon" class="size-8 text-muted-foreground" aria-hidden="true" />
    <h1 ref="heading" tabindex="-1" class="text-xl font-bold">{{ title }}</h1>
    <div class="max-w-prose text-sm text-ink-2"><slot /></div>
    <div v-if="$slots.actions" class="flex flex-wrap gap-2"><slot name="actions" /></div>
    <RequestIdRow v-if="requestId" :id="requestId" />
    <details v-if="$slots.details" class="w-full text-sm">
      <summary class="cursor-pointer font-semibold text-primary">Technical details</summary>
      <div class="mt-2 text-muted-foreground"><slot name="details" /></div>
    </details>
  </div>
</template>
