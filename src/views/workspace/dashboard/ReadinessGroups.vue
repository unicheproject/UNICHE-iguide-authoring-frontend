<script setup lang="ts">
/**
 * Warnings (plan 2.5, D-077, D-092): one row per Resource however many fields and languages it affects, with the fields
 * named ("Italian: Description, Summary"), grouped by kind, every group collapsed. Pending changes are not warnings
 * (they have their own list) and the same problem is never listed twice. Closed disclosures keep hundreds of links out
 * of the tab order; there is no live region on this section (only the Status card announces).
 */
import { ChevronRight } from "lucide-vue-next";
import { computed, ref } from "vue";
import { Button } from "@/components/ui/button";
import { issueSentence } from "@/platform/completeness";
import { groupIssues, issueLink, issueTitle, type IssueLine, type ReadinessIssue } from "@/platform/readiness";
import { sectionLocation } from "@/workspace/sections";

/** `warnings` is already cleaned with `dashboardIssues`. */
const props = defineProps<{ projectId: string; warnings: ReadinessIssue[] }>();

const groups = computed(() => groupIssues(props.warnings));
const total = computed(() => groups.value.reduce((n, g) => n + g.count, 0));
/** Rows shown per kind at first (seven kinds stay within 40 rows), and added by each "Show more". Before "Show more". */
const FIRST = 5;
const STEP = 20;
const limits = ref<Record<string, number>>({});
const limit = (key: string) => limits.value[key] ?? FIRST;
const more = (key: string) => (limits.value[key] = limit(key) + STEP);

const link = (line: IssueLine) => issueLink(props.projectId, line.issue);

const root = ref<HTMLElement | null>(null);
/** Opens the first group and moves focus to the section heading (the Status card's "Review warnings"). */
function reveal() {
  const first = root.value?.querySelector<HTMLDetailsElement>("details");
  if (first) first.open = true;
  root.value?.querySelector<HTMLElement>("h2")?.focus();
}
defineExpose({ reveal });
</script>

<template>
  <section ref="root" aria-labelledby="warnings-title" class="rounded-lg border border-border bg-card shadow-1">
    <div class="px-5 pb-3 pt-5">
      <h2 id="warnings-title" tabindex="-1" class="text-base font-bold">Warnings ({{ total }})</h2>
      <p class="mt-1 text-sm text-muted-foreground">
        {{ issueSentence({ blockers: 0, warnings: total }) }}. One line per item. Missing translations are also listed in
        <RouterLink :to="sectionLocation(projectId, 'translations')" class="hit-44">Translations</RouterLink>.
      </p>
    </div>
    <div class="flex flex-col">
      <details v-for="group in groups" :key="group.kind" class="group border-t border-border">
        <summary class="flex min-h-row cursor-pointer list-none items-center gap-2 px-5 py-2 text-sm font-semibold [&::-webkit-details-marker]:hidden">
          <ChevronRight class="size-4 shrink-0 transition-transform group-open:rotate-90" aria-hidden="true" />
          {{ group.label }}
          <span class="font-normal text-muted-foreground tabular">{{ group.count }}</span>
        </summary>
        <div class="px-5 pb-4 pl-11">
          <ul class="flex flex-col gap-1 text-sm">
            <li v-for="line in group.lines.slice(0, limit(group.kind))" :key="line.key">
              <RouterLink v-if="link(line)" :to="link(line)!" class="hit-44 font-medium"><bdi>{{ issueTitle(line.issue) }}</bdi></RouterLink>
              <span v-else class="font-medium"><bdi>{{ issueTitle(line.issue) }}</bdi></span>
              <span class="text-muted-foreground">: {{ line.detail }}</span>
            </li>
          </ul>
          <Button v-if="group.lines.length > limit(group.kind)" variant="link" size="sm" class="mt-1" @click="more(group.kind)">
            Show more ({{ group.lines.length - limit(group.kind) }} left)
          </Button>
        </div>
      </details>
    </div>
  </section>
</template>
