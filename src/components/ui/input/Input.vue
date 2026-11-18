<script setup lang="ts">
/**
 * Single-line text field: 40 px (44 coarse), 1 px control border at 3:1 or better, focus moves the border to the
 * brand colour inside the common focus ring. Needs a visible label from `FormField` or a `<label>`; the placeholder is
 * never the label. `invalid` sets `aria-invalid`; other attributes (id, name, aria-describedby, type) pass through.
 * `dir="auto"` by default, so text typed in another direction (Arabic in a Latin-language field) keeps its punctuation
 * order; pass `dir` (for example from the field's known language) to override.
 */
import type { HTMLAttributes } from "vue";
import { cn } from "@/lib/utils";

const props = defineProps<{ invalid?: boolean; class?: HTMLAttributes["class"] }>();
const model = defineModel<string | number | undefined>();
</script>

<template>
  <input
    v-model="model"
    dir="auto"
    :aria-invalid="invalid ? 'true' : undefined"
    :class="cn('ui-field', invalid && 'border-destructive', props.class)"
  />
</template>
