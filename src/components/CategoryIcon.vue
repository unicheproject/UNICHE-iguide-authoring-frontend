<script setup lang="ts">
/** A Category's built-in icon, decorative next to its name. */
import { computed } from "vue";
import { categoryIconPath, type Category } from "@/platform/categories";

const props = withDefaults(defineProps<{ category?: Pick<Category, "icon"> | null; icon?: string | null; size?: number }>(), { size: 16 });
const path = computed(() => categoryIconPath(props.category ?? { icon: props.icon ?? null }));
</script>

<template>
  <svg :width="size" :height="size" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path :d="path" />
  </svg>
</template>
