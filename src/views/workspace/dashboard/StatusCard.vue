<script setup lang="ts">
/**
 * The Status card (`12` §3, plan 2.5, D-077, D-092, D-112): exactly four states and one primary action, at most three
 * items listed. It says how the visitor app goes live: with at least one ACTIVE Resource, no blockers and the app still a
 * Draft, the primary action is "Go to Launch" and the sentence names what Launch does. "Live" is said only when the
 * application status is `LIVE`; SUSPENDED and a status that could not be read have sentences of their own, so a failed
 * read is never presented as good news (C3-54). While Launch is a placeholder the headline says "Content is ready; going
 * live is not available yet" (C3-57). Blocked rows give the cause, with no kind prefix (C3-58). "Ready" is asserted only
 * above zero ACTIVE Resources. State is shown by icon and words, never by a coloured edge. Counts are one per Resource,
 * the same unit the warnings list uses.
 */
import { CircleAlert, CircleCheck, CircleDashed, CirclePause, CircleQuestionMark, TriangleAlert } from "lucide-vue-next";
import { computed, ref, type Component } from "vue";
import { useRouter, type RouteLocationRaw } from "vue-router";
import { Button } from "@/components/ui/button";
import { glossary } from "@/lib/glossary";
import { RESOURCE_KINDS, type DashboardData } from "@/platform/dashboardData";
import { issueLink, issueRowParts, issueRows, issueTitle, type IssueLine, type Readiness, type ReadinessIssue } from "@/platform/readiness";
import { sectionLocation } from "@/workspace/sections";

const props = defineProps<{
  projectId: string;
  readiness: Readiness;
  data: DashboardData;
  warningCount: number;
  /** The first-run guide is open beside the card and owns the one primary action: "Show drafts" is then secondary. */
  guideOpen?: boolean;
}>();
const emit = defineEmits<{ "review-warnings": [] }>();

type State = "not-live" | "blocked" | "warnings" | "ready" | "suspended" | "unknown";

const blockers = computed(() => issueRows(props.readiness.blocking));
/** The application status as read, or null when settings could not be read or hold a status this CMS does not know. */
const appStatus = computed(() => {
  const status = props.data.settings?.applicationStatus;
  return status === "LIVE" || status === "DRAFT" || status === "SUSPENDED" ? status : null;
});
/** Active content, no blockers, and the app is a Draft: the next thing to do is Launch. */
const readyToLaunch = computed(() => blockers.value.length === 0 && props.data.activeTotal > 0 && appStatus.value === "DRAFT");

const state = computed<State>(() => {
  if (appStatus.value === "SUSPENDED") return "suspended";
  if (appStatus.value === null) return "unknown";
  if (blockers.value.length > 0) return "blocked";
  if (props.data.activeTotal === 0) return "not-live";
  return props.warningCount > 0 ? "warnings" : "ready";
});

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
const draftTotal = computed(() => props.data.resourceTotal - props.data.activeTotal);
const blockerText = computed(() => (blockers.value.length > 0 ? ` ${plural(blockers.value.length, "thing blocks", "things block")} going live, listed below.` : ""));

const headline = computed(() => {
  switch (state.value) {
    case "suspended":
      return "The visitor app is suspended";
    case "unknown":
      return "The visitor app status is unknown";
    case "blocked":
      return `${blockers.value.length} ${blockers.value.length === 1 ? "thing blocks" : "things block"} going live`;
    case "not-live":
      return "Nothing is live yet";
    default:
      if (readyToLaunch.value) {
        return launchAvailable.value ? "Ready to go live" : glossary.launchPlaceholder;
      }
      return "Live";
  }
});

const sentence = computed(() => {
  switch (state.value) {
    case "suspended":
      return `Visitors cannot open the app while it is suspended. The platform controls this, so ask UNICHE if you expect it to be open.${blockerText.value}`;
    case "unknown":
      return `The CMS could not read the visitor app status, so it cannot say whether visitors can open the app. Reload the page to try again.${blockerText.value}`;
    case "blocked":
      return "The visitor app cannot go live until these are fixed in the live content.";
    case "not-live":
      return `${plural(draftTotal.value, "item is a draft", "items are drafts")}, so visitors see nothing. Activate the ones that are ready.`;
    default: {
      const warnings = props.warningCount > 0 ? ` ${plural(props.warningCount, "warning would", "warnings would")} improve it for visitors.` : "";
      if (readyToLaunch.value) {
        return launchAvailable.value
          ? `Nothing blocks the visitor app. It is still a Draft, so visitors cannot open it until you go live in Launch.${warnings}`
          : `Visitors still see nothing: the visitor app is a Draft, and going live happens under Launch, which this CMS does not offer yet.${warnings}`;
      }
      return props.warningCount > 0
        ? `Visitors can open the app. The warnings below would improve it for them.`
        : `Visitors can open the app, and the live content is complete.`;
    }
  }
});

const icons: Record<State, Component> = {
  blocked: CircleAlert,
  "not-live": CircleDashed,
  warnings: TriangleAlert,
  ready: CircleCheck,
  suspended: CirclePause,
  unknown: CircleQuestionMark,
};
const iconInk: Record<State, string> = {
  blocked: "text-destructive",
  "not-live": "text-muted-foreground",
  warnings: "text-warning",
  ready: "text-success",
  suspended: "text-warning",
  unknown: "text-muted-foreground",
};

/** What is wrong with each blocked Resource, one cause per issue, split around the language name for `<bdi>`. */
interface BlockerRow {
  key: string;
  line: IssueLine;
  causes: ReturnType<typeof issueRowParts>[];
}
const blockerRows = computed<BlockerRow[]>(() => {
  const byResource = new Map<string, ReadinessIssue[]>();
  for (const issue of props.readiness.blocking) {
    const key = `${issue.resourceType}|${issue.resourceId ?? "project"}`;
    byResource.set(key, [...(byResource.get(key) ?? []), issue]);
  }
  return blockers.value.map((line) => {
    const key = `${line.issue.resourceType}|${line.issue.resourceId ?? "project"}`;
    const seen = new Set<string>();
    const causes = (byResource.get(key) ?? [line.issue]).map(issueRowParts).filter((c) => {
      const text = `${c.before}${c.language ?? ""}${c.after}`;
      return seen.has(text) ? false : (seen.add(text), true);
    });
    return { key: line.key, line, causes };
  });
});

const showAll = ref(false);
const shown = computed(() => (showAll.value ? blockerRows.value : blockerRows.value.slice(0, 3)));
const link = (line: IssueLine) => issueLink(props.projectId, line.issue);
const firstLink = computed(() => blockers.value.map(link).find((l) => l !== null) ?? null);

/** The first list that holds drafts, Places first, so "Show drafts" lands where there is something to activate. */
const draftTarget = computed<RouteLocationRaw>(() => {
  const kind = RESOURCE_KINDS.find((k) => props.data.draftByKind[k] > 0) ?? "places";
  return { ...sectionLocation(props.projectId, kind), query: { status: "DRAFT" } };
});
const launch = computed(() => sectionLocation(props.projectId, "launch"));
const router = useRouter();
/** Launch has a screen of its own once it has a dedicated route; until then it is the "Not available yet" placeholder. */
const launchAvailable = computed(() => router.resolve(launch.value).name !== "project-section");
const preview = computed<RouteLocationRaw>(() => ({ name: "preview", params: { projectId: props.projectId } }));
</script>

<template>
  <section aria-labelledby="status-title" class="rounded-lg border border-border bg-card px-5 pb-5 pt-5 shadow-1" :data-state="state" :data-launch="readyToLaunch || undefined">
    <div aria-live="polite" class="flex items-start gap-3">
      <component :is="icons[state]" class="mt-0.5 size-6 shrink-0" :class="iconInk[state]" aria-hidden="true" />
      <h2 id="status-title" class="text-base font-bold">{{ headline }}</h2>
    </div>
    <p class="mt-1 max-w-prose pl-9 text-sm text-ink-2">{{ sentence }}</p>

    <ul v-if="blockerRows.length > 0" class="mt-3 flex flex-col gap-1.5 pl-9 text-sm" data-testid="blocker-rows">
      <li v-for="row in shown" :key="row.key">
        <RouterLink v-if="link(row.line)" :to="link(row.line)!" class="hit-44 font-semibold"><bdi>{{ issueTitle(row.line.issue) }}</bdi></RouterLink>
        <span v-else class="font-semibold"><bdi>{{ issueTitle(row.line.issue) }}</bdi></span>
        <span>: <template v-for="(c, i) in row.causes" :key="i">{{ i > 0 ? "; " : "" }}{{ c.before }}<bdi v-if="c.language">{{ c.language }}</bdi>{{ c.after }}</template></span>
      </li>
      <li v-if="blockerRows.length > 3">
        <Button variant="link" size="sm" class="hit-44" :aria-expanded="showAll" @click="showAll = !showAll">
          {{ showAll ? "Show fewer" : `and ${blockerRows.length - 3} more` }}
        </Button>
      </li>
    </ul>

    <div class="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 pl-9">
      <template v-if="blockerRows.length > 0">
        <Button v-if="firstLink" as-child>
          <RouterLink :to="firstLink">Fix the first issue</RouterLink>
        </Button>
        <Button v-else variant="secondary" disabled-reason="These issues are not tied to a screen that can be opened from here">
          Fix the first issue
        </Button>
      </template>
      <Button v-else-if="state === 'not-live'" as-child :variant="guideOpen ? 'secondary' : 'primary'">
        <RouterLink :to="draftTarget">Show drafts</RouterLink>
      </Button>
      <template v-else-if="readyToLaunch">
        <Button v-if="launchAvailable" as-child>
          <RouterLink :to="launch">Go to Launch</RouterLink>
        </Button>
        <Button as-child :variant="launchAvailable ? 'link' : 'primary'" :class="launchAvailable && 'hit-44'">
          <RouterLink :to="preview">Preview the app</RouterLink>
        </Button>
        <Button v-if="!launchAvailable" as-child variant="link" class="hit-44"><RouterLink :to="launch">About Launch</RouterLink></Button>
        <Button v-if="state === 'warnings'" variant="link" class="hit-44" @click="emit('review-warnings')">Review warnings</Button>
      </template>
      <template v-else-if="state === 'warnings'">
        <Button variant="secondary" @click="emit('review-warnings')">Review warnings</Button>
      </template>
      <Button v-else as-child>
        <RouterLink :to="preview">Preview the app</RouterLink>
      </Button>
      <Button v-if="blockerRows.length > 0" as-child variant="link" class="hit-44">
        <RouterLink :to="preview">Preview the app</RouterLink>
      </Button>
    </div>
  </section>
</template>
