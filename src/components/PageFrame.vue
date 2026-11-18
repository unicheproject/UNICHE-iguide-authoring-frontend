<script setup lang="ts">
/**
 * The page's one `<main id="main">` (D-073): the scrolling region of the shell, with the page gutter (16 px, 24 px from
 * 1100 px), bottom room so toasts never cover the last row, and `tabindex="-1"` so the skip link and the route-change
 * focus can land here. `narrow` caps the width for forms and state pages. Views not yet migrated keep their own
 * `<main>`; the shell finds either.
 */
defineProps<{ narrow?: boolean; busy?: boolean }>();
</script>

<template>
  <main
    id="main"
    tabindex="-1"
    class="relative min-w-0 flex-1 overflow-y-auto pb-24 pt-6 [padding-inline:var(--gutter)]"
    :aria-busy="busy ? 'true' : undefined"
  >
    <div :class="narrow ? 'mx-auto max-w-3xl' : ''"><slot /></div>
  </main>
</template>
