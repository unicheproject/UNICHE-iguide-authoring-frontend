<script setup lang="ts">
import { computed } from "vue";
import { Button } from "@/components/ui/button";
import { session } from "@/platform/auth";
import { formatDate, statusChipStyle } from "@/lib/format";
import { canCreateProjects, loadProjects, projectsState } from "@/stores/projects";

const firstName = computed(() => session.user?.displayName.split(" ")[0] ?? "");
const hasProjects = computed(() => projectsState.groups.some((g) => g.projects.length > 0));
</script>

<template>
  <main class="relative min-w-0 flex-1 overflow-y-auto px-7 pb-16 pt-6">
    <div class="mb-[22px] flex flex-wrap items-start gap-5">
      <div class="min-w-[min(100%,300px)] flex-1">
        <h1 class="text-2xl font-extrabold leading-tight tracking-[-0.01em]">Welcome, {{ firstName }}</h1>
        <p class="mt-1 max-w-[760px] text-[13px] text-muted-foreground">
          Choose a Project to work on. The UNICHE Catalogue decides which Projects you can open.
        </p>
      </div>
      <Button v-if="canCreateProjects" as-child>
        <RouterLink :to="{ name: 'project-create' }" class="text-primary-foreground no-underline hover:text-primary-foreground hover:no-underline">
          Create Project
        </RouterLink>
      </Button>
    </div>

    <div
      v-if="projectsState.status === 'loading' || projectsState.status === 'idle'"
      class="animate-skeleton"
      aria-busy="true"
      aria-label="Loading projects"
    >
      <div class="mb-3 h-2.5 w-[160px] rounded bg-[#e2e3e7]"></div>
      <div class="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-3.5">
        <div v-for="n in 3" :key="n" class="flex flex-col gap-2.5 rounded-[10px] border bg-card p-[18px]">
          <div class="h-[15px] w-3/4 rounded bg-[#dcdde2]"></div>
          <div class="h-[9px] w-1/2 rounded bg-[#e6e7eb]"></div>
        </div>
      </div>
    </div>

    <div
      v-else-if="projectsState.status === 'error' && projectsState.error"
      role="alert"
      class="max-w-[640px] rounded-lg border border-l-[3px] border-l-destructive bg-card px-[18px] py-4"
    >
      <strong class="block text-[13px] font-bold text-destructive">
        {{ projectsState.error.platformUnavailable ? "The UNICHE platform is not reachable" : "Your projects could not be loaded" }}
      </strong>
      <p class="mt-1 text-[13px] text-gray-700">{{ projectsState.error.message }}</p>
      <p v-if="projectsState.error.requestId" class="mt-1 font-mono text-[11px] text-muted-foreground">
        Request id {{ projectsState.error.requestId }}
      </p>
      <Button variant="outline" size="sm" class="mt-3" @click="loadProjects()">Try again</Button>
    </div>

    <template v-else>
      <div v-if="!hasProjects" class="max-w-[640px] rounded-[10px] border bg-card px-[18px] py-4">
        <strong class="block text-[13px] font-bold">No projects yet</strong>
        <p class="mt-1 text-[13px] text-muted-foreground">
          {{
            canCreateProjects
              ? "A Project holds one visitor application. Create the first one to start authoring."
              : "A manager of your organisation can create a Project or add you to one in the UNICHE Catalogue."
          }}
        </p>
      </div>

      <section
        v-for="group in projectsState.groups"
        v-show="group.projects.length"
        :key="group.organisation.id"
        class="mb-7"
        :aria-labelledby="`org-${group.organisation.id}`"
      >
        <div class="mb-2.5 flex items-center gap-2">
          <h2
            :id="`org-${group.organisation.id}`"
            class="whitespace-nowrap text-[9px] font-extrabold uppercase tracking-[0.16em] text-gray-400"
          >
            {{ group.organisation.name }}
          </h2>
          <span class="h-px flex-1 bg-gray-200"></span>
        </div>
        <ul class="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-3.5">
          <li v-for="project in group.projects" :key="project.id">
            <RouterLink
              :to="{ name: 'project', params: { projectId: project.id } }"
              class="flex h-full flex-col gap-1 rounded-[10px] border bg-card p-[18px] text-foreground no-underline hover:border-primary hover:text-foreground hover:no-underline"
            >
              <span class="flex items-start gap-2">
                <span class="min-w-0 flex-1 break-words text-[15px] font-bold">{{ project.name }}</span>
                <span
                  class="mt-0.5 rounded-full px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-[0.07em]"
                  :style="statusChipStyle(project.status)"
                >
                  {{ project.status }}
                </span>
              </span>
              <span class="break-words font-mono text-[11px] text-muted-foreground">{{ project.slug }}</span>
              <span class="mt-auto pt-2 text-[11px] text-muted-foreground">Updated {{ formatDate(project.updatedAt) }}</span>
            </RouterLink>
          </li>
        </ul>
      </section>
    </template>
  </main>
</template>
