<script setup lang="ts">
/** A non-interactive heading inside a menu. */
import { DropdownMenuLabel } from "radix-vue";
</script>

<template>
  <DropdownMenuLabel class="px-3 py-1.5 text-xs font-semibold text-muted-foreground"><slot /></DropdownMenuLabel>
</template>
