<script setup lang="ts">
/**
 * The five-step first-run guide (`12` §3, D-077, D-092, D-112, Q-022). It ticks only what data proves, never a visit:
 * steps 1 and 2 from the list totals (a DRAFT Place counts), step 4 from the main menu having an item. Step 3 (Pages) is
 * "Not available yet" while Pages is a placeholder: it has no link and is not counted, so progress reads "n of 4".
 * Step 5 (Preview) has no data either, so it never ticks; it stays the next step until the drafts are activated, the
 * viewer dismisses the guide, or it is not needed any more. Once a Place and a point of interest exist, the guide
 * ends with "Next: activate the drafts that are ready". The next step is the first one not done and available: expanded
 * with the guide's one primary button. Steps 1 and 2 open the create dialog on the list (`?create=1`).
 */
import { Check, X } from "lucide-vue-next";
import { computed, nextTick } from "vue";
import type { RouteLocationRaw } from "vue-router";
import { Button } from "@/components/ui/button";
import { say } from "@/lib/announcer";
import { restoreFocus } from "@/lib/focus";
import { RESOURCE_KINDS, type ResourceKindPath } from "@/platform/dashboardData";
import { sectionLocation } from "@/workspace/sections";
import { useGuideMemory } from "./guideState";

const props = defineProps<{
  projectId: string;
  placeCount: number;
  poiCount: number;
  navigationFilled: boolean | null;
  /** Draft totals per kind: "Show drafts" lands on the first list that has any. */
  draftByKind: Record<ResourceKindPath, number>;
  /** The Project holds a Place and a point of interest but nothing is live: the intro talks about drafts. */
  hasDrafts: boolean;
}>();
const memory = useGuideMemory(computed(() => props.projectId));

interface Step {
  key: string;
  title: string;
  help: string;
  action: string;
  to: RouteLocationRaw;
  done: boolean;
  /** Pages is a placeholder: shown as "Not available yet", no link, not counted. */
  unavailable?: boolean;
}

const steps = computed<Step[]>(() => [
  {
    key: "places",
    title: "Add a Place",
    help: "A Place is a building, site or area visitors can go to. Points of interest sit inside it.",
    action: "Add a Place",
    to: { ...sectionLocation(props.projectId, "places"), query: { create: "1" } },
    done: props.placeCount > 0,
  },
  {
    key: "pois",
    title: "Add points of interest",
    help: "Objects, sights and stops that visitors read about, listen to and find on the map.",
    action: "Add a point of interest",
    to: { ...sectionLocation(props.projectId, "pois"), query: { create: "1" } },
    done: props.poiCount > 0,
  },
  {
    key: "pages",
    title: "Compose a page",
    help: "Pages are the screens visitors open first, such as the home page.",
    action: "Open Pages",
    to: { name: "project-section", params: { projectId: props.projectId, section: "pages" } },
    done: false,
    unavailable: true,
  },
  {
    key: "navigation",
    title: "Build the navigation",
    help: "Choose the menu that takes visitors from page to page.",
    action: "Open Navigation",
    to: sectionLocation(props.projectId, "navigation"),
    done: props.navigationFilled === true,
  },
  {
    key: "preview",
    title: "Preview the app",
    help: "See the visitor app as visitors will, on web, mobile and kiosk. Nothing records that you looked, so this step stays open.",
    action: "Open Preview",
    to: sectionLocation(props.projectId, "preview"),
    done: false,
  },
]);

const nextKey = computed(() => steps.value.find((s) => !s.done && !s.unavailable)?.key ?? null);
const counted = computed(() => steps.value.filter((s) => !s.unavailable));
const doneCount = computed(() => counted.value.filter((s) => s.done).length);
const state = (step: Step) => (step.done ? "done" : step.unavailable ? "unavailable" : step.key === nextKey.value ? "next" : "todo");

/** The first list that holds drafts, Places first. */
const draftTarget = computed<RouteLocationRaw>(() => {
  const kind = RESOURCE_KINDS.find((k) => props.draftByKind[k] > 0) ?? "places";
  return { ...sectionLocation(props.projectId, kind), query: { status: "DRAFT" } };
});
const showEnd = computed(() => props.placeCount > 0 && props.poiCount > 0);

async function dismiss() {
  memory.dismiss();
  say("Guide dismissed. You can show it again in Project details.");
  await nextTick();
  restoreFocus(null, "main h1");
}
</script>

<template>
  <section aria-labelledby="guide-title" class="rounded-lg border border-border bg-card shadow-1">
    <div class="flex items-start gap-3 px-5 pb-3 pt-5">
      <div class="min-w-0 flex-1">
        <h2 id="guide-title" tabindex="-1" class="text-base font-bold">Get your visitor app started</h2>
        <p class="mt-1 text-sm text-muted-foreground">
          {{ hasDrafts ? "Your drafts are saved, but nothing is live yet." : "Five steps take an empty Project to something you can preview." }}
          <span class="tabular">{{ doneCount }} of {{ counted.length }} done.</span>
        </p>
      </div>
      <Button variant="ghost" size="sm" @click="dismiss"><X />Dismiss guide</Button>
    </div>
    <ol class="flex flex-col gap-2 px-5 pb-5" data-testid="first-run-steps">
      <li
        v-for="(step, i) in steps"
        :key="step.key"
        :data-step="step.key"
        :data-state="state(step)"
        class="rounded-md border px-3 py-3"
        :class="step.key === nextKey ? 'border-primary bg-accent' : 'border-border'"
      >
        <div class="flex items-start gap-3">
          <span
            class="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border text-xs font-bold tabular"
            :class="[
              step.done ? 'border-success bg-success-tint text-success' : step.key === nextKey ? 'border-primary bg-primary text-primary-foreground forced-step-current' : 'border-input bg-card text-ink-2',
            ]"
            aria-hidden="true"
          >
            <Check v-if="step.done" class="size-4" />
            <template v-else>{{ i + 1 }}</template>
          </span>
          <div class="min-w-0 flex-1">
            <p class="text-sm font-semibold" :aria-current="step.key === nextKey ? 'step' : undefined">
              <template v-if="step.key === nextKey || step.done || step.unavailable">{{ step.title }}</template>
              <RouterLink v-else :to="step.to" class="hit-44">{{ step.title }}</RouterLink>
              <span v-if="step.done" class="ml-2 text-compact font-medium text-success">Done</span>
              <span v-else-if="step.unavailable" class="ml-2 text-compact font-medium text-muted-foreground">Not available yet</span>
              <span v-else-if="step.key === nextKey" class="ml-2 text-compact font-medium text-primary">Next step</span>
            </p>
            <template v-if="step.key === nextKey">
              <p class="mt-1 max-w-prose text-sm text-ink-2">{{ step.help }}</p>
              <Button as-child class="mt-3">
                <RouterLink :to="step.to">{{ step.action }}</RouterLink>
              </Button>
            </template>
          </div>
        </div>
      </li>
    </ol>
    <div v-if="showEnd" class="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border px-5 py-3" data-testid="guide-next">
      <p class="min-w-0 flex-1 text-sm font-semibold">Next: activate the drafts that are ready</p>
      <Button as-child variant="secondary"><RouterLink :to="draftTarget">Show drafts</RouterLink></Button>
    </div>
  </section>
</template>
