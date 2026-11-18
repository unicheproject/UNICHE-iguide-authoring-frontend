<script setup lang="ts">
/**
 * One chip for every small state or count: an optional lucide `icon` (drawn 16 px) and always text. Tones follow the
 * status vocabulary of D-070 (`success`, `warning`, `danger`, `info`, `brand`, `neutral`, `outline`).
 */
import type { Component, HTMLAttributes } from "vue";
import { chipVariants, type ChipVariants } from ".";
import { cn } from "@/lib/utils";

const props = defineProps<{
  tone?: ChipVariants["tone"];
  icon?: Component;
  class?: HTMLAttributes["class"];
}>();
</script>

<template>
  <span :class="cn(chipVariants({ tone }), props.class)">
    <component :is="icon" v-if="icon" aria-hidden="true" />
    <slot />
  </span>
</template>
