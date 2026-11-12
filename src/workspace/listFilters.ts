import { ref } from "vue";
import type { ProjectLanguage } from "@/platform/languages";
import type { ResourceStatus } from "@/platform/places";

/**
 * One filter in force on a Content list, shown as a removable chip beside the "Filters" button so a filter tucked
 * into the menu is never hidden (`14` §4; DECISIONS.md D-061).
 */
export interface ActiveFilter {
  key: string;
  /** Group and value, for example "Status: DRAFT". */
  label: string;
  clear: () => void;
}

export type StatusFilter = "ALL" | ResourceStatus | "PENDING";

/** The status choices of the lists that have Working Copies. */
export const STATUS_FILTER_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "DRAFT", label: "DRAFT" },
  { value: "ACTIVE", label: "ACTIVE" },
  { value: "ARCHIVED", label: "ARCHIVED" },
  { value: "PENDING", label: "Pending changes" },
];

/** The chip of a choice filter, or none while it is on its "all" value. */
export function choiceFilter<T extends string>(
  key: string,
  group: string,
  model: { value: T },
  options: { value: T; label: string }[],
  all: T,
): ActiveFilter[] {
  if (model.value === all) return [];
  const label = options.find((o) => o.value === model.value)?.label ?? model.value;
  return [{ key, label: `${group}: ${label}`, clear: () => (model.value = all) }];
}

/** The chip of the Category filter (see `useCategoryFilter`). */
export function categoryFilterChip(selected: { value: string }, options: { id: string; label: string }[]): ActiveFilter[] {
  if (selected.value === "ALL") return [];
  const label = selected.value === "NONE" ? "In no category" : (options.find((o) => o.id === selected.value)?.label ?? "Unknown");
  return [{ key: "category", label: `Category: ${label}`, clear: () => (selected.value = "ALL") }];
}

/**
 * The filters every Content list shares beyond status and Category (iGuide spec 12 section 3, Content library):
 * "Featured" for the kinds that have it, and the language the search looks in. The lists hold every row and
 * filter in the browser, as for status and Category (DECISIONS.md D-017, D-035).
 */
export function useListFilters() {
  const featuredOnly = ref(false);
  /** The language code the search looks in; empty for every language. */
  const searchLanguage = ref("");

  /** The texts of one field the search looks at: in the chosen language, or in every language. */
  function texts<T>(translations: Record<string, T>, field: keyof T): string[] {
    return Object.entries(translations)
      .filter(([code]) => !searchLanguage.value || code === searchLanguage.value)
      .map(([, t]) => {
        const value = t?.[field];
        return typeof value === "string" ? value : "";
      });
  }

  /** The chips of these two filters; `languages` names the search language. */
  function active(languages: ProjectLanguage[], featured = true): ActiveFilter[] {
    const chips: ActiveFilter[] = [];
    if (searchLanguage.value) {
      const name = languages.find((l) => l.languageCode === searchLanguage.value)?.displayName ?? searchLanguage.value;
      chips.push({ key: "language", label: `Search in: ${name}`, clear: () => (searchLanguage.value = "") });
    }
    if (featured && featuredOnly.value) chips.push({ key: "featured", label: "Featured only", clear: () => (featuredOnly.value = false) });
    return chips;
  }

  return { featuredOnly, searchLanguage, texts, active };
}
