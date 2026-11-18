<script setup lang="ts">
/** A loading block: static sunken colour, pulsing only when reduced motion is not requested. Shape it with classes. */
import type { HTMLAttributes } from "vue";
import { cn } from "@/lib/utils";

const props = defineProps<{ class?: HTMLAttributes["class"] }>();
</script>

<template>
  <div :class="cn('animate-skeleton rounded-md bg-muted', props.class)" aria-hidden="true"></div>
</template>
