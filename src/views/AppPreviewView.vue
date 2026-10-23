<script setup lang="ts">
/*
 * "Open in new tab" of Visitor app → Preview (`12` §3): the stand-in visitor app alone, at the surface's
 * real width, under the author's own session. The URL carries no token and opens nothing for anyone else.
 * With `?t={code}`, the address a QR code encodes (`11` §9), it fires that QR trigger once the content is loaded,
 * standing in for the visitor app until it exists (DECISIONS.md D-019).
 */
import { computed, nextTick, onBeforeUnmount, ref, watch } from "vue";
import PreviewApp from "@/components/preview/PreviewApp.vue";
import { SURFACES, type Surface } from "@/components/preview/surfaces";
import { ApiError } from "@/platform/api";
import { fetchProject } from "@/platform/catalogue";
import { loadPreviewData, visibleData, type PreviewData, type PreviewMode } from "@/workspace/previewData";

const props = defineProps<{ projectId: string; surface?: string; lang?: string; mode?: string; t?: string }>();

const surface = computed<Surface>(() => (props.surface === "MOBILE" || props.surface === "KIOSK" ? props.surface : "WEB"));
const mode = computed<PreviewMode>(() => (props.mode === "LIVE" ? "LIVE" : "WORKING"));

const name = ref("");
const all = ref<PreviewData | null>(null);
const error = ref<ApiError | null>(null);
let controller: AbortController | null = null;

async function load() {
  controller?.abort();
  controller = new AbortController();
  error.value = null;
  try {
    const [project, data] = await Promise.all([fetchProject(props.projectId, controller.signal), loadPreviewData(props.projectId, controller.signal)]);
    name.value = project.name;
    all.value = data;
    document.title = `Preview · ${project.name}`;
    await nextTick();
    fireCode();
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") return;
    if (!(e instanceof ApiError)) throw e;
    error.value = e;
  }
}
watch(() => props.projectId, load, { immediate: true });
onBeforeUnmount(() => controller?.abort());

const app = ref<InstanceType<typeof PreviewApp> | null>(null);
const unknownCode = ref<string | null>(null);

/** Opens what the `?t=` QR code opens, as a scan would; codes are compared without case. */
function fireCode() {
  const code = typeof props.t === "string" ? props.t.trim() : "";
  if (!code || !all.value) return;
  const trigger = all.value.triggers.find(
    (t) => t.triggerType === "QR_CODE" && t.status !== "ARCHIVED" && t.code?.toLowerCase() === code.toLowerCase(),
  );
  unknownCode.value = trigger ? null : code;
  if (trigger) app.value?.fire(trigger);
}

const defaultLanguage = computed(() => all.value?.languages.find((l) => l.isDefault)?.languageCode ?? null);
const language = computed(() =>
  props.lang && all.value?.languages.some((l) => l.languageCode === props.lang) ? props.lang : defaultLanguage.value,
);
const direction = computed(() => (all.value?.languages.find((l) => l.languageCode === language.value)?.direction === "RTL" ? "rtl" : "ltr"));
</script>

<template>
  <main class="flex min-h-screen flex-1 justify-center bg-muted">
    <p v-if="error" role="alert" class="m-8 text-[13px] text-destructive">
      {{ error.status === 404 ? "This Project is not available." : `The preview could not be loaded: ${error.message}` }}
    </p>
    <p v-else-if="!all" class="m-8 text-[13px] text-muted-foreground" aria-busy="true">Loading the preview…</p>
    <div
      v-else
      class="flex h-screen flex-col bg-white text-[#030712]"
      :class="surface === 'MOBILE' ? 'w-[390px] shadow-lg' : 'w-full'"
      :style="{ fontSize: `${SURFACES[surface].font}px` }"
      :dir="direction"
    >
      <p v-if="unknownCode" role="status" class="border-b bg-[rgba(154,98,0,0.07)] px-4 py-2 text-[13px] text-[#9a6200]">
        No QR code “{{ unknownCode }}” in this Project. It may have been removed, or the code was mistyped.
      </p>
      <PreviewApp ref="app" :data="visibleData(all, mode)" :language="language" :default-language="defaultLanguage" :surface="surface" :app-name="name" />
    </div>
  </main>
</template>
