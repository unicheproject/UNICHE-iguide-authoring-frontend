<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from "vue";
import { useRouter } from "vue-router";
import ListEmpty from "@/components/list/ListEmpty.vue";
import ListFooter from "@/components/list/ListFooter.vue";
import ListTable, { type ListColumn } from "@/components/list/ListTable.vue";
import ListToolbar from "@/components/list/ListToolbar.vue";
import RowMenu from "@/components/list/RowMenu.vue";
import { matchesStatus, statusCounts, useListQuery, useResultAnnouncer, useScrollRestore } from "@/components/list/useListQuery";
import PageFrame from "@/components/PageFrame.vue";
import PageHead from "@/components/PageHead.vue";
import StatusChip from "@/components/StatusChip.vue";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { focusSuccessor } from "@/lib/focus";
import { formatDate } from "@/lib/format";
import { ApiError } from "@/platform/api";
import { changeMapStatus, fetchMapReferences, listMaps, type GeoMap } from "@/platform/maps";
import { listPlaces, placeTitle, type Place } from "@/platform/places";
import { listPois } from "@/platform/pois";
import { showToast } from "@/stores/toast";
import { useCurrentProject } from "@/workspace/currentProject";
import { findSection } from "@/workspace/sections";
import { useProjectLanguages } from "@/workspace/useProjectLanguages";
import LifecycleDialogs from "../LifecycleDialogs.vue";
import { sortByQuery } from "../listRows";
import { fold } from "@/lib/utils";
import { useListLifecycle } from "../useListLifecycle";
import MapsTabs from "./MapsTabs.vue";
import NewMapDialog from "./NewMapDialog.vue";

const section = findSection("maps")!;
const project = useCurrentProject();
const router = useRouter();
const projectId = computed(() => project.value.id);
const { defaultLanguage } = useProjectLanguages(projectId);

const maps = ref<GeoMap[]>([]);
const places = ref<Place[]>([]);
const placeableCount = ref(0);
const loading = ref(true);
const loadError = ref<ApiError | null>(null);
let controller: AbortController | null = null;
const errorCard = ref<InstanceType<typeof Alert> | null>(null);

/** "Try again": focus moves off the error card before it goes, to the page heading (D-103). */
function retry() {
  focusSuccessor(errorCard.value?.$el as HTMLElement | undefined, ["main h1"]);
  void load();
}

async function load() {
  controller?.abort();
  controller = new AbortController();
  loading.value = true;
  loadError.value = null;
  try {
    const [allMaps, allPlaces, pois] = await Promise.all([
      listMaps(projectId.value, controller.signal),
      listPlaces(projectId.value),
      listPois(projectId.value),
    ]);
    maps.value = allMaps;
    places.value = allPlaces;
    placeableCount.value = [...allPlaces, ...pois].filter((r) => r.status !== "ARCHIVED").length;
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

const placeName = (id: string | null) => {
  const p = id ? places.value.find((x) => x.id === id) : undefined;
  return p ? placeTitle(p, null, defaultLanguage.value) : null;
};
const shows = (m: GeoMap) => [m.showPois ? "Points of interest" : "", m.showRoutes ? "Routes" : ""].filter(Boolean).join(" and ") || "nothing but Places";
const unplacedCount = (m: GeoMap) => Math.max(0, placeableCount.value - m.placements.length);

const editorRoute = (m: GeoMap) => ({ name: "map-editor", params: { projectId: projectId.value, mapId: m.id } });

const query = useListQuery();
if (query.sort.value === "manual") query.sort.value = "updated";
const rows = computed(() => {
  const q = fold(query.q.value.trim());
  const found = maps.value.filter((m) => matchesStatus(m, query.status.value) && (!query.pending.value || m.hasWorkingCopy) && (!q || fold(m.internalName).includes(q)));
  return sortByQuery(found, query, (m) => ({ title: m.internalName, status: m.status, updated: m.updatedAt, translations: 0, sortOrder: m.sortOrder }));
});
const lifecycle = useListLifecycle<GeoMap>({
  items: maps,
  projectId,
  noun: "map",
  referenceType: "MAP",
  title: (m) => m.internalName,
  changeStatus: changeMapStatus,
  fetchReferences: fetchMapReferences,
  editorRoute,
  reload: load,
});
const ready = computed(() => !loading.value);
useScrollRestore(ready);
useResultAnnouncer(computed(() => rows.value.length), computed(() => maps.value.length), ready);

const columns: ListColumn[] = [
  { key: "title", label: "Name", sortKey: "title", class: "w-[40%]" },
  { key: "placed", label: "Placed" },
  { key: "status", label: "Status", sortKey: "status", class: "w-44" },
];
// Maps have no stored order (the backend has no order endpoint for them), so there is no Manual order and no handle.
const SORTS = [
  { value: "title", label: "Name" },
  { value: "status", label: "Status" },
  { value: "updated", label: "Updated" },
];

const creating = ref(false);
function onCreated(m: GeoMap) {
  creating.value = false;
  showToast("Map created", `${m.internalName}. Place Points of Interest from the list.`);
  void router.push(editorRoute(m));
}
</script>

<template>
  <PageFrame>
    <PageHead :title="section.title" :subtitle="section.subtitle" section="maps">
      <template #actions>
        <Button @click="creating = true">New map</Button>
      </template>
    </PageHead>
    <MapsTabs :project-id="projectId" section="maps" :maps-count="loading || loadError ? null : maps.filter((m) => m.status !== 'ARCHIVED').length" />

    <Alert v-if="loadError" ref="errorCard" tone="danger" title="The maps could not be loaded" :request-id="loadError.requestId">
      {{ loadError.message }}
      <template #actions><Button variant="secondary" size="sm" @click="retry">Try again</Button></template>
    </Alert>

    <div v-else class="rounded-lg border border-border bg-card shadow-1">
      <template v-if="loading || maps.length">
        <ListToolbar :query="query" :counts="statusCounts(maps)" :languages="[]" :show-missing="false" search-placeholder="Search map names" :sort-options="SORTS" />
        <ListTable :columns="columns" :rows="rows" :loading="loading" :query="query" :row-label="(m) => m.internalName" label="Maps" openable @open="(m) => router.push(editorRoute(m))">
          <template #cell-title="{ row }">
            <RouterLink :to="editorRoute(row)" class="font-semibold no-underline hover:underline" :class="row.status === 'ARCHIVED' ? 'text-muted-foreground' : 'text-foreground'">{{ row.internalName }}</RouterLink>
            <p class="text-compact text-muted-foreground">{{ placeName(row.placeId) ? `Linked Place: ${placeName(row.placeId)}` : "Not linked to a Place" }} · Updated {{ formatDate(row.updatedAt) }}</p>
          </template>
          <template #cell-placed="{ row }">
            <p class="text-sm font-medium">{{ row.placements.length }} placed, {{ unplacedCount(row) }} not placed</p>
            <p class="text-compact text-muted-foreground">Shows {{ shows(row) }}</p>
          </template>
          <template #cell-status="{ row }">
            <div class="flex flex-wrap gap-1">
              <StatusChip :status="row.status" />
              <StatusChip v-if="row.hasWorkingCopy" status="PENDING" label="Pending changes" title="Has pending changes that visitors do not see yet" />
            </div>
          </template>
          <template #menu="{ row }">
            <RowMenu :title="row.internalName" :actions="lifecycle.actionsFor(row)" :item="row" @select="(key) => lifecycle.onSelect(row, key)" />
          </template>
        </ListTable>
      </template>
      <ListEmpty v-if="!loading && !rows.length" noun="maps" empty-title="No maps yet" :filtered="maps.length > 0" :filters="query.chips([], [])" @clear="query.clear()">
        A map shows Points of Interest and Places by coordinates on real streets. Create one to set its area and place items.
        <template #actions><Button @click="creating = true">New map</Button></template>
      </ListEmpty>
      <ListFooter v-if="maps.length" :shown="rows.length" :total="maps.length" noun="maps" :filtered="query.isFiltered.value" @clear="query.clear()" />
    </div>

    <NewMapDialog
      v-if="creating"
      :project-id="projectId"
      :places="places"
      :linked-place-ids="maps.flatMap((m) => (m.placeId ? [m.placeId] : []))"
      :default-language="defaultLanguage"
      @close="creating = false"
      @created="onCreated"
    />
    <LifecycleDialogs :lifecycle="lifecycle" />
  </PageFrame>
</template>
