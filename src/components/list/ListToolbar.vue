<script setup lang="ts">
/**
 * The toolbar of a Content list (D-076, D-089, plan 2.2): ONE row that sticks to the top of the page frame from 900 px
 * (about 56 px, `shadow-2` only while stuck) with the labelled search, the status segments (from 1180 px) and a
 * "Filters and sort" popover holding what does not fit: search language, sort, status below 1180 px, "Pending changes",
 * "Needs translation" and the view's own filters (slot `filters`: Category, Featured). Together with the sticky table
 * head the stuck area is about 100 px, not a third of the screen (C2-05). All state lives in the `query` from
 * `useListQuery`, so it is in the URL. Below 900 px the bar scrolls away and only the table head sticks.
 * It publishes `--list-toolbar-h` on its parent (the table head's `top`) and the stuck height as `--sticky-stack-h`.
 *
 * Round 3 (D-110): the button reads "Filters" and its count ("Filters 1"; visible text first, so the name contains the
 * label); the popover is a named dialog ("Filters and sort") with a visible Done, at most the available height with its
 * own scroll (reachable at 200 % zoom), every field a label above a full-width control (`FilterField` for the views'
 * own, slots `filters` and `filters-extra`), and ONE Language control for the search language and the "Needs
 * translation" worklist. Below 1180 px, where the status moves into the popover, the status in force is a chip beside
 * the button, and a worklist is a chip beside Clear filters.
 *
 * Round 2 (D-091): the one "Clear filters" of a list lives here (the footer and the empty state have none); `counts`
 * may be null while loading, and `loading` disables the controls so nothing is typed into a list that is still
 * arriving; "/" focuses the search when nothing else takes the key; "Needs translation" starts on the Search-in
 * language, else the first language that is not the default (the default is the source, usually complete).
 */
import { Search, SlidersHorizontal } from "lucide-vue-next";
import { computed, onBeforeUnmount, onMounted, ref, useId } from "vue";
import { Button } from "@/components/ui/button";
import Checkbox from "@/components/ui/checkbox/Checkbox.vue";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { ProjectLanguage } from "@/platform/languages";
import { useStickyStack } from "@/workspace/useStickyStack";
import FilterChip from "./FilterChip.vue";
import FilterField from "./FilterField.vue";
import { Select } from "@/components/ui/select";
import SortSelect from "./SortSelect.vue";
import StatusSegments from "./StatusSegments.vue";
import { LIST_STATUS_OPTIONS, type ListQuery, type ListStatus } from "./useListQuery";

const props = withDefaults(
  defineProps<{
    query: ListQuery;
    /** Segment counts; null while loading or after a failed read (no false zeros). */
    counts: Record<ListStatus, number> | null;
    /**
     * The rows are still loading: the controls stay in place but are off and the counts are left out. A view that does
     * not pass it still gets no false zeros: counts that are all zero while nothing filters can only mean "not loaded yet".
     */
    loading?: boolean;
    languages: ProjectLanguage[];
    /** Say what is searched: "Search title, slug, code or trigger". */
    searchPlaceholder: string;
    sortOptions: { value: string; label: string }[];
    showPending?: boolean;
    showMissing?: boolean;
    /** Filters the view keeps in its own slot content and has on (Media: type, alt, unused); added to the badge ("Filters 2"). */
    extraActive?: number;
  }>(),
  { showPending: true, showMissing: true, loading: undefined, extraActive: 0 },
);

const ids = { search: useId(), lang: useId() };
const root = ref<HTMLElement | null>(null);
const sentinel = ref<HTMLElement | null>(null);
const head = ref<HTMLElement | null>(null);
const stuck = ref(false);
const open = ref(false);
let observer: IntersectionObserver | null = null;
let resize: ResizeObserver | null = null;
let tableWatch: MutationObserver | null = null;

// From 1180 px the status segments fit in the row; below, they move into the popover.
const wideQuery = typeof window !== "undefined" ? window.matchMedia("(min-width: 1180px)") : null;
const inlineStatus = ref(wideQuery?.matches ?? true);
const onWide = (e: MediaQueryListEvent) => (inlineStatus.value = e.matches);

// The toolbar and the table head are what is stuck on a list: their height is the stack (D-089).
useStickyStack([root, head]);

/** The table head's `top`: the toolbar's height while the toolbar is sticky, nothing when it scrolls away. */
function publishHeight() {
  const parent = root.value?.parentElement;
  if (!root.value || !parent) return;
  const sticky = getComputedStyle(root.value).position === "sticky";
  parent.style.setProperty("--list-toolbar-h", sticky ? `${root.value.offsetHeight}px` : "0px");
}

onMounted(() => {
  const parent = root.value?.parentElement;
  if (root.value && parent) {
    resize = new ResizeObserver(publishHeight);
    resize.observe(root.value);
    window.addEventListener("resize", publishHeight);
    publishHeight();
    // The table renders after the data loads; its head joins the stack when it appears.
    const findHead = () => (head.value = parent.querySelector<HTMLElement>("thead th"));
    findHead();
    tableWatch = new MutationObserver(() => {
      if (!head.value || !head.value.isConnected) findHead();
    });
    tableWatch.observe(parent, { childList: true, subtree: true });
  }
  if (sentinel.value) {
    observer = new IntersectionObserver(([entry]) => (stuck.value = !entry.isIntersecting), { root: document.getElementById("main"), threshold: 0 });
    observer.observe(sentinel.value);
  }
  wideQuery?.addEventListener("change", onWide);
});
onBeforeUnmount(() => {
  observer?.disconnect();
  resize?.disconnect();
  tableWatch?.disconnect();
  window.removeEventListener("resize", publishHeight);
  wideQuery?.removeEventListener("change", onWide);
});

const isLoading = computed(() => props.loading ?? false);
/** Counts to show: none while loading, and none when every segment reads 0 with no filter on (the rows have not arrived). */
const shownCounts = computed(() => {
  const counts = props.counts;
  if (isLoading.value || !counts) return null;
  if (props.loading === undefined && !props.query.isFiltered.value && Object.values(counts).every((n) => n === 0)) return null;
  return counts;
});

/** The language "Needs translation" starts on: the Search-in language, else the first non-default one, else the first. */
function defaultMissingLanguage(): string {
  const { languages, query } = props;
  return (
    (query.lang.value && languages.some((l) => l.languageCode === query.lang.value) ? query.lang.value : "") ||
    languages.find((l) => !l.isDefault)?.languageCode ||
    languages[0]?.languageCode ||
    ""
  );
}
const needsTranslation = {
  get: () => !!props.query.missing.value,
  set: (on: boolean) => {
    const q = props.query;
    if (on) {
      // The worklist language is the Language control's: the search looks in it too.
      q.missing.value = defaultMissingLanguage();
      q.lang.value = q.missing.value;
    } else {
      if (q.lang.value === q.missing.value) q.lang.value = "";
      q.missing.value = "";
    }
  },
};
/** The one Language control: the search language, which is also the worklist's while "Needs translation" is on. */
const language = computed({
  get: () => props.query.lang.value,
  set: (code: string) => {
    props.query.lang.value = code;
    if (props.query.missing.value) props.query.missing.value = code || defaultMissingLanguage();
  },
});
const languageName = (code: string) => props.languages.find((l) => l.languageCode === code)?.displayName ?? code;
/** The status in force when it is not on screen (it lives in the popover below 1180 px). */
const statusChip = computed(() => {
  if (inlineStatus.value || props.query.status.value === "NOT_ARCHIVED") return null;
  return `Status: ${LIST_STATUS_OPTIONS.find((o) => o.value === props.query.status.value)?.label ?? props.query.status.value}`;
});
const missingChip = computed(() => (props.query.missing.value ? `Needs translation in ${languageName(props.query.missing.value)}` : null));

/** "/" jumps to the search, unless the author is typing, a dialog or menu is open, or a modifier is held (C2-74). */
function onSlash(event: KeyboardEvent) {
  if (event.key !== "/" || event.ctrlKey || event.metaKey || event.altKey || event.defaultPrevented) return;
  const target = event.target as HTMLElement | null;
  if (target?.closest("input, textarea, select, [contenteditable=''], [contenteditable='true'], [role='dialog'], [role='menu'], [role='listbox']")) return;
  if (document.querySelector("[role='dialog'], [role='alertdialog']")) return;
  const input = document.getElementById(ids.search);
  if (!input || (input as HTMLInputElement).disabled) return;
  event.preventDefault();
  input.focus();
}
onMounted(() => document.addEventListener("keydown", onSlash));
onBeforeUnmount(() => document.removeEventListener("keydown", onSlash));

/** How many filters inside the popover are on, for the button; the view's own (slot) count through `isFiltered`. */
const activeInside = computed(() => {
  const q = props.query;
  const known = [q.lang.value, q.pending.value, q.missing.value, q.cat.value, q.featured.value, !inlineStatus.value && q.status.value !== "NOT_ARCHIVED"].filter(Boolean).length;
  return known + props.extraActive;
});
</script>

<template>
  <div ref="sentinel" aria-hidden="true" class="h-px -mb-px"></div>
  <div
    ref="root"
    role="search"
    aria-label="Search and filter"
    class="z-sticky flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-border bg-card px-4 py-2 transition-shadow duration-2 min-[900px]:sticky min-[900px]:-top-6"
    :class="stuck ? 'min-[900px]:shadow-2' : ''"
  >
    <div class="relative min-w-[min(100%,12rem)] flex-1">
      <label :for="ids.search" class="sr-only">Search</label>
      <Search class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
      <input
        :id="ids.search"
        v-model="query.q.value"
        type="search"
        dir="auto"
        autocomplete="off"
        aria-keyshortcuts="/"
        :disabled="isLoading"
        :placeholder="searchPlaceholder"
        class="ui-field w-full pl-9"
      />
    </div>
    <StatusSegments v-if="inlineStatus" v-model="query.status.value" :counts="shownCounts" :disabled="isLoading" :reserve="isLoading" />
    <Popover v-model:open="open">
      <PopoverTrigger as-child>
        <Button variant="secondary" :disabled="isLoading">
          <SlidersHorizontal aria-hidden="true" />Filters <span v-if="activeInside" class="tabular rounded-full bg-accent px-1.5 text-compact font-semibold text-primary">{{ activeInside }}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        :collision-padding="8"
        :aria-label="sortOptions.length > 1 ? 'Filters and sort' : 'Filters'"
        class="flex max-h-[var(--radix-popper-available-height)] w-[min(92vw,22rem)] flex-col p-0"
      >
        <div class="flex min-h-0 flex-col gap-4 overflow-y-auto p-4">
          <StatusSegments v-if="!inlineStatus" v-model="query.status.value" :counts="shownCounts" :disabled="isLoading" />
          <FilterField v-if="languages.length > 1" label="Language" :for="ids.lang" :hint="query.missing.value ? 'The worklist and the search look in this language.' : undefined">
            <Select :id="ids.lang" v-model="language" size="sm">
              <option v-if="!query.missing.value" value="">All languages</option>
              <option v-for="l in languages" :key="l.languageCode" :value="l.languageCode" :lang="l.languageCode">{{ l.displayName }}</option>
            </Select>
          </FilterField>
          <SortSelect v-if="sortOptions.length > 1" v-model:sort="query.sort.value" v-model:dir="query.dir.value" :options="sortOptions" />
          <div v-if="showPending || (showMissing && languages.length)" class="flex flex-col">
            <Checkbox v-if="showPending" v-model="query.pending.value">Pending changes</Checkbox>
            <Checkbox v-if="showMissing && languages.length" :model-value="needsTranslation.get()" @update:model-value="needsTranslation.set">Needs translation</Checkbox>
          </div>
          <div class="flex flex-col gap-4 empty:hidden"><slot name="filters" /></div>
          <div class="flex flex-col gap-2 empty:hidden"><slot name="filters-extra" /></div>
        </div>
        <div class="flex justify-end border-t border-border p-3">
          <Button variant="secondary" @click="open = false">Done</Button>
        </div>
      </PopoverContent>
    </Popover>
    <FilterChip v-if="statusChip" :label="statusChip" @remove="query.status.value = 'NOT_ARCHIVED'" />
    <FilterChip v-if="missingChip" :label="missingChip" @remove="needsTranslation.set(false)" />
    <Button v-if="query.isFiltered.value && !isLoading" variant="ghost" size="sm" @click="query.clear()">Clear filters</Button>
  </div>
</template>
