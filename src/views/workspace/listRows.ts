import { fold } from "@/lib/utils";
import type { ListQuery } from "@/components/list/useListQuery";
import type { ProjectLanguage } from "@/platform/languages";

/** The `title` texts a search looks at: every language, or only the one chosen in "Search in" (`query.lang`). */
export function searchTitles(translations: Record<string, { title?: string | null } | undefined>, lang: string): string[] {
  return Object.entries(translations)
    .filter(([code]) => !lang || code === lang)
    .map(([, t]) => t?.title ?? "");
}

/** How many languages of the Project a row has fully translated; the "Translations" sort. */
export function translationScore(
  languages: ProjectLanguage[],
  completeness: (languageCode: string) => "complete" | "partial" | "missing",
): number {
  return languages.reduce((n, l) => n + (completeness(l.languageCode) === "complete" ? 2 : completeness(l.languageCode) === "partial" ? 1 : 0), 0);
}

const STATUS_RANK: Record<string, number> = { ACTIVE: 0, DRAFT: 1, ARCHIVED: 2 };

/** What a list can sort by besides Manual order, as plain values per row. */
export interface SortValues {
  title: string;
  status: string;
  updated: string;
  translations: number;
  sortOrder: number;
}

/** A title found in a language other than the one the row shows (C2-48): "Matches Ελληνικά: Ακρόπολη". */
export interface LanguageMatch {
  languageCode: string;
  text: string;
}

/**
 * Where a search hit comes from when the visible title does not contain it: the first language (default language
 * first) whose title does. Null without a search, or when the shown title, slug or code already matches, so the
 * hint only appears when it explains a row that would otherwise look unrelated.
 */
export function matchedInOtherLanguage(
  translations: Record<string, { title?: string | null } | undefined>,
  q: string,
  defaultLanguageCode: string,
  shown: string[],
): LanguageMatch | null {
  const needle = fold(q.trim());
  if (!needle) return null;
  if (shown.some((t) => fold(t).includes(needle))) return null;
  const codes = Object.keys(translations).sort((a, b) => Number(b === defaultLanguageCode) - Number(a === defaultLanguageCode));
  for (const code of codes) {
    const text = translations[code]?.title ?? "";
    if (text && fold(text).includes(needle)) return { languageCode: code, text };
  }
  return null;
}

/**
 * Orders rows by the list's sort state: Manual order is `sortOrder`; Title, Status (Active, Draft, Archived), Updated
 * and Translations by `query.dir`, which starts as the sort's own direction (`defaultDirFor`: Updated newest first,
 * the others ascending). Ties fall back to Manual order so the order is stable.
 */
export function sortByQuery<T>(rows: T[], query: ListQuery, values: (row: T) => SortValues): T[] {
  const sign = query.dir.value === "desc" ? -1 : 1;
  const key = query.sort.value;
  return [...rows].sort((a, b) => {
    const x = values(a);
    const y = values(b);
    let result = 0;
    if (key === "title") result = x.title.localeCompare(y.title, undefined, { sensitivity: "base" });
    else if (key === "status") result = (STATUS_RANK[x.status] ?? 9) - (STATUS_RANK[y.status] ?? 9);
    else if (key === "updated") result = x.updated.localeCompare(y.updated);
    else if (key === "translations") result = x.translations - y.translations;
    return (result === 0 ? x.sortOrder - y.sortOrder : result * (key === "manual" ? 1 : sign));
  });
}
