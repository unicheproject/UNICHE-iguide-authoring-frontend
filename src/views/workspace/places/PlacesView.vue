<script setup lang="ts">
/**
 * Places list (plan 2.2, D-076): the shared list scaffold with this kind's columns (title with slug and trigger chips,
 * indoor or outdoor with its type, linked map or floor plan, status, translations). Places form a tree: rows indent by
 * level with a disclosure button, and the order is the author's own (Manual only), among siblings. Activation goes
 * through the shared confirm. Filters and search live in the URL.
 */
import { Building2, Layers, Map as MapIcon, Mountain, Plus, Star } from "lucide-vue-next";
import { computed, onBeforeUnmount, ref, watch } from "vue";
import { useRouter } from "vue-router";
import ListEmpty from "@/components/list/ListEmpty.vue";
import ListFooter from "@/components/list/ListFooter.vue";
import ListRowTitle from "@/components/list/ListRowTitle.vue";
import ListSourceNotice from "@/components/list/ListSourceNotice.vue";
import ListTable, { type ListColumn } from "@/components/list/ListTable.vue";
import ListToolbar from "@/components/list/ListToolbar.vue";
import RowMenu from "@/components/list/RowMenu.vue";
import ListLoadError from "@/components/list/ListLoadError.vue";
import MatchHint from "@/components/list/MatchHint.vue";
import type { RowAction } from "@/components/list/RowMenu.vue";
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
import { listFloorPlans } from "@/platform/floorPlans";
import { listMaps } from "@/platform/maps";
import { saveOrder } from "@/platform/ordering";
import {
  changePlaceStatus,
  fetchPlaceReferences,
  listPlaces,
  PLACE_SETTING_LABELS,
  placeTitle,
  translationCompleteness,
  type Place,
} from "@/platform/places";
import { groupTriggersByTarget, listProjectTriggers, triggerLabel, type Trigger } from "@/platform/triggers";
import { showToast } from "@/stores/toast";
import { useCurrentProject } from "@/workspace/currentProject";
import { findSection } from "@/workspace/sections";
import { useProjectLanguages } from "@/workspace/useProjectLanguages";
import { useReorder } from "@/workspace/useReorder";
import LifecycleDialogs from "../LifecycleDialogs.vue";
import { matchedInOtherLanguage, searchTitles } from "../listRows";
import { fold } from "@/lib/utils";
import { useListLifecycle } from "../useListLifecycle";
import CreatePlaceDialog from "./CreatePlaceDialog.vue";
import { flattenPlaceTree, parentOptions, placeTypeLabel } from "./placeTree";

const section = findSection("places")!;
const project = useCurrentProject();
const router = useRouter();
const projectId = computed(() => project.value.id);
const { languages, defaultLanguage, error: languagesError, loading: languagesLoading, reload: reloadLanguages } = useProjectLanguages(projectId);

// Places sort Manual only: the tree order is the point (plan 2.2).
const query = useListQuery();
const places = ref<Place[]>([]);
const loading = ref(true);
const loadError = ref<ApiError | null>(null);
/** Non-archived triggers by Place; null when they could not be read (each row then says "Triggers not loaded"). */
const triggersByPlace = ref<Map<string, Trigger[]> | null>(null);
/** Ids of Places that have a map, and of Places that have a floor plan; null until known (or when unreadable). */
const linked = ref<{ maps: Set<string>; plans: Set<string> } | null>(null);
let controller: AbortController | null = null;

async function load() {
  controller?.abort();
  controller = new AbortController();
  const signal = controller.signal;
  loading.value = true;
  loadError.value = null;
  try {
    // The chips and the link state are hints: a failure to read them must not hide the list (the chips' failure is a notice).
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
    void Promise.all([listMaps(projectId.value, signal), listFloorPlans(projectId.value, signal)])
      .then(([maps, plans]) => {
        if (signal.aborted) return;
        linked.value = {
          maps: new Set(maps.flatMap((m) => (m.placeId ? [m.placeId] : []))),
          plans: new Set(plans.flatMap((p) => (p.placeId ? [p.placeId] : []))),
        };
      })
      .catch(() => (linked.value = null));
    // The rows are set once the triggers read has settled, so the chips never grow rows already on screen (C3-91).
    const [found, triggerRows] = await Promise.all([listPlaces(projectId.value, signal), triggers]);
    places.value = found;
    triggersByPlace.value = triggerRows ? groupTriggersByTarget(triggerRows, "PLACE") : null;
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

const title = (place: Place) => placeTitle(place, null, defaultLanguage.value);

/** Rows that pass every filter except the status segment: the segment counts come from these (no false zeros). */
const filteredAnyStatus = computed(() => {
  const q = fold(query.q.value.trim());
  return places.value.filter((place) => {
    if (query.pending.value && !place.hasWorkingCopy) return false;
    if (query.missing.value && translationCompleteness(place, query.missing.value) === "complete") return false;
    if (query.featured.value && !place.featured) return false;
    if (!q) return true;
    const triggerTexts = (triggersByPlace.value?.get(place.id) ?? []).map(triggerLabel);
    return [place.slug, ...searchTitles(place.translations, query.lang.value), ...triggerTexts].some((t) => fold(t).includes(q));
  });
});
const counts = computed(() => statusCounts(filteredAnyStatus.value));
const filtered = computed(() => filteredAnyStatus.value.filter((place) => matchesStatus(place, query.status.value)));
const total = computed(() => segmentTotal(places.value, query.status.value));

/** "Matches Ελληνικά: Ακρόπολη" under a row whose title only matches the search in another language (C2-48). */
function matchOf(place: Place) {
  return matchedInOtherLanguage(place.translations, query.q.value, defaultLanguage.value ?? "", [title(place), place.slug]);
}
const languageName = (code: string) => languages.value.find((l) => l.languageCode === code)?.displayName ?? code;
/** Rows in tree order with their level; a Place whose parent is filtered out stands at the top level. */
const tree = computed(() => flattenPlaceTree(filtered.value));
const rows = computed(() => tree.value.map((node) => node.place));
const depths = computed(() => new Map(tree.value.map((node) => [node.place.id, node.depth])));
const parents = computed(() => new Set(tree.value.flatMap((node) => (node.place.parentPlaceId && depths.value.has(node.place.parentPlaceId) ? [node.place.parentPlaceId] : []))));

const defaultLanguageInfo = computed(() => languages.value.find((l) => l.isDefault) ?? null);
const createOptions = computed(() => parentOptions(places.value, defaultLanguage.value));
const noLanguages = computed(() => !languagesLoading.value && !languagesError.value && !languages.value.length);

/** Whether the Place has the map (outdoor) or floor plan (indoor) its setting uses; null while unknown. */
function link(place: Place): { linked: boolean; noun: string } | null {
  if (!linked.value) return null;
  return place.setting === "INDOOR"
    ? { linked: linked.value.plans.has(place.id), noun: "Floor plan" }
    : { linked: linked.value.maps.has(place.id), noun: "Map" };
}

const editorRoute = (place: Place) => ({ name: "place-editor", params: { projectId: projectId.value, placeId: place.id } });

const lifecycle = useListLifecycle<Place>({
  items: places,
  projectId,
  noun: "place",
  referenceType: "PLACE",
  title,
  changeStatus: changePlaceStatus,
  fetchReferences: fetchPlaceReferences,
  editorRoute,
  reload: load,
  completeness: translationCompleteness,
  languages,
});

// Manual order (spec 12 section 3) among siblings as the tree shows them; off while a search or filter hides rows (D-017).
const reorder = useReorder<Place>({
  items: places,
  siblingKey: (place) => (place.parentPlaceId && places.value.some((p) => p.id === place.parentPlaceId) ? place.parentPlaceId : null),
  title,
  canReorder: query.canReorder,
  visible: (place) => matchesStatus(place, query.status.value),
  save: (ids) => saveOrder(projectId.value, "places", ids),
  reload: load,
});

const ready = computed(() => !loading.value);
const { rowKeyFocus } = useScrollRestore(ready);

// Status 128, Updated 152, Translations 192 and one domain column of 176 leave the Title at least 15 rem at 1280 (a tree
// step takes 24 px of it per level), so the list stays a table there (plan section 9, item 7).
const columns: ListColumn[] = [
  { key: "title", label: "Title", tree: true },
  { key: "setting", label: "Setting and map", class: "w-44" },
  { key: "status", label: "Status", class: "w-32" },
  { key: "updated", label: "Updated", class: "w-[9.5rem]" },
  { key: "translations", label: "Translations" },
];
/** The optional read to run again from the notice's "Try again". */
function retrySource() {
  focusHeading();
  void load();
}
const SORTS = [{ value: "manual", label: "Manual order (tree)" }];
useResultAnnouncer(computed(() => rows.value.length), total, ready, "places", { query, options: SORTS });
const creating = ref(false);
/** The Place a sub-place is being added to ("Add sub-place" in a row's menu); empty for the toolbar's "New place". */
const subPlaceOf = ref("");
useCreateParam(creating, computed(() => !!defaultLanguageInfo.value));
const createDisabledReason = computed(() => (defaultLanguageInfo.value ? undefined : languagesError.value ? "The languages could not be loaded" : "Add a language first"));

function actionsFor(place: Place): RowAction[] {
  const own = lifecycle.actionsFor(place);
  if (place.status === "ARCHIVED" || !defaultLanguageInfo.value) return own;
  return [{ key: "add-sub", label: "Add sub-place", icon: Plus }, ...own];
}
function openCreate(parentId = "") {
  subPlaceOf.value = parentId;
  creating.value = true;
}
watch(creating, (open) => {
  if (!open) subPlaceOf.value = "";
});

function onSelect(place: Place, key: string) {
  if (key === "restore-order") query.restoreManualOrder();
  else if (key === "add-sub") openCreate(place.id);
  else lifecycle.onSelect(place, key);
}

function onCreated(place: Place) {
  creating.value = false;
  showToast("Place created", "It is a draft. Add its texts, then activate it.");
  void router.push(editorRoute(place));
}
</script>

<template>
  <PageFrame>
    <PageHead :title="section.title" :subtitle="section.subtitle" section="places">
      <template #actions>
        <Button :disabled-reason="createDisabledReason" @click="openCreate()">New place</Button>
      </template>
    </PageHead>

    <Alert v-if="noLanguages" tone="warning" title="Add a language first" class="mb-5">
      Every place has its title and texts per language, starting with the default language.
      <template #actions>
        <Button as-child variant="secondary" size="sm">
          <RouterLink :to="{ name: 'project-languages', params: { projectId } }">Set up languages</RouterLink>
        </Button>
      </template>
    </Alert>

    <ListLoadError v-if="languagesError" :error="languagesError" what="the project languages" class="!mx-0 mb-4" @retry="reloadLanguages" />
    <ListLoadError v-if="loadError" :error="loadError" what="the places" @retry="load" />

    <template v-else>
    <ListSourceNotice :errors="query.errors" @retry="retrySource" />
    <div class="rounded-lg border border-border bg-card shadow-1">
      <template v-if="loading || places.length">
        <ListToolbar
          :query="query"
          :counts="counts"
          :loading="loading"
          :languages="languages"
          search-placeholder="Search title, slug or trigger"
          :sort-options="SORTS"
        >
          <template #filters-extra>
            <Checkbox v-model="query.featured.value">
              <span class="inline-flex items-center gap-1.5">
                <Star class="size-4" :class="query.featured.value ? 'fill-current text-primary' : 'text-muted-foreground'" aria-hidden="true" />
                Featured only
              </span>
            </Checkbox>
          </template>
        </ListToolbar>
        <p class="border-b border-border px-4 py-2 text-compact text-muted-foreground">Ordered by hierarchy and manual order. Sub-places sit under their parent.</p>
        <ListTable
          :columns="columns"
          :rows="rows"
          :loading="loading"
          :query="query"
          :reorder="reorder"
          :depth="(place) => depths.get(place.id) ?? 0"
          :has-children="(place) => parents.has(place.id)"
          :row-label="title"
          :row-key-focus="rowKeyFocus"
          label="Places"
          openable
          @open="(place) => router.push(editorRoute(place))"
        >
          <template #cell-title="{ row }">
            <div class="flex flex-wrap items-center gap-x-2 gap-y-0.5">
              <ListRowTitle :to="editorRoute(row)" :muted="row.status === 'ARCHIVED'" :missing="query.missing.value">{{ title(row) }}</ListRowTitle>
              <Chip v-if="row.featured" tone="brand" :icon="Star">Featured</Chip>
            </div>
            <p class="mono truncate text-compact text-muted-foreground" :title="row.slug">{{ row.slug }}</p>
            <TriggerChips :triggers="triggersByPlace?.get(row.id) ?? []" :unavailable="triggersByPlace === null" />
            <MatchHint v-if="matchOf(row)" :match="matchOf(row)!" :language-name="languageName(matchOf(row)!.languageCode)" />
          </template>
          <template #cell-setting="{ row }">
            <div class="flex flex-wrap items-center gap-x-2 gap-y-0.5">
              <Chip tone="outline" :icon="row.setting === 'INDOOR' ? Building2 : Mountain">{{ PLACE_SETTING_LABELS[row.setting].label }}</Chip>
              <span class="text-compact text-muted-foreground">{{ placeTypeLabel(row.type) }}</span>
            </div>
            <p v-if="link(row)" class="mt-0.5 flex items-center gap-1 text-compact" :class="link(row)!.linked ? 'text-success' : 'text-muted-foreground'">
              <component :is="row.setting === 'INDOOR' ? Layers : MapIcon" v-if="link(row)!.linked" class="size-4 shrink-0" aria-hidden="true" />
              {{ link(row)!.linked ? `${link(row)!.noun} linked` : `No ${link(row)!.noun.toLowerCase()} linked` }}
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
            <TranslationDots names :languages="languages" :route="editorRoute(row)" :completeness="(code) => translationCompleteness(row, code)" />
          </template>
          <template #menu="{ row }">
            <RowMenu
              :title="title(row)"
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
        noun="places"
        empty-title="No places yet"
        :filtered="places.length > 0"
        :filters="query.chips([], languages)"
        :counts="counts"
        :status="query.status.value"
        header-action
      >
        Places are physical or conceptual locations, from a whole region down to a single room. Points of Interest and Routes are organized under them.
      </ListEmpty>
      <ListFooter v-if="loading || places.length" :loading="loading" :shown="rows.length" :total="total" noun="places" :filtered="query.isFiltered.value" legend paged />
    </div>
    </template>

    <CreatePlaceDialog
      v-if="creating && defaultLanguageInfo"
      :project-id="projectId"
      :default-language="defaultLanguageInfo"
      :parent-options="createOptions"
      :initial-parent-id="subPlaceOf"
      @close="creating = false"
      @created="onCreated"
    />
    <LifecycleDialogs :lifecycle="lifecycle" />
  </PageFrame>
</template>
