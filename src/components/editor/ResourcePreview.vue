<script setup lang="ts">
/*
 * "Preview" of a Resource editor (`12` §3): the Resource drawn in a visitor shell on a Mobile, Web, or Kiosk
 * screen, scaled to the panel. A stand-in until the web runtime can be embedded (DECISIONS.md D-014): it
 * draws the editor's live form, unsaved changes included, in the default theme.
 */
import { computed, ref } from "vue";
import DeviceFrame from "@/components/preview/DeviceFrame.vue";
import ResourceContent from "@/components/preview/ResourceContent.vue";
import { SURFACES, type Surface } from "@/components/preview/surfaces";
import type { PreviewModel } from "@/workspace/preview";

const props = defineProps<{ model: PreviewModel; dirty: boolean }>();

const surface = ref<Surface>("MOBILE");
const languageName = computed(() => props.model.language?.displayName ?? "this language");
const dir = computed(() => (props.model.language?.direction === "RTL" ? "rtl" : "ltr"));
// Labelled with the surface and language it renders (`14` §4, DECISIONS.md D-042).
const label = computed(() => `Preview: ${SURFACES[surface.value].label}, ${props.model.language?.displayName ?? "no language"}`);
const panelId = `preview-panel-${Math.random().toString(36).slice(2, 9)}`;
</script>

<template>
  <section class="overflow-hidden rounded-lg border bg-card" :aria-label="label">
    <div class="flex items-center gap-1 border-b px-3 py-2" role="tablist" aria-label="Surface">
      <button
        v-for="key in (['MOBILE', 'WEB', 'KIOSK'] as const)"
        :key="key"
        type="button"
        role="tab"
        :aria-selected="surface === key"
        :aria-controls="panelId"
        class="rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.06em]"
        :class="surface === key ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-primary'"
        @click="surface = key"
      >
        {{ SURFACES[key].label }}
      </button>
      <span class="ml-auto text-[10px] font-semibold text-muted-foreground">{{ model.language?.displayName }}</span>
    </div>

    <DeviceFrame
      :id="panelId"
      :surface="surface"
      :dir="dir"
      :lang="model.language?.languageCode"
      role="tabpanel"
      :aria-label="label"
      class="bg-muted"
    >
      <header class="flex items-center gap-[0.75em] bg-[#4c1d8b] px-[1.2em] py-[0.9em] text-white" aria-hidden="true">
        <span class="text-[1.2em]">←</span>
        <span class="text-[0.8em] font-bold uppercase tracking-[0.08em] opacity-80">{{ model.kindLabel }}</span>
        <span class="ml-auto rounded-full border border-white/50 px-[0.6em] py-[0.1em] text-[0.7em] font-bold uppercase">
          {{ model.language?.languageCode ?? "—" }}
        </span>
      </header>
      <div class="min-h-0 flex-1 overflow-y-auto">
        <ResourceContent :model="model" :wide="surface !== 'MOBILE'" />
      </div>
    </DeviceFrame>

    <p class="px-3 py-2 text-[11px] text-muted-foreground">
      An approximation in the default theme: the visitor app itself is not available yet.
      <span v-if="dirty" class="font-semibold text-[#9a6200]">Includes unsaved changes.</span>
      Red marks texts missing in {{ languageName }}.
    </p>
  </section>
</template>
