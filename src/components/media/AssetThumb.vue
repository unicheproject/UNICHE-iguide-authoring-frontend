<script setup lang="ts">
/**
 * Preview of an Asset (D-080): an image is shown whole (`object-contain` in a fixed box, never cropped); any other type
 * shows a drawn icon and, when the box is tall enough (56 px or more), its type in words. Give `ratio` ("4 / 3") for a
 * box that scales with its column, else `height`. Decorative: the Asset's name sits next to it. A tiny picture (under
 * 64 px on a side) is not stretched over the box into a blur or a block: it is drawn crisp at no less than 32 px and no
 * more than 96 px, centred (C3-81).
 */
import { Box, File, FileText, Film, Image as ImageIcon, Map as MapIcon, Music } from "lucide-vue-next";
import { computed, ref, type Component } from "vue";
import { assetTypeLabel, isImage, type Asset, type AssetType } from "@/platform/assets";

const props = withDefaults(defineProps<{ asset: Asset; height?: string; ratio?: string }>(), { height: "64px", ratio: undefined });

const ICONS: Record<AssetType, Component> = {
  IMAGE: ImageIcon,
  AUDIO: Music,
  VIDEO: Film,
  DOCUMENT: FileText,
  THREE_D_MODEL: Box,
  FLOOR_PLAN: MapIcon,
  OTHER: File,
};
const tiny = ref(false);
function measure(event: Event) {
  const img = event.target as HTMLImageElement;
  tiny.value = img.naturalWidth > 0 && (img.naturalWidth < 64 || img.naturalHeight < 64);
}
const showLabel = computed(() => !!props.ratio || parseInt(props.height, 10) >= 56);
const boxStyle = computed(() => (props.ratio ? { aspectRatio: props.ratio } : { height: props.height }));
</script>

<template>
  <div class="flex flex-col items-center justify-center gap-1 overflow-hidden rounded-md border border-border bg-muted text-xs font-medium text-ink-2" :style="boxStyle">
    <img
      v-if="isImage(asset)"
      :src="asset.url"
      alt=""
      :class="tiny ? 'min-h-8 min-w-8 max-h-24 max-w-24 object-contain [image-rendering:pixelated]' : 'size-full object-contain'"
      loading="lazy"
      @load="measure"
    />
    <template v-else>
      <component :is="ICONS[asset.type]" class="size-6 flex-none" aria-hidden="true" />
      <span v-if="showLabel">{{ assetTypeLabel(asset.type) }}</span>
    </template>
  </div>
</template>
