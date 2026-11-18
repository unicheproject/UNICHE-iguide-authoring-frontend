<script setup lang="ts">
/** Step 4: everything that will be set up, in readable rows, each with a Change link back to its step. */
import { Button } from "@/components/ui/button";
import { SURFACE_COPY, type CreateProjectWizard, type StepKey } from "./useCreateProject";

defineProps<{ w: CreateProjectWizard }>();
defineEmits<{ change: [step: StepKey] }>();
</script>

<template>
  <div class="max-w-2xl">
    <p class="mb-4 text-sm text-ink-2">Check what will be set up. Initialization adds the Template's Categories and the style; the visitor app starts as Draft.</p>
    <dl class="divide-y divide-border rounded-lg border border-border bg-card text-sm">
      <div class="flex flex-wrap items-start gap-x-4 gap-y-1 px-4 py-3">
        <dt class="w-40 flex-none font-semibold text-ink-2">Project</dt>
        <dd class="min-w-0 flex-1">
          <span class="block break-words font-semibold">{{ w.created?.name }}</span>
          <span class="mono block break-all text-muted-foreground">{{ w.created?.slug }}</span>
          <span v-if="w.selectedOrgName" class="block text-xs text-muted-foreground">{{ w.selectedOrgName }}</span>
        </dd>
      </div>
      <div class="flex flex-wrap items-start gap-x-4 gap-y-1 px-4 py-3">
        <dt class="w-40 flex-none font-semibold text-ink-2">Template</dt>
        <dd class="flex min-w-0 flex-1 items-start gap-3">
          <div class="min-w-0 flex-1">{{ w.template?.name }} <span class="mono text-muted-foreground">v{{ w.template?.version }}</span></div>
          <Button variant="ghost" size="sm" @click="$emit('change', 'template')">Change<span class="sr-only"> template</span></Button>
        </dd>
      </div>
      <div class="flex flex-wrap items-start gap-x-4 gap-y-1 px-4 py-3">
        <dt class="w-40 flex-none font-semibold text-ink-2">Style</dt>
        <dd class="flex min-w-0 flex-1 items-start gap-3">
          <div class="min-w-0 flex-1">{{ w.preset?.name }}</div>
          <Button variant="ghost" size="sm" @click="$emit('change', 'template')">Change<span class="sr-only"> style</span></Button>
        </dd>
      </div>
      <div class="flex flex-wrap items-start gap-x-4 gap-y-1 px-4 py-3">
        <dt class="w-40 flex-none font-semibold text-ink-2">Languages</dt>
        <dd class="flex min-w-0 flex-1 items-start gap-3">
          <div class="min-w-0 flex-1">
            <ul v-if="w.chosenLanguages.length" class="flex flex-wrap gap-x-3 gap-y-1">
              <li v-for="l in w.chosenLanguages" :key="l.languageCode" :lang="l.languageCode"><bdi>{{ l.displayName }}</bdi><span v-if="l.languageCode === w.defaultLanguage" class="text-muted-foreground" lang="en"> (default)</span></li>
            </ul>
            <span v-else class="font-semibold text-destructive">None chosen</span>
          </div>
          <Button variant="ghost" size="sm" @click="$emit('change', 'languages')">Change<span class="sr-only"> languages</span></Button>
        </dd>
      </div>
      <div class="flex flex-wrap items-start gap-x-4 gap-y-1 px-4 py-3">
        <dt class="w-40 flex-none font-semibold text-ink-2">Surfaces</dt>
        <dd class="flex min-w-0 flex-1 items-start gap-3">
          <div class="min-w-0 flex-1">
            <template v-if="w.surfacesToSend.length">{{ w.surfacesToSend.map((s) => SURFACE_COPY[s].label).join(", ") }}</template>
            <span v-else class="font-semibold text-destructive">None chosen</span>
          </div>
          <Button variant="ghost" size="sm" @click="$emit('change', 'languages')">Change<span class="sr-only"> surfaces</span></Button>
        </dd>
      </div>
    </dl>
  </div>
</template>
