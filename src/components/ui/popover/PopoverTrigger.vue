<script setup lang="ts">
/** The control that opens a popover; use `as-child` around a `Button`. */
import { PopoverTrigger, type PopoverTriggerProps } from "radix-vue";

const props = defineProps<PopoverTriggerProps>();
</script>

<template>
  <PopoverTrigger v-bind="props"><slot /></PopoverTrigger>
</template>
