<script lang="ts">
import type { ReadinessItem } from "@/workspace/useResourceEditor";
import { describeIssue } from "@/platform/readiness";

/** The line's text split at its leading language name, which the template wraps in `<bdi>` (RTL-safe, C3-50). */
export function lineParts(line: Pick<ReadinessLine, "text" | "languageName">): { language: string | null; rest: string } {
  const lead = line.languageName ? `${line.languageName}: ` : "";
  return lead && line.text.startsWith(lead) ? { language: line.languageName!, rest: line.text.slice(lead.length) } : { language: null, rest: line.text };
}

/** One line of the readiness list: a problem the author can act on, with where to go to fix it. */
export interface ReadinessLine {
  key: string;
  blocking: boolean;
  /** The kind of problem it belongs to, for grouping: "Texts", "Media", "Links", "Other". */
  group: string;
  text: string;
  /** Field path and language the line links to; both empty for a line with nowhere to go. */
  path: string;
  languageCode: string | null;
  /** The gap belongs to the Resource, not to a language ("This Route has no stops"): the confirm names it first. */
  structural?: boolean;
  /** The language's display name at the start of `text` ("Italiano: ..."), wrapped in `<bdi>` so its script cannot reorder the sentence. */
  languageName?: string;
}

const GROUPS: Record<string, string> = {
  MISSING_DEFAULT_LANGUAGE_VALUE: "Texts",
  MISSING_TRANSLATION: "Texts",
  AI_OUTPUT_UNREVIEWED: "Texts",
  MISSING_ALTERNATIVE_TEXT: "Media",
  MISSING_TRANSCRIPT: "Media",
  MISSING_CAPTION_TRACK: "Media",
  DANGLING_REFERENCE: "Links",
  UNREACHABLE_PAGE: "Links",
  ROUTE_WITHOUT_ACTIVE_STOP: "Links",
  ROUTE_FEW_STOPS: "Links",
};

/**
 * Turns the platform's readiness items into one line per problem, not one per language per block: every missing
 * translation of a language becomes "Italiano: 4 texts missing". `languageName` gives a code's display name.
 */
export function readinessLines(items: ReadinessItem[], languageName: (code: string) => string): ReadinessLine[] {
  const lines: ReadinessLine[] = [];
  const perLanguage = new Map<string, { count: number; first: ReadinessItem }>();
  for (const item of items) {
    if (item.code === "MISSING_TRANSLATION" && item.languageCode) {
      const found = perLanguage.get(item.languageCode);
      if (found) found.count++;
      else perLanguage.set(item.languageCode, { count: 1, first: item });
      continue;
    }
    lines.push({
      key: `${item.code}-${item.path}-${item.languageCode ?? ""}-${lines.length}`,
      blocking: item.blocking,
      group: GROUPS[item.code] ?? "Other",
      text: item.languageCode ? `${languageName(item.languageCode)}: ${describeIssue(item)}` : describeIssue(item),
      path: item.path,
      languageCode: item.languageCode,
      languageName: item.languageCode ? languageName(item.languageCode) : undefined,
    });
  }
  for (const [code, { count, first }] of perLanguage) {
    lines.push({
      key: `MISSING_TRANSLATION-${code}`,
      blocking: first.blocking,
      group: "Texts",
      text: `${languageName(code)}: ${count} ${count === 1 ? "text" : "texts"} missing`,
      path: first.path,
      languageCode: code,
      languageName: languageName(code),
    });
  }
  return lines;
}
</script>

<script setup lang="ts">
/**
 * "Before you activate" (DRAFT) and "What needs attention" (ACTIVE) (plan 2.3): lines grouped by the kind of problem
 * with counts, blocking ones first, each a button that moves focus to the field or Resource (`14` §4). A group shows
 * three warnings and collapses the rest. The count is read out politely whenever it changes.
 */
import { ChevronDown, CircleAlert, CircleCheck, TriangleAlert } from "lucide-vue-next";
import { computed, reactive, ref, watch } from "vue";
import SideCard from "@/components/editor/SideCard.vue";
import { countIssues, issueSentence } from "@/platform/completeness";

const props = defineProps<{
  heading: string;
  lines: ReadinessLine[];
  /** What to say when nothing is left. */
  emptyText: string;
  /** Hide the heading when a parent already provides one (the activation dialog). */
  headless?: boolean;
  /** Makes each line a button; off for a plain list. */
  interactive?: boolean;
  /** The Resource is ACTIVE, so blockers read "to fix" without "before activating" (`issueSentence`). */
  active?: boolean;
  /**
   * A DRAFT: the platform cannot return its readiness yet (G-044), so the list adds "plus checks run on activation"
   * (D-107). Off for an ACTIVE Resource, whose list already includes the platform's items.
   */
  plusChecks?: boolean;
  /** Inside the narrow-layout summary card: no card of its own (a card in a card would nest). */
  flat?: boolean;
}>();
const emit = defineEmits<{ select: [line: ReadinessLine] }>();

const grouped = computed(() => {
  const groups = new Map<string, ReadinessLine[]>();
  for (const line of [...props.lines].sort((a, b) => Number(b.blocking) - Number(a.blocking))) {
    groups.set(line.group, [...(groups.get(line.group) ?? []), line]);
  }
  return [...groups].map(([name, items]) => ({ name, items, blocking: items.filter((i) => i.blocking).length }));
});
const expanded = reactive<Record<string, boolean>>({});
const visible = (group: { name: string; items: ReadinessLine[] }) => (expanded[group.name] ? group.items : group.items.slice(0, 3));
/** The one sentence of the completeness model (D-090): the same words as the header count, the confirm and the toast. */
const sentence = computed(() => issueSentence(countIssues(props.lines), { active: props.active }));
const announcement = computed(() => (props.lines.length ? `${sentence.value}.` : props.emptyText));
/**
 * The polite live region changes only when the counts change (C3-12): editing a field that leaves the counts alone
 * says nothing, and the first render says nothing at all.
 */
const announced = ref("");
watch(
  () => sentence.value + props.lines.length,
  () => (announced.value = announcement.value),
);
</script>

<template>
  <component :is="headless ? 'section' : SideCard" v-bind="headless ? { 'aria-label': heading } : { title: heading, headingId: 'readiness-heading', flat }">
    <p class="sr-only" :aria-live="headless ? undefined : 'polite'">{{ headless ? "" : announced }}</p>
    <p v-if="lines.length" class="mb-2 text-sm font-semibold" data-issue-sentence>{{ sentence }}</p>
    <p v-if="lines.length && plusChecks" class="-mt-1 mb-2 text-xs text-muted-foreground" data-plus-checks>plus checks run on activation</p>
    <p v-if="!lines.length" class="flex items-start gap-2 text-sm text-ink-2">
      <CircleCheck class="mt-0.5 size-4 shrink-0 text-success" aria-hidden="true" />{{ emptyText }}
    </p>
    <p v-if="!lines.length && plusChecks" class="mt-1 text-xs text-muted-foreground" data-plus-checks>plus checks run on activation</p>
    <div v-for="group in grouped" :key="group.name" class="mb-3 last:mb-0">
      <h3 class="mb-1 text-xs font-semibold text-muted-foreground">
        {{ group.name }} <span class="tabular">({{ group.items.length }}{{ group.blocking ? `, ${group.blocking} blocking` : "" }})</span>
      </h3>
      <ul class="flex flex-col gap-0.5">
        <li v-for="line in visible(group)" :key="line.key">
          <component
            :is="interactive ? 'button' : 'div'"
            :type="interactive ? 'button' : undefined"
            class="flex w-full items-start gap-2 rounded-md px-1 py-1.5 text-left text-sm"
            :class="interactive ? 'min-h-8 hover:bg-surface-hover' : ''"
            @click="interactive && emit('select', line)"
          >
            <component :is="line.blocking ? CircleAlert : TriangleAlert" class="mt-0.5 size-4 shrink-0" :class="line.blocking ? 'text-destructive' : 'text-warning'" aria-hidden="true" />
            <span class="min-w-0">
              <span class="font-semibold" :class="line.blocking ? 'text-destructive' : 'text-warning'">{{ line.blocking ? "Blocking:" : "Warning:" }}</span>{{ " " }}
              <template v-if="lineParts(line).language">
                <bdi :lang="line.languageCode ?? undefined">{{ lineParts(line).language }}</bdi>: {{ lineParts(line).rest }}
              </template>
              <template v-else>{{ line.text }}</template>
            </span>
          </component>
        </li>
      </ul>
      <button
        v-if="group.items.length > 3"
        type="button"
        class="mt-1 flex min-h-8 items-center gap-1 rounded-md px-1 text-sm font-medium text-primary hover:bg-surface-hover"
        :aria-expanded="!!expanded[group.name]"
        @click="expanded[group.name] = !expanded[group.name]"
      >
        <ChevronDown class="size-4 transition-transform" :class="expanded[group.name] ? 'rotate-180' : ''" aria-hidden="true" />
        {{ expanded[group.name] ? "Show fewer" : `Show ${group.items.length - 3} more` }}
      </button>
    </div>
  </component>
</template>
