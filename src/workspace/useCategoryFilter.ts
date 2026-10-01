import { computed, ref, watch, type Ref } from "vue";
import { ApiError } from "@/platform/api";
import { assignableCategories, listCategories, type Category, type CategoryScope } from "@/platform/categories";

/**
 * The Category filter of the Points of Interest and Routes lists (iGuide spec 12, "Content library"): the
 * Categories for the kind, and whether an item is in the chosen one or one of its subcategories. A failed
 * load hides the filter instead of blocking the list.
 */
export function useCategoryFilter(projectId: Ref<string>, scope: CategoryScope, defaultLanguage: Ref<string | null>) {
  const categories = ref<Category[]>([]);
  const selected = ref<string>("ALL");

  async function load() {
    try {
      categories.value = await listCategories(projectId.value);
    } catch (e) {
      if (!(e instanceof ApiError)) throw e;
      categories.value = [];
    }
  }
  watch(projectId, load, { immediate: true });

  const options = computed(() => assignableCategories(categories.value, scope, defaultLanguage.value));
  const chosen = computed(() => {
    if (selected.value === "ALL" || selected.value === "NONE") return new Set<string>();
    return new Set([selected.value, ...categories.value.filter((c) => c.parentCategoryId === selected.value).map((c) => c.id)]);
  });

  function matches(categoryId: string | null): boolean {
    if (selected.value === "ALL") return true;
    if (selected.value === "NONE") return !categoryId;
    return !!categoryId && chosen.value.has(categoryId);
  }

  return { categories, options, selected, matches, reload: load };
}
