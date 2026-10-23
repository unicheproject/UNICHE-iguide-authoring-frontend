<script setup lang="ts">
/**
 * The backend's QR image of a saved QR code trigger (`GET .../triggers/{id}/qr.png`, DECISIONS.md D-020), fetched
 * with the author's token, since an `<img src>` cannot carry it, and shown with its runtime URL.
 */
import { onBeforeUnmount, ref, watch } from "vue";
import QrCodePreview from "@/components/editor/QrCodePreview.vue";
import { ApiError } from "@/platform/api";
import { fetchQrImage } from "@/platform/triggers";

const props = defineProps<{
  projectId: string;
  triggerId: string;
  code: string;
  runtimeUrl: string;
}>();

const objectUrl = ref<string | null>(null);
const failed = ref<string | null>(null);
let controller: AbortController | null = null;

function release() {
  if (objectUrl.value) URL.revokeObjectURL(objectUrl.value);
  objectUrl.value = null;
}

watch(
  () => [props.projectId, props.triggerId, props.runtimeUrl] as const,
  async ([projectId, triggerId]) => {
    controller?.abort();
    controller = new AbortController();
    failed.value = null;
    try {
      const blob = await fetchQrImage(projectId, triggerId, controller.signal);
      release();
      objectUrl.value = URL.createObjectURL(blob);
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return;
      if (!(e instanceof ApiError)) throw e;
      release();
      failed.value = e.platformUnavailable ? "The UNICHE platform is not reachable." : e.message;
    }
  },
  { immediate: true },
);

onBeforeUnmount(() => {
  controller?.abort();
  release();
});
</script>

<template>
  <QrCodePreview :url="runtimeUrl" :code="code" :image-src="objectUrl">
    <p v-if="failed" class="font-semibold text-destructive">The QR image could not be loaded: {{ failed }}</p>
  </QrCodePreview>
</template>
