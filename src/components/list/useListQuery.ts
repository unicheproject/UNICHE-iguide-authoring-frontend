import { computed, nextTick, onBeforeUnmount, reactive, ref, watch, type ComputedRef, type Ref } from "vue";
import { onBeforeRouteLeave, useRoute, useRouter, type LocationQuery } from "vue-router";
import { say } from "@/lib/announcer";
import type { ActiveFilter } from "@/workspace/listFilters";

/** The status segments of a Content list; "not archived" is the default (D-076, Q-010). */
export type ListStatus = "NOT_ARCHIVED" | "ACTIVE" | "DRAFT" | "ARCHIVED";
export type SortDirection = "asc" | "desc";

/** Segment order and wording of the status control. */
export const LIST_STATUS_OPTIONS: { value: ListStatus; label: string }[] = [
  { value: "NOT_ARCHIVED", label: "Not archived" },
  { value: "ACTIVE", label: "Active" },
  { value: "DRAFT", label: "Draft" },
  { value: "ARCHIVED", label: "Archived" },
];

/** A row's status as the lists know it. */
export interface StatusRow {
  status: string;
  hasWorkingCopy?: boolean;
}

/** Whether a row belongs to a status segment. */
export function matchesStatus(row: StatusRow, status: ListStatus): boolean {
  return status === "NOT_ARCHIVED" ? row.status !== "ARCHIVED" : row.status === status;
}

/** Row counts for the four segments, from the loaded list. */
export function statusCounts(rows: StatusRow[]): Record<ListStatus, number> {
  return {
    NOT_ARCHIVED: rows.filter((r) => matchesStatus(r, "NOT_ARCHIVED")).length,
    ACTIVE: rows.filter((r) => matchesStatus(r, "ACTIVE")).length,
    DRAFT: rows.filter((r) => matchesStatus(r, "DRAFT")).length,
    ARCHIVED: rows.filter((r) => matchesStatus(r, "ARCHIVED")).length,
  };
}

/** The sort value that means "the order the author arranged" (`sortOrder`). */
export const MANUAL_SORT = "manual";

/** Rows a list page renders (D-091): the loaders read every page of the API, the table shows this many at a time. */
export const LIST_PAGE_SIZE = 50;

/**
 * The direction a sort starts in: Updated is newest first (descending), every other sort ascending (A to Z, Active
 * first, least translated first). The URL names `dir` only when it differs from this (C2-36).
 */
export function defaultDirFor(sort: string): SortDirection {
  return sort === "updated" ? "desc" : "asc";
}

/** The words of a sort direction, so the control never rests on an arrow alone: "Newest first", "A to Z". */
export function sortDirectionLabel(sort: string, dir: SortDirection): string {
  const asc = dir === "asc";
  switch (sort) {
    case "updated":
      return asc ? "Oldest first" : "Newest first";
    case "title":
    case "name":
      return asc ? "A to Z" : "Z to A";
    case "status":
      return asc ? "Active first" : "Archived first";
    case "translations":
      return asc ? "Least translated first" : "Most translated first";
    default:
      return asc ? "Ascending" : "Descending";
  }
}

/** How many pages `total` rows make (at least 1). */
export function pageCountOf(total: number, size = LIST_PAGE_SIZE): number {
  return Math.max(1, Math.ceil(total / size));
}

/** The reads a list can do without; a failure of one leaves its detail out of the rows but never hides them (C3-87). */
export type ListSource = "categories" | "places" | "triggers";

export interface ListQueryOptions {
  /** Sort in force when the URL names none; default {@link MANUAL_SORT}. */
  defaultSort?: string;
  /** How long typing waits before the address bar follows, in ms. */
  debounce?: number;
}

/** The filter state of one Content list, stored in the URL query (D-076). Returned by {@link useListQuery}. */
export interface ListQuery {
  /** Search text (`q`). */
  q: Ref<string>;
  /** Status segment (`status`). */
  status: Ref<ListStatus>;
  /** Only rows with pending changes (`pending=1`). */
  pending: Ref<boolean>;
  /** Language the search looks in (`lang`); empty for every language. */
  lang: Ref<string>;
  /** Language checked by "Needs translation" (`missing`); empty when the toggle is off. */
  missing: Ref<string>;
  /** Category filter (`cat`): empty, `NONE` or a Category id. */
  cat: Ref<string>;
  /** Featured only (`featured=1`). */
  featured: Ref<boolean>;
  /** Sort key (`sort`). */
  sort: Ref<string>;
  /** Sort direction (`dir`); starts as {@link defaultDirFor} the sort and follows it when the sort changes. */
  dir: Ref<SortDirection>;
  /** Alias of `dir`, the name the list contract uses. */
  sortDir: Ref<SortDirection>;
  /** The page shown, 1-based (`page`); back to 1 whenever a filter, the search or the sort changes. */
  page: Ref<number>;
  defaultSort: string;
  /** Any filter other than sort differs from its default. */
  isFiltered: ComputedRef<boolean>;
  /** Rows are in the author's own order, so reordering is meaningful. */
  isManualOrder: ComputedRef<boolean>;
  /**
   * Manual order and nothing but the default status segment hides rows. Pass to `useReorder({ canReorder })`, with
   * `visible: (row) => matchesStatus(row, query.status.value)` so a move steps over hidden rows.
   */
  canReorder: ComputedRef<boolean>;
  /**
   * The failure of each optional read, or null while it is fine (D-110, C3-87). A view reports with `reportError`; the
   * view renders `ListSourceNotice :errors="query.errors"` once, so a failed Categories, Places or Triggers read is
   * said (with the request id and "Try again") instead of vanishing.
   */
  errors: Record<ListSource, unknown>;
  /** Records (or, with `null`, clears) the failure of one optional read. */
  reportError: (source: ListSource, error: unknown) => void;
  /** Why the rows cannot be reordered right now, or null; shown by `RowMenu` and the toolbar. */
  reorderReason: ComputedRef<string | null>;
  /** Removable chips for the filters in force; `extra` adds the view's own (a Category name); `languages` names language codes. */
  chips: (extra?: ActiveFilter[], languages?: { languageCode: string; displayName: string }[]) => ActiveFilter[];
  /** Back to the defaults (sort kept); also called by every "Clear filters" button. */
  clear: () => void;
  /** Returns to Manual order and clears everything that hides rows. */
  restoreManualOrder: () => void;
}

const STATUSES = new Set<string>(LIST_STATUS_OPTIONS.map((o) => o.value));
const first = (value: LocationQuery[string] | undefined): string => (Array.isArray(value) ? (value[0] ?? "") : (value ?? ""));

/**
 * Filter, search and sort state of a list, kept in the URL query (`q`, `status`, `pending`, `lang`, `missing`, `cat`,
 * `featured`, `sort`, `dir`) so Back from an editor restores it and a link shares it. Defaults stay out of the URL. Typing
 * is debounced; everything else writes at once with `router.replace` (no history entry per keystroke). The state follows
 * the address bar when it changes (Back, a link). Call it once per list view, in `<script setup>`.
 */
export function useListQuery(options: ListQueryOptions = {}): ListQuery {
  const route = useRoute();
  const router = useRouter();
  const defaultSort = options.defaultSort ?? MANUAL_SORT;
  const routeName = route.name;

  const read = (query: LocationQuery) => ({
    q: first(query.q),
    status: (STATUSES.has(first(query.status)) ? first(query.status) : "NOT_ARCHIVED") as ListStatus,
    pending: first(query.pending) === "1",
    lang: first(query.lang),
    missing: first(query.missing),
    cat: first(query.cat),
    featured: first(query.featured) === "1",
    sort: first(query.sort) || defaultSort,
    dir: (first(query.dir) === "desc" || first(query.dir) === "asc" ? first(query.dir) : defaultDirFor(first(query.sort) || defaultSort)) as SortDirection,
    page: Math.max(1, Number.parseInt(first(query.page), 10) || 1),
  });
  const initial = read(route.query);

  const q = ref(initial.q);
  const status = ref<ListStatus>(initial.status);
  const pending = ref(initial.pending);
  const lang = ref(initial.lang);
  const missing = ref(initial.missing);
  const cat = ref(initial.cat);
  const featured = ref(initial.featured);
  const sort = ref(initial.sort);
  const dir = ref<SortDirection>(initial.dir);
  const page = ref(initial.page);
  /** True while the controls copy the address bar, so that copy does not reset the page or the direction. */
  let applyingUrl = false;

  const params = (): Record<string, string> => {
    const out: Record<string, string> = {};
    if (q.value.trim()) out.q = q.value;
    if (status.value !== "NOT_ARCHIVED") out.status = status.value;
    if (pending.value) out.pending = "1";
    if (lang.value) out.lang = lang.value;
    if (missing.value) out.missing = missing.value;
    if (cat.value) out.cat = cat.value;
    if (featured.value) out.featured = "1";
    if (sort.value !== defaultSort) out.sort = sort.value;
    if (dir.value !== defaultDirFor(sort.value)) out.dir = dir.value;
    if (page.value > 1) out.page = String(page.value);
    return out;
  };
  const KEYS = ["q", "status", "pending", "lang", "missing", "cat", "featured", "sort", "dir", "page"];
  const serialized = (query: Record<string, unknown>) => JSON.stringify(KEYS.map((k) => first(query[k] as LocationQuery[string])));

  let timer: ReturnType<typeof setTimeout> | undefined;
  function writeUrl() {
    clearTimeout(timer);
    // The author may already have left for an editor; never write this list's query onto another route.
    if (route.name !== routeName) return;
    const next = params();
    if (serialized(next) === serialized(route.query)) return;
    const rest = Object.fromEntries(Object.entries(route.query).filter(([k]) => !KEYS.includes(k)));
    void router.replace({ query: { ...rest, ...next }, hash: route.hash });
  }

  // A new sort starts in its own direction; any change that alters the rows starts again on page 1. Synchronous, so the
  // address bar copy below (`applyingUrl`) can switch them off around its assignments.
  watch(sort, (value) => {
    if (!applyingUrl) dir.value = defaultDirFor(value);
  }, { flush: "sync" });
  watch([q, status, pending, lang, missing, cat, featured, sort, dir], () => {
    if (!applyingUrl) page.value = 1;
  }, { flush: "sync" });
  watch([status, pending, lang, missing, cat, featured, sort, dir, page], writeUrl);
  watch(q, () => {
    clearTimeout(timer);
    timer = setTimeout(writeUrl, options.debounce ?? 250);
  });

  // The address bar changed (Back, Forward, a pasted link): the controls follow it.
  watch(
    () => route.query,
    (query) => {
      if (route.name !== routeName) return;
      const next = read(query);
      if (serialized(params()) === serialized(query)) return;
      applyingUrl = true;
      q.value = next.q;
      status.value = next.status;
      pending.value = next.pending;
      lang.value = next.lang;
      missing.value = next.missing;
      cat.value = next.cat;
      featured.value = next.featured;
      sort.value = next.sort;
      dir.value = next.dir;
      page.value = next.page;
      applyingUrl = false;
    },
  );
  onBeforeUnmount(() => clearTimeout(timer));

  const isManualOrder = computed(() => sort.value === MANUAL_SORT);
  const hidesRows = computed(() => !!q.value.trim() || status.value !== "NOT_ARCHIVED" || pending.value || !!missing.value || !!cat.value || featured.value);
  const isFiltered = computed(() => hidesRows.value || !!lang.value);
  const canReorder = computed(() => isManualOrder.value && !hidesRows.value);
  const reorderReason = computed(() => {
    if (canReorder.value) return null;
    if (!isManualOrder.value && hidesRows.value) return "Clear filters and use Manual order to reorder";
    return isManualOrder.value ? "Clear filters to reorder" : "Use Manual order to reorder";
  });

  const errors = reactive<Record<ListSource, unknown>>({ categories: null, places: null, triggers: null });
  const reportError = (source: ListSource, error: unknown) => {
    errors[source] = error ?? null;
  };

  function clear() {
    q.value = "";
    status.value = "NOT_ARCHIVED";
    pending.value = false;
    lang.value = "";
    missing.value = "";
    cat.value = "";
    featured.value = false;
    clearTimeout(timer);
    writeUrl();
  }

  function chips(extra: ActiveFilter[] = [], languages: { languageCode: string; displayName: string }[] = []): ActiveFilter[] {
    const out: ActiveFilter[] = [];
    const name = (code: string) => languages.find((l) => l.languageCode === code)?.displayName ?? code;
    if (q.value.trim()) out.push({ key: "q", label: `Search: ${q.value.trim()}`, clear: () => (q.value = "") });
    if (status.value !== "NOT_ARCHIVED") {
      const label = LIST_STATUS_OPTIONS.find((o) => o.value === status.value)?.label ?? status.value;
      out.push({ key: "status", label: `Status: ${label}`, clear: () => (status.value = "NOT_ARCHIVED") });
    }
    if (pending.value) out.push({ key: "pending", label: "Pending changes", clear: () => (pending.value = false) });
    if (missing.value) out.push({ key: "missing", label: `Needs translation: ${name(missing.value)}`, clear: () => (missing.value = "") });
    if (lang.value) out.push({ key: "lang", label: `Search in: ${name(lang.value)}`, clear: () => (lang.value = "") });
    if (featured.value) out.push({ key: "featured", label: "Featured only", clear: () => (featured.value = false) });
    return [...out, ...extra];
  }

  return {
    q, status, pending, lang, missing, cat, featured, sort, dir, sortDir: dir, page, defaultSort,
    isFiltered, isManualOrder, canReorder, reorderReason, chips, clear, errors, reportError,
    restoreManualOrder: () => {
      clear();
      sort.value = MANUAL_SORT;
    },
  };
}

interface ScrollMemory {
  top: number;
  /** The `data-row-id` of the row the author last used (title link, menu), so Back lands on it. */
  rowId: string | null;
}
const scrollMemory = new Map<string, ScrollMemory>();

/** The id of the list row a node sits in (`ListTable` marks its rows with `data-row-id`). */
function rowIdOf(node: EventTarget | null): string | null {
  return node instanceof Element ? (node.closest<HTMLElement>("[data-row-id]")?.dataset.rowId ?? null) : null;
}

/**
 * Remembers how far a list was scrolled and which row the author used when they leave it, and puts both back when they
 * return with Back (C2-41): the scroll within 50 px, and focus on that row's link. Fresh visits start at the top. The
 * position is read in a route-leave guard, before the next screen replaces the page frame and its scroll height. Call
 * once; `ready` turns true when the rows are on screen (after loading). The scrolling region is `#main`, else the
 * window. Memory only. Returns `rowKeyFocus`, the id of the row to focus (pass it to `ListTable row-key-focus`, which
 * also moves to the page that holds it); the composable focuses the row itself as well.
 */
export function useScrollRestore(ready: Ref<boolean>): { rowKeyFocus: Ref<string | null> } {
  const route = useRoute();
  const key = route.path;
  const scroller = () => document.getElementById("main");
  const cameBack = (window.history.state as { forward?: string | null } | null)?.forward != null;
  const rowKeyFocus = ref<string | null>(null);
  let lastRow: string | null = null;
  let saved = false;

  const remember = (event: Event) => {
    const id = rowIdOf(event.target);
    if (id) lastRow = id;
  };
  document.addEventListener("focusin", remember);
  document.addEventListener("pointerdown", remember, true);

  function save() {
    saved = true;
    scrollMemory.set(key, { top: scroller()?.scrollTop ?? window.scrollY, rowId: lastRow });
  }
  onBeforeRouteLeave(() => {
    save();
  });
  onBeforeUnmount(() => {
    document.removeEventListener("focusin", remember);
    document.removeEventListener("pointerdown", remember, true);
    if (!saved) save();
  });

  const stop = watch(
    ready,
    async (isReady) => {
      if (!isReady) return;
      stop();
      const memory = scrollMemory.get(key);
      if (!cameBack || !memory) return;
      rowKeyFocus.value = memory.rowId;
      await nextTick();
      const el = scroller();
      // The rows may still be settling (images, a late page switch): try for a few frames until the position holds.
      for (let attempt = 0; attempt < 12; attempt++) {
        if (el) el.scrollTop = memory.top;
        else window.scrollTo({ top: memory.top });
        await new Promise((resolve) => requestAnimationFrame(resolve));
        if (Math.abs((el ? el.scrollTop : window.scrollY) - memory.top) < 2) break;
      }
      if (memory.rowId) {
        const link = document.querySelector<HTMLElement>(`[data-row-id="${CSS.escape(memory.rowId)}"] a[href], [data-row-id="${CSS.escape(memory.rowId)}"] button`);
        link?.focus({ preventScroll: true });
      }
    },
    { immediate: true },
  );
  return { rowKeyFocus };
}

/** Where the segment counts and "Showing N of M" come from: the rows of the active status segment, whatever else is on. */
export function segmentTotal(rows: StatusRow[], status: ListStatus): number {
  return rows.filter((r) => matchesStatus(r, status)).length;
}

/**
 * Announces the settled result politely after a search, filter, sort or page change (not on first load, not while
 * `ready` is false): "2 of 55 points of interest", "Sorted by Updated, newest first", "Page 2 of 4". `total` is the
 * count of the active segment (`segmentTotal`), so the denominator matches the status shown. Debounced so typing
 * announces the settled result once.
 */
export function useResultAnnouncer(
  shown: Ref<number>,
  total: Ref<number>,
  ready: Ref<boolean>,
  noun = "results",
  sort?: { query: ListQuery; options: { value: string; label: string }[] },
): void {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let primed = false;
  const sortSentence = () => {
    if (!sort || sort.query.sort.value === MANUAL_SORT) return "Manual order";
    const label = sort.options.find((o) => o.value === sort.query.sort.value)?.label ?? sort.query.sort.value;
    return `Sorted by ${label}, ${sortDirectionLabel(sort.query.sort.value, sort.query.dir.value).toLowerCase()}`;
  };
  watch(
    [shown, total, ready],
    ([s, t, isReady], [previousShown]) => {
      clearTimeout(timer);
      if (!isReady) return;
      if (!primed) {
        primed = true;
        return;
      }
      if (s === previousShown) return;
      timer = setTimeout(() => say(`${s} of ${t} ${noun}`), 500);
    },
    { flush: "post" },
  );
  if (sort) {
    watch([() => sort.query.sort.value, () => sort.query.dir.value], () => {
      if (!ready.value || !primed) return;
      clearTimeout(timer);
      timer = setTimeout(() => say(sortSentence()), 300);
    });
  }
  onBeforeUnmount(() => clearTimeout(timer));
}
