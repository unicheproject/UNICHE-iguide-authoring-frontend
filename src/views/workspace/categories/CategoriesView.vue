<script setup lang="ts">
/**
 * Categories list (plan 2.2, D-076, `12` §3): the shared list scaffold as a tree. Each Category shows its icon, name,
 * code and where it is used; "Applies to" (Points of interest or Routes) is its own column and a toolbar filter;
 * subcategories sit under their parent behind a disclosure button. The Points of interest tree comes first, then the
 * Routes tree. Manual order only (siblings), activation through the shared confirm, "Add subcategory" in the row menu.
 */
import { MapPinned, Plus as PlusIcon, Route as RouteIcon } from "lucide-vue-next";
import { computed, onBeforeUnmount, ref, useId, watch } from "vue";
import { useRouter } from "vue-router";
import CategoryIcon from "@/components/CategoryIcon.vue";
import ListEmpty from "@/components/list/ListEmpty.vue";
import ListFooter from "@/components/list/ListFooter.vue";
import FilterField from "@/components/list/FilterField.vue";
import ListLoadError from "@/components/list/ListLoadError.vue";
import ListRowTitle from "@/components/list/ListRowTitle.vue";
import MatchHint from "@/components/list/MatchHint.vue";
import { Select } from "@/components/ui/select";
import ListTable, { type ListColumn } from "@/components/list/ListTable.vue";
import ListToolbar from "@/components/list/ListToolbar.vue";
import RowMenu, { type RowAction } from "@/components/list/RowMenu.vue";
import { useCreateParam } from "@/components/list/useCreateParam";
import { matchesStatus, segmentTotal, statusCounts, useListQuery, useResultAnnouncer, useScrollRestore } from "@/components/list/useListQuery";
import PageFrame from "@/components/PageFrame.vue";
import PageHead from "@/components/PageHead.vue";
import StatusChip from "@/components/StatusChip.vue";
import TranslationDots from "@/components/TranslationDots.vue";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { formatDateTime, NBSP } from "@/lib/format";
import { ApiError } from "@/platform/api";
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
import { saveOrder } from "@/platform/ordering";
import { showToast } from "@/stores/toast";
import { useCurrentProject } from "@/workspace/currentProject";
import type { ActiveFilter } from "@/workspace/listFilters";
import { findSection } from "@/workspace/sections";
import { useProjectLanguages } from "@/workspace/useProjectLanguages";
import { useReorder } from "@/workspace/useReorder";
import LifecycleDialogs from "../LifecycleDialogs.vue";
import { matchedInOtherLanguage, searchTitles } from "../listRows";
import { fold } from "@/lib/utils";
import { useListLifecycle } from "../useListLifecycle";
import CreateCategoryDialog from "./CreateCategoryDialog.vue";

const section = findSection("categories")!;
const project = useCurrentProject();
const router = useRouter();
const projectId = computed(() => project.value.id);
const { languages, defaultLanguage, error: languagesError, loading: languagesLoading, reload: reloadLanguages } = useProjectLanguages(projectId);

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

const query = useListQuery();
const scopeId = useId();
/** "Applies to" lives in the URL as `cat` (`POI` or `ROUTE`); anything else means both. */
const scopeFilter = computed<CategoryScope | null>(() => (CATEGORY_SCOPES as readonly string[]).includes(query.cat.value) ? (query.cat.value as CategoryScope) : null);
const scopeChip = computed<ActiveFilter[]>(() =>
  scopeFilter.value ? [{ key: "scope", label: `Applies to: ${scopeLabel(scopeFilter.value)}`, clear: () => (query.cat.value = "") }] : [],
);

const name = (c: Category) => categoryName(c, defaultLanguage.value);
const parentName = (c: Category) => {
  const parent = c.parentCategoryId ? categories.value.find((p) => p.id === c.parentCategoryId) : undefined;
  return parent ? name(parent) : null;
};

/** Categories that pass every filter except the status segment: the segment counts are taken from these. */
const filteredAnyStatus = computed(() => {
  const q = fold(query.q.value.trim());
  return categories.value.filter((c) => {
    if (query.pending.value && !c.hasWorkingCopy) return false;
    if (query.missing.value && categoryCompleteness(c, query.missing.value) === "complete") return false;
    if (scopeFilter.value && c.scope !== scopeFilter.value) return false;
    if (!q) return true;
    return [c.code, ...searchTitlesOf(c, query.lang.value)].some((t) => fold(t).includes(q));
  });
});
const counts = computed(() => statusCounts(filteredAnyStatus.value));
const segmentCount = computed(() => segmentTotal(categories.value, query.status.value));
const filtered = computed(() => filteredAnyStatus.value.filter((c) => matchesStatus(c, query.status.value)));
/** The `name` texts a search looks at (Categories have names, not titles). */
function searchTitlesOf(c: Category, lang: string): string[] {
  return searchTitles(Object.fromEntries(Object.entries(c.translations).map(([code, t]) => [code, { title: t.name }])), lang);
}

/** The language that explains a row the search found through a name other than the one shown. */
function matchOf(c: Category) {
  const names = Object.fromEntries(Object.entries(c.translations).map(([code, t]) => [code, { title: t.name }]));
  const match = matchedInOtherLanguage(names, query.q.value, defaultLanguage.value ?? "", [name(c), c.code]);
  return match ? { match, languageName: languages.value.find((l) => l.languageCode === match.languageCode)?.displayName ?? match.languageCode } : null;
}

/** Rows in tree order, the Points of interest tree and then the Routes tree; a subcategory whose parent is filtered out stands at the top. */
const tree = computed(() => CATEGORY_SCOPES.flatMap((scope) => categoryTree(filtered.value, scope, true)));
const rows = computed(() => tree.value.map((node) => node.category));
const depths = computed(() => new Map(tree.value.map((node) => [node.category.id, node.depth])));
const parents = computed(() => new Set(tree.value.flatMap((node) => (node.category.parentCategoryId && depths.value.has(node.category.parentCategoryId) ? [node.category.parentCategoryId] : []))));

const defaultLanguageInfo = computed(() => languages.value.find((l) => l.isDefault) ?? null);
const noLanguages = computed(() => !languagesLoading.value && !languagesError.value && !languages.value.length);
const editorRoute = (c: Category) => ({ name: "category-editor", params: { projectId: projectId.value, categoryId: c.id } });

const lifecycle = useListLifecycle<Category>({
  items: categories,
  projectId,
  noun: "category",
  referenceType: "CATEGORY",
  title: name,
  changeStatus: changeCategoryStatus,
  fetchReferences: fetchCategoryReferences,
  editorRoute,
  reload: load,
  completeness: categoryCompleteness,
  languages,
});

/** The kebab: "Add subcategory" for a live top-level Category, then the lifecycle entries. */
function actionsFor(c: Category): RowAction[] {
  const own = lifecycle.actionsFor(c);
  return c.status !== "ARCHIVED" && !c.parentCategoryId ? [{ key: "add-sub", label: "Add subcategory", icon: PlusIcon, disabled: !defaultLanguageInfo.value }, ...own] : own;
}

const creating = ref(false);
const createParent = ref<string | null>(null);
function newCategory(parentId: string | null = null) {
  createParent.value = parentId;
  creating.value = true;
}
function onSelect(c: Category, key: string) {
  if (key === "restore-order") query.restoreManualOrder();
  else if (key === "add-sub") newCategory(c.id);
  else lifecycle.onSelect(c, key);
}
function onCreated(c: Category) {
  creating.value = false;
  showToast("Category created", "It is a draft. Add its names, then activate it.");
  void router.push(editorRoute(c));
}

// Manual order among siblings as the tree shows them (same scope and parent); off while a search or filter hides rows (D-017).
const reorder = useReorder<Category>({
  items: categories,
  siblingKey: (category) =>
    `${category.scope}:${category.parentCategoryId && categories.value.some((c) => c.id === category.parentCategoryId) ? category.parentCategoryId : ""}`,
  title: name,
  canReorder: query.canReorder,
  visible: (category) => matchesStatus(category, query.status.value),
  save: (ids) => saveOrder(projectId.value, "categories", ids),
  reload: load,
});

/** Trees offer no sort (Q-018): the one entry says how the rows are ordered. */
const SORTS = [{ value: "manual", label: "Ordered by hierarchy and manual order" }];

const ready = computed(() => !loading.value);
const { rowKeyFocus } = useScrollRestore(ready);
useResultAnnouncer(computed(() => rows.value.length), segmentCount, ready, "categories", { query, options: SORTS });
/** `?create=1` opens the dialog once the default language is known; it is a top-level category, no parent. */
useCreateParam(creating, computed(() => !!defaultLanguageInfo.value));
/** Why "New category" is off, or undefined. */
const createReason = computed(() => (defaultLanguageInfo.value ? undefined : languagesError.value ? "The languages could not be loaded" : languagesLoading.value ? "Loading languages" : "Add a language first"));

// Width budget (D-110, plan 9.7): Applies to 168 + Status 128 + Updated 152 + Translations 192 leave the Name 246 px at 1280.
// "Used by N" sits under the name, where it has the room, not in the 168 px Applies to column.
const columns: ListColumn[] = [
  { key: "title", label: "Name", tree: true },
  { key: "scope", label: "Applies to", class: "w-[10.5rem]" },
  { key: "status", label: "Status", class: "w-32" },
  { key: "updated", label: "Updated", class: "w-[9.5rem]" },
  { key: "translations", label: "Translations" },
];

const usage = (c: Category) => {
  const noun = c.scope === "ROUTE" ? (c.resourceCount === 1 ? "route" : "routes") : c.resourceCount === 1 ? "point of interest" : "points of interest";
  return `Used by ${c.resourceCount}${NBSP}${noun.replaceAll(" ", NBSP)}`;
};
</script>

<template>
  <PageFrame>
    <PageHead :title="section.title" :subtitle="section.subtitle" section="categories">
      <template #actions>
        <Button :disabled-reason="createReason" @click="newCategory()">New category</Button>
      </template>
    </PageHead>

    <Alert v-if="noLanguages" tone="warning" title="Add a language first" class="mb-5">
      Every category has its name per language, starting with the default language.
      <template #actions>
        <Button as-child variant="secondary" size="sm">
          <RouterLink :to="{ name: 'project-languages', params: { projectId } }">Set up languages</RouterLink>
        </Button>
      </template>
    </Alert>

    <ListLoadError v-if="languagesError" :error="languagesError" what="the project's languages" @retry="reloadLanguages" />
    <ListLoadError v-else-if="loadError" :error="loadError" what="the categories" @retry="load" />

    <div v-else class="rounded-lg border border-border bg-card shadow-1">
      <template v-if="loading || categories.length">
        <ListToolbar
          :query="query"
          :counts="counts"
          :loading="loading"
          :languages="languages"
          search-placeholder="Search name or code"
          :sort-options="SORTS"
        >
          <template #filters>
            <FilterField label="Applies to" :for="scopeId">
              <Select :id="scopeId" :model-value="scopeFilter ?? ''" size="sm" @update:model-value="(v) => (query.cat.value = String(v ?? ''))">
                <option value="">Both kinds</option>
                <option v-for="s in CATEGORY_SCOPES" :key="s" :value="s">{{ scopeLabel(s) }}</option>
              </Select>
            </FilterField>
          </template>
        </ListToolbar>
        <ListTable
          :columns="columns"
          :rows="rows"
          :loading="loading"
          :query="query"
          :reorder="reorder"
          :depth="(c) => depths.get(c.id) ?? 0"
          :has-children="(c) => parents.has(c.id)"
          :row-label="name"
          :row-key-focus="rowKeyFocus"
          label="Categories"
          openable
          @open="(c) => router.push(editorRoute(c))"
        >
          <template #cell-title="{ row }">
            <div class="flex min-w-0 items-start gap-2">
              <span class="flex size-7 flex-none items-center justify-center rounded-md bg-accent text-primary">
                <CategoryIcon :category="row" :size="16" />
              </span>
              <ListRowTitle :to="editorRoute(row)" :muted="row.status === 'ARCHIVED'" :missing="query.missing.value" class="min-w-0">{{ name(row) }}</ListRowTitle>
            </div>
            <p class="flex min-w-0 items-baseline gap-1 text-compact text-muted-foreground">
              <span class="mono min-w-0 truncate" :title="row.code">{{ row.code }}</span>
              <span v-if="!depths.get(row.id) && parentName(row)" class="min-w-0 truncate" :title="parentName(row) ?? undefined">· in&nbsp;{{ parentName(row) }}</span>
            </p>
            <p class="truncate text-compact text-muted-foreground" :title="usage(row)">{{ usage(row) }}</p>
            <MatchHint v-if="matchOf(row)" v-bind="matchOf(row)!" />
          </template>
          <template #cell-scope="{ row }">
            <Chip tone="outline" :icon="row.scope === 'ROUTE' ? RouteIcon : MapPinned">{{ scopeLabel(row.scope) }}</Chip>
          </template>
          <template #cell-status="{ row }">
            <div class="flex flex-wrap gap-1">
              <StatusChip :status="row.status" />
              <StatusChip v-if="row.hasWorkingCopy" status="PENDING" label="Pending changes" title="Has pending changes that visitors do not see yet" wrap />
            </div>
          </template>
          <template #cell-updated="{ row }">
            <time :datetime="row.updatedAt" class="tabular whitespace-nowrap text-compact text-muted-foreground">{{ formatDateTime(row.updatedAt).replaceAll(" ", NBSP) }}</time>
          </template>
          <template #cell-translations="{ row }">
            <TranslationDots names :route="editorRoute(row)" :languages="languages" :completeness="(code) => categoryCompleteness(row, code)" />
          </template>
          <template #menu="{ row }">
            <RowMenu
              :title="name(row)"
              :actions="actionsFor(row)"
              :reorder="reorder"
              :item="row"
              :reorder-reason="query.reorderReason.value"
              @select="(key) => onSelect(row, key)"
            />
          </template>
        </ListTable>
      </template>
      <ListEmpty
        v-if="!loading && !rows.length"
        noun="categories"
        empty-title="No categories yet"
        :filtered="categories.length > 0"
        :filters="query.chips(scopeChip, languages)"
        :counts="counts"
        :status="query.status.value"
        header-action
      >
        Categories group points of interest or routes so visitors can filter them, such as Sculpture or Short tours.
      </ListEmpty>
      <ListFooter v-if="loading || categories.length" :loading="loading" :shown="rows.length" :total="segmentCount" noun="categories" paged legend />
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
    <LifecycleDialogs :lifecycle="lifecycle" />
  </PageFrame>
</template>
