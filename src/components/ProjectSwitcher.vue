<script setup lang="ts">
/**
 * The header Project switcher (D-084): a button naming the open Project and its Application status, opening a popover
 * with the shared searchable `ProjectList` (search focused, current Project in view, arrow keys, Esc returns focus to
 * the button). Choosing a Project closes the popover first, so the "Leave without saving?" confirmation is the only
 * layer on screen (C1-56). The footer offers Create Project to managers and "Manage members" when a Portal is set.
 */
import { ChevronsUpDown, ExternalLink, Plus } from "lucide-vue-next";
import { computed, onBeforeUnmount, onMounted, onUpdated, ref, watch } from "vue";
import { useRoute } from "vue-router";
import ProjectList from "@/components/ProjectList.vue";
import StatusChip from "@/components/StatusChip.vue";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { statusWord } from "@/lib/glossary";
import { platformConfig } from "@/platform/auth";
import { offlineReason } from "@/stores/connection";
import { canCreateProjects, detailState, findProject, projectsState } from "@/stores/projects";

// The popover root renders no element of its own, so the header's layout classes would have nowhere to go.
defineOptions({ inheritAttrs: false });

const route = useRoute();
const open = ref(false);
const portalUrl = platformConfig().portalUrl;

const currentId = computed(() => (typeof route.params.projectId === "string" ? route.params.projectId : null));
const current = computed(() => (currentId.value ? findProject(currentId.value) : undefined));
const appStatus = computed(() => (current.value?.detailed && current.value.initialized ? current.value.applicationStatus : null));
const label = computed(() => {
  if (current.value) return current.value.name;
  if (projectsState.status === "loading" || projectsState.status === "idle") return "Loading projects";
  return "Choose a project";
});

// The chip's skeleton shows only while the Project's detail is being read, and for 3 s at most; a failed read or an
// error page shows nothing, so the header never waits for a status that is not coming (C2-25, W0-A request).
const SKELETON_MS = 3000;
const skeletonExpired = ref(false);
let skeletonTimer: ReturnType<typeof setTimeout> | undefined;
const chipLoading = computed(() => !!currentId.value && !skeletonExpired.value && detailState(currentId.value) === "loading" && route.name !== "not-found" && route.name !== "project-not-found");
watch(
  currentId,
  () => {
    clearTimeout(skeletonTimer);
    skeletonExpired.value = false;
    skeletonTimer = setTimeout(() => (skeletonExpired.value = true), SKELETON_MS);
  },
  { immediate: true },
);
onBeforeUnmount(() => clearTimeout(skeletonTimer));

// While the popover is closed the library points `aria-controls` at nothing (an empty id, axe `aria-valid-attr-value`):
// the attribute is dropped until the popover has content to control (C3-92).
const trigger = ref<HTMLElement | null>(null);
function dropEmptyControls() {
  if (trigger.value?.getAttribute("aria-controls") === "") trigger.value.removeAttribute("aria-controls");
}
onMounted(dropEmptyControls);
onUpdated(dropEmptyControls);

watch(() => route.fullPath, () => {
  open.value = false;
});
</script>

<template>
  <Popover v-model:open="open">
    <PopoverTrigger as-child>
      <button
        ref="trigger"
        type="button"
        class="flex min-h-control w-auto min-w-0 max-w-[26rem] items-center gap-2 rounded-md border border-input bg-card px-3 text-left hover:bg-surface-hover"
        :class="open ? 'bg-surface-hover' : ''"
      >
        <span class="min-w-0 flex-1 truncate text-sm font-semibold" :title="current?.name">{{ label }}</span>
        <StatusChip v-if="appStatus" :status="appStatus" :label="`Visitor app: ${statusWord(appStatus)}`" class="hidden lg:inline-flex" />
        <span v-else-if="chipLoading" role="status" aria-label="Loading app status" class="hidden h-6 w-24 flex-none animate-skeleton rounded-full bg-muted lg:inline-block"></span>
        <span class="sr-only">{{ current ? ". Switch project" : "" }}</span>
        <ChevronsUpDown class="size-4 flex-none text-muted-foreground" aria-hidden="true" />
      </button>
    </PopoverTrigger>
    <PopoverContent class="flex max-h-[calc(100dvh-8rem)] w-[min(26rem,calc(100vw-1rem))] flex-col p-0" align="start" role="dialog" aria-label="Switch project">
      <ProjectList variant="popover" :current-id="currentId" @navigate="open = false" />
      <div v-if="canCreateProjects || (portalUrl && current)" class="flex flex-wrap gap-2 border-t border-border p-3">
        <span v-if="offlineReason()" id="switcher-offline" class="sr-only">{{ offlineReason() }}</span>
        <Button v-if="canCreateProjects" as-child variant="secondary" size="sm" :disabled-reason="offlineReason()">
          <RouterLink :to="{ name: 'project-create' }" class="no-underline" :aria-describedby="offlineReason() ? 'switcher-offline' : undefined" @click="open = false"><Plus />Create Project</RouterLink>
        </Button>
        <Button v-if="portalUrl && current" as-child variant="ghost" size="sm">
          <a :href="portalUrl" target="_blank" rel="noopener">
            <ExternalLink />Manage members<span class="sr-only"> (opens the UNICHE Platform Portal in a new tab)</span>
          </a>
        </Button>
      </div>
    </PopoverContent>
  </Popover>
</template>
