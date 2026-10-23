<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from "vue";
import PageHead from "@/components/PageHead.vue";
import { formatDate } from "@/lib/format";
import { ApiError } from "@/platform/api";
import { describeIssue, fetchReadiness, issueLink, kindName, type Readiness, type ReadinessIssue } from "@/platform/readiness";
import { findOrganisation } from "@/stores/projects";
import { useCurrentProject } from "@/workspace/currentProject";

const project = useCurrentProject();

const organisationName = computed(() => findOrganisation(project.value.orgId)?.name ?? "Organisation");

// Readiness: one status card answering "what do I do now" (spec 12 section 3 Dashboard, DECISIONS.md D-022).
const readiness = ref<Readiness | null>(null);
const readinessError = ref<ApiError | null>(null);
const showAll = ref(false);
let controller: AbortController | null = null;

async function loadReadiness() {
  controller?.abort();
  controller = new AbortController();
  readinessError.value = null;
  try {
    readiness.value = await fetchReadiness(project.value.id, controller.signal);
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") return;
    if (!(e instanceof ApiError)) throw e;
    readinessError.value = e;
  }
}
watch(() => project.value.id, loadReadiness, { immediate: true });
onBeforeUnmount(() => controller?.abort());

const blocking = computed(() => readiness.value?.blocking ?? []);
const warnings = computed(() => readiness.value?.warnings ?? []);
const shownBlocking = computed(() => (showAll.value ? blocking.value : blocking.value.slice(0, 3)));
const link = (issue: ReadinessIssue) => issueLink(project.value.id, issue);
const where = (issue: ReadinessIssue) =>
  issue.resourceType === "PROJECT" ? "Project" : `${kindName(issue.resourceType)}${issue.title ? ` “${issue.title}”` : ""}`;

const details = computed(() => [
  { label: "Organisation", value: organisationName.value },
  { label: "Slug", value: project.value.slug, mono: true },
  { label: "Created", value: formatDate(project.value.createdAt) },
  { label: "Last updated", value: formatDate(project.value.updatedAt) },
]);
</script>

<template>
  <main class="relative min-w-0 flex-1 overflow-y-auto px-7 pb-16 pt-6">
    <PageHead
      title="Dashboard"
      :subtitle="`${project.name} · ${organisationName}. The UNICHE Catalogue confirmed your access to this Project.`"
      :status="project.status"
    />

    <section
      class="mb-5 max-w-[860px] rounded-lg border border-l-[3px] bg-card px-[18px] py-4"
      :class="readiness && !readiness.activatable ? 'border-l-destructive' : 'border-l-[#0f7a6e]'"
      aria-labelledby="readiness-heading"
      aria-live="polite"
    >
      <p v-if="readinessError" class="text-[13px] text-gray-700">
        <strong id="readiness-heading" class="block text-[13px] font-bold">Readiness could not be checked</strong>
        {{ readinessError.platformUnavailable ? "The UNICHE platform is not reachable." : readinessError.message }}
        <button type="button" class="ml-2 text-[11px] font-bold uppercase tracking-[0.06em] text-primary" @click="loadReadiness">Try again</button>
      </p>
      <p v-else-if="!readiness" id="readiness-heading" class="text-[13px] text-muted-foreground" aria-busy="true">Checking what visitors would see…</p>
      <template v-else>
        <h2 id="readiness-heading" class="text-[15px] font-bold">
          {{
            readiness.activatable
              ? "Ready for visitors"
              : `${blocking.length} ${blocking.length === 1 ? "thing blocks" : "things block"} going live`
          }}
        </h2>
        <p class="mt-1 text-[13px] text-gray-700">
          {{
            readiness.activatable
              ? "Nothing blocks the application from going live with its active content."
              : "The application cannot go live until these are fixed in the active content."
          }}
          <template v-if="warnings.length">
            {{ warnings.length }} {{ warnings.length === 1 ? "warning does" : "warnings do" }} not block, but deserve a look.
          </template>
        </p>
        <ul v-if="blocking.length" class="mt-3 flex flex-col gap-1.5">
          <li v-for="(issue, i) in shownBlocking" :key="`${issue.resourceId}-${issue.path}-${issue.code}-${i}`" class="text-[13px]">
            <RouterLink v-if="link(issue)" :to="link(issue)!" class="font-semibold text-primary no-underline hover:underline">{{ where(issue) }}</RouterLink>
            <span v-else class="font-semibold">{{ where(issue) }}</span>:
            {{ describeIssue(issue) }}<template v-if="issue.languageCode"> ({{ issue.languageCode }})</template>
          </li>
        </ul>
        <button
          v-if="blocking.length > 3"
          type="button"
          class="mt-2 text-[11px] font-bold uppercase tracking-[0.06em] text-primary"
          :aria-expanded="showAll"
          @click="showAll = !showAll"
        >
          {{ showAll ? "Show fewer" : `Show all ${blocking.length}` }}
        </button>
        <details v-if="warnings.length" class="mt-3 text-[13px]">
          <summary class="cursor-pointer text-[12px] font-bold text-[#9a6200]">Warnings ({{ warnings.length }})</summary>
          <ul class="mt-2 flex flex-col gap-1.5">
            <li v-for="(issue, i) in warnings" :key="`w-${issue.resourceId}-${issue.path}-${issue.code}-${i}`">
              <RouterLink v-if="link(issue)" :to="link(issue)!" class="font-semibold text-primary no-underline hover:underline">{{ where(issue) }}</RouterLink>
              <span v-else class="font-semibold">{{ where(issue) }}</span>:
              {{ describeIssue(issue) }}<template v-if="issue.languageCode"> ({{ issue.languageCode }})</template>
            </li>
          </ul>
        </details>
      </template>
    </section>

    <div class="grid grid-cols-[repeat(auto-fill,minmax(190px,1fr))] gap-3.5">
      <div v-for="d in details" :key="d.label" class="min-w-0 rounded-[10px] border bg-card p-[18px]">
        <span class="block text-[10px] font-extrabold uppercase tracking-[0.1em] text-muted-foreground">{{ d.label }}</span>
        <span class="mt-1 block break-words text-[15px] font-bold" :class="d.mono ? 'font-mono text-[13px]' : ''">
          {{ d.value }}
        </span>
      </div>
    </div>
  </main>
</template>
