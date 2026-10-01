<script setup lang="ts">
/** The tab strip of a menu item that groups several sections, such as App settings (mockup `sectionTabs`). */
import { computed } from "vue";
import { sectionLocation, tabsOf } from "@/workspace/sections";

const props = defineProps<{ projectId: string; section: string }>();
const group = computed(() => tabsOf(props.section));
</script>

<template>
  <nav v-if="group" class="mb-5 flex border-b-2" aria-label="Sections">
    <RouterLink
      v-for="tab in group.tabs"
      :key="tab.slug"
      :to="sectionLocation(projectId, tab.slug)"
      :aria-current="tab.slug === section ? 'page' : undefined"
      class="-mb-0.5 border-b-2 px-5 py-2.5 text-xs font-bold uppercase tracking-[0.05em] no-underline"
      :class="tab.slug === section ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'"
    >
      {{ tab.label }}
    </RouterLink>
  </nav>
</template>
