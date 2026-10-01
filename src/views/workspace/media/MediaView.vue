<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from "vue";
import PageHead from "@/components/PageHead.vue";
import AssetThumb from "@/components/media/AssetThumb.vue";
import UploadDialog from "@/components/media/UploadDialog.vue";
import { Button } from "@/components/ui/button";
import { formatDate, statusChipStyle } from "@/lib/format";
import { ApiError } from "@/platform/api";
import {
  ASSET_TYPES,
  assetMatches,
  assetMeta,
  assetTypeLabel,
  listAssets,
  missingAlternativeText,
  type Asset,
  type AssetType,
} from "@/platform/assets";
import type { ResourceStatus } from "@/platform/places";
import { useCurrentProject } from "@/workspace/currentProject";
import { findSection } from "@/workspace/sections";
import { useProjectLanguages } from "@/workspace/useProjectLanguages";

const section = findSection("media")!;
const project = useCurrentProject();
const projectId = computed(() => project.value.id);
const { defaultLanguage } = useProjectLanguages(projectId);

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
    assets.value = await listAssets(projectId.value, controller.signal);
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

// Upload ------------------------------------------------------------------------------------------------

const uploading = ref(false);
const droppedFiles = ref<File[]>([]);
const dragging = ref(false);

function openUpload(files: File[] = []) {
  droppedFiles.value = files;
  uploading.value = true;
}

function onDrop(event: DragEvent) {
  dragging.value = false;
  const files = event.dataTransfer?.files;
  if (files?.length && !uploading.value) openUpload(Array.from(files));
}

function onUploaded(asset: Asset) {
  assets.value = [asset, ...assets.value.filter((a) => a.id !== asset.id)];
}

// View and filters --------------------------------------------------------------------------------------

const VIEW_KEY = "iguide.media.view";
function storedView(): "grid" | "list" {
  try {
    return localStorage.getItem(VIEW_KEY) === "list" ? "list" : "grid";
  } catch {
    return "grid";
  }
}
const view = ref<"grid" | "list">(storedView());
watch(view, (value) => {
  try {
    localStorage.setItem(VIEW_KEY, value);
  } catch {
    // A blocked storage only loses the remembered view.
  }
});

const MAIN_TYPES: AssetType[] = ["IMAGE", "AUDIO", "VIDEO", "DOCUMENT", "THREE_D_MODEL"];
const typeFilter = ref<"ALL" | AssetType>("ALL");
const statusFilter = ref<"ALL" | ResourceStatus>("ALL");
const query = ref("");
const typeChips = computed(() => [
  ...MAIN_TYPES,
  ...ASSET_TYPES.filter((t) => !MAIN_TYPES.includes(t) && assets.value.some((a) => a.type === t)),
]);

const visible = computed(() =>
  assets.value.filter(
    (a) =>
      (typeFilter.value === "ALL" || a.type === typeFilter.value) &&
      (statusFilter.value === "ALL" || a.status === statusFilter.value) &&
      assetMatches(a, query.value),
  ),
);

// Paging ------------------------------------------------------------------------------------------------

const PAGE_SIZE = 24;
const page = ref(0);
watch([typeFilter, statusFilter, query], () => (page.value = 0));
const pageCount = computed(() => Math.max(1, Math.ceil(visible.value.length / PAGE_SIZE)));
const pageItems = computed(() => visible.value.slice(page.value * PAGE_SIZE, (page.value + 1) * PAGE_SIZE));
const rangeText = computed(() => {
  const total = visible.value.length;
  if (!total) return `0 of ${assets.value.length}`;
  const from = page.value * PAGE_SIZE + 1;
  const to = Math.min(total, from + PAGE_SIZE - 1);
  return `${from} to ${to} of ${total}${total !== assets.value.length ? ` (${assets.value.length} in the library)` : ""}`;
});
watch(pageCount, (count) => {
  if (page.value >= count) page.value = count - 1;
});

function chipClass(selected: boolean) {
  return selected ? "border-primary bg-primary font-bold text-white" : "bg-card font-semibold text-gray-700";
}
</script>

<template>
  <main
    class="relative min-w-0 flex-1 overflow-y-auto px-7 pb-16 pt-6"
    @dragover.prevent="dragging = !uploading"
    @dragleave.self="dragging = false"
    @drop.prevent="onDrop"
  >
    <PageHead :title="section.title" subtitle="Images, audio, video, documents and 3D models used by your content">
      <template #actions>
        <Button variant="brand" @click="openUpload()">Upload</Button>
      </template>
    </PageHead>

    <div
      v-if="dragging"
      class="pointer-events-none absolute inset-3 z-10 flex items-center justify-center rounded-xl border-2 border-dashed border-primary bg-primary/[0.06] text-[15px] font-bold text-primary"
    >
      Drop to upload
    </div>

    <div class="mb-4 flex flex-wrap items-center gap-2.5">
      <input
        v-model="query"
        type="search"
        aria-label="Search by name, filename or title"
        placeholder="Search by name, filename or title"
        class="min-w-[240px] flex-1 rounded-lg border-[1.5px] px-3 py-[9px] text-[13px] focus:border-primary focus:outline-none"
      />
      <div class="flex overflow-hidden rounded-lg border" role="group" aria-label="View">
        <button
          v-for="v in (['grid', 'list'] as const)"
          :key="v"
          type="button"
          :aria-pressed="view === v"
          class="px-3 py-[7px] text-[11px] font-bold"
          :class="view === v ? 'bg-primary text-white' : 'bg-card text-gray-700'"
          @click="view = v"
        >
          {{ v === "grid" ? "Grid" : "List" }}
        </button>
      </div>
    </div>
    <div class="mb-4 flex flex-wrap items-center gap-x-5 gap-y-2.5">
      <div class="flex flex-wrap gap-1.5" role="group" aria-label="Filter by type">
        <button
          v-for="chip in (['ALL', ...typeChips] as const)"
          :key="chip"
          type="button"
          class="rounded-full border px-[13px] py-1.5 text-[11px]"
          :class="chipClass(typeFilter === chip)"
          :aria-pressed="typeFilter === chip"
          @click="typeFilter = chip"
        >
          {{ chip === "ALL" ? "All" : assetTypeLabel(chip) }}
        </button>
      </div>
      <div class="flex flex-wrap gap-1.5" role="group" aria-label="Filter by status">
        <button
          v-for="chip in (['ALL', 'DRAFT', 'ACTIVE', 'ARCHIVED'] as const)"
          :key="chip"
          type="button"
          class="rounded-full border px-[13px] py-1.5 text-[11px]"
          :class="chipClass(statusFilter === chip)"
          :aria-pressed="statusFilter === chip"
          @click="statusFilter = chip"
        >
          {{ chip === "ALL" ? "Any status" : chip }}
        </button>
      </div>
    </div>

    <div v-if="loadError" role="alert" class="max-w-[640px] rounded-lg border border-l-[3px] border-l-destructive bg-card px-[18px] py-4">
      <strong class="block text-[13px] font-bold text-destructive">
        {{ loadError.platformUnavailable ? "The UNICHE platform is not reachable" : "The media could not be loaded" }}
      </strong>
      <p class="mt-1 text-[13px] text-gray-700">{{ loadError.message }}</p>
      <Button variant="outline" size="sm" class="mt-3" @click="load">Try again</Button>
    </div>

    <div v-else-if="loading" class="grid animate-skeleton grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4" aria-busy="true" aria-label="Loading media">
      <div v-for="n in 8" :key="n" class="h-[200px] rounded-lg border bg-card"></div>
    </div>

    <template v-else-if="visible.length">
      <!-- Grid -->
      <ul v-if="view === 'grid'" class="grid grid-cols-[repeat(auto-fill,minmax(min(100%,200px),1fr))] gap-4">
        <li v-for="asset in pageItems" :key="asset.id">
          <RouterLink
            :to="{ name: 'asset-editor', params: { projectId, assetId: asset.id } }"
            class="block overflow-hidden rounded-lg border bg-card text-foreground no-underline shadow-[0_1px_3px_rgba(0,0,0,0.06)] hover:border-primary hover:text-foreground hover:no-underline"
          >
            <AssetThumb :asset="asset" height="120px" class="rounded-none border-0 border-b" />
            <span class="block px-3.5 py-3">
              <span class="block break-words text-[13px] font-bold">{{ asset.internalName }}</span>
              <span class="mt-0.5 block text-[11px] text-muted-foreground">{{ assetMeta(asset) }}</span>
              <span class="mt-2 flex flex-wrap gap-1.5">
                <span class="rounded-full px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-[0.07em]" :style="statusChipStyle(asset.status)">{{ asset.status }}</span>
                <span class="rounded-full border bg-muted px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-[0.07em] text-muted-foreground">
                  {{ asset.usageCount ? `used in ${asset.usageCount}` : "unused" }}
                </span>
                <span
                  v-if="missingAlternativeText(asset, defaultLanguage)"
                  class="rounded-full bg-[rgba(192,24,94,0.1)] px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-[0.07em] text-destructive"
                >
                  no alt text ({{ defaultLanguage }})
                </span>
              </span>
            </span>
          </RouterLink>
        </li>
      </ul>

      <!-- List -->
      <div v-else class="overflow-x-auto rounded-lg border bg-card shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
        <table class="w-full min-w-[720px] border-collapse">
          <thead>
            <tr>
              <th class="th w-[64px] px-[18px]"><span class="sr-only">Preview</span></th>
              <th class="th px-3">Name</th>
              <th class="th px-3">Type</th>
              <th class="th px-3">Details</th>
              <th class="th px-3">Status</th>
              <th class="th px-3">Used in</th>
              <th class="th px-[18px]">Uploaded</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="asset in pageItems" :key="asset.id" class="hover:bg-muted">
              <td class="td px-[18px]"><AssetThumb :asset="asset" height="36px" class="w-12" /></td>
              <td class="td px-3">
                <RouterLink :to="{ name: 'asset-editor', params: { projectId, assetId: asset.id } }" class="text-[13px] font-semibold text-foreground no-underline hover:underline">
                  {{ asset.internalName }}
                </RouterLink>
                <div class="truncate text-[11px] text-gray-400">{{ asset.originalFilename }}</div>
                <div v-if="missingAlternativeText(asset, defaultLanguage)" class="text-[11px] font-semibold text-destructive">⚠ No alt text ({{ defaultLanguage }})</div>
              </td>
              <td class="td px-3 text-xs">{{ assetTypeLabel(asset.type) }}</td>
              <td class="td px-3 text-xs text-muted-foreground">{{ assetMeta(asset) }}</td>
              <td class="td px-3">
                <span class="rounded-full px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-[0.07em]" :style="statusChipStyle(asset.status)">{{ asset.status }}</span>
              </td>
              <td class="td px-3 text-xs">{{ asset.usageCount || "—" }}</td>
              <td class="td px-[18px] text-xs text-muted-foreground">{{ formatDate(asset.createdAt) }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <nav class="mt-4 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground" aria-label="Pages">
        <span>{{ rangeText }}</span>
        <template v-if="pageCount > 1">
          <button type="button" class="font-bold text-primary disabled:text-gray-300" :disabled="page === 0" @click="page--">‹ Previous</button>
          <span>Page {{ page + 1 }} of {{ pageCount }}</span>
          <button type="button" class="font-bold text-primary disabled:text-gray-300" :disabled="page >= pageCount - 1" @click="page++">Next ›</button>
        </template>
      </nav>
    </template>

    <div v-else class="rounded-lg border bg-card px-6 py-12 text-center">
      <p class="mx-auto mb-[18px] max-w-[440px] text-[13px] text-muted-foreground">
        {{
          assets.length
            ? "No file matches the search or the filters."
            : "The media library holds the images, audio, video, documents and 3D models your content uses. Upload the first files, or drop them here."
        }}
      </p>
      <Button v-if="!assets.length" variant="brand" @click="openUpload()">Upload</Button>
    </div>

    <UploadDialog v-if="uploading" :project-id="projectId" :initial-files="droppedFiles" @close="uploading = false" @uploaded="onUploaded" />
  </main>
</template>

<style scoped src="@/styles/list-table.css"></style>
