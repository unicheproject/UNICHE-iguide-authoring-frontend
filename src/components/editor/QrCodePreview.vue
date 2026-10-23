<script setup lang="ts">
/**
 * The QR image of a QR code trigger and the link it encodes. With `imageSrc`, the image is the backend's `qr.png` of
 * the app's public web address (spec 11 section 9, DECISIONS.md D-020); without it, the CMS draws a stand-in whose
 * link opens its own preview of the visitor app with the same `?t=` code (D-019).
 */
import QRCode from "qrcode";
import { computed, ref, watch } from "vue";
import { showToast } from "@/stores/toast";

const props = defineProps<{
  url: string;
  code: string;
  /** The backend's image; the CMS draws nothing then. */
  imageSrc?: string | null;
}>();

const image = ref<string | null>(null);
const standIn = computed(() => props.imageSrc === undefined);

watch(
  () => [props.url, props.imageSrc] as const,
  async ([url, imageSrc]) => {
    if (imageSrc !== undefined) {
      image.value = imageSrc;
      return;
    }
    try {
      image.value = await QRCode.toDataURL(url, { margin: 1, width: 168, errorCorrectionLevel: "M" });
    } catch {
      image.value = null;
    }
  },
  { immediate: true },
);

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
    <img v-if="image" :src="image" :alt="`QR code ${code}`" width="112" height="112" class="rounded border bg-white" />
    <div class="flex min-w-[min(100%,260px)] flex-1 flex-col gap-1.5 text-xs">
      <span class="select-all break-all font-mono text-[11px] text-gray-700">{{ url }}</span>
      <div class="flex flex-wrap gap-3">
        <button type="button" class="text-[10px] font-bold uppercase tracking-[0.06em] text-primary" @click="copy">Copy link</button>
        <a
          v-if="image"
          :href="image"
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
      <p v-if="standIn" class="text-muted-foreground">
        Stand-in: it opens the CMS preview of the visitor app, for signed-in authors only. Once the app has its public
        web address (App settings → Surfaces), the real QR image replaces it. Save before printing: the image follows
        the code as typed.
      </p>
    </div>
  </div>
</template>
