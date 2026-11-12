<script setup lang="ts">
/*
 * "Preview" of a Resource editor (`12` §3): the Resource drawn in a visitor shell on a Mobile, Web, or Kiosk
 * screen, in the editor's "Preview in app" pop-up card (D-056, D-059): a header with the surface switch and Close, the
 * screen on a grey stage, and a note on what is shown. A stand-in until the web runtime can be embedded (DECISIONS.md D-014): it
 * draws the editor's live form, unsaved changes included, in the Project's theme and app shell
 * (`workspace/projectTheme.ts`), the CMS default before the Project is initialized.
 */
import { X } from "lucide-vue-next";
import { computed, nextTick, onMounted, ref, watch } from "vue";
import DeviceFrame from "@/components/preview/DeviceFrame.vue";
import ResourceContent from "@/components/preview/ResourceContent.vue";
import { previewStrings } from "@/components/preview/strings";
import { SURFACES, type Surface } from "@/components/preview/surfaces";
import { useCurrentProject } from "@/workspace/currentProject";
import type { PreviewModel } from "@/workspace/preview";
import { themeStyle, useProjectTheme } from "@/workspace/projectTheme";

const props = defineProps<{ model: PreviewModel; dirty: boolean }>();
const emit = defineEmits<{ close: [] }>();

const surface = ref<Surface>("MOBILE");
const project = useCurrentProject();
const theme = useProjectTheme(computed(() => project.value.id));
const t = computed(() => previewStrings(props.model.language?.languageCode));
const mobile = computed(() => surface.value === "MOBILE");
const logo = computed(() => (mobile.value ? theme.value.compactLogoUrl : theme.value.logoUrl));
const menu = computed(() => [t.value.home, t.value.places, t.value.pois, t.value.routes, t.value.guides, t.value.events]);
const languageName = computed(() => props.model.language?.displayName ?? "this language");
const dir = computed(() => (props.model.language?.direction === "RTL" ? "rtl" : "ltr"));
// Labelled with the surface and language it renders (`14` §4, DECISIONS.md D-042).
const label = computed(() => `Preview: ${SURFACES[surface.value].label}, ${props.model.language?.displayName ?? "no language"}`);
const uid = Math.random().toString(36).slice(2, 9);
const panelId = `preview-panel-${uid}`;
const tabId = (key: Surface) => `preview-tab-${key}-${uid}`;
const KEYS = ["MOBILE", "WEB", "KIOSK"] as const;

/** Arrow keys, Home, and End move between the surface tabs (WAI-ARIA tabs pattern). */
function onTabKey(event: KeyboardEvent) {
  const at = KEYS.indexOf(surface.value);
  const next =
    event.key === "ArrowRight" ? KEYS[(at + 1) % KEYS.length]
    : event.key === "ArrowLeft" ? KEYS[(at + KEYS.length - 1) % KEYS.length]
    : event.key === "Home" ? KEYS[0]
    : event.key === "End" ? KEYS[KEYS.length - 1]
    : null;
  if (!next) return;
  event.preventDefault();
  surface.value = next;
  void nextTick(() => document.getElementById(tabId(next))?.focus());
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
  <section :aria-label="label">
    <!-- Stays on top while the card scrolls, as in the prototype. -->
    <div class="sticky top-0 z-10 flex items-center gap-2 border-b bg-white px-3.5 py-2.5">
      <span class="min-w-0 flex-1 truncate text-[11px] font-extrabold uppercase tracking-[0.1em] text-muted-foreground">In the app</span>
      <div class="flex flex-none overflow-hidden rounded-full border" role="tablist" aria-label="Surface" @keydown="onTabKey">
        <button
          v-for="key in KEYS"
          :id="tabId(key)"
          :key="key"
          type="button"
          role="tab"
          :aria-selected="surface === key"
          :aria-controls="panelId"
          :tabindex="surface === key ? 0 : -1"
          class="min-h-[28px] px-3 text-[11px] font-extrabold uppercase tracking-[0.07em] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-4px]"
          :class="surface === key ? 'bg-primary text-primary-foreground focus-visible:outline-white' : 'bg-white text-muted-foreground hover:text-primary focus-visible:outline-primary'"
          @click="surface = key"
        >
          {{ SURFACES[key].label }}
        </button>
      </div>
      <button
        type="button"
        class="-mr-1 grid h-8 w-8 flex-none place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary"
        aria-label="Close preview"
        @click="emit('close')"
      >
        <X class="h-4 w-4" aria-hidden="true" />
      </button>
    </div>

    <!-- `isolate`: the map's own controls (z-index 1000) stay under the sticky header. -->
    <div class="isolate bg-muted p-3 sm:p-[22px]">
      <DeviceFrame
        :id="panelId"
        :surface="surface"
        :dir="dir"
        :lang="model.language?.languageCode"
        role="tabpanel"
        :aria-labelledby="tabId(surface)"
        tabindex="0"
        card
        class="rounded-[18px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
        :style="themeStyle(theme)"
      >
        <header class="flex items-center gap-[0.75em] bg-[var(--t-primary)] px-[1.2em] py-[0.9em] text-[var(--t-on-primary)]" aria-hidden="true">
          <span class="inline-block text-[1.2em] rtl:-scale-x-100">←</span>
          <span v-if="mobile && theme.shell.mobileMenu === 'BURGER'" class="text-[1.2em]">☰</span>
          <img v-if="logo" :src="logo" alt="" class="h-[1.6em] w-auto flex-none object-contain" />
          <span class="min-w-0 truncate text-[1.1em] font-bold [font-family:var(--t-heading)]">{{ project.name }}</span>
          <span
            v-if="theme.shell.search === 'HEADER'"
            class="ml-auto flex-none rounded-full border border-current px-[0.8em] py-[0.15em] text-[0.7em] font-bold uppercase tracking-[0.06em]"
          >
            {{ t.search }}
          </span>
          <span
            v-if="theme.shell.languageSwitcher === 'HEADER'"
            class="flex-none rounded-full border border-current px-[0.6em] py-[0.1em] text-[0.7em] font-bold uppercase"
            :class="{ 'ml-auto': theme.shell.search !== 'HEADER' }"
          >
            {{ model.language?.languageCode ?? "—" }} ▾
          </span>
        </header>
        <div ref="screenEl">
          <ResourceContent :model="model" :wide="surface !== 'MOBILE'" />
        </div>
        <div
          v-if="theme.shell.languageSwitcher === 'FOOTER'"
          class="flex justify-center border-t border-[var(--t-border)] py-[0.5em] text-[0.75em] font-bold uppercase text-[var(--t-muted)]"
          aria-hidden="true"
        >
          {{ t.language }}: {{ model.language?.languageCode ?? "—" }} ▾
        </div>
        <nav
          v-if="mobile && theme.shell.mobileMenu === 'BOTTOM_BAR'"
          class="flex bg-[var(--t-primary)] text-[0.62em] font-semibold text-[var(--t-on-primary)]"
          aria-hidden="true"
        >
          <span v-for="item in menu" :key="item" class="min-w-0 flex-1 truncate px-[0.3em] py-[1em] text-center">{{ item }}</span>
        </nav>
      </DeviceFrame>
    </div>

    <p class="border-t px-3.5 py-2.5 text-[12px] leading-[1.5] text-muted-foreground">
      <strong v-if="dirty" class="font-semibold text-[#855400]">Shows unsaved changes.</strong>
      {{ dirty ? "" : "Shows the form as it stands." }}
      Language: {{ model.language?.displayName ?? "none" }}, following the editor's language tab.
      <template v-if="hasMissing">Red dashed outlines mark texts missing in {{ languageName }}.</template>
      An approximation {{ theme.styleName ? `in the Project's theme (${theme.styleName})` : "in the default theme" }}: the
      visitor app itself is not available yet.
    </p>
  </section>
</template>
