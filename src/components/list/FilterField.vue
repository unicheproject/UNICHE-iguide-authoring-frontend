<script setup lang="ts">
/**
 * One field of the Filters popover (D-110): the label above, the control below at the full width of the popover.
 * Every filter a view adds in the `filters` slot of `ListToolbar` goes in one of these, so the popover has one label
 * layout and one control width. The label is a real `<label for>`: pass the control's `id`.
 */
defineProps<{ label: string; for: string; hint?: string }>();
</script>

<template>
  <div class="flex min-w-0 flex-col gap-1">
    <label :for="$props.for" class="text-xs font-semibold text-ink-2">{{ label }}</label>
    <slot />
    <p v-if="hint" class="text-xs text-muted-foreground">{{ hint }}</p>
  </div>
</template>
