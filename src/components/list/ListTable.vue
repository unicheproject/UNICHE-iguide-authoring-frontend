<script setup lang="ts" generic="T extends Orderable">
/**
 * The table of a Content list (D-076, plan 2.2). From 900 px a real `<table>` with a sticky head (under the toolbar),
 * sortable columns as buttons with `aria-sort`, 52 px rows, one drag handle cell when reordering is on, an optional
 * last cell for the row menu, and tree rows (indent 24 px per level with a hairline guide and a disclosure button
 * with `aria-expanded`). Below 900 px the same rows are two-line cards: title cell, then the other cells wrapped,
 * the menu button 44 px. The table never exceeds its container.
 *
 * Columns: `{ key, label, sortKey?, tree?, class?, hideLabel?, card? }`. Content comes through slots: `cell-<key>`
 * with `{ row, index }` (the `tree` column holds the title link) and `menu` with `{ row }` (a `RowMenu`). The whole row
 * opens when `openable` and the click lands outside a control (`open` event); the title link stays the keyboard target.
 * Dragging uses the `reorder` object from `useReorder`; its announcements are rendered in a polite live region here,
 * so a list built on `ListTable` needs no region of its own.
 *
 * Round 2 (D-091): the table renders `pageSize` rows (50) of `rows` at a time with a pager below ("Showing 51-100 of
 * 184", Previous / Next); the page lives in `query.page` (URL `page`), or in the table itself without a `query`. The
 * loaders keep reading every page of the API, so search, segment counts and manual order still see every row. Rows
 * carry `data-row-id`; `rowKeyFocus` (from `useScrollRestore`) moves to the page holding that row and focuses its link
 * after Back from an editor. While `loading` the head stays and skeleton rows take the place of the body. Sorting a
 * column starts in the sort's own direction (Updated newest first).
 *
 * Round 3 (D-110, D-111): the Title column takes what the others leave (its own width class is ignored) and is never
 * narrower than 15 rem: when the other columns would squeeze it below that, the rows become the same two-line cards
 * the narrow layout uses, until the table fits again (C3-42). One header height (48 px), one Order width (48 px), one
 * tree step (24 px). A third click on a sorted header returns to the list's own order (C3-45). After a move (menu,
 * position dialog or drop) a bar says "Moved X to position N of M" with Undo (Ctrl or Cmd+Z) and, when the row left the
 * page, "Show it"; the row flashes for 1.5 s and focus lands on its kebab, or on the next row's when it left the page
 * (C3-08). Changing page moves focus to the table and scrolls it to just under the toolbar (C3-10).
 */
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronDown, ChevronLeft, ChevronRight, GripVertical, Undo2, X } from "lucide-vue-next";
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { Button } from "@/components/ui/button";
import { say } from "@/lib/announcer";
import { focusSuccessor } from "@/lib/focus";
import { useToastOffset } from "@/lib/toastOffset";
import type { Orderable, Reorder } from "@/workspace/useReorder";
import { defaultDirFor, LIST_PAGE_SIZE, MANUAL_SORT, pageCountOf, type ListQuery } from "./useListQuery";

/** One column of a list. */
export interface ListColumn {
  key: string;
  label: string;
  /** Makes the header a sort button; the value is the `sort` the view understands. */
  sortKey?: string;
  /** The column that carries the disclosure and indentation (the title). */
  tree?: boolean;
  /** Width and alignment classes for the `th` (table mode). */
  class?: string;
  /** Header text only for assistive technology. */
  hideLabel?: boolean;
  /** `hidden` leaves the cell out of the card. */
  card?: "hidden";
}

const props = defineProps<{
  columns: ListColumn[];
  rows: T[];
  /** Names the table for assistive technology: "Points of interest". */
  label: string;
  query?: ListQuery;
  reorder?: Reorder<T>;
  /** Tree depth of a row (0 = top level); rows must come in tree order. */
  depth?: (row: T) => number;
  /** Whether a row has children to collapse. */
  hasChildren?: (row: T) => boolean;
  /** The row's name, for the disclosure button's label. */
  rowLabel?: (row: T) => string;
  /** Whole-row click opens (`open` event). */
  openable?: boolean;
  loading?: boolean;
  /** Shows the trailing menu cell when slot `menu` is given; its header text. */
  menuLabel?: string;
  /** Rows per page; default 50 (D-091). */
  pageSize?: number;
  /** Id of the row whose link takes focus once it is on screen (Back from its editor); its page opens first. */
  rowKeyFocus?: string | null;
}>();
const emit = defineEmits<{ open: [row: T] }>();
const size = computed(() => props.pageSize ?? LIST_PAGE_SIZE);
const localPage = ref(1);
/** The page in force: the URL's when the view passes its `query`, else the table's own. */
const page = computed({
  get: () => props.query?.page.value ?? localPage.value,
  set: (value: number) => {
    if (props.query) props.query.page.value = value;
    else localPage.value = value;
  },
});

const collapsed = ref(new Set<string>());
/** The narrow layout (below 900 px): cards. */
const narrow = ref(false);
/** The table does not fit: the Title would be narrower than {@link MIN_TITLE} px, so the rows are cards (C3-42). */
const tight = ref(false);
const compact = computed(() => narrow.value || tight.value);
/** 15 rem: the narrowest a Title cell may be in table mode. */
const MIN_TITLE = 240;
/** The container width at which the table fits again after it went tight (measured when it went tight). */
let tightNeeds = Number.POSITIVE_INFINITY;
let media: MediaQueryList | null = null;
let resizer: ResizeObserver | null = null;
const onMedia = () => (narrow.value = !!media?.matches);

/** Switches between the table and cards by measuring the Title column, with the width it needs as hysteresis. */
function fit() {
  const el = root.value;
  if (!el || narrow.value) return;
  const width = el.clientWidth;
  if (tight.value) {
    if (width >= tightNeeds) tight.value = false;
    return;
  }
  const th = el.querySelector<HTMLElement>("thead th[data-tree]");
  if (!th) return;
  const title = th.getBoundingClientRect().width;
  if (title > 0 && title < MIN_TITLE - 0.5) {
    tightNeeds = width + (MIN_TITLE - title) + 1;
    tight.value = true;
  }
}
onMounted(() => {
  media = window.matchMedia("(max-width: 899.98px)");
  onMedia();
  media.addEventListener("change", onMedia);
  fit();
  if (root.value && typeof ResizeObserver !== "undefined") {
    resizer = new ResizeObserver(() => fit());
    resizer.observe(root.value);
  }
});
onBeforeUnmount(() => {
  media?.removeEventListener("change", onMedia);
  resizer?.disconnect();
});

function toggle(id: string) {
  const next = new Set(collapsed.value);
  if (!next.delete(id)) next.add(id);
  collapsed.value = next;
}

/** Rows after hiding the subtrees of collapsed rows. */
const visibleRows = computed(() => {
  if (!props.depth || !collapsed.value.size) return props.rows;
  const out: T[] = [];
  let hideBelow: number | null = null;
  for (const row of props.rows) {
    const d = props.depth(row);
    if (hideBelow !== null && d > hideBelow) continue;
    hideBelow = null;
    out.push(row);
    if (collapsed.value.has(row.id)) hideBelow = d;
  }
  return out;
});

const pageCount = computed(() => pageCountOf(visibleRows.value.length, size.value));
const currentPage = computed(() => Math.min(Math.max(page.value, 1), pageCount.value));
/** The rows of the current page. */
const pageRows = computed(() => visibleRows.value.slice((currentPage.value - 1) * size.value, currentPage.value * size.value));
const range = computed(() => ({
  from: visibleRows.value.length ? (currentPage.value - 1) * size.value + 1 : 0,
  to: Math.min(currentPage.value * size.value, visibleRows.value.length),
}));
const root = ref<HTMLElement | null>(null);

// A stale `page` (a link from a longer list, rows that were archived meanwhile) falls back to the last page.
watch([pageCount, () => props.loading], () => {
  if (!props.loading && page.value > pageCount.value) page.value = pageCount.value;
});

/** The element a page change focuses and scrolls to: the table (or the card list), named by `label`. */
const tableEl = () => root.value?.querySelector<HTMLElement>("table, ul.list-none") ?? null;

function goTo(next: number) {
  if (next < 1 || next > pageCount.value || next === currentPage.value) return;
  page.value = next;
  say(`Page ${next} of ${pageCount.value}, showing ${(next - 1) * size.value + 1} to ${Math.min(next * size.value, visibleRows.value.length)} of ${visibleRows.value.length}`);
  // The pager is far below the rows: focus the table and put its head just under the toolbar (D-111, C3-10).
  void nextTick(() => {
    tableEl()?.focus({ preventScroll: true });
    root.value?.scrollIntoView({ block: "start" });
  });
}

async function focusRow(id: string) {
  const index = visibleRows.value.findIndex((r) => r.id === id);
  if (index < 0) return;
  page.value = Math.floor(index / size.value) + 1;
  await nextTick();
  root.value?.querySelector<HTMLElement>(`[data-row-id="${CSS.escape(id)}"] a[href]`)?.focus({ preventScroll: true });
}
let focusedFor: string | null = null;
watch(
  () => [props.rowKeyFocus, props.loading, props.rows.length] as const,
  ([id, loading]) => {
    if (!id || loading || id === focusedFor || !props.rows.some((r) => r.id === id)) return;
    focusedFor = id;
    void focusRow(id);
  },
  { immediate: true, flush: "post" },
);

const showHandle = computed(() => !!props.reorder && (props.reorder.enabled || props.reorder.saving));
const depthOf = (row: T) => props.depth?.(row) ?? 0;
const treeColumn = computed(() => props.columns.find((c) => c.tree) ?? props.columns[0]);
const metaColumns = computed(() => props.columns.filter((c) => c !== treeColumn.value && c.card !== "hidden"));

function ariaSort(c: ListColumn): "ascending" | "descending" | "none" | undefined {
  if (!c.sortKey || !props.query) return undefined;
  return props.query.sort.value === c.sortKey ? (props.query.dir.value === "asc" ? "ascending" : "descending") : "none";
}
/**
 * A click starts the sort in its own direction, a second reverses it, a third returns to the list's own order (manual
 * order, or the view's default sort); the announcer names the result (C3-45).
 */
function sortBy(c: ListColumn) {
  const q = props.query;
  if (!c.sortKey || !q) return;
  if (q.sort.value !== c.sortKey) {
    q.sort.value = c.sortKey; // the direction follows the sort's own default (`useListQuery`)
    return;
  }
  if (q.dir.value === defaultDirFor(c.sortKey) || q.defaultSort === c.sortKey) {
    q.dir.value = q.dir.value === "asc" ? "desc" : "asc";
    return;
  }
  q.sort.value = q.defaultSort;
  say(q.defaultSort === MANUAL_SORT ? "Manual order" : "Back to the default order");
}

/** Width classes of the Title column are ignored (it takes the rest); height classes are ignored everywhere (D-110). */
function thClass(c: ListColumn): string | undefined {
  const own = (c.class ?? "").split(/\s+/).filter((token) => token && !/^h-/.test(token) && !(c.tree && /^w-/.test(token)));
  return own.join(" ") || undefined;
}

const INTERACTIVE = "a, button, input, select, textarea, label, [role=menuitem], [data-no-open]";
function onRowClick(row: T, event: MouseEvent) {
  if (!props.openable || (event.target as HTMLElement).closest(INTERACTIVE)) return;
  if (window.getSelection()?.toString()) return;
  emit("open", row);
}
const dropClass = (row: T) => {
  const line = props.reorder?.dropLine(row);
  return line ? `list-drop-${line}` : "";
};
/** Flash class of the row that just moved (D-111). */
const flashClass = (row: T) => (props.reorder?.flashId === row.id ? "list-flash" : "");

// Moves (D-111) --------------------------------------------------------------------------------------------------

/** The ids on the page before the rows last changed, to know where the moved row stood (and who took its place). */
let idsBefore: string[] = [];
watch(
  () => pageRows.value.map((r) => r.id).join("\u0000"),
  (_now, before) => {
    idsBefore = before ? before.split("\u0000") : [];
  },
  { flush: "sync" },
);
/** The page holding the row that moved, when that is not the page on screen ("Show it"). */
const offPage = ref<number | null>(null);
const moveBar = ref<HTMLElement | null>(null);
useToastOffset(computed(() => moveBar.value));

const kebabOf = (id: string) => root.value?.querySelector<HTMLElement>(`[data-row-id="${CSS.escape(id)}"] button[aria-label^="Actions for"]`) ?? null;

/** Once the rows have their new order: scroll the moved row into view and focus its kebab; if it left the page, the next row's. */
watch(
  () => props.reorder?.moves,
  async (moves, before) => {
    const moved = props.reorder?.flashId;
    if (!moves || moves === before || !moved) return;
    const slot = idsBefore.indexOf(moved);
    await nextTick();
    const index = visibleRows.value.findIndex((r) => r.id === moved);
    if (index < 0) return;
    const rowPage = Math.floor(index / size.value) + 1;
    if (rowPage === currentPage.value) {
      offPage.value = null;
      const button = kebabOf(moved);
      button?.focus({ preventScroll: true });
      button?.closest("[data-row-id]")?.scrollIntoView({ block: "nearest" });
      return;
    }
    // The row left this page: say where it went, and give focus to the row that now stands where it stood.
    offPage.value = rowPage;
    const rows = pageRows.value;
    const next = rows[Math.min(Math.max(slot, 0), rows.length - 1)];
    const button = next ? kebabOf(next.id) : null;
    if (button) button.focus({ preventScroll: true });
    else tableEl()?.focus({ preventScroll: true });
  },
);
watch(page, () => {
  if (offPage.value === currentPage.value) offPage.value = null;
});

/** "Show it": opens the page of the moved row, scrolls to it, flashes it and focuses its kebab. */
async function showMoved() {
  const move = props.reorder?.lastMove;
  if (!move || offPage.value === null) return;
  page.value = offPage.value;
  offPage.value = null;
  await nextTick();
  props.reorder?.highlight(move.id);
  const button = kebabOf(move.id);
  button?.focus({ preventScroll: true });
  button?.closest("[data-row-id]")?.scrollIntoView({ block: "center" });
}

/** Closes the bar; when focus is inside it, focus goes to a kebab, never to the page body. */
function dismissMove() {
  const move = props.reorder?.lastMove;
  focusSuccessor(moveBar.value, [move ? kebabOf(move.id) : null, "main h1"]);
  props.reorder?.clearLastMove();
  offPage.value = null;
}

// The bar stays for 30 s (the author may want to look first); a newer move restarts it.
let barTimer: ReturnType<typeof setTimeout> | undefined;
watch(
  () => props.reorder?.lastMove?.seq,
  (seq) => {
    clearTimeout(barTimer);
    if (seq) barTimer = setTimeout(dismissMove, 30000);
    else offPage.value = null;
  },
);
onBeforeUnmount(() => clearTimeout(barTimer));

/** Ctrl or Cmd+Z undoes the last move while the bar is up, unless the author is typing or a dialog is open. */
function onUndoKey(event: KeyboardEvent) {
  if (event.key.toLowerCase() !== "z" || !(event.ctrlKey || event.metaKey) || event.shiftKey || event.altKey || event.defaultPrevented) return;
  if (!props.reorder?.lastMove) return;
  const target = event.target as HTMLElement | null;
  if (target?.closest("input, textarea, select, [contenteditable=''], [contenteditable='true']")) return;
  if (document.querySelector("[role='dialog'], [role='alertdialog'], [role='menu']")) return;
  event.preventDefault();
  void props.reorder.undo();
}
onMounted(() => document.addEventListener("keydown", onUndoKey));
onBeforeUnmount(() => document.removeEventListener("keydown", onUndoKey));

const SKELETON_ROWS = 6;
const TRANSLATIONS_KEY = "translations";
</script>

<template>
  <div ref="root" class="list-scope" :aria-busy="loading ? 'true' : undefined">
    <p class="sr-only" role="status" aria-live="polite">{{ loading ? `Loading ${label.toLowerCase()}` : reorder?.announcement }}</p>

    <table v-if="!compact" :aria-label="label" tabindex="-1" class="w-full table-fixed border-separate border-spacing-0 text-sm">
      <thead>
        <tr>
          <th v-if="reorder" scope="col" class="list-th list-th-order"><span class="sr-only">Order</span></th>
          <th
            v-for="c in columns"
            :key="c.key"
            scope="col"
            class="list-th"
            :class="[thClass(c), c.key === TRANSLATIONS_KEY && 'list-th-translations']"
            :data-tree="c === treeColumn ? '' : undefined"
            :aria-sort="ariaSort(c)"
          >
            <button v-if="c.sortKey && query" type="button" class="list-sort hit-44" :disabled="loading" @click="sortBy(c)">
              <span :class="c.hideLabel && 'sr-only'">{{ c.label }}</span>
              <ArrowUp v-if="ariaSort(c) === 'ascending'" class="size-4" aria-hidden="true" />
              <ArrowDown v-else-if="ariaSort(c) === 'descending'" class="size-4" aria-hidden="true" />
              <ArrowUpDown v-else class="size-4 text-muted-foreground" aria-hidden="true" />
            </button>
            <span v-else :class="c.hideLabel && 'sr-only'">{{ c.label }}</span>
          </th>
          <th v-if="$slots.menu" scope="col" class="list-th w-14"><span class="sr-only">{{ menuLabel ?? "Actions" }}</span></th>
        </tr>
      </thead>
      <tbody v-if="loading" class="animate-skeleton" aria-hidden="true">
        <tr v-for="n in SKELETON_ROWS" :key="n" class="list-row list-row-skeleton">
          <td v-if="reorder" class="list-td list-td-order"></td>
          <td v-for="(c, ci) in columns" :key="c.key" class="list-td">
            <div class="h-4 rounded-sm bg-muted" :class="ci === 0 ? 'w-2/3' : 'w-1/2'"></div>
            <div v-if="ci === 0" class="mt-2 h-3 w-1/3 rounded-sm bg-muted"></div>
          </td>
          <td v-if="$slots.menu" class="list-td w-14"></td>
        </tr>
      </tbody>
      <tbody v-else>
        <tr
          v-for="(row, index) in pageRows"
          :key="row.id"
          :data-row-id="row.id"
          class="list-row"
          :class="[dropClass(row), flashClass(row), openable && 'cursor-pointer']"
          @click="onRowClick(row, $event)"
          @dragover="reorder?.dragOver(row, $event)"
          @drop="reorder?.drop(row, $event)"
        >
          <td v-if="reorder" class="list-td list-td-order !pr-0">
            <span
              v-if="showHandle"
              class="inline-flex size-8 cursor-grab items-center justify-center rounded-sm text-muted-foreground hover:bg-surface-hover hover:text-foreground active:cursor-grabbing"
              :draggable="reorder.enabled"
              aria-hidden="true"
              title="Drag to reorder"
              @dragstart="reorder.dragStart(row, $event)"
              @dragend="reorder.dragEnd()"
            >
              <GripVertical class="size-5" />
            </span>
          </td>
          <td v-for="c in columns" :key="c.key" class="list-td" :class="c === treeColumn && 'list-tree-cell'">
            <div v-if="c === treeColumn" class="relative flex min-w-0 items-start gap-1" :style="{ paddingInlineStart: `${depthOf(row) * 24}px` }">
              <span v-if="depthOf(row) > 0" class="list-guide" :style="{ insetInlineStart: `${depthOf(row) * 24 - 12}px` }" aria-hidden="true"></span>
              <button
                v-if="depth && hasChildren?.(row)"
                type="button"
                class="-ml-1 inline-flex size-8 shrink-0 items-center justify-center rounded-sm text-ink-2 hover:bg-surface-hover [@media(pointer:coarse)]:size-11"
                :aria-expanded="!collapsed.has(row.id)"
                :aria-label="`Sub-items of ${rowLabel?.(row) ?? 'this row'}`"
                @click="toggle(row.id)"
              >
                <ChevronRight v-if="collapsed.has(row.id)" class="size-4" aria-hidden="true" />
                <ChevronDown v-else class="size-4" aria-hidden="true" />
              </button>
              <span v-else-if="depth" class="-ml-1 size-8 shrink-0 [@media(pointer:coarse)]:size-11" aria-hidden="true"></span>
              <div class="min-w-0 flex-1" dir="auto"><slot :name="`cell-${c.key}`" :row="row" :index="index" /></div>
            </div>
            <slot v-else :name="`cell-${c.key}`" :row="row" :index="index" />
          </td>
          <td v-if="$slots.menu" class="list-td w-14 !px-1 text-right"><slot name="menu" :row="row" /></td>
        </tr>
      </tbody>
    </table>

    <ul v-else :aria-label="label" tabindex="-1" class="m-0 list-none p-0">
      <template v-if="loading">
        <li v-for="n in SKELETON_ROWS" :key="n" class="list-card list-card-skeleton animate-skeleton" aria-hidden="true">
          <div class="h-4 w-2/3 rounded-sm bg-muted"></div>
          <div class="mt-2 h-3 w-1/3 rounded-sm bg-muted"></div>
        </li>
      </template>
      <li
        v-for="(row, index) in loading ? [] : pageRows"
        :key="row.id"
        :data-row-id="row.id"
        class="list-card"
        :class="[dropClass(row), flashClass(row), openable && 'cursor-pointer']"
        @click="onRowClick(row, $event)"
      >
        <div class="flex min-w-0 items-start gap-1" :style="{ paddingInlineStart: `${depthOf(row) * 16}px` }">
          <button
            v-if="depth && hasChildren?.(row)"
            type="button"
            class="inline-flex size-11 shrink-0 items-center justify-center rounded-sm text-ink-2"
            :aria-expanded="!collapsed.has(row.id)"
            :aria-label="`Sub-items of ${rowLabel?.(row) ?? 'this row'}`"
            @click="toggle(row.id)"
          >
            <ChevronRight v-if="collapsed.has(row.id)" class="size-4" aria-hidden="true" />
            <ChevronDown v-else class="size-4" aria-hidden="true" />
          </button>
          <div class="min-w-0 flex-1 py-1" dir="auto"><slot :name="`cell-${treeColumn.key}`" :row="row" :index="index" /></div>
          <div v-if="$slots.menu" class="shrink-0"><slot name="menu" :row="row" /></div>
        </div>
        <div class="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1.5" :style="{ paddingInlineStart: `${depthOf(row) * 16}px` }">
          <div v-for="c in metaColumns" :key="c.key" class="min-w-0">
            <span class="sr-only">{{ c.label }}: </span>
            <slot :name="`cell-${c.key}`" :row="row" :index="index" />
          </div>
        </div>
      </li>
    </ul>

    <nav v-if="!loading && pageCount > 1" :aria-label="`Pages of ${label.toLowerCase()}`" class="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border px-4 py-3">
      <p class="tabular text-sm text-ink-2">Showing {{ range.from }}&ndash;{{ range.to }} of {{ visibleRows.length }}</p>
      <div class="ml-auto flex items-center gap-2">
        <Button variant="secondary" size="sm" :disabled-reason="currentPage === 1 ? 'You are on the first page' : undefined" @click="goTo(currentPage - 1)">
          <ChevronLeft aria-hidden="true" />Previous
        </Button>
        <span class="tabular text-sm text-ink-2">Page {{ currentPage }} of {{ pageCount }}</span>
        <Button variant="secondary" size="sm" :disabled-reason="currentPage === pageCount ? 'You are on the last page' : undefined" @click="goTo(currentPage + 1)">
          Next<ChevronRight aria-hidden="true" />
        </Button>
      </div>
    </nav>

    <div
      v-if="reorder?.lastMove"
      ref="moveBar"
      class="sticky bottom-4 z-raised m-3 flex flex-wrap items-center gap-2 rounded-md border border-input bg-card px-3 py-1.5 text-sm shadow-2"
      role="group"
      aria-label="Last move"
    >
      <span class="min-w-0 flex-1 [overflow-wrap:anywhere]">
        Moved <bdi class="font-semibold">{{ reorder.lastMove.title }}</bdi> to position {{ reorder.lastMove.position }} of {{ reorder.lastMove.count }}.
        <span v-if="offPage" class="text-ink-2">It is on page {{ offPage }}.</span>
      </span>
      <Button v-if="offPage" variant="secondary" size="sm" @click="showMoved">Show it</Button>
      <Button variant="secondary" size="sm" aria-keyshortcuts="Control+Z Meta+Z" @click="reorder.undo()">
        <Undo2 aria-hidden="true" />Undo<span class="sr-only"> move of {{ reorder.lastMove.title }}</span>
      </Button>
      <Button variant="ghost" size="icon" label="Dismiss" @click="dismissMove"><X aria-hidden="true" /></Button>
    </div>
  </div>
</template>


<style scoped src="@/styles/list-table.css"></style>
