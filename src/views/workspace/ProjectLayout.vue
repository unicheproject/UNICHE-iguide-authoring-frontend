<script setup lang="ts">
import { onBeforeUnmount, ref, watch, type Ref } from "vue";
import { Button } from "@/components/ui/button";
import WorkspaceNav from "@/components/WorkspaceNav.vue";
import { ApiError, onProjectPathNotFound } from "@/platform/api";
import { platformConfig } from "@/platform/auth";
import { fetchProject, type Project } from "@/platform/catalogue";
import { forgetProject, upsertProject } from "@/stores/projects";
import { provideCurrentProject } from "@/workspace/currentProject";

const props = defineProps<{ projectId: string }>();

const project = ref<Project | null>(null);
const error = ref<ApiError | null>(null);
const loading = ref(true);
let controller: AbortController | null = null;

// Pages below only render once the access check has succeeded, so they always see a Project.
provideCurrentProject(project as Readonly<Ref<Project>>);

async function load() {
  controller?.abort();
  controller = new AbortController();
  loading.value = true;
  error.value = null;
  project.value = null;
  try {
    // The backend asks the Catalogue whether the caller may open this Project before answering.
    project.value = await fetchProject(props.projectId, controller.signal);
    upsertProject(project.value);
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") return;
    if (!(e instanceof ApiError)) throw e;
    error.value = e;
    // Only a 404 means the Project is gone for the caller; a 403 is a manager-only refusal (`07` §15).
    if (e.status === 404) forgetProject(props.projectId);
  } finally {
    loading.value = false;
  }
}

watch(() => props.projectId, load, { immediate: true });

/*
 * A `404` anywhere under the open Project may mean the caller lost it: no longer a member, or the Project deleted in
 * the Catalogue (`07` §15, `12` §6). The Project is read again; only a `404` there closes the workspace, so a
 * Resource that is merely missing keeps its own message (DECISIONS.md D-041).
 */
let rechecking = false;
async function recheck(projectId: string) {
  if (projectId !== props.projectId || !project.value || rechecking) return;
  rechecking = true;
  try {
    await fetchProject(projectId);
  } catch (e) {
    if (e instanceof ApiError && e.status === 404 && projectId === props.projectId) {
      controller?.abort();
      project.value = null;
      error.value = e;
      forgetProject(projectId);
    }
  } finally {
    rechecking = false;
  }
}
const stopListening = onProjectPathNotFound((projectId) => void recheck(projectId));

const portalUrl = platformConfig().portalUrl;

onBeforeUnmount(() => {
  controller?.abort();
  stopListening();
});
</script>

<template>
  <!-- Fills the shell below the header: the menu column and the page's <main> each scroll on their own (D-062). -->
  <div class="flex min-h-0 min-w-0 flex-1 flex-col items-stretch md:flex-row">
    <WorkspaceNav v-if="project" :project-id="projectId" />

    <main v-if="loading" class="relative min-w-0 flex-1 overflow-y-auto px-4 pb-16 pt-6 md:px-7">
      <div class="animate-skeleton" role="status" aria-busy="true" aria-label="Loading Project workspace">
        <div class="mb-[26px] flex flex-col gap-[11px]">
          <div class="h-2.5 w-[130px] rounded bg-[#e2e3e7]"></div>
          <div class="h-[25px] w-[min(55%,340px)] rounded-md bg-[#dcdde2]"></div>
          <div class="h-3 w-[min(78%,520px)] rounded bg-[#e6e7eb]"></div>
        </div>
        <div class="grid grid-cols-[repeat(auto-fill,minmax(190px,1fr))] gap-3.5">
          <div v-for="n in 4" :key="n" class="flex flex-col gap-2.5 rounded-[10px] border bg-card p-[18px]">
            <div class="h-[9px] w-3/5 rounded bg-[#e6e7eb]"></div>
            <div class="h-[22px] w-2/5 rounded-[5px] bg-[#dcdde2]"></div>
          </div>
        </div>
      </div>
    </main>

    <main v-else-if="error" class="relative min-w-0 flex-1 overflow-y-auto px-4 pb-16 pt-6 md:px-7">
      <div role="alert" class="max-w-[640px] rounded-lg border border-l-[3px] border-l-destructive bg-card px-[18px] py-4">
        <template v-if="error.status === 404">
          <strong class="block text-[13px] font-bold text-destructive">This Project is not available</strong>
          <p class="mt-1 text-[13px] text-gray-700">
            It was not found: it no longer exists in the UNICHE Catalogue, or you are no longer a member of it. It
            has been removed from your list of projects. A deleted Project can be restored, and membership asked for,
            in the
            <a v-if="portalUrl" :href="portalUrl" target="_blank" rel="noopener" class="font-semibold text-primary">UNICHE Platform Portal</a>
            <template v-else>UNICHE Platform Portal</template>.
          </p>
        </template>
        <template v-else-if="error.status === 403">
          <strong class="block text-[13px] font-bold text-destructive">Access denied</strong>
          <p class="mt-1 text-[13px] text-gray-700">
            The UNICHE Catalogue refused this. Only organization managers may do it; ask one of them, or go back to your
            projects.
          </p>
        </template>
        <template v-else>
          <strong class="block text-[13px] font-bold text-destructive">
            {{ error.platformUnavailable ? "The UNICHE platform is not reachable" : "The Project could not be loaded" }}
          </strong>
          <p class="mt-1 text-[13px] text-gray-700">
            {{ error.platformUnavailable ? "Access cannot be verified right now. Nothing has changed." : error.message }}
          </p>
        </template>
        <p v-if="error.requestId" class="mt-1 font-mono text-[11px] text-muted-foreground">Request id {{ error.requestId }}</p>
        <div class="mt-3 flex gap-2.5">
          <Button v-if="error.status !== 404 && error.status !== 403" variant="outline" size="sm" @click="load">
            Try again
          </Button>
          <Button as-child variant="outline" size="sm">
            <RouterLink :to="{ name: 'home' }" class="no-underline hover:no-underline">All projects</RouterLink>
          </Button>
        </div>
      </div>
    </main>

    <RouterView v-else-if="project" />
  </div>
</template>
