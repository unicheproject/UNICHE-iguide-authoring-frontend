<script setup lang="ts">
/*
 * Visitor app → Preview (`12` §3 Preview, mockup screen 14): the stand-in visitor app (DECISIONS.md D-015)
 * per surface and language, with drafts ("Working content") or only active content ("Live content"), a
 * "fire trigger" control, and "Open in new tab" under the author's own session. Nothing here is shareable
 * or changes what visitors see.
 */
import { computed, onBeforeUnmount, ref, watch } from "vue";
import { useRouter } from "vue-router";
import PageHead from "@/components/PageHead.vue";
import DeviceFrame from "@/components/preview/DeviceFrame.vue";
import PreviewApp from "@/components/preview/PreviewApp.vue";
import { SURFACES, type Surface } from "@/components/preview/surfaces";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/platform/api";
import { TRIGGER_LABELS, type Trigger } from "@/platform/triggers";
import { useCurrentProject } from "@/workspace/currentProject";
import { loadPreviewData, visibleData, type PreviewData, type PreviewMode } from "@/workspace/previewData";
import { titleOf } from "@/workspace/previewModels";
import { findSection } from "@/workspace/sections";

const section = findSection("preview")!;
const project = useCurrentProject();
const projectId = computed(() => project.value.id);
const router = useRouter();

const all = ref<PreviewData | null>(null);
const loading = ref(true);
const loadError = ref<ApiError | null>(null);
let controller: AbortController | null = null;

const surface = ref<Surface>("WEB");
const language = ref<string | null>(null);
const mode = ref<PreviewMode>("WORKING");
const app = ref<InstanceType<typeof PreviewApp> | null>(null);

async function load() {
  controller?.abort();
  controller = new AbortController();
  const signal = controller.signal;
  loading.value = true;
  loadError.value = null;
  try {
    all.value = await loadPreviewData(projectId.value, signal);
    const codes = all.value.languages.map((l) => l.languageCode);
    if (!language.value || !codes.includes(language.value)) language.value = defaultLanguage.value;
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") return;
    if (!(e instanceof ApiError)) throw e;
    loadError.value = e;
  } finally {
    if (!signal.aborted) loading.value = false;
  }
}
watch(projectId, load, { immediate: true });
onBeforeUnmount(() => controller?.abort());

const defaultLanguage = computed(() => all.value?.languages.find((l) => l.isDefault)?.languageCode ?? null);
const data = computed(() => (all.value ? visibleData(all.value, mode.value) : null));
const activeLanguage = computed(() => all.value?.languages.find((l) => l.languageCode === language.value) ?? null);

/** Titles visitors of the chosen language would see in the default language instead. */
const missingTitles = computed(() => {
  const d = data.value;
  const code = language.value;
  if (!d || !code) return 0;
  const lists: { translations: Record<string, { title: string | null }> }[][] = [d.places, d.pois, d.routes, d.guides, d.events];
  return lists.flat().filter((r) => !r.translations[code]?.title?.trim()).length;
});
const statusLine = computed(() => {
  const what = mode.value === "WORKING" ? "Showing drafts and active content." : "Showing active content only, as visitors see it.";
  const name = activeLanguage.value?.displayName ?? "";
  const missing = missingTitles.value;
  return `${what} ${missing ? `${missing} missing title${missing === 1 ? "" : "s"}` : "No missing titles"} in ${name}.`;
});

const firable = computed(() => (data.value?.triggers ?? []).filter((t) => t.status !== "ARCHIVED"));
function triggerLabel(t: Trigger): string {
  const c = t.configuration;
  const detail = t.triggerType === "QR_CODE" ? String(t.code) : t.triggerType === "BEACON" ? `${c.uuid} / ${c.major} / ${c.minor}` : `${c.radiusMeters} m`;
  const target = data.value ? titleOf({ data: data.value, language: language.value, defaultLanguage: defaultLanguage.value }, { type: "POI", id: t.targetResourceId }) : "";
  return `${TRIGGER_LABELS[t.triggerType]} ${detail} → ${target}`;
}
const fireId = ref("");
function fire() {
  const trigger = firable.value.find((t) => t.id === fireId.value);
  if (trigger) app.value?.fire(trigger);
  fireId.value = "";
}

function openInNewTab() {
  const href = router.resolve({
    name: "app-preview",
    params: { projectId: projectId.value },
    query: { surface: surface.value, lang: language.value ?? undefined, mode: mode.value },
  }).href;
  window.open(href, "_blank", "noopener");
}

const chip = (selected: boolean) =>
  selected ? "bg-primary text-primary-foreground" : "text-gray-700 hover:text-primary";
</script>

<template>
  <main class="relative min-w-0 flex-1 overflow-y-auto px-7 pb-16 pt-6">
    <PageHead :title="section.title" :subtitle="section.subtitle">
      <template #actions>
        <Button variant="outline" :disabled="!data" @click="openInNewTab">Open in new tab</Button>
      </template>
    </PageHead>

    <div v-if="loadError" role="alert" class="max-w-[640px] rounded-lg border border-l-[3px] border-l-destructive bg-card px-[18px] py-4">
      <strong class="block text-[13px] font-bold text-destructive">
        {{ loadError.platformUnavailable ? "The UNICHE platform is not reachable" : "The preview could not be loaded" }}
      </strong>
      <p class="mt-1 text-[13px] text-gray-700">{{ loadError.message }}</p>
      <Button variant="outline" size="sm" class="mt-3" @click="load">Try again</Button>
    </div>

    <div v-else-if="loading || !data" class="animate-skeleton space-y-4" aria-busy="true" aria-label="Loading the preview">
      <div class="h-[64px] rounded-[10px] border bg-card"></div>
      <div class="mx-auto h-[520px] max-w-[1000px] rounded-xl border bg-card"></div>
    </div>

    <template v-else>
      <div class="mb-5 flex flex-wrap items-center gap-3 rounded-[10px] border bg-card px-[18px] py-3">
        <div class="flex rounded-full bg-muted p-1" role="group" aria-label="Surface">
          <button
            v-for="key in (['WEB', 'MOBILE', 'KIOSK'] as const)"
            :key="key"
            type="button"
            :aria-pressed="surface === key"
            class="rounded-full px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.06em]"
            :class="chip(surface === key)"
            @click="surface = key"
          >
            {{ SURFACES[key].label }}
          </button>
        </div>
        <div v-if="all && all.languages.length" class="flex rounded-full bg-muted p-1" role="group" aria-label="Language">
          <button
            v-for="l in all.languages"
            :key="l.languageCode"
            type="button"
            :aria-pressed="language === l.languageCode"
            class="rounded-full px-4 py-1.5 text-[11px] font-bold tracking-[0.04em]"
            :class="chip(language === l.languageCode)"
            @click="language = l.languageCode"
          >
            {{ l.displayName }}
          </button>
        </div>
        <div class="flex rounded-full bg-muted p-1" role="group" aria-label="Content">
          <button type="button" :aria-pressed="mode === 'WORKING'" class="rounded-full px-4 py-1.5 text-[11px] font-bold" :class="chip(mode === 'WORKING')" @click="mode = 'WORKING'">
            Working content
          </button>
          <button type="button" :aria-pressed="mode === 'LIVE'" class="rounded-full px-4 py-1.5 text-[11px] font-bold" :class="chip(mode === 'LIVE')" @click="mode = 'LIVE'">
            Live content
          </button>
        </div>
        <label class="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.06em] text-muted-foreground">
          Fire trigger
          <select v-model="fireId" class="field-input max-w-[300px] py-1.5 text-[12px] normal-case tracking-normal" :disabled="!firable.length" @change="fire">
            <option value="">{{ firable.length ? "Choose a trigger…" : "No triggers" }}</option>
            <option v-for="t in firable" :key="t.id" :value="t.id">{{ triggerLabel(t) }}</option>
          </select>
        </label>
        <span class="ml-auto text-xs text-muted-foreground" aria-live="polite">{{ statusLine }}</span>
      </div>

      <p class="mb-2 text-center text-[10px] font-extrabold uppercase tracking-[0.1em] text-muted-foreground">{{ SURFACES[surface].caption }}</p>
      <div class="mx-auto" :class="surface === 'MOBILE' ? 'max-w-[400px]' : surface === 'KIOSK' ? 'max-w-[640px]' : 'max-w-[1000px]'">
        <DeviceFrame :surface="surface" :dir="activeLanguage?.direction === 'RTL' ? 'rtl' : 'ltr'" browser-chrome>
          <PreviewApp
            ref="app"
            :data="data"
            :language="language"
            :default-language="defaultLanguage"
            :surface="surface"
            :app-name="project.name"
          />
        </DeviceFrame>
      </div>
      <p class="mx-auto mt-3 max-w-[760px] text-center text-[11px] text-muted-foreground">
        An approximation in the default theme with a default menu: the visitor app, Pages, Navigation, and the theme are not
        available yet. Red marks texts missing in the chosen language. Nothing here changes what visitors see.
      </p>
    </template>
  </main>
</template>
