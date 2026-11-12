<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from "vue";
import ReorderControls from "@/components/ReorderControls.vue";
import { saveOrder } from "@/platform/ordering";
import { dropLineClass, useReorder } from "@/workspace/useReorder";
import { useRouter } from "vue-router";
import PageHead from "@/components/PageHead.vue";
import StatusChip from "@/components/StatusChip.vue";
import TranslationDots from "@/components/TranslationDots.vue";
import StatusChangeDialog from "@/components/StatusChangeDialog.vue";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/format";
import { ApiError } from "@/platform/api";
import CategoryIcon from "@/components/CategoryIcon.vue";
import {
  CATEGORY_SCOPES,
  categoryCompleteness,
  categoryName,
  categoryTree,
  changeCategoryStatus,
  fetchCategoryReferences,
  listCategories,
  scopeLabel,
  type Category,
  type CategoryScope,
} from "@/platform/categories";
import type { ResourceStatus } from "@/platform/places";
import type { ResourceReference } from "@/platform/references";
import { showToast } from "@/stores/toast";
import { useCurrentProject } from "@/workspace/currentProject";
import { referenceLink } from "@/workspace/referenceLinks";
import { findSection } from "@/workspace/sections";
import { STATUS_FILTER_OPTIONS, choiceFilter, useListFilters } from "@/workspace/listFilters";
import ListFilterMenu from "@/components/ListFilterMenu.vue";
import FilterChoiceGroup from "@/components/FilterChoiceGroup.vue";
import SearchLanguageSelect from "@/components/SearchLanguageSelect.vue";
import { useProjectLanguages } from "@/workspace/useProjectLanguages";
import { useStatusActions } from "@/workspace/useStatusActions";
import CreateCategoryDialog from "./CreateCategoryDialog.vue";

const section = findSection("categories")!;
const project = useCurrentProject();
const router = useRouter();
const projectId = computed(() => project.value.id);
const { languages, defaultLanguage, error: languagesError, loading: languagesLoading } = useProjectLanguages(projectId);

const categories = ref<Category[]>([]);
const loading = ref(true);
const loadError = ref<ApiError | null>(null);
let controller: AbortController | null = null;

async function load() {
  controller?.abort();
  controller = new AbortController();
  loading.value = true;
  loadError.value = null;
  try {
    categories.value = await listCategories(projectId.value, controller.signal);
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") return;
    if (!(e instanceof ApiError)) throw e;
    loadError.value = e;
  } finally {
    loading.value = false;
  }
}
watch(projectId, load, { immediate: true });
onBeforeUnmount(() => controller?.abort());

const statusFilter = ref<"ALL" | ResourceStatus | "PENDING">("ALL");
const scopeFilter = ref<"ALL" | CategoryScope>("ALL");
const query = ref("");
const filters = useListFilters();
const scopeOptions: { value: "ALL" | CategoryScope; label: string }[] = [
  { value: "ALL", label: "Both kinds" },
  ...CATEGORY_SCOPES.map((value) => ({ value, label: scopeLabel(value) })),
];
/** The filters in force, shown as chips beside the Filters button. */
const activeFilters = computed(() => [
  ...choiceFilter("status", "Status", statusFilter, STATUS_FILTER_OPTIONS, "ALL"),
  ...choiceFilter("scope", "Applies to", scopeFilter, scopeOptions, "ALL"),
  ...filters.active(languages.value, false),
]);
const { searchLanguage } = filters;
const normalize = (text: string) => text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** The two-level tree, or a flat list of matches while searching or filtering by status. */
const rows = computed(() => {
  const q = normalize(query.value.trim());
  // As in the mockup: the Points of Interest tree, then the Routes tree.
  const scopes = scopeFilter.value === "ALL" ? CATEGORY_SCOPES : [scopeFilter.value];
  const nodes = scopes.flatMap((scope) => categoryTree(categories.value, scope, true));
  if (!q && statusFilter.value === "ALL") return nodes;
  return nodes
    .filter(({ category }) => statusFilter.value === "ALL" || (statusFilter.value === "PENDING" ? !!category.hasWorkingCopy : category.status === statusFilter.value))
    .filter(({ category }) => !q || [category.code, ...filters.texts(category.translations, "name")].some((t) => normalize(t).includes(q)))
    .map(({ category }) => ({ category, depth: 0 }));
});

const defaultLanguageInfo = computed(() => languages.value.find((l) => l.isDefault) ?? null);
const noLanguages = computed(() => !languagesLoading.value && !languagesError.value && !languages.value.length);
const name = (c: Category) => categoryName(c, defaultLanguage.value);
const parentName = (c: Category) => {
  const parent = c.parentCategoryId ? categories.value.find((p) => p.id === c.parentCategoryId) : undefined;
  return parent ? name(parent) : null;
};
const itemsText = (c: Category) => {
  const noun = c.scope === "ROUTE" ? (c.resourceCount === 1 ? "route" : "routes") : c.resourceCount === 1 ? "point of interest" : "points of interest";
  return `${c.resourceCount} ${noun}`;
};

const actions = useStatusActions<Category>({
  items: categories,
  kind: "category",
  title: name,
  change: (c, target) => changeCategoryStatus(projectId.value, c.id, target, c.version),
  reload: load,
  open: (c) => void router.push({ name: "category-editor", params: { projectId: projectId.value, categoryId: c.id } }),
});
const { pendingId, confirm, confirmCopy } = actions;
const toReference = (r: ResourceReference) => referenceLink(projectId.value, r);

const creating = ref(false);
const createParent = ref<string | null>(null);
function newCategory(parentId: string | null = null) {
  createParent.value = parentId;
  creating.value = true;
}
function onCreated(c: Category) {
  creating.value = false;
  showToast("Category created", "It is a draft. Add its names, then activate it.");
  void router.push({ name: "category-editor", params: { projectId: projectId.value, categoryId: c.id } });
}

const countText = computed(() => {
  const total = categories.value.length;
  const noun = total === 1 ? "category" : "categories";
  return rows.value.length === total ? `${total} ${noun}` : `${rows.value.length} of ${total} ${noun}`;
});
// Manual order (spec 12 section 3); off while a search or filter hides rows (DECISIONS.md D-017).
const reorder = useReorder<Category>({
  items: categories,
  // Siblings as the tree shows them: the same scope and parent; a subcategory whose parent is missing is top level.
  siblingKey: (category) =>
    `${category.scope}:${category.parentCategoryId && categories.value.some((c) => c.id === category.parentCategoryId) ? category.parentCategoryId : ""}`,
  save: (ids) => saveOrder(projectId.value, "categories", ids),
  title: (category) => name(category),
  canReorder: computed(() => !query.value.trim() && statusFilter.value === "ALL"),
  reload: load,
});
</script>

<template>
  <main class="relative min-w-0 flex-1 overflow-y-auto px-4 pb-16 pt-6 md:px-7">
    <PageHead :title="section.title" :subtitle="section.subtitle">
      <template #actions>
        <Button variant="brand" :disabled="!defaultLanguageInfo" @click="newCategory()">New category</Button>
      </template>
    </PageHead>

    <div
      v-if="noLanguages"
      class="mb-5 flex flex-wrap items-center gap-3.5 rounded-lg border-l-[3px] border-l-[#855400] bg-[rgba(154,98,0,0.07)] px-[18px] py-3.5 text-[13px]"
    >
      <div class="min-w-[min(100%,260px)] flex-1">
        <strong class="mb-0.5 block text-[13px] font-bold">Add a language first</strong>
        <span class="text-gray-700">Every category has its name per language, starting with the default language.</span>
      </div>
      <RouterLink :to="{ name: 'project-languages', params: { projectId } }" class="whitespace-nowrap text-[11px] font-bold uppercase tracking-[0.06em] text-primary">
        Set up languages
      </RouterLink>
    </div>

    <div v-if="loadError" role="alert" class="max-w-[640px] rounded-lg border border-l-[3px] border-l-destructive bg-card px-[18px] py-4">
      <strong class="block text-[13px] font-bold text-destructive">
        {{ loadError.platformUnavailable ? "The UNICHE platform is not reachable" : "The categories could not be loaded" }}
      </strong>
      <p class="mt-1 text-[13px] text-gray-700">{{ loadError.message }}</p>
      <Button variant="outline" size="sm" class="mt-3" @click="load">Try again</Button>
    </div>

    <div v-else class="overflow-hidden rounded-lg border bg-card shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
      <div class="flex flex-wrap items-center gap-2.5 border-b px-[18px] py-3.5">
        <label for="categories-search" class="text-[11px] font-bold uppercase tracking-[0.06em] text-muted-foreground">Search</label>
        <input
          id="categories-search"
          v-model="query"
          type="search"
          placeholder="Search names and codes"
          class="min-w-[min(100%,200px)] flex-1 rounded-lg border-[1.5px] px-3 py-[9px] text-[13px] focus:border-primary focus:outline-none"
        />
        <ListFilterMenu :active="activeFilters">
          <FilterChoiceGroup v-model="statusFilter" legend="Status" :options="STATUS_FILTER_OPTIONS" />
          <FilterChoiceGroup v-model="scopeFilter" legend="Applies to" :options="scopeOptions" />
          <SearchLanguageSelect v-model="searchLanguage" :languages="languages" />
        </ListFilterMenu>
        <span class="ml-auto text-[11px] text-muted-foreground">
          {{ query || statusFilter !== "ALL" ? "Matches · clear the search and filters to reorder" : "Tree · drag or use the arrows to reorder" }}
        </span>
        <p class="sr-only" aria-live="polite">{{ reorder.announcement }}</p>
      </div>

      <div v-if="loading" class="animate-skeleton" role="status" aria-busy="true" aria-label="Loading categories">
        <div v-for="n in 3" :key="n" class="flex items-center gap-3.5 border-b border-gray-100 px-[18px] py-4">
          <div class="h-[13px] w-1/3 rounded bg-[#e2e3e7]"></div>
        </div>
      </div>

      <div v-else-if="rows.length" class="overflow-x-auto">
        <table class="w-full min-w-[620px] table-fixed border-collapse">
          <thead>
            <tr>
              <th class="th w-[56px] px-2"><span class="sr-only">Order</span></th>
              <th class="th w-[40%] px-[18px]">Name</th>
              <th class="th w-[13%] px-3">Status</th>
              <th class="th w-[17%] px-3">Translations</th>
              <th class="th w-[30%] px-[18px] text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="{ category, depth } in rows" :key="category.id"
              class="hover:bg-muted"
              :class="dropLineClass(reorder.dropLine(category))"
              @dragover="reorder.dragOver(category, $event)"
              @drop="reorder.drop(category, $event)"
            >
              <td class="td px-2"><ReorderControls :reorder="reorder" :item="category" :title="name(category)" /></td>
              <td class="td px-[18px]">
                <div class="flex items-center gap-2" :style="{ paddingLeft: `${depth * 18}px` }">
                  <span v-if="depth" class="text-gray-300" aria-hidden="true">└</span>
                  <span class="flex h-6 w-6 flex-none items-center justify-center rounded-md bg-[#f5f0fb] text-primary">
                    <CategoryIcon :category="category" :size="15" />
                  </span>
                  <RouterLink
                    :to="{ name: 'category-editor', params: { projectId, categoryId: category.id } }"
                    class="truncate text-[13px] font-semibold no-underline hover:underline"
                    :class="category.status === 'ARCHIVED' ? 'text-muted-foreground' : 'text-foreground'"
                  >
                    {{ name(category) }}
                  </RouterLink>
                  <span class="flex-none rounded-full border bg-muted px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-[0.08em] text-muted-foreground">
                    {{ category.scope === "ROUTE" ? "Route" : "POI" }}
                  </span>
                </div>
                <div class="mt-[3px] break-words text-[11px] text-gray-500" :style="{ paddingLeft: `${depth * 18 + (depth ? 46 : 32)}px` }">
                  <span class="font-mono">{{ category.code }}</span>
                  <template v-if="!depth && parentName(category) && (query || statusFilter !== 'ALL')"> · in {{ parentName(category) }}</template>
                  · {{ scopeLabel(category.scope) }} · {{ itemsText(category) }} ·
                  {{ formatDate(category.updatedAt) }}
                </div>
              </td>
              <td class="td px-3">
                <StatusChip :status="category.status" />
                <StatusChip
                  v-if="category.hasWorkingCopy"
                  status="PENDING"
                  label="Pending changes"
                  class="ml-1"
                  title="Has pending changes that visitors do not see yet"
                />
              </td>
              <td class="td px-3">
                <TranslationDots :languages="languages" :completeness="(code) => categoryCompleteness(category, code)" />
              </td>
              <td class="td px-[18px]">
                <div class="flex flex-wrap items-center justify-end gap-2.5">
                  <button
                    v-if="category.status !== 'ARCHIVED' && !category.parentCategoryId"
                    type="button"
                    class="whitespace-nowrap text-[10px] font-bold uppercase tracking-[0.06em] text-primary"
                    :disabled="!defaultLanguageInfo"
                    @click="newCategory(category.id)"
                  >
                    + Sub
                  </button>
                  <button
                    type="button"
                    class="whitespace-nowrap rounded-full border bg-muted px-[13px] py-1.5 text-[10px] font-bold uppercase tracking-[0.06em] text-gray-700 disabled:opacity-50"
                    :disabled="pendingId === category.id"
                    @click="actions.onToggle(category)"
                  >
                    {{ actions.toggleLabel(category) }}
                  </button>
                  <button
                    v-if="category.status !== 'ARCHIVED'"
                    type="button"
                    class="whitespace-nowrap text-[10px] font-bold uppercase tracking-[0.06em] text-destructive disabled:opacity-50"
                    :disabled="pendingId === category.id"
                    @click="actions.ask(category, 'ARCHIVED')"
                  >
                    Archive
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-else class="px-6 py-12 text-center">
        <p class="mx-auto mb-[18px] max-w-[440px] text-[13px] text-muted-foreground">
          {{
            categories.length
              ? "No category matches the search or the status filter."
              : "Categories group Points of Interest or Routes so visitors can filter them, such as Sculpture or Short tours."
          }}
        </p>
        <Button v-if="!categories.length" variant="brand" :disabled="!defaultLanguageInfo" @click="newCategory()">New category</Button>
      </div>

      <div class="border-t border-gray-100 px-[18px] py-3 text-[11px] text-muted-foreground">{{ countText }}</div>
    </div>

    <CreateCategoryDialog
      v-if="creating && defaultLanguageInfo"
      :project-id="projectId"
      :default-language="defaultLanguageInfo"
      :categories="categories"
      :initial-parent-id="createParent"
      @close="creating = false"
      @created="onCreated"
    />

    <StatusChangeDialog
      v-if="confirm && confirmCopy"
      :heading="confirmCopy.heading"
      :body="confirmCopy.body"
      :action-label="confirmCopy.action"
      :danger="confirm.target === 'ARCHIVED'"
      :busy="pendingId === confirm.item.id"
      :load-references="() => fetchCategoryReferences(projectId, confirm!.item.id)"
      :blocked-by="confirm.blockedBy ?? null"
      :link-for="toReference"
      @close="actions.cancel()"
      @confirm="actions.transition(confirm.item, confirm.target)"
    />
  </main>
</template>

<style scoped src="@/styles/list-table.css"></style>
