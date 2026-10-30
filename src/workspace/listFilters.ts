import { ref } from "vue";

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

  return { featuredOnly, searchLanguage, texts };
}
