<script setup lang="ts">
/** Which language a Content list's search looks in (iGuide spec 12 section 3): every one, or one of the Project's. */
import type { ProjectLanguage } from "@/platform/languages";

defineProps<{ languages: ProjectLanguage[] }>();
const model = defineModel<string>({ required: true });
</script>

<template>
  <!-- A visible label, not only the first option (`14` §4, DECISIONS.md D-042). -->
  <label class="inline-flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground">
    Search in
    <select
      v-model="model"
      class="rounded-lg border-[1.5px] bg-card px-2.5 py-[9px] text-[12px] font-normal text-foreground focus:border-primary focus:outline-none"
    >
      <option value="">all languages</option>
      <option v-for="l in languages" :key="l.languageCode" :value="l.languageCode">{{ l.displayName }}</option>
    </select>
  </label>
</template>
