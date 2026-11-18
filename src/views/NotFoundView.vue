<script setup lang="ts">
/**
 * "Page not found" (C2-13): an address the CMS does not know, or a Project id that is not a Project id. One full-page
 * state with its heading focused on arrival and one next step: the Dashboard when the address is inside a Project,
 * the Project list otherwise. It never redirects silently, so a mistyped address is not mistaken for a working one.
 */
import { FileQuestion } from "lucide-vue-next";
import { computed } from "vue";
import { useRoute } from "vue-router";
import PageFrame from "@/components/PageFrame.vue";
import { Button } from "@/components/ui/button";
import { StateCard } from "@/components/ui/state-card";

const route = useRoute();
const projectId = computed(() => (typeof route.params.projectId === "string" ? route.params.projectId : null));
</script>

<template>
  <PageFrame narrow>
    <StateCard title="Page not found" :icon="FileQuestion">
      <p>The address may be mistyped, or the page was moved. Nothing was changed.</p>
      <template #actions>
        <Button v-if="projectId" as-child>
          <RouterLink :to="{ name: 'project', params: { projectId } }" class="no-underline">Go to the Dashboard</RouterLink>
        </Button>
        <Button as-child :variant="projectId ? 'secondary' : 'primary'">
          <RouterLink :to="{ name: 'home' }" class="no-underline">Choose a Project</RouterLink>
        </Button>
      </template>
    </StateCard>
  </PageFrame>
</template>
