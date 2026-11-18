<script setup lang="ts">
/**
 * The one card of the editor side column (D-109, C3-31): Status, "Before you activate", "On this page", Translations,
 * "Used in" and the cards editors add through the shell's `aside` slot. The heading is the card's only `h2`
 * (`text-sm font-bold`), the padding is `p-4`, and nothing inside may open another `h2` (use `h3`). `flat` drops the
 * card chrome for the narrow layout, where the cards already sit inside the summary card and a card in a card would
 * nest. The heading takes programmatic focus (`tabindex="-1"`) so Activate, Apply and "Show where it is used" can
 * move focus to the card they changed.
 */
withDefaults(
  defineProps<{
    title: string;
    /** The id of the `h2`; the card is labelled by it. */
    headingId: string;
    /** `nav` for a card that is a navigation landmark ("On this page"). */
    as?: "section" | "nav";
    flat?: boolean;
  }>(),
  { as: "section", flat: false },
);
</script>

<template>
  <component :is="as" :aria-labelledby="headingId" data-side-card :class="flat ? '' : 'rounded-lg border bg-card p-4 shadow-1'">
    <div class="mb-2 flex min-h-6 items-center justify-between gap-2">
      <h2 :id="headingId" tabindex="-1" class="m-0 text-sm font-bold">{{ title }}</h2>
      <slot name="actions" />
    </div>
    <slot />
  </component>
</template>
