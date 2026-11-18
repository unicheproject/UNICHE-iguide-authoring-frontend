<script setup lang="ts">
/*
 * "Preview in app" of a Resource editor (`12` §3; D-056, D-059, D-082): the Resource drawn in a visitor shell on a Web,
 * Mobile, or Kiosk screen, inside the editor's inline panel (`PreviewPanel`, which owns the container, Esc and focus
 * return). A header with the surface switch and, in the controls slot, Expand and Close (`PreviewPanel`), a labelled preview region (`PreviewPane`) whose screen is drawn at
 * its real size and fitted to the room, with the scale stated and "Open at real size" for the new tab, and a note on what
 * is shown. A stand-in until the web runtime can be embedded (DECISIONS.md D-014): it draws the editor's live form,
 * unsaved changes included, in the Project's theme and app shell (`workspace/projectTheme.ts`). The surface opens as the
 * Project's first enabled one.
 */
import { ArrowLeft, ChevronDown, ExternalLink, Menu } from "lucide-vue-next";
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import PreviewPane from "@/components/preview/PreviewPane.vue";
import ResourceContent from "@/components/preview/ResourceContent.vue";
import { previewStrings } from "@/components/preview/strings";
import { firstEnabledSurface, SURFACES, SURFACE_KEYS, type Surface } from "@/components/preview/surfaces";
import { Button } from "@/components/ui/button";
import { HelpHint } from "@/components/ui/help-hint";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { say } from "@/lib/announcer";
import { hints } from "@/lib/glossary";
import { ApiError } from "@/platform/api";
import { fetchSurfaces } from "@/platform/surfaces";
import { useCurrentProject } from "@/workspace/currentProject";
import type { PreviewModel } from "@/workspace/preview";
import { themeStyle, useProjectTheme } from "@/workspace/projectTheme";

const props = defineProps<{ model: PreviewModel; dirty: boolean }>();

const router = useRouter();
const project = useCurrentProject();
const theme = useProjectTheme(computed(() => project.value.id));
/** Null until the Project's surfaces are known, so the panel opens on the right one instead of flashing another. */
const surface = ref<Surface | null>(null);
const interactive = ref(false);
const shown = computed<Surface>(() => surface.value ?? "WEB");
const t = computed(() => previewStrings(props.model.language?.languageCode));
const mobile = computed(() => shown.value === "MOBILE");
const logo = computed(() => (mobile.value ? theme.value.compactLogoUrl : theme.value.logoUrl));
const menu = computed(() => [t.value.home, t.value.places, t.value.pois, t.value.routes, t.value.guides, t.value.events]);
const languageName = computed(() => props.model.language?.displayName ?? "this language");
const dir = computed(() => (props.model.language?.direction === "RTL" ? "rtl" : "ltr"));
// Labelled with the surface, language and the state it renders (`14` §4, D-042, D-082).
const label = computed(
  () => `Preview: ${SURFACES[shown.value].label}, ${props.model.language?.displayName ?? "no language"}, ${props.dirty ? "unsaved form" : "saved form"}`,
);

let aborted = false;
onMounted(async () => {
  try {
    const surfaces = await fetchSurfaces(project.value.id);
    if (!aborted && surface.value === null) surface.value = firstEnabledSurface(surfaces.filter((s) => s.enabled).map((s) => s.surface));
  } catch (e) {
    if (!(e instanceof ApiError)) throw e;
    if (!aborted && surface.value === null) surface.value = "WEB";
  }
});
onBeforeUnmount(() => (aborted = true));

function chooseSurface(value: string | number) {
  surface.value = value as Surface;
  say(`Preview: ${SURFACES[value as Surface].label}`);
}

/** The new tab shows the saved content at the real size of the screen; unsaved form changes stay in the editor. */
function openAtRealSize() {
  const href = router.resolve({
    name: "app-preview",
    params: { projectId: project.value.id },
    query: { surface: shown.value, lang: props.model.language?.languageCode, mode: "WORKING", real: "1" },
  }).href;
  const tab = window.open(href, `iguide-preview-${project.value.id}`);
  if (tab) tab.opener = null;
}

/** Whether the screen marks any text as missing, so the note names the outline only when it explains something. */
const screenEl = ref<HTMLElement | null>(null);
const hasMissing = ref(false);
function measure() {
  hasMissing.value = !!screenEl.value?.querySelector(".missing");
}
onMounted(measure);
watch([() => props.model, surface], () => void nextTick(measure), { deep: true });
</script>

<template>
  <section>
    <!-- Stays on top while the panel scrolls: the Surface tabs and, from the panel, Expand and Close (D-113). -->
    <div class="sticky top-0 z-sticky flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-border bg-card px-4 py-2">
      <span class="min-w-0 flex-1 truncate text-sm font-semibold text-ink-2">In the app</span>
      <Tabs :model-value="shown" @update:model-value="chooseSurface">
        <TabsList label="Surface" class="border-b-0">
          <TabsTrigger v-for="key in SURFACE_KEYS" :key="key" :value="key" class="min-h-control px-3">{{ SURFACES[key].label }}</TabsTrigger>
        </TabsList>
        <TabsContent v-for="key in SURFACE_KEYS" :key="key" :value="key" force-mount class="hidden" />
      </Tabs>
      <HelpHint label="What is a surface?" class="-mx-2">{{ hints.previewSurface }}</HelpHint>
      <slot name="controls" />
    </div>

    <!-- `isolate`: the map's own controls (z-index 1000) stay under the sticky header. -->
    <div class="isolate bg-muted p-3">
      <p v-if="surface === null" class="text-sm text-muted-foreground" role="status">Loading the Project's surfaces…</p>
      <PreviewPane
        v-else
        v-model:interactive="interactive"
        content-inert
        compact
        :surface="surface"
        :label="label"
        :dir="dir"
        :lang="model.language?.languageCode"
        :style="themeStyle(theme)"
        browser-chrome
      >
        <template #actions>
          <Button variant="secondary" size="sm" @click="openAtRealSize"><ExternalLink aria-hidden="true" />Open at real size</Button>
        </template>
        <template #default="{ inert }">
          <div class="flex items-center gap-[0.75em] bg-[var(--t-primary)] px-[1.2em] py-[0.9em] text-[var(--t-on-primary)]" aria-hidden="true">
            <ArrowLeft class="size-[1.2em] flex-none rtl:-scale-x-100" />
            <Menu v-if="mobile && theme.shell.mobileMenu === 'BURGER'" class="size-[1.2em] flex-none" />
            <img v-if="logo" :src="logo" alt="" class="h-[1.6em] w-auto flex-none object-contain" />
            <span class="min-w-0 truncate text-[1.1em] font-bold [font-family:var(--t-heading)]">{{ project.name }}</span>
            <span
              v-if="theme.shell.search === 'HEADER'"
              class="ml-auto flex-none rounded-full border border-current px-[0.8em] py-[0.15em] text-[0.7em] font-bold"
            >
              {{ t.search }}
            </span>
            <span
              v-if="theme.shell.languageSwitcher === 'HEADER'"
              class="flex-none rounded-full border border-current px-[0.6em] py-[0.1em] text-[0.7em] font-bold"
              :class="{ 'ml-auto': theme.shell.search !== 'HEADER' }"
            >
              {{ model.language?.languageCode ?? "—" }}<ChevronDown class="ml-[0.2em] inline size-[1em]" />
            </span>
          </div>
          <!-- The screen scrolls on its own; its content is inert (a picture), the scroller is not, so keys and wheel work. -->
          <div class="min-h-0 flex-1 overflow-y-auto" tabindex="0" role="group" aria-label="Screen content, scrolls">
            <div ref="screenEl" :inert="inert">
              <ResourceContent :model="model" :wide="surface !== 'MOBILE'" />
            </div>
          </div>
          <div
            v-if="theme.shell.languageSwitcher === 'FOOTER'"
            class="flex justify-center border-t border-[var(--t-border)] py-[0.5em] text-[0.75em] font-bold text-[var(--t-muted)]"
            aria-hidden="true"
          >
            {{ t.language }}: {{ model.language?.languageCode ?? "—" }}<ChevronDown class="ml-[0.2em] inline size-[1em]" />
          </div>
          <div
            v-if="mobile && theme.shell.mobileMenu === 'BOTTOM_BAR'"
            class="flex bg-[var(--t-primary)] text-[0.62em] font-semibold text-[var(--t-on-primary)]"
            aria-hidden="true"
          >
            <span v-for="item in menu" :key="item" class="min-w-0 flex-1 truncate px-[0.3em] py-[1em] text-center">{{ item }}</span>
          </div>
        </template>
      </PreviewPane>
    </div>

    <p class="border-t border-border px-4 py-3 text-xs leading-normal text-muted-foreground">
      <strong v-if="dirty" class="font-semibold text-warning">Shows unsaved changes.</strong>
      {{ dirty ? "" : "Shows the form as it stands." }}
      Language: {{ model.language?.displayName ?? "none" }}, following the editor's language tab.
      <template v-if="hasMissing">Dashed red outlines mark texts missing in {{ languageName }}.</template>
      An approximation {{ theme.styleName ? `in the Project's theme (${theme.styleName})` : "in the default theme" }}: the
      visitor app itself is not available yet. The new tab shows saved content only.
    </p>
  </section>
</template>
