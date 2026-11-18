import { ApiError, apiRequest } from "./api";
import { CONTENT_KINDS, fetchContentCounts, type ContentCount } from "./overview";
import { fetchProjectLanguages } from "./languages";
import { listNavigations } from "./navigation";
import { fetchSettings, type ProjectSettings } from "./settings";

/**
 * Everything the Dashboard shows besides readiness (D-077). Only data the API provides: list `totalElements` with
 * `status` and `pending` filters, and `GET /settings`. No translation completeness and no packages: those endpoints do
 * not exist yet (GAPS.md G-023, G-024), so nothing here approximates them.
 */

/** The six Resource kinds that carry Working Copies and count towards "has content" (Assets do not: C1-52). */
export const RESOURCE_KINDS = ["places", "pois", "routes", "guides", "events", "categories"] as const;
export type ResourceKindPath = (typeof RESOURCE_KINDS)[number];

/** The Working Copies shown at most in the "Waiting for you to apply" list. */
export const PENDING_ROWS = 10;
/** Rows asked per request when every Working Copy is read, and the most pages read per kind (a safety stop). */
const PENDING_PAGE_SIZE = 100;
const PENDING_MAX_PAGES = 10;

export interface PendingItem {
  id: string;
  kind: ResourceKindPath;
  title: string;
  savedAt: string | null;
}

export interface PendingChanges {
  /** All Working Copies of the six kinds, counted from the rows read (not from the lists' totals). */
  total: number;
  /** Every Working Copy, most recently saved first; the view shows the first {@link PENDING_ROWS}. */
  items: PendingItem[];
  /** Working Copies per kind, for the "See all" links to each pending-filtered list. */
  perKind: Record<ResourceKindPath, number>;
}

export interface DashboardData {
  counts: ContentCount[];
  /** Non-archived Resources of the six kinds, DRAFT included. Zero means the first-run guide. */
  resourceTotal: number;
  /** ACTIVE Resources of the six kinds: "Ready" is only asserted above zero. */
  activeTotal: number;
  /** Draft totals per kind, to point "Activate content" at the first list that has drafts. */
  draftByKind: Record<ResourceKindPath, number>;
  pending: PendingChanges;
  /**
   * Why the Working Copies could not be read, or null. One failed list must not blank the Dashboard (C3-59): the Status
   * card and the counts stay, and `pending` is then empty.
   */
  pendingError: ApiError | null;
  /** Null when the Project is not initialized (`409 PROJECT_NOT_INITIALIZED`) or the settings cannot be read. */
  settings: ProjectSettings | null;
  /** Whether the main menu has an item (step 4 of the guide); null when the menu cannot be read. */
  navigationFilled: boolean | null;
}

interface RawRow {
  id: string;
  slug?: string | null;
  code?: string | null;
  internalName?: string | null;
  hasWorkingCopy?: boolean;
  workingCopyUpdatedAt?: string | null;
  translations?: Record<string, { title?: string | null; name?: string | null }>;
}

interface RawPage {
  content: RawRow[];
  totalElements: number;
  totalPages?: number;
}

function rowTitle(row: RawRow, defaultLanguage: string | null): string {
  const translations = row.translations ?? {};
  const own = defaultLanguage ? translations[defaultLanguage] : undefined;
  const any = Object.values(translations).find((t) => (t.title ?? t.name)?.trim());
  return (own?.title ?? own?.name)?.trim() || row.internalName?.trim() || (any?.title ?? any?.name)?.trim() || row.slug || row.code || row.id;
}

/** Every row of `pending=true` for one kind, page after page (the list pages; the Dashboard must not guess from page 1). */
async function fetchPendingKind(projectId: string, kind: ResourceKindPath, signal?: AbortSignal): Promise<RawRow[]> {
  const rows: RawRow[] = [];
  for (let page = 0; page < PENDING_MAX_PAGES; page++) {
    const result = await apiRequest<RawPage>(
      `/projects/${encodeURIComponent(projectId)}/${kind}?pending=true&size=${PENDING_PAGE_SIZE}&page=${page}`,
      { signal },
    );
    rows.push(...result.content);
    if (result.content.length === 0 || page + 1 >= (result.totalPages ?? 1)) break;
  }
  return rows;
}

interface RawPending {
  kind: ResourceKindPath;
  rows: RawRow[];
}

/** Every Working Copy of the six kinds as raw rows (one request chain per kind, in parallel). */
async function fetchPendingRaw(projectId: string, signal?: AbortSignal): Promise<RawPending[]> {
  return Promise.all(
    RESOURCE_KINDS.map(async (kind) => ({ kind, rows: (await fetchPendingKind(projectId, kind, signal)).filter((row) => row.hasWorkingCopy !== false) })),
  );
}

/** Titles in the default language, newest saved first, with honest totals (all pages). */
function toPendingChanges(raw: RawPending[], defaultLanguage: string | null): PendingChanges {
  const items: PendingItem[] = raw.flatMap(({ kind, rows }) =>
    rows.map((row) => ({ id: row.id, kind, title: rowTitle(row, defaultLanguage), savedAt: row.workingCopyUpdatedAt ?? null })),
  );
  items.sort((a, b) => (b.savedAt ?? "").localeCompare(a.savedAt ?? ""));
  const perKind = Object.fromEntries(raw.map(({ kind, rows }) => [kind, rows.length])) as Record<ResourceKindPath, number>;
  return { total: items.length, items, perKind };
}

/** Working Copies of the six kinds, newest saved first, with honest totals (all pages, one request chain per kind). */
export async function fetchPendingChanges(
  projectId: string,
  defaultLanguage: string | null,
  signal?: AbortSignal,
): Promise<PendingChanges> {
  return toPendingChanges(await fetchPendingRaw(projectId, signal), defaultLanguage);
}

/** Whether the main menu has at least one item: step 4 of the first-run guide. Null when it cannot be read. */
async function hasNavigationItems(projectId: string, signal?: AbortSignal): Promise<boolean | null> {
  try {
    const navigations = await listNavigations(projectId, signal);
    return navigations.some((n) => n.items.length > 0);
  } catch (e) {
    if (e instanceof ApiError) return null;
    throw e;
  }
}

/**
 * Counts, Working Copies, settings, the default language and the menu for the Dashboard, all requested at once
 * (C2-73). Rejects with the first `ApiError` of the counts; a failed Working Copies read is returned as `pendingError`.
 */
export async function fetchDashboardData(projectId: string, signal?: AbortSignal): Promise<DashboardData> {
  const [counts, pendingRaw, settings, languages, navigationFilled] = await Promise.all([
    fetchContentCounts(projectId, signal),
    fetchPendingRaw(projectId, signal).catch((e: unknown) => {
      if (e instanceof ApiError) return e;
      throw e;
    }),
    fetchSettings(projectId, signal).catch((e: unknown) => {
      // Settings are one muted line; a Project without them (409) or a failed read must not hide the rest.
      if (e instanceof ApiError) return null;
      throw e;
    }),
    fetchProjectLanguages(projectId, signal).catch((e: unknown) => {
      if (e instanceof ApiError) return null;
      throw e;
    }),
    hasNavigationItems(projectId, signal),
  ]);
  const defaultLanguage = languages?.languages.find((l) => l.isDefault)?.languageCode ?? null;
  const six = counts.filter((c) => (RESOURCE_KINDS as readonly string[]).includes(c.kind.path));
  const draftByKind = Object.fromEntries(six.map((c) => [c.kind.path, c.draft])) as Record<ResourceKindPath, number>;
  return {
    counts,
    resourceTotal: six.reduce((sum, c) => sum + c.active + c.draft, 0),
    activeTotal: six.reduce((sum, c) => sum + c.active, 0),
    draftByKind,
    pending: pendingRaw instanceof ApiError ? toPendingChanges([], defaultLanguage) : toPendingChanges(pendingRaw, defaultLanguage),
    pendingError: pendingRaw instanceof ApiError ? pendingRaw : null,
    settings,
    navigationFilled,
  };
}

/** Singular author-facing name of a Resource kind path. */
export const KIND_SINGULAR: Record<ResourceKindPath, string> = {
  places: "Place",
  pois: "Point of interest",
  routes: "Route",
  guides: "Guide",
  events: "Event",
  categories: "Category",
};

export { CONTENT_KINDS };
