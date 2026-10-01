<script setup lang="ts">
import { onBeforeUnmount, ref, watch, type Ref } from "vue";
import { Button } from "@/components/ui/button";
import WorkspaceNav from "@/components/WorkspaceNav.vue";
import { ApiError } from "@/platform/api";
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
    if (e.status === 404 || e.status === 403) forgetProject(props.projectId);
  } finally {
    loading.value = false;
  }
}

watch(() => props.projectId, load, { immediate: true });
onBeforeUnmount(() => controller?.abort());
</script>

<template>
  <div class="flex min-w-0 flex-1 items-stretch">
    <WorkspaceNav v-if="project" :project-id="projectId" />

    <main v-if="loading" class="relative min-w-0 flex-1 overflow-y-auto px-7 pb-16 pt-6">
      <div class="animate-skeleton" aria-busy="true" aria-label="Loading Project workspace">
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

    <main v-else-if="error" class="relative min-w-0 flex-1 overflow-y-auto px-7 pb-16 pt-6">
      <div role="alert" class="max-w-[640px] rounded-lg border border-l-[3px] border-l-destructive bg-card px-[18px] py-4">
        <template v-if="error.status === 404">
          <strong class="block text-[13px] font-bold text-destructive">This Project is not available</strong>
          <p class="mt-1 text-[13px] text-gray-700">
            It no longer exists in the UNICHE Catalogue, or you are not a member of it.
          </p>
        </template>
        <template v-else-if="error.status === 403">
          <strong class="block text-[13px] font-bold text-destructive">Access denied</strong>
          <p class="mt-1 text-[13px] text-gray-700">The UNICHE Catalogue no longer admits you to this Project.</p>
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
