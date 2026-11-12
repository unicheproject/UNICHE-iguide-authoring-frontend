<script setup lang="ts">
/** Which language a Content list's search looks in (iGuide spec 12 section 3): every one, or one of the Project's. */
import type { ProjectLanguage } from "@/platform/languages";

defineProps<{ languages: ProjectLanguage[] }>();
const model = defineModel<string>({ required: true });
</script>

<template>
  <!-- A visible label, not only the first option (`14` §4, DECISIONS.md D-042). Lives in the list filter menu. -->
  <label class="flex flex-col gap-2">
    <span class="text-[11px] font-bold uppercase tracking-[0.06em] text-muted-foreground">Search in</span>
    <select
      v-model="model"
      class="w-full rounded-lg border-[1.5px] bg-card px-3 py-[8px] text-[13px] text-foreground focus:border-primary"
      :class="model ? 'border-primary font-semibold' : ''"
    >
      <option value="">All languages</option>
      <option v-for="l in languages" :key="l.languageCode" :value="l.languageCode">{{ l.displayName }}</option>
    </select>
  </label>
</template>
