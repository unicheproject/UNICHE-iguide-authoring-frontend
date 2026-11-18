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
import { listAssets, type Asset } from "@/platform/assets";
import { changeFloorPlanStatus, fetchFloorPlanReferences, listFloorPlans, type FloorPlan } from "@/platform/floorPlans";
import { saveOrder } from "@/platform/ordering";
import { listPlaces, placeTitle, type Place } from "@/platform/places";
import { showToast } from "@/stores/toast";
import { useCurrentProject } from "@/workspace/currentProject";
import { findSection } from "@/workspace/sections";
import { useProjectLanguages } from "@/workspace/useProjectLanguages";
import { useReorder } from "@/workspace/useReorder";
import LifecycleDialogs from "../LifecycleDialogs.vue";
import { sortByQuery } from "../listRows";
import { fold } from "@/lib/utils";
import { useListLifecycle } from "../useListLifecycle";
import MapsTabs from "./MapsTabs.vue";
import NewFloorPlanDialog from "./NewFloorPlanDialog.vue";

const section = findSection("floor-plans")!;
const project = useCurrentProject();
const router = useRouter();
const projectId = computed(() => project.value.id);
const { defaultLanguage } = useProjectLanguages(projectId);

const plans = ref<FloorPlan[]>([]);
const places = ref<Place[]>([]);
const assets = ref<Asset[]>([]);
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
    const [allPlans, allPlaces, library] = await Promise.all([
      listFloorPlans(projectId.value, controller.signal),
      listPlaces(projectId.value),
      listAssets(projectId.value),
    ]);
    plans.value = allPlans;
    places.value = allPlaces;
    assets.value = library;
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

const editorRoute = (f: FloorPlan) => ({ name: "floor-plan-editor", params: { projectId: projectId.value, planId: f.id } });

const query = useListQuery();
/** Plans of one Place in the order of its floor switcher (spec 12 section 3, D-017); the position is shown in the Place column. */
function orderInPlace(f: FloorPlan): string | null {
  if (!f.placeId) return null;
  const siblings = plans.value.filter((p) => p.placeId === f.placeId && p.status !== "ARCHIVED").sort((a, b) => a.sortOrder - b.sortOrder);
  const index = siblings.findIndex((p) => p.id === f.id);
  return index < 0 ? null : `Floor ${index + 1} of ${siblings.length} in this Place`;
}
const rows = computed(() => {
  const q = fold(query.q.value.trim());
  const found = plans.value.filter((f) => matchesStatus(f, query.status.value) && (!query.pending.value || f.hasWorkingCopy) && (!q || fold(`${f.internalName} ${placeName(f.placeId) ?? ""}`).includes(q)));
  return sortByQuery(found, query, (f) => ({ title: f.internalName, status: f.status, updated: f.updatedAt, translations: 0, sortOrder: f.sortOrder }));
});
const lifecycle = useListLifecycle<FloorPlan>({
  items: plans,
  projectId,
  noun: "floor plan",
  referenceType: "FLOOR_PLAN",
  title: (f) => f.internalName,
  changeStatus: changeFloorPlanStatus,
  fetchReferences: fetchFloorPlanReferences,
  editorRoute,
  reload: load,
});
// The floor plans of one Place reorder among themselves; plans without a Place among themselves.
const reorder = useReorder<FloorPlan>({
  items: plans,
  siblingKey: (plan) => plan.placeId,
  save: (ids) => saveOrder(projectId.value, "floor-plans", ids),
  title: (plan) => plan.internalName,
  canReorder: query.canReorder,
  visible: (f) => matchesStatus(f, query.status.value),
  reload: load,
});
const ready = computed(() => !loading.value);
useScrollRestore(ready);
useResultAnnouncer(computed(() => rows.value.length), computed(() => plans.value.length), ready);

const columns: ListColumn[] = [
  { key: "title", label: "Name", sortKey: "title", class: "w-[34%]" },
  { key: "place", label: "Linked Place" },
  { key: "placed", label: "Placed", class: "w-40" },
  { key: "status", label: "Status", sortKey: "status", class: "w-44" },
];
const SORTS = [
  { value: "manual", label: "Manual order" },
  { value: "title", label: "Name" },
  { value: "status", label: "Status" },
  { value: "updated", label: "Updated" },
];

const creating = ref(false);
function onCreated(f: FloorPlan) {
  creating.value = false;
  showToast("Floor plan created", `${f.internalName}. Place Points of Interest on it.`);
  void router.push(editorRoute(f));
}
function onSelect(f: FloorPlan, key: string) {
  if (key === "restore-order") query.restoreManualOrder();
  else lifecycle.onSelect(f, key);
}
</script>

<template>
  <PageFrame>
    <PageHead :title="section.title" :subtitle="section.subtitle" section="floor-plans">
      <template #actions>
        <Button @click="creating = true">New floor plan</Button>
      </template>
    </PageHead>
    <MapsTabs :project-id="projectId" section="floor-plans" :plans-count="loading || loadError ? null : plans.filter((f) => f.status !== 'ARCHIVED').length" />

    <Alert v-if="loadError" ref="errorCard" tone="danger" title="The floor plans could not be loaded" :request-id="loadError.requestId">
      {{ loadError.message }}
      <template #actions><Button variant="secondary" size="sm" @click="retry">Try again</Button></template>
    </Alert>

    <div v-else class="rounded-lg border border-border bg-card shadow-1">
      <template v-if="loading || plans.length">
        <ListToolbar :query="query" :counts="statusCounts(plans)" :languages="[]" :show-missing="false" search-placeholder="Search plan or Place names" :sort-options="SORTS" />
        <ListTable :columns="columns" :rows="rows" :loading="loading" :query="query" :reorder="reorder" :row-label="(f) => f.internalName" label="Floor plans" openable @open="(f) => router.push(editorRoute(f))">
          <template #cell-title="{ row }">
            <RouterLink :to="editorRoute(row)" class="font-semibold no-underline hover:underline" :class="row.status === 'ARCHIVED' ? 'text-muted-foreground' : 'text-foreground'">{{ row.internalName }}</RouterLink>
            <p class="text-compact text-muted-foreground">Updated {{ formatDate(row.updatedAt) }}<template v-if="row.width && row.height"> · {{ row.width }} × {{ row.height }} px</template></p>
          </template>
          <template #cell-place="{ row }">
            <p class="text-sm font-medium">{{ placeName(row.placeId) ?? "Not linked to a Place" }}</p>
            <p v-if="orderInPlace(row)" class="text-compact text-muted-foreground">{{ orderInPlace(row) }}</p>
          </template>
          <template #cell-placed="{ row }">
            <p class="text-sm font-medium">{{ row.positions.length }} placed</p>
          </template>
          <template #cell-status="{ row }">
            <div class="flex flex-wrap gap-1">
              <StatusChip :status="row.status" />
              <StatusChip v-if="row.hasWorkingCopy" status="PENDING" label="Pending changes" title="Has pending changes that visitors do not see yet" />
            </div>
          </template>
          <template #menu="{ row }">
            <RowMenu :title="row.internalName" :actions="lifecycle.actionsFor(row)" :reorder="reorder" :item="row" :reorder-reason="query.reorderReason.value" @select="(key) => onSelect(row, key)" />
          </template>
        </ListTable>
      </template>
      <ListEmpty v-if="!loading && !rows.length" noun="floor plans" empty-title="No floor plans yet" :filtered="plans.length > 0" :filters="query.chips([], [])" @clear="query.clear()">
        A floor plan is an indoor image, one per floor, on which you place Points of Interest. Upload or pick an image to start.
        <template #actions><Button @click="creating = true">New floor plan</Button></template>
      </ListEmpty>
      <ListFooter v-if="plans.length" :shown="rows.length" :total="plans.length" noun="floor plans" :filtered="query.isFiltered.value" @clear="query.clear()" />
    </div>

    <NewFloorPlanDialog
      v-if="creating"
      :project-id="projectId"
      :assets="assets"
      :places="places"
      :linked-place-ids="plans.flatMap((f) => (f.placeId ? [f.placeId] : []))"
      :default-language="defaultLanguage"
      @close="creating = false"
      @created="onCreated"
      @uploaded="assets.unshift($event)"
    />
    <LifecycleDialogs :lifecycle="lifecycle" />
  </PageFrame>
</template>
