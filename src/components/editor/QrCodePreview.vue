<script setup lang="ts">
/**
 * The QR block of a QR code trigger (`11` §9, DECISIONS.md D-020, D-039): the backend's image beside the link it
 * encodes (the app's public web address with the `?t=` code), with Copy link, Download PNG and Open. The block is always
 * drawn: without an image (no public web address yet, an unsaved row, a failed load) it is a dashed frame with the
 * reason, and the actions that do not need the image stay. The CMS never draws a QR code itself, since without the
 * address there is none to encode.
 */
import { Copy, Download, ExternalLink, QrCode } from "lucide-vue-next";
import { computed, ref } from "vue";
import { Button } from "@/components/ui/button";
import { say } from "@/lib/announcer";
import { showToast } from "@/stores/toast";

const props = defineProps<{
  /** The link the code encodes; null while there is none (no public web address, or not saved yet). */
  url: string | null;
  code: string;
  /** The backend's image; null while it loads, when it failed, or when there is none. */
  imageSrc: string | null;
  /** Why there is no image, in a sentence; shown in the frame's place beside it. */
  reason?: string | null;
}>();

/** The image's own pixel size, read from the loaded file, so the caption states what Download PNG gives (C2-93). */
const pixels = ref("");
/** The largest print that stays sharp at 300 dpi, in whole centimetres (C3-69); empty until the image is measured. */
const printSize = ref("");
function measured(event: Event) {
  const img = event.target as HTMLImageElement;
  pixels.value = img.naturalWidth ? `${img.naturalWidth} × ${img.naturalHeight} px` : "";
  const cm = Math.floor((img.naturalWidth / 300) * 2.54);
  printSize.value = img.naturalWidth && cm >= 1 ? `Prints sharp up to ${cm}\u00a0cm wide.` : "";
}
/** The link in pieces that may wrap after a slash or a query sign, never inside a word. */
const urlParts = computed(() => (props.url ? props.url.split(/(?<=[/?=&])/) : []));

async function copy() {
  if (!props.url) return;
  try {
    await navigator.clipboard.writeText(props.url);
    showToast("Link copied");
    say("Link copied");
  } catch {
    showToast("The link was not copied", "Select it and copy it by hand.", "warning");
  }
}
</script>

<template>
  <div class="flex flex-wrap items-start gap-4" data-qr-block>
    <!-- `bg-white` is deliberate: a QR code needs a white quiet zone for scanners whatever the theme (literal-gate exception). -->
    <img v-if="imageSrc" :src="imageSrc" @load="measured" :alt="`QR code ${code}`" width="128" height="128" class="size-32 shrink-0 rounded-md border border-border bg-white p-1" />
    <div
      v-else
      class="flex size-32 shrink-0 flex-col items-center justify-center gap-1 rounded-md border border-dashed border-input bg-muted text-center text-xs text-muted-foreground"
      role="img"
      aria-label="No QR image yet"
    >
      <QrCode class="size-8" aria-hidden="true" />
      No image yet
    </div>
    <div class="flex min-w-[min(100%,16rem)] flex-1 flex-col gap-2 text-sm">
      <template v-if="url">
        <span class="select-all font-mono text-compact text-ink-2" :aria-label="url"><template v-for="(part, i) in urlParts" :key="i">{{ part }}<wbr /></template></span>
        <p v-if="printSize" class="m-0 text-xs text-muted-foreground">{{ printSize }}</p>
        <div class="flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" type="button" @click="copy"><Copy aria-hidden="true" />Copy link</Button>
          <Button v-if="imageSrc" variant="secondary" size="sm" as-child>
            <a :href="imageSrc" :download="`qr-${code}.png`"><Download aria-hidden="true" />Download PNG<span v-if="pixels" class="font-normal text-muted-foreground">({{ pixels }})</span></a>
          </Button>
          <Button variant="ghost" size="sm" as-child>
            <a :href="url" target="_blank" rel="noopener"><ExternalLink aria-hidden="true" />Open link<span class="sr-only"> (new tab)</span></a>
          </Button>
        </div>
      </template>
      <p v-if="reason" class="text-muted-foreground">{{ reason }}</p>
      <slot />
    </div>
  </div>
</template>
