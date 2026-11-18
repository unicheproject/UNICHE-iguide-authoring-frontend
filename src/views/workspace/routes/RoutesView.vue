<script setup lang="ts">
/**
 * Routes list (plan 2.2, D-076): the shared list scaffold with this kind's columns (title with slug and trigger chips;
 * setting, mode and difficulty; stops; status; translations), Category and Featured filters in the toolbar, manual order
 * with "Move to position...", and activation through the shared confirm. Filters, sort and search live in the URL.
 */
import { Building2, Mountain, Star } from "lucide-vue-next";
import { computed, onBeforeUnmount, ref, useId, watch } from "vue";
import { useRouter } from "vue-router";
import ListEmpty from "@/components/list/ListEmpty.vue";
import ListFooter from "@/components/list/ListFooter.vue";
import ListTable, { type ListColumn } from "@/components/list/ListTable.vue";
import FilterField from "@/components/list/FilterField.vue";
import ListRowTitle from "@/components/list/ListRowTitle.vue";
import { Select } from "@/components/ui/select";
import ListSourceNotice from "@/components/list/ListSourceNotice.vue";
import ListToolbar from "@/components/list/ListToolbar.vue";
import RowMenu from "@/components/list/RowMenu.vue";
import ListLoadError from "@/components/list/ListLoadError.vue";
import MatchHint from "@/components/list/MatchHint.vue";
import { matchesStatus, segmentTotal, statusCounts, useListQuery, useResultAnnouncer, useScrollRestore } from "@/components/list/useListQuery";
import { useCreateParam } from "@/components/list/useCreateParam";
import PageFrame from "@/components/PageFrame.vue";
import PageHead from "@/components/PageHead.vue";
import StatusChip from "@/components/StatusChip.vue";
import TranslationDots from "@/components/TranslationDots.vue";
import TriggerChips from "@/components/TriggerChips.vue";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Chip } from "@/components/ui/chip";
import { focusHeading } from "@/lib/focus";
import { formatDateTime, formatDistance, NBSP, withUnit } from "@/lib/format";
import { ApiError } from "@/platform/api";
import { categoryLabel } from "@/platform/categories";
import {
  changeRouteStatus,
  fetchRouteReferences,
  listRoutes,
  routeCompleteness,
  routeDifficultyLabel,
  routeModeLabel,
  routeTitle,
  routeTypeLabel,
  type Route,
} from "@/platform/routes";
import { saveOrder } from "@/platform/ordering";
import { groupTriggersByTarget, listProjectTriggers, triggerLabel, type Trigger } from "@/platform/triggers";
import { showToast } from "@/stores/toast";
import { useCurrentProject } from "@/workspace/currentProject";
import type { ActiveFilter } from "@/workspace/listFilters";
import { findSection } from "@/workspace/sections";
import { useCategoryFilter } from "@/workspace/useCategoryFilter";
import { useProjectLanguages } from "@/workspace/useProjectLanguages";
import { useReorder } from "@/workspace/useReorder";
import CreateRouteDialog from "./CreateRouteDialog.vue";
import LifecycleDialogs from "../LifecycleDialogs.vue";
import { matchedInOtherLanguage, searchTitles, sortByQuery, translationScore } from "../listRows";
import { fold } from "@/lib/utils";
import { useListLifecycle } from "../useListLifecycle";

const section = findSection("routes")!;
const project = useCurrentProject();
const router = useRouter();
const projectId = computed(() => project.value.id);
const { languages, defaultLanguage, error: languagesError, loading: languagesLoading, reload: reloadLanguages } = useProjectLanguages(projectId);

const query = useListQuery();
const routes = ref<Route[]>([]);
/** Non-archived triggers by Route; null when they could not be read (each row then says "Triggers not loaded"). */
const triggersByRoute = ref<Map<string, Trigger[]> | null>(null);
const loading = ref(true);
const loadError = ref<ApiError | null>(null);
let controller: AbortController | null = null;

async function load() {
  controller?.abort();
  controller = new AbortController();
  loading.value = true;
  loadError.value = null;
  try {
    const signal = controller.signal;
    // The chips are a hint: a failure to read them must not hide the list (it is reported as a notice).
    const triggers = listProjectTriggers(projectId.value, signal).then(
      (found) => {
        query.reportError("triggers", null);
        return found;
      },
      (e: unknown) => {
        if (e instanceof DOMException && e.name === "AbortError") throw e;
        query.reportError("triggers", e);
        return null;
      },
    );
    // The rows are set once the triggers read has settled, so the chips never grow rows already on screen (C3-91).
    const [found, triggerRows] = await Promise.all([listRoutes(projectId.value, signal), triggers]);
    routes.value = found;
    triggersByRoute.value = triggerRows ? groupTriggersByTarget(triggerRows, "ROUTE") : null;
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

const categoryId = useId();
const categoryFilter = useCategoryFilter(projectId, "ROUTE", defaultLanguage);
// The Category choice lives in the URL (`cat`); the filter helper reads "ALL" for none.
const categoryChoice = computed<string>({
  get: () => query.cat.value || "ALL",
  set: (value) => (query.cat.value = value === "ALL" ? "" : value),
});
watch(() => query.cat.value, (value) => (categoryFilter.selected.value = value || "ALL"), { immediate: true });
// A failed Categories read is a notice with Try again, never a silent "Not loaded" column (C3-87).
watch(() => categoryFilter.error.value, (error) => query.reportError("categories", error), { immediate: true });
const categoryChip = computed<ActiveFilter[]>(() => {
  if (!query.cat.value) return [];
  const label = query.cat.value === "NONE" ? "In no category" : (categoryFilter.options.value.find((o) => o.id === query.cat.value)?.label ?? "Unknown");
  return [{ key: "category", label: `Category: ${label}`, clear: () => (query.cat.value = "") }];
});

const title = (route: Route) => routeTitle(route, defaultLanguage.value);
const categoryName = (route: Route) => {
  const category = categoryFilter.categories.value.find((c) => c.id === route.categoryId);
  return category ? categoryLabel(category, categoryFilter.categories.value, defaultLanguage.value) : null;
};

/** Rows that pass every filter except the status segment: the segment counts come from these (no false zeros). */
const filtered = computed(() => {
  const q = fold(query.q.value.trim());
  return routes.value.filter((route) => {
    if (query.pending.value && !route.hasWorkingCopy) return false;
    if (query.missing.value && routeCompleteness(route, query.missing.value) === "complete") return false;
    if (!categoryFilter.matches(route.categoryId)) return false;
    if (query.featured.value && !route.featured) return false;
    if (!q) return true;
    const triggerTexts = (triggersByRoute.value?.get(route.id) ?? []).map(triggerLabel);
    return [route.slug, ...searchTitles(route.translations, query.lang.value), ...triggerTexts].some((t) => fold(t).includes(q));
  });
});
const counts = computed(() => statusCounts(filtered.value));
const rows = computed(() =>
  sortByQuery(
    filtered.value.filter((route) => matchesStatus(route, query.status.value)),
    query,
    (route) => ({
      title: title(route),
      status: route.status,
      updated: route.updatedAt,
      translations: translationScore(languages.value, (code) => routeCompleteness(route, code)),
      sortOrder: route.sortOrder,
    }),
  ),
);
const total = computed(() => segmentTotal(routes.value, query.status.value));

/** "Matches Ελληνικά: Ακρόπολη" under a row whose title only matches the search in another language (C2-48). */
function matchOf(route: Route) {
  return matchedInOtherLanguage(route.translations, query.q.value, defaultLanguage.value ?? "", [title(route), route.slug]);
}
const languageName = (code: string) => languages.value.find((l) => l.languageCode === code)?.displayName ?? code;

const defaultLanguageInfo = computed(() => languages.value.find((l) => l.isDefault) ?? null);
const noLanguages = computed(() => !languagesLoading.value && !languagesError.value && !languages.value.length);

const lifecycle = useListLifecycle<Route>({
  items: routes,
  projectId,
  noun: "route",
  referenceType: "ROUTE",
  title,
  changeStatus: changeRouteStatus,
  fetchReferences: fetchRouteReferences,
  editorRoute: (route) => ({ name: "route-editor", params: { projectId: projectId.value, routeId: route.id } }),
  reload: load,
  completeness: routeCompleteness,
  languages,
});

// Manual order (spec 12 section 3); off while a search or filter hides rows (D-017); a move steps over hidden ARCHIVED rows.
const reorder = useReorder<Route>({
  items: routes,
  title,
  canReorder: query.canReorder,
  visible: (route) => matchesStatus(route, query.status.value),
  save: (ids) => saveOrder(projectId.value, "routes", ids),
  reload: load,
});

const ready = computed(() => !loading.value);
const { rowKeyFocus } = useScrollRestore(ready);

// The Category sits on the slug line under the Title, so the one domain column (176) plus Status 128, Updated 152 and
// Translations 192 leave the Title at least 15 rem at 1280 and the list stays a table (plan section 9, item 7).
const columns: ListColumn[] = [
  { key: "title", label: "Title", tree: true, sortKey: "title" },
  { key: "setting", label: "Setting and stops", class: "w-44" },
  { key: "status", label: "Status", sortKey: "status", class: "w-32" },
  { key: "updated", label: "Updated", sortKey: "updated", class: "w-[9.5rem]" },
  { key: "translations", label: "Translations", sortKey: "translations" },
];
/** The optional read to run again from the notice's "Try again". */
function retrySource(source: "categories" | "places" | "triggers") {
  // The notice goes when the read succeeds; focus has a successor (D-103).
  focusHeading();
  if (source === "categories") void categoryFilter.reload();
  else void load();
}
const SORTS = [
  { value: "manual", label: "Manual order" },
  { value: "title", label: "Title" },
  { value: "status", label: "Status" },
  { value: "updated", label: "Updated" },
  { value: "translations", label: "Translations" },
];

useResultAnnouncer(computed(() => rows.value.length), total, ready, "routes", { query, options: SORTS });

const editorRoute = (route: Route) => ({ name: "route-editor", params: { projectId: projectId.value, routeId: route.id } });

/** "12 stops", "45 min · 3.2 km · loop": what the route is made of, for the Stops column. */
function stopFacts(route: Route): string[] {
  const facts: string[] = [];
  if (route.estimatedDurationMinutes) facts.push(withUnit(route.estimatedDurationMinutes, "min"));
  if (route.distanceMeters) facts.push(formatDistance(route.distanceMeters));
  if (route.loop) facts.push("loop");
  return facts;
}
const creating = ref(false);
useCreateParam(creating, computed(() => !!defaultLanguageInfo.value));
const createDisabledReason = computed(() => (defaultLanguageInfo.value ? undefined : languagesError.value ? "The languages could not be loaded" : "Add a language first"));

function onSelect(route: Route, key: string) {
  if (key === "restore-order") query.restoreManualOrder();
  else lifecycle.onSelect(route, key);
}

function onCreated(route: Route) {
  creating.value = false;
  showToast("Route created", "It is a draft. Add its stops, then activate it.");
  void router.push(editorRoute(route));
}
</script>

<template>
  <PageFrame>
    <PageHead :title="section.title" :subtitle="section.subtitle" section="routes">
      <template #actions>
        <Button :disabled-reason="createDisabledReason" @click="creating = true">New route</Button>
      </template>
    </PageHead>

    <Alert v-if="noLanguages" tone="warning" title="Add a language first" class="mb-5">
      Every route has its title and texts per language, starting with the default language.
      <template #actions>
        <Button as-child variant="secondary" size="sm">
          <RouterLink :to="{ name: 'project-languages', params: { projectId } }">Set up languages</RouterLink>
        </Button>
      </template>
    </Alert>

    <ListLoadError v-if="languagesError" :error="languagesError" what="the project languages" class="!mx-0 mb-4" @retry="reloadLanguages" />
    <ListLoadError v-if="loadError" :error="loadError" what="the routes" @retry="load" />

    <template v-else>
    <ListSourceNotice :errors="query.errors" @retry="retrySource" />
    <div class="rounded-lg border border-border bg-card shadow-1">
      <template v-if="loading || routes.length">
        <ListToolbar
          :query="query"
          :counts="counts"
          :loading="loading"
          :languages="languages"
          search-placeholder="Search title, slug or trigger"
          :sort-options="SORTS"
        >
          <template #filters>
            <FilterField v-if="categoryFilter.options.value.length || query.cat.value" label="Category" :for="categoryId">
              <Select :id="categoryId" v-model="categoryChoice" size="sm">
                <option value="ALL">All categories</option>
                <option value="NONE">In no category</option>
                <option v-for="o in categoryFilter.options.value" :key="o.id" :value="o.id">{{ o.label }}</option>
              </Select>
            </FilterField>
          </template>
          <template #filters-extra>
            <Checkbox v-model="query.featured.value">
              <span class="inline-flex items-center gap-1.5">
                <Star class="size-4" :class="query.featured.value ? 'fill-current text-primary' : 'text-muted-foreground'" aria-hidden="true" />
                Featured only
              </span>
            </Checkbox>
          </template>
        </ListToolbar>
        <ListTable
          :columns="columns"
          :rows="rows"
          :loading="loading"
          :query="query"
          :reorder="reorder"
          :row-label="title"
          :row-key-focus="rowKeyFocus"
          label="Routes"
          openable
          @open="(route) => router.push(editorRoute(route))"
        >
          <template #cell-title="{ row }">
            <div class="flex flex-wrap items-center gap-x-2 gap-y-0.5">
              <ListRowTitle :to="editorRoute(row)" :muted="row.status === 'ARCHIVED'" :missing="query.missing.value">{{ title(row) }}</ListRowTitle>
              <Chip v-if="row.featured" tone="brand" :icon="Star">Featured</Chip>
            </div>
            <div class="flex min-w-0 items-center gap-x-1.5 text-compact text-muted-foreground">
              <span class="mono min-w-0 shrink truncate" :title="row.slug">{{ row.slug }}</span>
              <template v-if="!categoryFilter.failed.value">
                <span aria-hidden="true">·</span>
                <span class="min-w-0 max-w-[50%] shrink-0 truncate" :title="categoryName(row) ?? undefined">{{ categoryName(row) ?? "No category" }}</span>
              </template>
            </div>
            <TriggerChips :triggers="triggersByRoute?.get(row.id) ?? []" :unavailable="triggersByRoute === null" />
            <MatchHint v-if="matchOf(row)" :match="matchOf(row)!" :language-name="languageName(matchOf(row)!.languageCode)" />
          </template>
          <template #cell-updated="{ row }">
            <time :datetime="row.updatedAt" class="tabular whitespace-nowrap text-compact text-muted-foreground">{{ formatDateTime(row.updatedAt).replaceAll(" ", NBSP) }}</time>
          </template>
          <template #cell-setting="{ row }">
            <Chip
              tone="outline"
              :icon="row.type === 'INDOOR' ? Building2 : Mountain"
              :title="[row.mode ? routeModeLabel(row.mode) : null, row.difficulty ? routeDifficultyLabel(row.difficulty) : null].filter(Boolean).join(' · ') || 'Mode and difficulty not set'"
            >{{ routeTypeLabel(row.type) }}</Chip>
            <p class="mt-0.5 text-compact text-muted-foreground">{{ [row.stops.length === 1 ? withUnit(1, "stop") : withUnit(row.stops.length, "stops"), ...stopFacts(row)].join(" · ") }}</p>
          </template>
          <template #cell-status="{ row }">
            <div class="flex flex-wrap gap-1">
              <StatusChip :status="row.status" />
              <StatusChip v-if="row.hasWorkingCopy" status="PENDING" label="Pending changes" title="Has pending changes that visitors do not see yet" wrap />
            </div>
          </template>
          <template #cell-translations="{ row }">
            <TranslationDots names :languages="languages" :route="editorRoute(row)" :completeness="(code) => routeCompleteness(row, code)" />
          </template>
          <template #menu="{ row }">
            <RowMenu
              :title="title(row)"
              :actions="lifecycle.actionsFor(row)"
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
        noun="routes"
        empty-title="No routes yet"
        :filtered="routes.length > 0"
        :filters="query.chips(categoryChip, languages)"
        :counts="counts"
        :status="query.status.value"
        header-action
      >
        A route is an ordered walk through your content: stops that are Points of Interest, with a mode, a difficulty and a line on the map or floor plan.
      </ListEmpty>
      <ListFooter v-if="loading || routes.length" :loading="loading" :shown="rows.length" :total="total" noun="routes" :filtered="query.isFiltered.value" legend paged />
    </div>
    </template>

    <CreateRouteDialog
      v-if="creating && defaultLanguageInfo"
      :project-id="projectId"
      :default-language="defaultLanguageInfo"
      @close="creating = false"
      @created="onCreated"
    />
    <LifecycleDialogs :lifecycle="lifecycle" />
  </PageFrame>
</template>
