<script setup lang="ts">
/** The tab strip of a menu item that groups several sections, such as App settings or Maps & Floor plans. */
import { computed } from "vue";
import { LinkTabs } from "@/components/ui/tabs";
import { sectionLocation, tabsOf } from "@/workspace/sections";

const props = defineProps<{ projectId: string; section: string }>();
const group = computed(() => tabsOf(props.section));
const tabs = computed(() => group.value?.tabs.map((tab) => ({ key: tab.slug, label: tab.label, to: sectionLocation(props.projectId, tab.slug) })) ?? []);
</script>

<template>
  <LinkTabs v-if="group" label="Sections" :tabs="tabs" :current="section" />
</template>
