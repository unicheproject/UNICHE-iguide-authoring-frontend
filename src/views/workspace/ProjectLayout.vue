<script setup lang="ts">
/**
 * The workspace of one Project: the access check, the left menu and the page. The menu and a page skeleton render as
 * soon as the route names a Project, so nothing jumps 232 px when it loads (D-084); the menu is `inert` and the page
 * skeleton mirrors the page the route leads to (Dashboard, list or editor) and announces "Loading <page>" (D-097, C2-21).
 * A Project that cannot be opened
 * shows one full-page state (403, 404, platform unreachable, other) with the request id and one next step.
 */
import { CloudOff, FolderX, Lock, TriangleAlert } from "lucide-vue-next";
import { computed, onBeforeUnmount, ref, watch, type Ref } from "vue";
import PageFrame from "@/components/PageFrame.vue";
import WorkspaceNav from "@/components/WorkspaceNav.vue";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StateCard } from "@/components/ui/state-card";
import { describeError } from "@/lib/errors";
import { ApiError, onProjectPathNotFound } from "@/platform/api";
import { platformConfig } from "@/platform/auth";
import { fetchProject, type Project } from "@/platform/catalogue";
import { forgetProject, loadProjects, markDetailFailed, upsertProject } from "@/stores/projects";
import { useRoute } from "vue-router";
import { useHeldTitle } from "@/views/heldTitle";
import { provideCurrentProject } from "@/workspace/currentProject";
import { findSection } from "@/workspace/sections";
import { forgetRecentProject, rememberProject } from "@/workspace/lastProject";

const props = defineProps<{ projectId: string }>();

const route = useRoute();
/** Which page the skeleton imitates, and what it announces. */
const skeletonKind = computed<"dashboard" | "list" | "editor" | "generic">(() => {
  if (route.name === "project") return "dashboard";
  if (String(route.name ?? "").endsWith("-editor")) return "editor";
  return route.meta.section || route.params.section ? "list" : "generic";
});
/** The page heading the route is known to show (the Dashboard, a list); an editor's is its record's name, so it has none yet. */
const knownTitle = computed<string | null>(() => {
  if (skeletonKind.value === "editor") return null;
  if (typeof route.meta.title === "string") return route.meta.title;
  const slug = (route.meta.section ?? route.params.section) as string | undefined;
  return (slug ? findSection(slug)?.title : undefined) ?? null;
});
const loadingName = computed(() => {
  if (typeof route.meta.title === "string") return route.meta.title.toLowerCase();
  const slug = (route.meta.section ?? route.params.section) as string | undefined;
  const title = slug ? findSection(slug)?.title : undefined;
  return skeletonKind.value === "editor" && title ? `${title} editor` : (title ?? "page");
});

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
    rememberProject(project.value.id);
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") return;
    if (!(e instanceof ApiError)) throw e;
    error.value = e;
    markDetailFailed(props.projectId);
    // A 404 means the Project is gone for the caller (`07` §15): it leaves the picker, and the list is read again so
    // the picker and the header agree with the Catalogue.
    if (e.status === 404) dropFromPicker(props.projectId);
  } finally {
    loading.value = false;
  }
}

function dropFromPicker(projectId: string) {
  forgetProject(projectId);
  forgetRecentProject(projectId);
  void loadProjects();
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
      dropFromPicker(projectId);
    }
  } finally {
    rechecking = false;
  }
}
const stopListening = onProjectPathNotFound((projectId) => void recheck(projectId));

const portalUrl = platformConfig().portalUrl;

/** The state card's kind: what the author reads, one next step each. */
const state = computed(() => {
  const e = error.value;
  if (!e) return null;
  if (e.status === 404) return { kind: "not-found", title: "This Project is not available", icon: FolderX };
  if (e.status === 403) return { kind: "denied", title: "You no longer have access to this Project", icon: Lock };
  // 502, 503 and 504 and a network failure each have one sentence in `lib/errors.ts`; "not reachable" is for the network only (D-105).
  const text = describeError(e, "open this Project");
  if (e.platformUnavailable || e.backendUnreachable) return { kind: "unreachable", title: text.title, icon: CloudOff };
  return { kind: "other", title: "This Project could not be opened", icon: TriangleAlert };
});
const failureBody = computed(() => (error.value ? describeError(error.value, "open this Project").body : ""));

// The page title follows the state; the route announcer would otherwise leave "Dashboard" on it.
useHeldTitle(computed(() => state.value?.title ?? null));

onBeforeUnmount(() => {
  controller?.abort();
  stopListening();
});
</script>

<template>
  <!-- Fills the shell below the header: the menu column and the page's <main> each scroll on their own (D-062). -->
  <div class="flex min-h-0 min-w-0 flex-1 flex-col items-stretch nav:flex-row">
    <WorkspaceNav v-if="!error" :project-id="projectId" :pending="loading" />

    <PageFrame v-if="loading" busy>
      <div role="status" aria-busy="true">
        <span class="sr-only">Loading {{ loadingName }}</span>
        <!-- The head takes the real page head's boxes (26 px title line, 4 px, 21 px subtitle line, 24 px below), so the page does not move when it arrives. It is not a heading: the route announcer waits for the real one. -->
        <div class="mb-6" aria-hidden="true">
          <p class="text-lg font-bold">
            <template v-if="knownTitle">{{ knownTitle }}</template>
            <span v-else class="inline-block w-[min(55%,20rem)] animate-skeleton rounded-md bg-muted align-top">&nbsp;</span>
          </p>
          <p class="mt-1 text-sm"><span class="inline-block w-[min(78%,32rem)] animate-skeleton rounded-md bg-muted align-top">&nbsp;</span></p>
        </div>
        <div v-if="skeletonKind === 'dashboard'" class="grid grid-cols-[repeat(auto-fill,minmax(12rem,1fr))] gap-4" aria-hidden="true">
          <Skeleton v-for="n in 4" :key="n" class="h-24 rounded-lg" />
          <Skeleton class="col-span-full h-48 rounded-lg" />
        </div>
        <!-- A list: the card, its 57 px toolbar, the 48 px header and rows at the real 81 px. -->
        <div v-else-if="skeletonKind === 'list'" class="overflow-hidden rounded-lg border border-border bg-card" aria-hidden="true">
          <div class="flex h-14 items-center gap-3 border-b border-border px-3"><Skeleton class="h-10 w-72 max-w-full" /><Skeleton class="h-10 w-24" /></div>
          <div class="h-12 border-b border-border bg-muted"></div>
          <div v-for="n in 6" :key="n" class="flex h-20 items-center border-b border-border px-3 last:border-b-0"><Skeleton class="h-4 w-[min(60%,24rem)]" /></div>
        </div>
        <div v-else-if="skeletonKind === 'editor'" class="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]" aria-hidden="true">
          <div class="flex flex-col gap-4"><Skeleton class="h-40 rounded-lg" /><Skeleton class="h-64 rounded-lg" /></div>
          <div class="flex flex-col gap-4"><Skeleton class="h-32 rounded-lg" /><Skeleton class="h-32 rounded-lg" /></div>
        </div>
        <div v-else class="grid grid-cols-[repeat(auto-fill,minmax(12rem,1fr))] gap-4" aria-hidden="true">
          <Skeleton v-for="n in 4" :key="n" class="h-24 rounded-lg" />
        </div>
      </div>
    </PageFrame>

    <PageFrame v-else-if="error && state" narrow>
      <StateCard :title="state.title" :icon="state.icon" :request-id="error.requestId">
        <template v-if="state.kind === 'not-found'">
          <p>
            It no longer exists in the UNICHE Catalogue, or you are not a member of it any more. It has been taken out of
            your list of Projects.
          </p>
          <p class="mt-2">
            A deleted Project can be restored, and membership asked for, in the
            <a v-if="portalUrl" :href="portalUrl" target="_blank" rel="noopener">UNICHE Platform Portal</a><template v-else>UNICHE Platform Portal</template>.
          </p>
        </template>
        <p v-else-if="state.kind === 'denied'">
          Your account is not a member of this Project, or your membership was removed. Ask a Project manager to add you,
          or choose another Project. Your unsaved edits stay in this browser.
        </p>
        <p v-else>{{ failureBody }}</p>
        <template #actions>
          <Button v-if="state.kind === 'unreachable' || state.kind === 'other'" @click="load">Try again</Button>
          <Button as-child :variant="state.kind === 'unreachable' || state.kind === 'other' ? 'secondary' : 'primary'">
            <RouterLink :to="{ name: 'home' }" class="no-underline">Choose another Project</RouterLink>
          </Button>
        </template>
      </StateCard>
    </PageFrame>

    <RouterView v-else-if="project" />
  </div>
</template>
