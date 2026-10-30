<script setup lang="ts">
/** Which language a Content list's search looks in (iGuide spec 12 section 3): every one, or one of the Project's. */
import type { ProjectLanguage } from "@/platform/languages";

defineProps<{ languages: ProjectLanguage[] }>();
const model = defineModel<string>({ required: true });
</script>

<template>
  <select
    v-model="model"
    aria-label="Search in"
    class="rounded-lg border-[1.5px] bg-card px-2.5 py-[9px] text-[12px] focus:border-primary focus:outline-none"
  >
    <option value="">in all languages</option>
    <option v-for="l in languages" :key="l.languageCode" :value="l.languageCode">in {{ l.displayName }}</option>
  </select>
</template>
