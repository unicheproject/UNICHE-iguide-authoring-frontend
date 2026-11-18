<script setup lang="ts">
/** Popover root (Radix): Esc closes it and returns focus to the trigger; `v-model:open` controls it. */
import { PopoverRoot, type PopoverRootEmits, type PopoverRootProps, useForwardPropsEmits } from "radix-vue";

const props = defineProps<PopoverRootProps>();
const emits = defineEmits<PopoverRootEmits>();
const forwarded = useForwardPropsEmits(props, emits);
</script>

<template>
  <PopoverRoot v-bind="forwarded"><slot /></PopoverRoot>
</template>
