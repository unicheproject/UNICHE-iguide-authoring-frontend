<script setup lang="ts">
/**
 * Menu root (Radix): arrow-key model, type-ahead, Esc returns focus to the trigger. Non-modal by default: a modal menu
 * aria-hides the header, skip link and nav while they stay focusable (axe `aria-hidden-focus`).
 */
import { DropdownMenuRoot, type DropdownMenuRootEmits, type DropdownMenuRootProps, useForwardPropsEmits } from "radix-vue";

const props = defineProps<DropdownMenuRootProps>();
const emits = defineEmits<DropdownMenuRootEmits>();
const forwarded = useForwardPropsEmits(props, emits);
</script>

<template>
  <DropdownMenuRoot v-bind="forwarded" :modal="props.modal ?? false"><slot /></DropdownMenuRoot>
</template>
