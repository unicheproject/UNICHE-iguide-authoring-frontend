<script setup lang="ts">
/**
 * Points of Interest list (plan 2.2, D-076): the shared list scaffold with this kind's columns (title with slug, Place,
 * exhibit code and trigger chips; Category; status; translations), Category and Featured filters in the toolbar, manual
 * order with "Move to position...", and activation through the shared confirm. Filters, sort and search live in the URL.
 */
import { Star } from "lucide-vue-next";
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
import { formatDateTime, NBSP } from "@/lib/format";
import { ApiError } from "@/platform/api";
import { categoryLabel } from "@/platform/categories";
import { listPlaces, placeTitle, type Place } from "@/platform/places";
import { changePoiStatus, fetchPoiReferences, listPois, poiCompleteness, poiTitle, type Poi } from "@/platform/pois";
import { saveOrder } from "@/platform/ordering";
import { groupTriggersByTarget, listProjectTriggers, triggerLabel, type Trigger } from "@/platform/triggers";
import { showToast } from "@/stores/toast";
import { useCurrentProject } from "@/workspace/currentProject";
import type { ActiveFilter } from "@/workspace/listFilters";
import { findSection } from "@/workspace/sections";
import { useCategoryFilter } from "@/workspace/useCategoryFilter";
import { useProjectLanguages } from "@/workspace/useProjectLanguages";
import { useReorder } from "@/workspace/useReorder";
import { parentOptions } from "../places/placeTree";
import CreatePoiDialog from "./CreatePoiDialog.vue";
import LifecycleDialogs from "../LifecycleDialogs.vue";
import { matchedInOtherLanguage, searchTitles, sortByQuery, translationScore } from "../listRows";
import { fold } from "@/lib/utils";
import { useListLifecycle } from "../useListLifecycle";

const section = findSection("pois")!;
const project = useCurrentProject();
const router = useRouter();
const projectId = computed(() => project.value.id);
const { languages, defaultLanguage, error: languagesError, loading: languagesLoading, reload: reloadLanguages } = useProjectLanguages(projectId);

const query = useListQuery();
const pois = ref<Poi[]>([]);
const places = ref<Place[]>([]);
/** The Places could not be read (a 403 included): rows still list, without Place names or the Place choice in "New". */
const placesFailed = ref(false);
/** Non-archived triggers by POI; null when they could not be read (each row then says "Triggers not loaded"). */
const triggersByPoi = ref<Map<string, Trigger[]> | null>(null);
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
    // The Places only name a row's location: a failed read (a 403 included) must not fail the list (C2-46).
    const placeRead = listPlaces(projectId.value, signal).then(
      (found) => {
        query.reportError("places", null);
        return { found, failed: false };
      },
      (e: unknown) => {
        if (e instanceof DOMException && e.name === "AbortError") throw e;
        if (!(e instanceof ApiError)) throw e;
        query.reportError("places", e);
        return { found: [] as Place[], failed: true };
      },
    );
    // The rows are set only once the triggers read has settled, so the chips do not grow rows that are already
    // on screen (C3-91: the skeleton stays until then).
    const [found, placeResult, triggerRows] = await Promise.all([listPois(projectId.value, signal), placeRead, triggers]);
    pois.value = found;
    places.value = placeResult.found;
    placesFailed.value = placeResult.failed;
    triggersByPoi.value = triggerRows ? groupTriggersByTarget(triggerRows, "POI") : null;
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
const categoryFilter = useCategoryFilter(projectId, "POI", defaultLanguage);
// The Category choice lives in the URL (`cat`); the filter helper reads "ALL" for none.
const categoryChoice = computed<string>({
  get: () => query.cat.value || "ALL",
  set: (value) => (query.cat.value = value === "ALL" ? "" : value),
});
watch(() => query.cat.value, (value) => (categoryFilter.selected.value = value || "ALL"), { immediate: true });
watch(() => categoryFilter.error.value, (error) => query.reportError("categories", error), { immediate: true });
const categoryChip = computed<ActiveFilter[]>(() => {
  if (!query.cat.value) return [];
  const label = query.cat.value === "NONE" ? "In no category" : (categoryFilter.options.value.find((o) => o.id === query.cat.value)?.label ?? "Unknown");
  return [{ key: "category", label: `Category: ${label}`, clear: () => (query.cat.value = "") }];
});

const title = (poi: Poi) => poiTitle(poi, defaultLanguage.value);
const placeNames = computed(() => new Map(places.value.map((p) => [p.id, placeTitle(p, null, defaultLanguage.value)])));
const categoryName = (poi: Poi) => {
  const category = categoryFilter.categories.value.find((c) => c.id === poi.categoryId);
  return category ? categoryLabel(category, categoryFilter.categories.value, defaultLanguage.value) : null;
};

/** Rows that pass every filter except the status segment: the segment counts come from these (no false zeros). */
const filtered = computed(() => {
  const q = fold(query.q.value.trim());
  return pois.value.filter((poi) => {
    if (query.pending.value && !poi.hasWorkingCopy) return false;
    if (query.missing.value && poiCompleteness(poi, query.missing.value) === "complete") return false;
    if (!categoryFilter.matches(poi.categoryId)) return false;
    if (query.featured.value && !poi.featured) return false;
    if (!q) return true;
    const triggerTexts = (triggersByPoi.value?.get(poi.id) ?? []).map(triggerLabel);
    return [poi.slug, poi.code ?? "", ...searchTitles(poi.translations, query.lang.value), ...triggerTexts].some((t) => fold(t).includes(q));
  });
});
const counts = computed(() => statusCounts(filtered.value));
const rows = computed(() =>
  sortByQuery(
    filtered.value.filter((poi) => matchesStatus(poi, query.status.value)),
    query,
    (poi) => ({
      title: title(poi),
      status: poi.status,
      updated: poi.updatedAt,
      translations: translationScore(languages.value, (code) => poiCompleteness(poi, code)),
      sortOrder: poi.sortOrder,
    }),
  ),
);
const total = computed(() => segmentTotal(pois.value, query.status.value));

/** "Matches Ελληνικά: Ακρόπολη" under a row whose title only matches the search in another language (C2-48). */
function matchOf(poi: Poi) {
  return matchedInOtherLanguage(poi.translations, query.q.value, defaultLanguage.value ?? "", [title(poi), poi.slug, poi.code ?? ""]);
}
const languageName = (code: string) => languages.value.find((l) => l.languageCode === code)?.displayName ?? code;

const defaultLanguageInfo = computed(() => languages.value.find((l) => l.isDefault) ?? null);
const placeOptions = computed(() => parentOptions(places.value, defaultLanguage.value));
const noLanguages = computed(() => !languagesLoading.value && !languagesError.value && !languages.value.length);
/** The optional read to run again from the notice's "Try again". */
function retrySource(source: "categories" | "places" | "triggers") {
  // The notice goes when the read succeeds; focus has a successor (D-103).
  focusHeading();
  if (source === "categories") void categoryFilter.reload();
  else void load();
}

const lifecycle = useListLifecycle<Poi>({
  items: pois,
  projectId,
  noun: "point of interest",
  referenceType: "POI",
  title,
  changeStatus: changePoiStatus,
  fetchReferences: fetchPoiReferences,
  editorRoute: (poi) => ({ name: "poi-editor", params: { projectId: projectId.value, poiId: poi.id } }),
  reload: load,
  completeness: poiCompleteness,
  languages,
});

// Manual order (spec 12 section 3); off while a search or filter hides rows (D-017); a move steps over hidden ARCHIVED rows.
const reorder = useReorder<Poi>({
  items: pois,
  title,
  canReorder: query.canReorder,
  visible: (poi) => matchesStatus(poi, query.status.value),
  save: (ids) => saveOrder(projectId.value, "pois", ids),
  reload: load,
});

const ready = computed(() => !loading.value);
const { rowKeyFocus } = useScrollRestore(ready);

// Same anatomy as Routes, Guides, Events and Categories (C2-43): Title, the kind's own column, Status 128, Updated 152, Translations 192.
// The widths leave the Title at least 15 rem at 1280, so the list stays a table (plan section 9, item 7).
const columns: ListColumn[] = [
  { key: "title", label: "Title", tree: true, sortKey: "title" },
  { key: "place", label: "Place and category", class: "w-36" },
  { key: "status", label: "Status", sortKey: "status", class: "w-32" },
  { key: "updated", label: "Updated", sortKey: "updated", class: "w-[9.5rem]" },
  { key: "translations", label: "Translations", sortKey: "translations" },
];
const SORTS = [
  { value: "manual", label: "Manual order" },
  { value: "title", label: "Title" },
  { value: "status", label: "Status" },
  { value: "updated", label: "Updated" },
  { value: "translations", label: "Translations" },
];

useResultAnnouncer(computed(() => rows.value.length), total, ready, "points of interest", { query, options: SORTS });

const editorRoute = (poi: Poi) => ({ name: "poi-editor", params: { projectId: projectId.value, poiId: poi.id } });
const creating = ref(false);
useCreateParam(creating, computed(() => !!defaultLanguageInfo.value));
const createDisabledReason = computed(() => (defaultLanguageInfo.value ? undefined : languagesError.value ? "The languages could not be loaded" : "Add a language first"));

function onSelect(poi: Poi, key: string) {
  if (key === "restore-order") query.restoreManualOrder();
  else lifecycle.onSelect(poi, key);
}

function onCreated(poi: Poi) {
  creating.value = false;
  showToast("Point of interest created", "It is a draft. Add its texts, then activate it.");
  void router.push(editorRoute(poi));
}
</script>

<template>
  <PageFrame>
    <PageHead :title="section.title" :subtitle="section.subtitle" section="pois">
      <template #actions>
        <Button :disabled-reason="createDisabledReason" @click="creating = true">New point of interest</Button>
      </template>
    </PageHead>

    <Alert v-if="noLanguages" tone="warning" title="Add a language first" class="mb-5">
      Every point of interest has its title and texts per language, starting with the default language.
      <template #actions>
        <Button as-child variant="secondary" size="sm">
          <RouterLink :to="{ name: 'project-languages', params: { projectId } }">Set up languages</RouterLink>
        </Button>
      </template>
    </Alert>

    <ListLoadError v-if="languagesError" :error="languagesError" what="the project languages" class="!mx-0 mb-4" @retry="reloadLanguages" />
    <ListLoadError v-if="loadError" :error="loadError" what="the points of interest" @retry="load" />

    <template v-else>
    <ListSourceNotice :errors="query.errors" @retry="retrySource" />
    <div class="rounded-lg border border-border bg-card shadow-1">
      <template v-if="loading || pois.length">
        <ListToolbar
          :query="query"
          :counts="counts"
          :loading="loading"
          :languages="languages"
          search-placeholder="Search title, slug, code or trigger"
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
          label="Points of interest"
          openable
          @open="(poi) => router.push(editorRoute(poi))"
        >
          <template #cell-title="{ row }">
            <div class="flex flex-wrap items-center gap-x-2 gap-y-0.5">
              <ListRowTitle :to="editorRoute(row)" :muted="row.status === 'ARCHIVED'" :missing="query.missing.value">{{ title(row) }}</ListRowTitle>
              <Chip v-if="row.code" tone="outline" class="mono" :title="`Exhibit code ${row.code}`">{{ row.code }}</Chip>
              <Chip v-if="row.featured" tone="brand" :icon="Star">Featured</Chip>
            </div>
            <p class="mono truncate text-compact text-muted-foreground" :title="row.slug">{{ row.slug }}</p>
            <TriggerChips :triggers="triggersByPoi?.get(row.id) ?? []" :unavailable="triggersByPoi === null" empty-text="No trigger" />
            <MatchHint v-if="matchOf(row)" :match="matchOf(row)!" :language-name="languageName(matchOf(row)!.languageCode)" />
          </template>
          <template #cell-place="{ row }">
            <p class="truncate text-sm" :class="!row.placeId || placesFailed ? 'text-muted-foreground' : ''" :title="row.placeId ? placeNames.get(row.placeId) : undefined">
              {{ !row.placeId ? "No place" : placesFailed ? "Not loaded" : (placeNames.get(row.placeId) ?? "An unavailable place") }}
            </p>
            <p v-if="!categoryFilter.failed.value" class="truncate text-compact text-muted-foreground" :title="categoryName(row) ?? undefined">
              {{ categoryName(row) ?? "No category" }}
            </p>
          </template>
          <template #cell-updated="{ row }">
            <time :datetime="row.updatedAt" class="tabular whitespace-nowrap text-compact text-muted-foreground">{{ formatDateTime(row.updatedAt).replaceAll(" ", NBSP) }}</time>
          </template>
          <template #cell-status="{ row }">
            <div class="flex flex-wrap gap-1">
              <StatusChip :status="row.status" />
              <StatusChip v-if="row.hasWorkingCopy" status="PENDING" label="Pending changes" title="Has pending changes that visitors do not see yet" wrap />
            </div>
          </template>
          <template #cell-translations="{ row }">
            <TranslationDots names :languages="languages" :route="editorRoute(row)" :completeness="(code) => poiCompleteness(row, code)" />
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
        noun="points of interest"
        empty-title="No points of interest yet"
        :filtered="pois.length > 0"
        :filters="query.chips(categoryChip, languages)"
        :counts="counts"
        :status="query.status.value"
        header-action
      >
        Points of interest are the objects and spots visitors open directly: an exhibit, a statue, a viewpoint. Give each an exhibit code so visitors can type it in.
      </ListEmpty>
      <ListFooter v-if="loading || pois.length" :loading="loading" :shown="rows.length" :total="total" noun="points of interest" :filtered="query.isFiltered.value" legend paged />
    </div>
    </template>

    <CreatePoiDialog
      v-if="creating && defaultLanguageInfo"
      :project-id="projectId"
      :default-language="defaultLanguageInfo"
      :place-options="placeOptions"
      :places-failed="placesFailed"
      :category-options="categoryFilter.options.value"
      @close="creating = false"
      @created="onCreated"
    />
    <LifecycleDialogs :lifecycle="lifecycle" />
  </PageFrame>
</template>
