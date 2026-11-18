<script setup lang="ts">
/** The strip of tab triggers: a bottom hairline, tabs scroll sideways instead of wrapping off screen. */
import { TabsList } from "radix-vue";
import type { HTMLAttributes } from "vue";
import { cn } from "@/lib/utils";

const props = defineProps<{ class?: HTMLAttributes["class"]; label?: string }>();
</script>

<template>
  <TabsList :aria-label="label" :class="cn('-m-1 flex overflow-x-auto border-b border-border p-1', props.class)"><slot /></TabsList>
</template>
