<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { onClickOutside, onKeyStroke } from "@vueuse/core";
import { useRoute } from "vue-router";
import { formatDate, statusChipStyle } from "@/lib/format";
import {
  canCreateProjects,
  findOrganisation,
  findProject,
  loadProjects,
  projectsState,
} from "@/stores/projects";

const route = useRoute();
const open = ref(false);
const root = ref<HTMLElement | null>(null);

const currentId = computed(() =>
  typeof route.params.projectId === "string" ? route.params.projectId : null,
);
const current = computed(() => (currentId.value ? findProject(currentId.value) : undefined));
const currentOrg = computed(() => (current.value ? findOrganisation(current.value.orgId) : undefined));
const projectCount = computed(() => projectsState.groups.reduce((n, g) => n + g.projects.length, 0));

const subtitle = computed(() => {
  if (current.value) return `${currentOrg.value?.name ?? "Organisation"} · ${current.value.slug}`;
  if (projectsState.status === "loading") return "Loading projects…";
  if (projectsState.status === "error") return "Projects could not be loaded";
  return projectCount.value === 1 ? "1 project" : `${projectCount.value} projects`;
});

onClickOutside(root, () => {
  open.value = false;
});
onKeyStroke("Escape", () => {
  open.value = false;
});
watch(() => route.fullPath, () => {
  open.value = false;
});
</script>

<template>
  <div ref="root" class="relative ml-1.5 min-w-0 flex-[0_1_340px]">
    <button
      type="button"
      class="flex w-full items-center gap-2.5 overflow-hidden rounded-lg border px-3 py-1.5 text-left"
      :class="open ? 'bg-muted' : 'bg-card hover:bg-muted'"
      :aria-expanded="open"
      aria-controls="project-switcher-menu"
      @click="open = !open"
    >
      <span class="min-w-0 flex-1">
        <span class="block truncate text-[13px] font-bold text-foreground">
          {{ current?.name ?? "Select a project" }}
        </span>
        <span class="block truncate text-[10px] text-muted-foreground">{{ subtitle }}</span>
      </span>
      <span
        v-if="current"
        class="inline-flex items-center gap-[5px] rounded-full px-2 py-[3px] text-[9px] font-extrabold uppercase tracking-[0.07em]"
        :style="statusChipStyle(current.status)"
      >
        <span class="inline-block h-[5px] w-[5px] rounded-full bg-current"></span>{{ current.status }}
      </span>
      <span class="text-[10px] text-muted-foreground" aria-hidden="true">{{ open ? "▴" : "▾" }}</span>
    </button>

    <div
      v-if="open"
      id="project-switcher-menu"
      class="absolute left-0 top-[calc(100%+8px)] z-[80] max-h-[70vh] w-[340px] overflow-y-auto rounded-[10px] border bg-card shadow-[0_18px_44px_rgba(3,7,18,0.18)]"
    >
      <div v-if="projectsState.status === 'loading'" class="animate-skeleton px-3.5 py-3" aria-busy="true">
        <div class="mb-2 h-2.5 w-2/5 rounded bg-[#e6e7eb]"></div>
        <div class="mb-2 h-3 w-3/4 rounded bg-[#dcdde2]"></div>
        <div class="h-3 w-3/5 rounded bg-[#dcdde2]"></div>
        <span class="sr-only">Loading projects</span>
      </div>

      <div v-else-if="projectsState.status === 'error'" role="alert" class="px-3.5 py-3">
        <p class="text-xs font-bold text-destructive">
          {{
            projectsState.error?.platformUnavailable
              ? "The UNICHE platform is not reachable"
              : "Projects could not be loaded"
          }}
        </p>
        <p v-if="projectsState.error?.requestId" class="mt-0.5 font-mono text-[10px] text-muted-foreground">
          Request id {{ projectsState.error.requestId }}
        </p>
        <button type="button" class="mt-2 text-xs font-bold text-primary hover:underline" @click="loadProjects()">
          Try again
        </button>
      </div>

      <template v-else>
        <p v-if="!projectsState.groups.length" class="px-3.5 py-3 text-xs text-muted-foreground">
          The UNICHE Catalogue lists no organisations or projects for you yet.
        </p>
        <div v-for="group in projectsState.groups" :key="group.organisation.id">
          <div
            class="border-b bg-muted px-3.5 py-2 text-[9px] font-extrabold uppercase tracking-[0.12em] text-muted-foreground"
          >
            {{ group.organisation.name }}
          </div>
          <p v-if="!group.projects.length" class="border-b border-gray-100 px-3.5 py-2.5 text-[11px] text-muted-foreground">
            No projects yet.
          </p>
          <ul>
            <li v-for="project in group.projects" :key="project.id">
              <RouterLink
                :to="{ name: 'project', params: { projectId: project.id } }"
                class="block border-b border-l-[3px] border-b-gray-100 px-3.5 py-2.5 text-left no-underline hover:bg-muted hover:no-underline"
                :class="project.id === currentId ? 'border-l-primary bg-primary/[0.06]' : 'border-l-transparent'"
                :aria-current="project.id === currentId ? 'page' : undefined"
              >
                <span class="flex items-center gap-1.5">
                  <span class="min-w-0 flex-1 break-words text-xs font-bold text-foreground">{{ project.name }}</span>
                  <span
                    class="rounded-full px-1.5 py-0.5 text-[8px] font-extrabold uppercase tracking-[0.07em]"
                    :style="statusChipStyle(project.status)"
                  >
                    {{ project.status }}
                  </span>
                </span>
                <span class="mt-0.5 block break-words text-[10px] text-muted-foreground">
                  {{ project.slug }} · updated {{ formatDate(project.updatedAt) }}
                </span>
              </RouterLink>
            </li>
          </ul>
        </div>
      </template>

      <RouterLink
        v-if="canCreateProjects"
        :to="{ name: 'project-create' }"
        class="block bg-card px-3.5 py-3 text-left text-xs font-bold text-primary no-underline hover:bg-muted hover:no-underline"
      >
        + Create Project
      </RouterLink>
    </div>
  </div>
</template>
