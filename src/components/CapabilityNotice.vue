<script setup lang="ts">
/**
 * "Events are switched off for this Project. [Turn on in Features]": the notice under the page head of a section whose
 * capability is off (`12` §3, D-049, D-073). Renders nothing when the capability is on or the settings are not loaded.
 */
import { computed } from "vue";
import { useRoute } from "vue-router";
import { Alert } from "@/components/ui/alert";
import { sectionOff, useProjectSettings } from "@/workspace/projectSettings";
import { findSection, sectionLocation } from "@/workspace/sections";

const props = defineProps<{ section: string }>();
const route = useRoute();
const projectId = computed(() => String(route.params.projectId ?? ""));
const settings = useProjectSettings(projectId);
const off = computed(() => sectionOff(settings.value ?? null, props.section));
const title = computed(() => findSection(props.section)?.title ?? props.section);
</script>

<template>
  <Alert v-if="off" tone="info" role="status" class="mb-4">
    {{ title }} are switched off for this Project, for visitors.
    <RouterLink :to="sectionLocation(projectId, 'features')" class="font-semibold">Turn on in Features</RouterLink>
  </Alert>
</template>
