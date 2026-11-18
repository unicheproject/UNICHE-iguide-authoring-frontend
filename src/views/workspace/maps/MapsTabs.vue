<script setup lang="ts">
/**
 * The Maps / Floor plans tab strip with the number of each (C1-100). The counts are read once per visit; a failed read
 * leaves a tab without its count rather than blocking the page.
 */
import { ref, watch } from "vue";
import { LinkTabs } from "@/components/ui/tabs";
import { countFloorPlans } from "@/platform/floorPlans";
import { countMaps } from "@/platform/maps";
import { sectionLocation } from "@/workspace/sections";

const props = defineProps<{ projectId: string; section: "maps" | "floor-plans"; mapsCount?: number | null; plansCount?: number | null }>();
const maps = ref<number | null>(null);
const plans = ref<number | null>(null);

watch(
  () => props.projectId,
  (id) => {
    countMaps(id).then((n) => (maps.value = n), () => (maps.value = null));
    countFloorPlans(id).then((n) => (plans.value = n), () => (plans.value = null));
  },
  { immediate: true },
);
</script>

<template>
  <LinkTabs
    label="Sections"
    :current="section"
    :tabs="[
      { key: 'maps', label: 'Maps', to: sectionLocation(projectId, 'maps'), count: mapsCount ?? maps },
      { key: 'floor-plans', label: 'Floor plans', to: sectionLocation(projectId, 'floor-plans'), count: plansCount ?? plans },
    ]"
  />
</template>
