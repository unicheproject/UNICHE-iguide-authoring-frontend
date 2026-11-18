<script setup lang="ts">
/**
 * Home = the Project picker (`12` §4, D-084): a searchable list shared with the header switcher, a "Continue to <last
 * Project>" shortcut when this browser remembers one the author can still open, and Create Project for managers. Sign-in
 * still lands here; nothing opens by itself.
 */
import { ArrowRight, Plus } from "lucide-vue-next";
import { computed } from "vue";
import PageFrame from "@/components/PageFrame.vue";
import PageHead from "@/components/PageHead.vue";
import ProjectList from "@/components/ProjectList.vue";
import { Button } from "@/components/ui/button";
import { offlineReason } from "@/stores/connection";
import { canCreateProjects, findProject, needsSetup, projectsState } from "@/stores/projects";
import { lastProjectId } from "@/workspace/lastProject";

const last = computed(() => {
  const id = lastProjectId();
  const project = id ? findProject(id) : undefined;
  return project && !needsSetup(project) ? project : undefined;
});
</script>

<template>
  <PageFrame narrow :busy="projectsState.status === 'loading'">
    <PageHead title="Projects" subtitle="Choose a Project to work on. You see the Projects the UNICHE Catalogue gives you access to.">
      <template v-if="canCreateProjects" #actions>
        <Button as-child variant="secondary" :disabled-reason="offlineReason()">
          <RouterLink :to="{ name: 'project-create' }" class="no-underline"><Plus />Create Project</RouterLink>
        </Button>
      </template>
    </PageHead>

    <section v-if="last" aria-labelledby="continue-heading" class="mb-6 flex flex-wrap items-center gap-x-4 gap-y-3 rounded-lg border border-border bg-card p-4 shadow-1">
      <div class="min-w-[min(100%,14rem)] flex-1">
        <h2 id="continue-heading" class="text-sm font-semibold">Pick up where you left off</h2>
        <p class="mt-0.5 text-sm text-muted-foreground">Open the Project you used last in this browser.</p>
      </div>
      <Button as-child>
        <RouterLink :to="{ name: 'project', params: { projectId: last.id } }" class="no-underline">
          Continue to {{ last.name }}<ArrowRight />
        </RouterLink>
      </Button>
    </section>

    <ProjectList variant="page" :omit-recent-id="last?.id" />
  </PageFrame>
</template>
