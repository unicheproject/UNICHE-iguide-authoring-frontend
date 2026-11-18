<script setup lang="ts">
/**
 * Step 3: languages (one is the default, chosen with a radio group) and surfaces (switches). Each language row names the
 * language in its own script with `lang`; adding and removing are announced.
 */
import { Plus, X } from "lucide-vue-next";
import { Button } from "@/components/ui/button";
import { HelpHint } from "@/components/ui/help-hint";
import Switch from "@/components/ui/switch/Switch.vue";
import { KNOWN_LANGUAGES } from "@/lib/languageCatalogue";
import { FIELD_IDS, SURFACE_COPY, type CreateProjectWizard } from "./useCreateProject";

defineProps<{ w: CreateProjectWizard }>();
const englishName = (code: string) => KNOWN_LANGUAGES.find((k) => k.code === code)?.englishName ?? null;
</script>

<template>
  <div class="grid gap-8 md:grid-cols-2">
    <fieldset :id="FIELD_IDS.defaultLanguage" tabindex="-1" class="min-w-0 outline-none">
      <legend class="flex items-center gap-1 text-sm font-semibold text-ink-2">
        Languages
        <HelpHint label="What is the default language?">
          The default language is the one every text needs before content can go live. Other languages can be completed later. The
          default language cannot be removed afterwards.
        </HelpHint>
      </legend>
      <p class="mt-1 text-xs" :class="w.chosenLanguages.length && !w.defaultLanguage ? 'font-semibold text-destructive' : 'text-muted-foreground'">
        {{ w.chosenLanguages.length && !w.defaultLanguage ? "Required: choose which one is the default language." : "Choose which one is the default language." }}
      </p>
      <!-- A default the author did not pick is said, once, with the way to change it (C3-95). -->
      <p v-if="w.defaultOrigin && w.defaultLanguage" class="mt-1 text-xs text-muted-foreground">
        <bdi>{{ w.defaultLanguageName }}</bdi> is the default language because
        {{ w.defaultOrigin === "template" ? `the Template ${w.template?.name ?? ""} marks it` : "it is the only language so far" }}. To change it, choose another below.
      </p>
      <ul class="mt-2 flex flex-col gap-2">
        <li v-for="l in w.chosenLanguages" :key="l.languageCode" class="flex items-center gap-1 rounded-lg border border-border bg-card pl-3">
          <label class="flex min-h-control min-w-0 flex-1 cursor-pointer items-center gap-3 py-1">
            <input type="radio" name="default-language" class="size-4 flex-none accent-primary" :value="l.languageCode" :checked="l.languageCode === w.defaultLanguage" @change="w.makeDefault(l.languageCode)" />
            <span class="min-w-0">
              <span class="block break-words text-sm font-semibold" :lang="l.languageCode" :dir="l.direction === 'RTL' ? 'rtl' : undefined"><bdi>{{ l.displayName }}</bdi></span>
              <span class="block text-xs text-muted-foreground">{{ l.languageCode === w.defaultLanguage ? "Default language" : "Make default" }}<template v-if="englishName(l.languageCode)"> · {{ englishName(l.languageCode) }}</template></span>
            </span>
          </label>
          <Button variant="ghost" size="icon" :label="`Remove ${l.displayName}`" @click="w.removeLanguage(l.languageCode)"><X /></Button>
        </li>
      </ul>
      <p v-if="!w.chosenLanguages.length" class="mt-2 text-sm text-muted-foreground">No language yet. Add at least one below.</p>
      <div class="mt-3 flex gap-2">
        <label for="add-language" class="sr-only">Add a language</label>
        <select :id="FIELD_IDS.languages" v-model="w.addLanguageCode" class="ui-field min-w-0 flex-1">
          <option value="">Add a language</option>
          <option v-for="k in w.addableLanguages" :key="k.code" :value="k.code">{{ k.displayName }} ({{ k.englishName }})</option>
        </select>
        <Button variant="secondary" :disabled="!w.addLanguageCode" @click="w.addLanguage()"><Plus />Add</Button>
      </div>
    </fieldset>

    <fieldset v-if="w.template" :id="FIELD_IDS.surfaces" tabindex="-1" class="min-w-0 outline-none">
      <legend class="flex items-center gap-1 text-sm font-semibold text-ink-2">
        Surfaces
        <HelpHint label="What is a surface?">
          A surface is where visitors use the app: Web is a browser, Mobile an installable app, Kiosk a fixed screen in the venue.
          Turn on the ones you will use; you can change this later in Visitor app, Surfaces.
        </HelpHint>
      </legend>
      <p class="mt-1 text-xs text-muted-foreground">{{ w.template.name }} supports {{ w.template.supportedSurfaces.map((s) => SURFACE_COPY[s].label).join(", ") }}. Recommended: all on, so every surface can be previewed; turn off the ones you will not use.</p>
      <ul class="mt-2 flex flex-col gap-2">
        <li v-for="s in w.template.supportedSurfaces" :key="s" class="rounded-lg border border-border bg-card px-3">
          <Switch :model-value="w.chosenSurfaces.has(s)" :description="SURFACE_COPY[s].note" @update:model-value="(on: boolean) => w.setSurface(s, on)">{{ SURFACE_COPY[s].label }}</Switch>
        </li>
      </ul>
    </fieldset>
  </div>
</template>
