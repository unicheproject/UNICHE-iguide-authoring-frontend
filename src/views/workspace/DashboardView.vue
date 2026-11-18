<script setup lang="ts">
/**
 * Dashboard (`12` §3, plan 2.5, D-077, D-092, D-112): the answer to "what do I do now". One status line ("Visitor app:
 * Draft · Content revision N"), the first-run guide until it is done or dismissed, the Status card (how the visitor app
 * goes live), "Waiting for you to apply", warnings with one row per Resource, the content counts and the Project
 * details. Everything is requested at once. Translation bars and latest packages are absent until their endpoints exist
 * (G-023, G-024); nothing here approximates them.
 *
 * Layout: from 1100 px two columns (guide, status, pending and warnings on the left, counts and details on the right);
 * below it one column in which the counts come second, so the Tab order always follows the visual order (C3-55). The
 * blocks are placed from one list, so the DOM order is the visual order in both layouts.
 */
import { CircleCheck, CircleDashed, CirclePause, CircleQuestionMark } from "lucide-vue-next";
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import PageFrame from "@/components/PageFrame.vue";
import PageHead from "@/components/PageHead.vue";
import { Alert, ProblemAlert } from "@/components/ui/alert";
import { Chip } from "@/components/ui/chip";
import { HelpHint } from "@/components/ui/help-hint";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { hints, statusWord } from "@/lib/glossary";
import { ApiError } from "@/platform/api";
import { fetchDashboardData, type DashboardData } from "@/platform/dashboardData";
import { dashboardIssues, fetchReadiness, issueRows, type Readiness } from "@/platform/readiness";
import { findOrganisation } from "@/stores/projects";
import { useCurrentProject } from "@/workspace/currentProject";
import ContentCounts from "./dashboard/ContentCounts.vue";
import FirstRunGuide from "./dashboard/FirstRunGuide.vue";
import { useGuideMemory } from "./dashboard/guideState";
import PendingChanges from "./dashboard/PendingChanges.vue";
import ProjectDetails from "./dashboard/ProjectDetails.vue";
import ReadinessGroups from "./dashboard/ReadinessGroups.vue";
import StatusCard from "./dashboard/StatusCard.vue";

const project = useCurrentProject();
/** Null while the organisations are still loading: the subtitle then shows the Project name alone (no placeholder word). */
const organisationName = computed(() => findOrganisation(project.value.orgId)?.name ?? null);
const subtitle = computed(() => (organisationName.value ? `${project.value.name} · ${organisationName.value}` : project.value.name));

const data = ref<DashboardData | null>(null);
const readiness = ref<Readiness | null>(null);
const dataError = ref<unknown>(null);
const readinessError = ref<unknown>(null);
const loading = ref(true);
let controller: AbortController | null = null;

const isAbort = (e: unknown) => e instanceof DOMException && e.name === "AbortError";

/** Readiness, with a failed read kept as an error to show instead of the Status card. */
async function loadReadiness(id: string, signal: AbortSignal): Promise<Readiness | ApiError> {
  try {
    return await fetchReadiness(id, signal);
  } catch (e) {
    if (e instanceof ApiError) return e;
    throw e;
  }
}

async function load() {
  controller?.abort();
  const mine = (controller = new AbortController());
  const id = project.value.id;
  loading.value = true;
  dataError.value = null;
  readinessError.value = null;
  data.value = null;
  readiness.value = null;
  if (!project.value.initialized) {
    loading.value = false;
    return;
  }
  try {
    // One round of requests: counts, pending, settings, languages, menu and readiness together (C2-73).
    const [loaded, checked] = await Promise.all([fetchDashboardData(id, mine.signal), loadReadiness(id, mine.signal)]);
    if (mine.signal.aborted) return;
    data.value = loaded;
    if (checked instanceof ApiError) readinessError.value = checked;
    else readiness.value = checked;
  } catch (e) {
    if (isAbort(e)) return;
    if (!(e instanceof ApiError)) throw e;
    dataError.value = e;
  } finally {
    if (controller === mine) loading.value = false;
  }
}
watch(() => project.value.id, load, { immediate: true });
onBeforeUnmount(() => controller?.abort());

/** Whether the two-column layout applies (the `nav` breakpoint, 1100 px). */
const wide = ref(false);
let query: MediaQueryList | null = null;
const syncWide = () => (wide.value = query?.matches ?? false);
onMounted(() => {
  query = window.matchMedia("(min-width: 1100px)");
  syncWide();
  query.addEventListener("change", syncWide);
});
onBeforeUnmount(() => query?.removeEventListener("change", syncWide));

const countOf = (path: string) => {
  const c = data.value?.counts.find((x) => x.kind.path === path);
  return c ? c.active + c.draft : 0;
};
const guide = useGuideMemory(computed(() => project.value.id));
/** Nothing to show but the guide: no Place or no Point of interest and nothing live. */
const firstRun = computed(() => data.value !== null && data.value.activeTotal === 0 && (countOf("places") === 0 || countOf("pois") === 0));
/**
 * Whether the guide still has something to teach: with live content the Status card already says what to do next
 * (D-092). It stays until the viewer dismisses it, and Project details can bring it back (D-112).
 */
const guideApplies = computed(() => data.value !== null && (firstRun.value || data.value.activeTotal === 0));
const guideShown = computed(() => guideApplies.value && !guide.dismissed.value);
const canRestoreGuide = computed(() => guideApplies.value && guide.dismissed.value);

/** Warnings without pending-changes noise, and the blockers: the same rows the Status card and the list count. */
const warnings = computed(() => dashboardIssues(readiness.value?.warnings ?? []));
const warningCount = computed(() => issueRows(warnings.value).length);

/** The warnings list, bound by a function ref because it sits inside the column loop. */
let warningsList: InstanceType<typeof ReadinessGroups> | null = null;
const bindWarnings = (el: unknown) => (warningsList = (el as InstanceType<typeof ReadinessGroups> | null) ?? null);
async function reviewWarnings() {
  await nextTick();
  warningsList?.reveal();
}

type Block = "guide" | "status" | "pending" | "warnings" | "counts" | "details";
/** The blocks present, in reading order for each layout: one column below 1100 px, two from it. */
const blocks = computed<Block[][]>(() => {
  const guideOnly = guideShown.value && firstRun.value;
  const head: Block[] = [];
  if (guideShown.value) head.push("guide");
  if (!guideOnly) head.push("status");
  const rest: Block[] = [];
  if (data.value && (data.value.pending.total > 0 || data.value.pendingError)) rest.push("pending");
  if (warnings.value.length && !guideOnly) rest.push("warnings");
  return wide.value ? [[...head, ...rest], ["counts", "details"]] : [[...head, "counts", ...rest, "details"]];
});

/** Placeholder heights that mirror the loaded blocks of each layout (status, counts, pending, details), so nothing jumps. */
const skeletons = computed(() =>
  wide.value ? [["h-44", "h-[34rem]"], ["h-[33.5rem]", "h-14"]] : [["h-44", "h-48", "h-[34rem]", "h-14"]],
);

const appStatus = computed(() => data.value?.settings?.applicationStatus ?? null);
const statusIcon = computed(() => (appStatus.value === "LIVE" ? CircleCheck : appStatus.value === "SUSPENDED" ? CirclePause : appStatus.value === "DRAFT" ? CircleDashed : CircleQuestionMark));
/** "Draft", "Live" or "Suspended"; a status this CMS does not know is "unknown", never the server's word. */
const statusLabel = computed(() => (appStatus.value === "LIVE" || appStatus.value === "DRAFT" || appStatus.value === "SUSPENDED" ? statusWord(appStatus.value) : "unknown"));
const statusTone = computed(() => (appStatus.value === "LIVE" ? "success" : appStatus.value === "SUSPENDED" ? "warning" : "neutral"));

/** A failure the viewer cannot cure by trying again: no access, a Project that is gone, a request the platform rejected. */
const dataStatus = computed(() => (dataError.value instanceof ApiError ? dataError.value.status : 0));
const noRetry = computed(() => [403, 404, 422].includes(dataStatus.value));
const noRetryText = computed(() => {
  switch (dataStatus.value) {
    case 403:
      return { title: "You no longer have access to this Project", body: "Your account cannot open the Dashboard of this Project. Ask a Project manager to check your membership." };
    case 404:
      return { title: "This Project was not found", body: "It may have been removed, or it is not one of your Projects." };
    default:
      return { title: "The Dashboard could not be read", body: "The platform rejected the request for this Project's data. Nothing was changed. Choose another Project, or give the request id to support." };
  }
});
const dataRequestId = computed(() => (dataError.value instanceof ApiError ? dataError.value.requestId : null));
</script>

<template>
  <PageFrame :busy="loading">
    <PageHead title="Dashboard" :subtitle="subtitle">
      <template v-if="project.initialized" #status>
        <div v-if="data && !loading" class="flex min-h-6 flex-wrap items-center gap-x-2 gap-y-1 text-compact text-muted-foreground" data-testid="app-status-line">
          <template v-if="data.settings">
            <Chip :tone="statusTone" :icon="statusIcon">Visitor app: {{ statusLabel }}</Chip>
            <HelpHint label="What does the visitor app status mean?" class="-my-2 -ml-1">
              <p><strong>Draft</strong>: visitors cannot open the visitor app yet. <strong>Live</strong>: they can. {{ hints.launchPlaceholder }}</p>
              <p class="mt-2">The content revision goes up each time something visitors could see changes.</p>
            </HelpHint>
            <span class="tabular">Content revision {{ data.settings.contentRevision }}</span>
          </template>
          <span v-else>The visitor app status could not be read.</span>
        </div>
        <div v-else-if="loading" class="flex min-h-6 items-center gap-2" aria-hidden="true"><Skeleton class="h-6 w-40" /><Skeleton class="h-4 w-36" /></div>
      </template>
    </PageHead>

    <Alert v-if="!project.initialized" tone="warning" title="Finish setting up this Project">
      It has no Template yet. Pick a Template and a style, then its languages and surfaces.
      <template #actions>
        <Button as-child>
          <RouterLink :to="{ name: 'project-create', query: { resume: project.id } }">Resume initialization</RouterLink>
        </Button>
      </template>
    </Alert>

    <Alert v-else-if="dataError && noRetry" tone="danger" :title="noRetryText.title" :request-id="dataRequestId">
      <p>{{ noRetryText.body }}</p>
      <template #actions>
        <Button as-child variant="secondary" size="sm"><RouterLink :to="{ name: 'home' }">Choose another Project</RouterLink></Button>
      </template>
    </Alert>

    <ProblemAlert v-else-if="dataError" :error="dataError" action="load the Dashboard" title="The Dashboard could not be loaded" @retry="load" />

    <div v-else-if="loading" class="flex flex-col gap-5 nav:grid nav:grid-cols-[minmax(0,1fr)_22.5rem] nav:items-start" data-testid="dashboard-skeleton">
      <p role="status" class="sr-only">Loading dashboard</p>
      <div v-for="(column, c) in skeletons" :key="c" class="flex min-w-0 flex-col gap-5" aria-hidden="true">
        <Skeleton v-for="(height, i) in column" :key="i" :class="['w-full rounded-lg', height]" />
      </div>
    </div>

    <div v-else-if="data" class="flex flex-col gap-5 nav:grid nav:grid-cols-[minmax(0,1fr)_22.5rem] nav:items-start">
      <div v-for="(column, c) in blocks" :key="c" class="flex min-w-0 flex-col gap-5">
        <template v-for="block in column" :key="block">
          <FirstRunGuide
            v-if="block === 'guide'"
            :project-id="project.id"
            :place-count="countOf('places')"
            :poi-count="countOf('pois')"
            :navigation-filled="data.navigationFilled"
            :draft-by-kind="data.draftByKind"
            :has-drafts="!firstRun"
          />
          <template v-else-if="block === 'status'">
            <ProblemAlert v-if="readinessError" :error="readinessError" action="check what needs attention" title="What needs attention could not be checked" @retry="load" />
            <StatusCard
              v-else-if="readiness"
              :project-id="project.id"
              :readiness="readiness"
              :data="data"
              :warning-count="warningCount"
              :guide-open="guideShown"
              @review-warnings="reviewWarnings"
            />
          </template>
          <template v-else-if="block === 'pending'">
            <ProblemAlert v-if="data.pendingError" :error="data.pendingError" action="read the pending changes" title="Waiting for you to apply could not be loaded" @retry="load" />
            <PendingChanges v-else :project-id="project.id" :pending="data.pending" />
          </template>
          <ReadinessGroups v-else-if="block === 'warnings'" :ref="bindWarnings" :project-id="project.id" :warnings="warnings" />
          <ContentCounts v-else-if="block === 'counts'" :project-id="project.id" :counts="data.counts" />
          <ProjectDetails v-else :project="project" :organisation-name="organisationName" :can-restore-guide="canRestoreGuide" />
        </template>
      </div>
    </div>
  </PageFrame>
</template>
