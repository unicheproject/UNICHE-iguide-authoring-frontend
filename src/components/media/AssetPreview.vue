<script setup lang="ts">
/**
 * The file itself, large enough to judge (D-080): an image whole inside a box of at most 40 dvh ,
 * an audio or video player, or, for a document and the rest, a file card. Under audio, video and documents, the file
 * name, size and duration, since those have no picture to tell them apart. `compact` (below the editor's two-column
 * width) is one short row: a thumbnail of at most 6 rem beside the file line, so the form's first field stays above the
 * fold; audio and video keep their player at a quarter of the viewport height at most.
 */
import { ExternalLink, FileText } from "lucide-vue-next";
import { computed } from "vue";
import { formatBytes } from "@/lib/format";
import { assetTypeLabel, formatDuration, isImage, type Asset } from "@/platform/assets";

const props = defineProps<{ asset: Asset; /** The alternative text the image is shown with, so the preview behaves as visitors' readers do. */ alt?: string; compact?: boolean }>();
/** A file smaller than 64 px either way is shown enlarged and sharp, with a line that says so (C3-81). */
const tiny = computed(() => !!props.asset.width && !!props.asset.height && Math.max(props.asset.width, props.asset.height) < 64);
const small = computed(() => (tiny.value ? "min-h-24 min-w-24 [image-rendering:pixelated]" : ""));
const maxH = computed(() => (props.compact ? "max-h-[25dvh]" : "max-h-[40dvh]"));
const line = computed(() => [props.asset.originalFilename, formatBytes(props.asset.sizeBytes), props.asset.durationSeconds ? formatDuration(props.asset.durationSeconds) : null].filter(Boolean).join(" · "));
</script>

<template>
  <figure v-if="compact && isImage(asset)" class="m-0 flex items-center gap-3 overflow-hidden rounded-lg border border-border bg-muted p-2">
    <img :src="asset.url" :alt="alt ?? ''" class="max-h-24 max-w-[8rem] [@media(max-height:500px)]:max-h-16 flex-none rounded-md object-contain sm:max-w-[10rem]" :class="small" />
    <figcaption class="tabular min-w-0 break-words text-xs text-muted-foreground">{{ line }}</figcaption>
  </figure>
  <figure v-else class="m-0 overflow-hidden rounded-lg border border-border bg-muted">
    <div class="flex items-center justify-center p-2">
      <img v-if="isImage(asset)" :src="asset.url" :alt="alt ?? ''" class="max-w-full object-contain" :class="[maxH, small]" />
      <audio v-else-if="asset.type === 'AUDIO'" :src="asset.url" controls class="w-full" :aria-label="`Play ${asset.internalName}`"></audio>
      <video v-else-if="asset.type === 'VIDEO'" :src="asset.url" controls class="max-w-full" :class="maxH" :aria-label="`Play ${asset.internalName}`"></video>
      <div v-else class="flex flex-col items-center gap-2 py-6 text-sm">
        <FileText class="size-8 text-muted-foreground" aria-hidden="true" />
        <span class="font-semibold">{{ assetTypeLabel(asset.type) }}</span>
        <a :href="asset.url" target="_blank" rel="noopener" class="inline-flex items-center gap-1 font-semibold">Open the file<ExternalLink class="size-4" aria-hidden="true" /><span class="sr-only">(opens in a new tab)</span></a>
      </div>
    </div>
    <figcaption v-if="isImage(asset) && tiny" class="tabular border-t border-border bg-card px-3 py-2 text-xs text-muted-foreground">A very small file ({{ asset.width }} × {{ asset.height }} px), shown enlarged.</figcaption>
    <figcaption v-else-if="!isImage(asset)" class="tabular break-words border-t border-border bg-card px-3 py-2 text-xs text-muted-foreground">{{ line }}</figcaption>
  </figure>
</template>
