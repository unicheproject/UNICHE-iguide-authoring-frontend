<script setup lang="ts">
/**
 * The first row of the Preview page's compact toolbar (D-082, D-093): Surface, Language and Content (Working or Live) as
 * labelled tab groups with their labels inline. The frame's own Size choice sits beside the picture (`PreviewSize`).
 * Changes are announced by the page, not here.
 */
import { HelpHint } from "@/components/ui/help-hint";
import { glossary, hints } from "@/lib/glossary";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ProjectLanguage } from "@/platform/languages";
import type { PreviewMode } from "@/workspace/previewData";
import { SURFACES, SURFACE_KEYS, type Surface } from "./surfaces";

defineProps<{ languages: ProjectLanguage[] }>();
const surface = defineModel<Surface>("surface", { required: true });
const language = defineModel<string | null>("language", { required: true });
const mode = defineModel<PreviewMode>("mode", { required: true });
const MODES: { key: PreviewMode; label: string }[] = [
  { key: "WORKING", label: glossary.previewContent.working },
  { key: "LIVE", label: glossary.previewContent.live },
];
const trigger = "min-h-control px-2.5";
</script>

<template>
  <div class="flex flex-wrap items-center gap-x-5 gap-y-1">
    <div class="flex items-center gap-2">
      <span class="text-xs font-semibold text-ink-2">{{ glossary.previewSurface }}</span>
      <HelpHint :label="`What is a ${glossary.previewSurface.toLowerCase()}?`" class="-mx-2">{{ hints.previewSurface }}</HelpHint>
      <Tabs v-model="surface">
        <TabsList label="Surface" class="border-b-0">
          <TabsTrigger v-for="key in SURFACE_KEYS" :key="key" :value="key" :class="trigger">{{ SURFACES[key].label }}</TabsTrigger>
        </TabsList>
        <TabsContent v-for="key in SURFACE_KEYS" :key="key" :value="key" force-mount class="hidden" />
      </Tabs>
    </div>
    <div v-if="languages.length" class="flex items-center gap-2">
      <span class="text-xs font-semibold text-ink-2">Language</span>
      <Tabs :model-value="language ?? undefined" @update:model-value="(v) => (language = String(v))">
        <TabsList label="Language" class="border-b-0">
          <TabsTrigger v-for="l in languages" :key="l.languageCode" :value="l.languageCode" :class="trigger" :lang="l.languageCode">{{ l.displayName }}</TabsTrigger>
        </TabsList>
        <TabsContent v-for="l in languages" :key="l.languageCode" :value="l.languageCode" force-mount class="hidden" />
      </Tabs>
    </div>
    <div class="flex items-center gap-2">
      <span class="text-xs font-semibold text-ink-2">Content</span>
      <HelpHint label="What are Working and Live content?" class="-mx-2">{{ hints.previewContent }}</HelpHint>
      <Tabs v-model="mode">
        <TabsList label="Content" class="border-b-0">
          <TabsTrigger v-for="m in MODES" :key="m.key" :value="m.key" :class="trigger">{{ m.label }}</TabsTrigger>
        </TabsList>
        <TabsContent v-for="m in MODES" :key="m.key" :value="m.key" force-mount class="hidden" />
      </Tabs>
    </div>
  </div>
</template>
