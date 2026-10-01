<script setup lang="ts">
/** Preview of an Asset: the image itself for images, otherwise its type as a label. Decorative next to its name. */
import { assetTypeLabel, isImage, type Asset } from "@/platform/assets";

withDefaults(defineProps<{ asset: Asset; height?: string }>(), { height: "64px" });
</script>

<template>
  <div
    class="flex items-center justify-center overflow-hidden rounded-md border bg-muted text-[9px] font-extrabold uppercase tracking-[0.08em] text-muted-foreground"
    :style="{ height }"
  >
    <img v-if="isImage(asset)" :src="asset.url" alt="" class="h-full w-full object-cover" loading="lazy" />
    <span v-else>{{ assetTypeLabel(asset.type) }}</span>
  </div>
</template>
