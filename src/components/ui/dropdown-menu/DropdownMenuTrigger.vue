<script setup lang="ts">
/** The control that opens a menu (`aria-haspopup="menu"` comes from Radix); use `as-child` around a `Button`. */
import { DropdownMenuTrigger, type DropdownMenuTriggerProps } from "radix-vue";

const props = defineProps<DropdownMenuTriggerProps>();
</script>

<template>
  <DropdownMenuTrigger v-bind="props"><slot /></DropdownMenuTrigger>
</template>
