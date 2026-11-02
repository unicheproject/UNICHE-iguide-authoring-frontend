<script setup lang="ts">
/**
 * The backend's QR image of a QR code trigger (`qr.png`, spec 11 section 9, DECISIONS.md D-020) and the link it
 * encodes, the app's public web address with the `?t=` code. The CMS never draws a QR code itself: without the
 * address there is none to encode (DECISIONS.md D-039).
 */
import { showToast } from "@/stores/toast";

const props = defineProps<{
  url: string;
  code: string;
  /** The backend's image; null while it loads or when it failed. */
  imageSrc: string | null;
}>();

async function copy() {
  try {
    await navigator.clipboard.writeText(props.url);
    showToast("Link copied", props.url);
  } catch {
    showToast("The link was not copied", "Select it and copy it by hand.", "warning");
  }
}
</script>

<template>
  <div class="flex flex-wrap items-start gap-4">
    <img v-if="imageSrc" :src="imageSrc" :alt="`QR code ${code}`" width="112" height="112" class="rounded border bg-white" />
    <div class="flex min-w-[min(100%,260px)] flex-1 flex-col gap-1.5 text-xs">
      <span class="select-all break-all font-mono text-[11px] text-gray-700">{{ url }}</span>
      <div class="flex flex-wrap gap-3">
        <button type="button" class="text-[10px] font-bold uppercase tracking-[0.06em] text-primary" @click="copy">Copy link</button>
        <a
          v-if="imageSrc"
          :href="imageSrc"
          :download="`qr-${code}.png`"
          class="text-[10px] font-bold uppercase tracking-[0.06em] text-primary no-underline"
        >
          Download PNG
        </a>
        <a :href="url" target="_blank" rel="noopener" class="text-[10px] font-bold uppercase tracking-[0.06em] text-primary no-underline">
          Open
        </a>
      </div>
      <slot />
    </div>
  </div>
</template>
