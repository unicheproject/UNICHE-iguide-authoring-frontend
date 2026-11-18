<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import ListEmpty from "@/components/list/ListEmpty.vue";
import ListFooter from "@/components/list/ListFooter.vue";
import ListTable, { type ListColumn } from "@/components/list/ListTable.vue";
import ListToolbar from "@/components/list/ListToolbar.vue";
import RowMenu, { type RowAction } from "@/components/list/RowMenu.vue";
import { matchesStatus, statusCounts, useListQuery, useResultAnnouncer, useScrollRestore } from "@/components/list/useListQuery";
import StatusChip from "@/components/StatusChip.vue";
import TranslationDots from "@/components/TranslationDots.vue";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { listPois, poiCompleteness, poiTitle, type Poi } from "@/platform/pois";
import { ApiError } from "@/platform/api";
import { useProjectLanguages } from "@/workspace/useProjectLanguages";
import { useReorder } from "@/workspace/useReorder";
import PageHead from "@/components/PageHead.vue";

const router = useRouter();
const projectId = computed(() => String(useRoute().params.projectId)); // real views: useCurrentProject().value.id
const { languages, defaultLanguage } = useProjectLanguages(projectId);
const pois = ref<Poi[]>([]);
const loading = ref(true);
const error = ref<ApiError | null>(null);
async function load() {
  loading.value = true;
  error.value = null;
  try {
    pois.value = await listPois(projectId.value);
  } catch (e) {
    if (!(e instanceof ApiError)) throw e;
    error.value = e;
  } finally {
    loading.value = false;
  }
}
watch(projectId, load, { immediate: true });

const query = useListQuery();
const title = (p: Poi) => poiTitle(p, defaultLanguage.value);
const rows = computed(() => {
  const q = query.q.value.trim().toLowerCase();
  const out = pois.value.filter(
    (p) =>
      matchesStatus(p, query.status.value) &&
      (!query.pending.value || p.hasWorkingCopy) &&
      (!query.missing.value || poiCompleteness(p, query.missing.value) !== "complete") &&
      (!q || title(p).toLowerCase().includes(q) || p.slug.includes(q)),
  );
  const by = query.sort.value;
  const sign = query.dir.value === "asc" ? 1 : -1;
  return out.sort((a, b) =>
    by === "title" ? sign * title(a).localeCompare(title(b)) : by === "updated" ? sign * a.updatedAt.localeCompare(b.updatedAt) : a.sortOrder - b.sortOrder,
  );
});
const reorder = useReorder<Poi>({
  items: pois,
  title,
  canReorder: query.canReorder,
  visible: (p) => matchesStatus(p, query.status.value),
  save: async () => {}, // demo: nothing is written; the real view calls saveOrder(projectId, "pois", ids)
  reload: load,
});
const ready = computed(() => !loading.value);
useScrollRestore(ready);
useResultAnnouncer(computed(() => rows.value.length), computed(() => pois.value.length), ready, "shown");

const columns: ListColumn[] = [
  { key: "title", label: "Title", tree: true, sortKey: "title", class: "w-[44%]" },
  { key: "status", label: "Status", class: "w-40" },
  { key: "translations", label: "Translations" },
];
const actions = (p: Poi): RowAction[] => [{ key: p.status === "ACTIVE" ? "deactivate" : "activate", label: p.status === "ACTIVE" ? "Deactivate" : "Activate" }];
function onSelect(key: string) {
  if (key === "restore-order") query.restoreManualOrder();
}
</script>

<template>
  <div>
    <PageHead title="Points of interest" subtitle="Scaffold demo (no data is written)" />
    <Alert v-if="error" tone="danger" title="The points of interest could not be loaded" :request-id="error.requestId">
      {{ error.message }}
      <template #actions><Button variant="secondary" size="sm" @click="load">Try again</Button></template>
    </Alert>
    <div v-else class="rounded-lg border border-border bg-card shadow-1">
      <ListToolbar
        :query="query"
        :counts="statusCounts(pois)"
        :languages="languages"
        search-placeholder="Search title or slug"
        :sort-options="[{ value: 'manual', label: 'Manual order' }, { value: 'title', label: 'Title' }, { value: 'updated', label: 'Updated' }]"
      />
      <ListTable
        :columns="columns"
        :rows="rows"
        :loading="loading"
        :query="query"
        :reorder="reorder"
        :row-label="title"
        label="Points of interest"
        openable
        @open="(p) => router.push({ name: 'poi-editor', params: { projectId, poiId: p.id } })"
      >
        <template #cell-title="{ row }">
          <RouterLink :to="{ name: 'poi-editor', params: { projectId, poiId: row.id } }" class="font-semibold text-foreground no-underline hover:underline">{{ title(row) }}</RouterLink>
          <p class="text-compact text-muted-foreground"><span class="mono">{{ row.slug }}</span></p>
        </template>
        <template #cell-status="{ row }">
          <StatusChip :status="row.status" />
          <StatusChip v-if="row.hasWorkingCopy" status="PENDING" label="Pending changes" class="ml-1" />
        </template>
        <template #cell-translations="{ row }">
          <TranslationDots names :languages="languages" :completeness="(code) => poiCompleteness(row, code)" />
        </template>
        <template #menu="{ row }">
          <RowMenu :title="title(row)" :actions="actions(row)" :reorder="reorder" :item="row" :reorder-reason="query.reorderReason.value" @select="onSelect" />
        </template>
      </ListTable>
      <ListEmpty
        v-if="!loading && !rows.length"
        noun="points of interest"
        empty-title="No points of interest yet"
        :filtered="pois.length > 0"
        :filters="query.chips([], languages)"
        @clear="query.clear()"
      >
        A point of interest is a place visitors can stop at and read about.
      </ListEmpty>
      <ListFooter :shown="rows.length" :total="pois.length" noun="points of interest" :filtered="query.isFiltered.value" legend @clear="query.clear()" />
    </div>
  </div>
</template>
