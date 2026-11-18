<script setup lang="ts">
/**
 * Step 2: a Template version and a style preset, both real radio groups (one selected at a time, shown by border, tint,
 * a check and the word "Selected"). There is no "confirm style" button: the choice is the state. The preview figure
 * renders the Home Page in the chosen style with the Template's own fonts (loaded from Google Fonts for previews only,
 * D-045); its colours come from the preset, so it is exempt from the CMS palette.
 */
import { Check } from "lucide-vue-next";
import { computed } from "vue";
import { Alert } from "@/components/ui/alert";
import { describeError } from "@/lib/errors";
import { Button } from "@/components/ui/button";
import { HelpHint } from "@/components/ui/help-hint";
import { Skeleton } from "@/components/ui/skeleton";
import { inkOn, type StylePreset } from "@/platform/templates";
import { SURFACE_COPY, type CreateProjectWizard } from "./useCreateProject";

const props = defineProps<{ w: CreateProjectWizard }>();

const RADIUS: Record<string, { card: string; label: string }> = {
  SHARP: { card: "0px", label: "Square" },
  SOFT: { card: "8px", label: "Soft" },
  ROUND: { card: "16px", label: "Round" },
};
const DENSITY: Record<string, { pad: string; gap: string; label: string }> = {
  COMPACT: { pad: "9px 10px", gap: "6px", label: "Compact" },
  REGULAR: { pad: "12px 13px", gap: "9px", label: "Regular" },
  SPACIOUS: { pad: "16px 17px", gap: "13px", label: "Spacious" },
};

const fontFamily = (key: string) => props.w.template?.fonts.find((f) => f.key === key)?.family ?? key;

function presetSummary(p: StylePreset): string {
  return `${fontFamily(p.headingFont)} and ${fontFamily(p.bodyFont)}, ${RADIUS[p.cornerRadius]?.label ?? p.cornerRadius} corners, ${DENSITY[p.density]?.label ?? p.density} spacing`;
}
/** The one sentence for a failed Template list (503 is "busy or down for maintenance", D-105). */
const templatesProblem = computed(() => describeError(props.w.templatesError, "load the Templates"));
const projectName = computed(() => props.w.created?.name ?? "Project name");
const ring = "peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ring";
</script>

<template>
  <div v-if="w.templatesLoading" class="grid grid-cols-[repeat(auto-fit,minmax(min(100%,14rem),1fr))] gap-3" role="status" aria-busy="true">
    <Skeleton v-for="n in 3" :key="n" class="h-24" />
    <span class="sr-only">Loading Templates</span>
  </div>

  <Alert v-else-if="w.templatesError" tone="danger" :title="templatesProblem.title" :request-id="templatesProblem.requestId">
    {{ templatesProblem.body }}
    <template #actions><Button size="sm" variant="secondary" @click="w.loadTemplates()">Try again</Button></template>
  </Alert>

  <div v-else-if="w.templates.length" class="flex flex-col gap-8">
    <fieldset>
      <legend class="flex items-center gap-1 text-sm font-semibold text-ink-2">
        Template
        <HelpHint label="What is a Template?">
          A Template is the starting point of the visitor app: its structure, first Categories and the styles you can choose. Setup
          copies it into the Project, so it cannot be switched afterwards.
        </HelpHint>
      </legend>
      <div class="mt-2 grid grid-cols-[repeat(auto-fit,minmax(min(100%,15rem),1fr))] gap-3">
        <div v-for="t in w.templates" :key="t.id" class="relative">
          <input :id="`template-${t.id}`" type="radio" name="template" class="peer sr-only" :value="t.id" :checked="t.id === w.templateId" @change="w.chooseTemplate(t.id)" />
          <label
            :for="`template-${t.id}`"
            class="flex h-full cursor-pointer flex-col gap-1 rounded-lg border bg-card px-4 py-3 text-left hover:bg-surface-hover"
            :class="[ring, t.id === w.templateId ? 'border-primary bg-accent hover:bg-accent' : 'border-input']"
          >
            <span class="flex items-baseline gap-2">
              <span class="text-sm font-semibold">{{ t.name }}</span>
              <span class="mono text-muted-foreground">v{{ t.version }}</span>
              <span v-if="t.id === w.templateId" class="ml-auto inline-flex items-center gap-1 text-xs font-semibold text-primary"><Check class="size-4" aria-hidden="true" />Selected<template v-if="w.templates.length === 1"> (the only Template)</template></span>
            </span>
            <span class="text-sm text-ink-2">{{ t.description }}</span>
            <span class="mt-0.5 text-xs text-muted-foreground">Surfaces: {{ t.supportedSurfaces.map((surface) => SURFACE_COPY[surface].label).join(", ") }}</span>
          </label>
        </div>
      </div>
    </fieldset>

    <p v-if="!w.template" class="rounded-md border border-border bg-sunken px-3 py-2 text-sm text-ink-2">Choose a Template to see the styles it offers.</p>

    <fieldset v-else>
      <legend class="flex items-center gap-1 text-sm font-semibold text-ink-2">
        Style
        <HelpHint label="What is a style?">
          A style is a ready-made look for the visitor app: colours, fonts, corner shapes and spacing. Pick one now; it can be
          changed later in Visitor app settings.
        </HelpHint>
      </legend>
      <p class="mt-1 text-xs text-muted-foreground">Colours, fonts, corners and spacing of the visitor app. The one marked Recommended is selected for you; choose another if you prefer.</p>
      <div class="mt-2 flex flex-wrap items-start gap-6">
        <div class="flex min-w-[min(100%,20rem)] flex-[1_1_20rem] flex-col gap-3">
          <div class="grid grid-cols-[repeat(auto-fit,minmax(min(100%,7rem),1fr))] gap-2">
            <div v-for="p in w.template.stylePresets" :key="p.key" class="relative">
              <input :id="`preset-${p.key}`" type="radio" name="style" class="peer sr-only" :value="p.key" :checked="p.key === w.presetKey" @change="w.choosePreset(p.key)" />
              <label
                :for="`preset-${p.key}`"
                class="flex h-full cursor-pointer flex-col overflow-hidden rounded-lg border bg-card text-left"
                :class="[ring, p.key === w.presetKey ? 'border-primary' : 'border-input']"
                :title="presetSummary(p)"
              >
                <span class="flex w-full items-center gap-1 px-2 pb-2 pt-2" :style="{ background: p.primaryColor }">
                  <span class="text-base font-bold leading-none" :style="{ fontFamily: `'${fontFamily(p.headingFont)}', serif`, color: inkOn(p.primaryColor) }">Aa</span>
                  <span class="ml-auto flex gap-1" aria-hidden="true">
                    <span class="size-3 border border-border" :style="{ background: p.backgroundColor, borderRadius: p.cornerRadius === 'SHARP' ? '1px' : '999px' }"></span>
                    <span class="size-3 border border-border" :style="{ background: p.textColor, borderRadius: p.cornerRadius === 'SHARP' ? '1px' : '999px' }"></span>
                  </span>
                </span>
                <span class="flex w-full flex-col px-2 pb-2 pt-1.5" :class="p.key === w.presetKey ? 'bg-accent' : ''">
                  <span class="text-xs font-semibold">{{ p.name }}</span>
                  <span class="inline-flex items-center gap-1 text-xs" :class="p.key === w.presetKey ? 'font-semibold text-primary' : 'text-muted-foreground'">
                    <Check v-if="p.key === w.presetKey" class="size-3.5" aria-hidden="true" />
                    {{ p.key === w.presetKey ? "Selected" : p.suggested ? "Recommended" : "\u00a0" }}
                  </span>
                </span>
              </label>
            </div>
          </div>
          <p v-if="w.preset" class="text-sm text-ink-2">
            <strong class="font-semibold text-foreground">{{ w.preset.name }}</strong><template v-if="w.preset.suggested"> (Recommended)</template>: {{ presetSummary(w.preset) }}. {{ w.preset.description }}
          </p>
        </div>

        <figure v-if="w.preset" class="w-52 flex-none" aria-label="Preview of the Home Page in the chosen style">
          <div
            class="overflow-hidden border border-border shadow-1"
            :style="{ background: w.preset.backgroundColor, borderRadius: RADIUS[w.preset.cornerRadius]?.card === '0px' ? '2px' : '12px', fontFamily: `'${fontFamily(w.preset.bodyFont)}', sans-serif` }"
          >
            <div class="px-2.5 py-2" :style="{ background: w.preset.primaryColor, color: inkOn(w.preset.primaryColor) }">
              <span class="block truncate text-xs font-bold" :style="{ fontFamily: `'${fontFamily(w.preset.headingFont)}', serif` }">{{ projectName }}</span>
            </div>
            <div class="flex flex-col p-2.5" :style="{ gap: DENSITY[w.preset.density]?.gap, color: w.preset.textColor }">
              <span class="text-sm font-bold" :style="{ fontFamily: `'${fontFamily(w.preset.headingFont)}', serif` }">Home</span>
              <span
                v-for="n in 2"
                :key="n"
                class="block border border-border"
                :style="{ borderRadius: RADIUS[w.preset.cornerRadius]?.card, padding: DENSITY[w.preset.density]?.pad, background: w.preset.backgroundColor }"
              >
                <span class="block h-1.5 w-3/4 rounded-sm" :style="{ background: w.preset.textColor, opacity: 0.18 }"></span>
              </span>
              <span class="inline-block self-start rounded-full px-2 py-0.5 text-xs font-bold" :style="{ background: w.preset.secondaryColor, color: inkOn(w.preset.secondaryColor) }">Explore</span>
            </div>
          </div>
          <figcaption class="mt-1.5 text-xs text-muted-foreground">The Home Page in {{ w.preset.name }}, before any content.</figcaption>
        </figure>
      </div>
    </fieldset>
  </div>
</template>
