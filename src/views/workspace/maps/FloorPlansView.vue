<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from "vue";
import { useRouter } from "vue-router";
import PageHead from "@/components/PageHead.vue";
import SectionTabs from "@/components/SectionTabs.vue";
import StatusChangeDialog from "@/components/StatusChangeDialog.vue";
import { Button } from "@/components/ui/button";
import { formatDate, statusChipStyle } from "@/lib/format";
import { ApiError } from "@/platform/api";
import { listAssets, type Asset } from "@/platform/assets";
import { changeFloorPlanStatus, fetchFloorPlanReferences, listFloorPlans, type FloorPlan } from "@/platform/floorPlans";
import { listPlaces, placeTitle, type Place } from "@/platform/places";
import type { ResourceReference } from "@/platform/references";
import { showToast } from "@/stores/toast";
import { useCurrentProject } from "@/workspace/currentProject";
import { referenceLink } from "@/workspace/referenceLinks";
import { findSection } from "@/workspace/sections";
import { useProjectLanguages } from "@/workspace/useProjectLanguages";
import { useStatusActions } from "@/workspace/useStatusActions";
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
function meta(f: FloorPlan): string {
  const place = placeName(f.placeId);
  const size = f.width && f.height ? ` · ${f.width} × ${f.height} px` : "";
  const placements = f.positions.length === 1 ? "1 placement" : `${f.positions.length} placements`;
  const connections = f.connections.length === 1 ? "1 floor connection" : `${f.connections.length} floor connections`;
  return `${place ? `Place: ${place} · ` : ""}${placements} · ${connections}${size}`;
}

const actions = useStatusActions<FloorPlan>({
  items: plans,
  kind: "floor plan",
  title: (f) => f.internalName,
  change: (f, target) => changeFloorPlanStatus(projectId.value, f.id, target, f.version),
  reload: load,
});
const { pendingId, confirm, confirmCopy } = actions;
const toReference = (r: ResourceReference) => referenceLink(projectId.value, r);

const creating = ref(false);
function onCreated(f: FloorPlan) {
  creating.value = false;
  showToast("Floor plan created", `${f.internalName}. Place Points of Interest on it.`);
  void router.push({ name: "floor-plan-editor", params: { projectId: projectId.value, planId: f.id } });
}
</script>

<template>
  <main class="relative min-w-0 flex-1 overflow-y-auto px-7 pb-16 pt-6">
    <PageHead :title="section.title" :subtitle="section.subtitle">
      <template #actions>
        <Button variant="brand" @click="creating = true">New floor plan</Button>
      </template>
    </PageHead>
    <SectionTabs :project-id="projectId" section="floor-plans" />

    <div v-if="loadError" role="alert" class="max-w-[640px] rounded-lg border border-l-[3px] border-l-destructive bg-card px-[18px] py-4">
      <strong class="block text-[13px] font-bold text-destructive">The floor plans could not be loaded</strong>
      <p class="mt-1 text-[13px] text-gray-700">{{ loadError.message }}</p>
      <Button variant="outline" size="sm" class="mt-3" @click="load">Try again</Button>
    </div>

    <div v-else class="overflow-hidden rounded-lg border bg-card shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
      <div v-if="loading" class="animate-skeleton" aria-busy="true" aria-label="Loading floor plans">
        <div v-for="n in 2" :key="n" class="border-b border-gray-100 px-[18px] py-4"><div class="h-[13px] w-1/3 rounded bg-[#e2e3e7]"></div></div>
      </div>
      <ul v-else-if="plans.length">
        <li v-for="m in plans" :key="m.id" class="flex flex-wrap items-center gap-3 border-b border-gray-100 px-[18px] py-3.5 last:border-b-0 hover:bg-muted">
          <div class="min-w-[min(100%,260px)] flex-1">
            <RouterLink :to="{ name: 'floor-plan-editor', params: { projectId, planId: m.id } }" class="text-[13px] font-semibold text-foreground no-underline hover:underline">
              {{ m.internalName }}
            </RouterLink>
            <div class="mt-[3px] text-[11px] text-gray-400">{{ meta(m) }} · {{ formatDate(m.updatedAt) }}</div>
          </div>
          <span class="rounded-full px-[9px] py-[3px] text-[10px] font-bold uppercase tracking-[0.07em]" :style="statusChipStyle(m.status)">{{ m.status }}</span>
          <RouterLink :to="{ name: 'floor-plan-editor', params: { projectId, planId: m.id } }" class="text-[10px] font-bold uppercase tracking-[0.06em] text-primary no-underline">Open</RouterLink>
          <button
            type="button"
            class="rounded-full border bg-muted px-[13px] py-1.5 text-[10px] font-bold uppercase tracking-[0.06em] text-gray-700 disabled:opacity-50"
            :disabled="pendingId === m.id"
            @click="actions.onToggle(m)"
          >
            {{ actions.toggleLabel(m) }}
          </button>
          <button
            v-if="m.status !== 'ARCHIVED'"
            type="button"
            class="text-[10px] font-bold uppercase tracking-[0.06em] text-destructive disabled:opacity-50"
            :disabled="pendingId === m.id"
            @click="actions.ask(m, 'ARCHIVED')"
          >
            Archive
          </button>
        </li>
      </ul>
      <div v-else class="px-6 py-12 text-center">
        <p class="mx-auto mb-[18px] max-w-[440px] text-[13px] text-muted-foreground">
          No indoor plan has been uploaded. Add one to place Resources on a floor image.
        </p>
        <Button variant="brand" @click="creating = true">New floor plan</Button>
      </div>
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

    <StatusChangeDialog
      v-if="confirm && confirmCopy"
      :heading="confirmCopy.heading"
      :body="confirm.target === 'ARCHIVED' ? 'An archived floor plan leaves the visitor app and its Place stops showing it. Restoring it makes it a draft again.' : confirmCopy.body"
      :action-label="confirmCopy.action"
      :danger="confirm.target === 'ARCHIVED'"
      :busy="pendingId === confirm.item.id"
      :load-references="() => fetchFloorPlanReferences(projectId, confirm!.item.id)"
      :blocked-by="confirm.blockedBy ?? null"
      :link-for="toReference"
      @close="actions.cancel()"
      @confirm="actions.transition(confirm.item, confirm.target)"
    />
  </main>
</template>
