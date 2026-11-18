<script setup lang="ts">
/**
 * The media library (`12` §3 Media; D-080, D-094). Sticky toolbar from the list scaffold (search, search language, status
 * segments, sort), the library's own filters (Type, "Needs attention": no alt text, unused, decorative), a grid or a
 * list (`view=list` in the URL) with one Tab stop per file, ONE count line, and "Show more" that moves focus to the first
 * new file and announces the range. Every row says what is missing in the language in force ("Italiano: alt text, title
 * missing"; the Needs translation language, else the search language, else the default). Thumbnails are never cropped;
 * non-images get a drawn icon and the type in words. The list view has five columns, Status holds the chips, so no cell
 * overprints another at 1024 px (C2-75). "Clear filters" is the toolbar's one button and clears the library's own
 * filters too; focus then goes to the search field.
 */
import { CircleAlert, EyeOff, LayoutGrid, List as ListIcon, Upload } from "lucide-vue-next";
import { computed, nextTick, onBeforeUnmount, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import AssetThumb from "@/components/media/AssetThumb.vue";
import UploadDialog from "@/components/media/UploadDialog.vue";
import FilterChip from "@/components/list/FilterChip.vue";
import ListEmpty from "@/components/list/ListEmpty.vue";
import { Select } from "@/components/ui/select";
import ListTable, { type ListColumn } from "@/components/list/ListTable.vue";
import ListToolbar from "@/components/list/ListToolbar.vue";
import { matchesStatus, statusCounts, useListQuery, useResultAnnouncer, useScrollRestore } from "@/components/list/useListQuery";
import PageFrame from "@/components/PageFrame.vue";
import PageHead from "@/components/PageHead.vue";
import StatusChip from "@/components/StatusChip.vue";
import { ProblemAlert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import Checkbox from "@/components/ui/checkbox/Checkbox.vue";
import { say } from "@/lib/announcer";
import { focusSuccessor, restoreFocus } from "@/lib/focus";
import { formatDateTime, formatNumber } from "@/lib/format";
import { ApiError, apiRequest } from "@/platform/api";
import {
  ASSET_TYPES,
  assetMatches,
  assetMeta,
  assetTypeLabel,
  listAssets,
  missingAlternativeText,
  missingTextIn,
  missingTextNames,
  type Asset,
  type AssetType,
} from "@/platform/assets";
import { useCurrentProject } from "@/workspace/currentProject";
import type { ActiveFilter } from "@/workspace/listFilters";
import { findSection } from "@/workspace/sections";
import { useProjectLanguages } from "@/workspace/useProjectLanguages";

const section = findSection("media")!;
const project = useCurrentProject();
const projectId = computed(() => project.value.id);
const { languages, defaultLanguage } = useProjectLanguages(projectId);
const route = useRoute();
const router = useRouter();

const assets = ref<Asset[]>([]);
const loading = ref(true);
const loadError = ref<ApiError | null>(null);
/** The first request is this many files; the rest arrives in the background (C3-80; server paging is G-041). */
const FIRST_REQUEST = 48;
/** How many files the platform holds, from the first answer; the rest is still on its way while this exceeds `assets`. */
const totalFiles = ref(0);
const loadingRest = ref(false);
const restError = ref<ApiError | null>(null);
let controller: AbortController | null = null;

interface AssetPage {
  content: Asset[];
  totalElements: number;
}

/** First paint: 48 files and the total. Then every file, merged in (a file uploaded meanwhile stays). */
async function load() {
  controller?.abort();
  const own = (controller = new AbortController());
  loading.value = true;
  loadingRest.value = false;
  loadError.value = null;
  restError.value = null;
  try {
    const first = await apiRequest<AssetPage>(`/projects/${encodeURIComponent(projectId.value)}/assets?size=${FIRST_REQUEST}&page=0`, { signal: own.signal });
    assets.value = first.content;
    totalFiles.value = first.totalElements;
    loading.value = false;
    if (first.content.length < first.totalElements) await loadRest(own);
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") return;
    if (!(e instanceof ApiError)) throw e;
    loadError.value = e;
  } finally {
    if (controller === own) loading.value = false;
  }
}

/** The files after the first 48, in the background; a failure keeps what is shown and says so with "Try again". */
async function loadRest(own: AbortController | null = controller) {
  if (!own) return;
  loadingRest.value = true;
  restError.value = null;
  try {
    const all = await listAssets(projectId.value, own.signal);
    const known = new Set(all.map((a) => a.id));
    assets.value = [...assets.value.filter((a) => !known.has(a.id)), ...all];
    totalFiles.value = Math.max(assets.value.length, totalFiles.value);
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") return;
    if (!(e instanceof ApiError)) throw e;
    restError.value = e;
  } finally {
    if (controller === own) loadingRest.value = false;
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

// Filters and sort ---------------------------------------------------------------------------------------

const SORTS = [
  { value: "updated", label: "Updated" },
  { value: "name", label: "Name" },
  { value: "type", label: "Type" },
  { value: "size", label: "Size" },
  { value: "used", label: "Used in" },
];
/** The direction that reads naturally for each sort: newest, biggest and most used first; names A to Z. */
const NATURAL_DIR: Record<string, "asc" | "desc"> = { updated: "desc", name: "asc", type: "asc", size: "desc", used: "desc" };

const query = useListQuery({ defaultSort: "updated" });
if (!route.query.sort && !route.query.dir) query.dir.value = "desc";
watch(query.sort, (value) => (query.dir.value = NATURAL_DIR[value] ?? "asc"));

/** One word for a file nothing uses, in the library, the editor and the picker. */
const NOT_USED = "Not used yet";
const typeFilter = ref<"ALL" | AssetType>(ASSET_TYPES.includes(route.query.type as AssetType) ? (route.query.type as AssetType) : "ALL");
const needsAlt = ref(route.query.alt === "1");
const unused = ref(route.query.unused === "1");
const decorative = ref(route.query.decorative === "1");
watch([typeFilter, needsAlt, unused, decorative], () => {
  const rest = { ...route.query };
  delete rest.type;
  delete rest.alt;
  delete rest.unused;
  delete rest.decorative;
  void router.replace({
    query: {
      ...rest,
      ...(typeFilter.value !== "ALL" ? { type: typeFilter.value } : {}),
      ...(needsAlt.value ? { alt: "1" } : {}),
      ...(unused.value ? { unused: "1" } : {}),
      ...(decorative.value ? { decorative: "1" } : {}),
    },
  });
});

const typeOptions = computed(() => [
  ...(["IMAGE", "AUDIO", "VIDEO", "DOCUMENT", "THREE_D_MODEL"] as AssetType[]),
  ...ASSET_TYPES.filter((t) => !["IMAGE", "AUDIO", "VIDEO", "DOCUMENT", "THREE_D_MODEL"].includes(t) && assets.value.some((a) => a.type === t)),
]);
const langName = (code: string) => languages.value.find((l) => l.languageCode === code)?.displayName ?? code;
/** The language every row, the alt filter and the label speak about: Needs translation, else Search in, else the default. */
const rowLang = computed(() => query.missing.value || query.lang.value || defaultLanguage.value || "");
const altLabel = computed(() => (rowLang.value ? `No alt text in ${langName(rowLang.value)}` : "No alt text"));
/** "Italiano: alt text, title missing", or null when the file is complete in that language. */
function missingLine(asset: Asset): string | null {
  if (!rowLang.value) return null;
  const names = missingTextNames(asset, rowLang.value);
  return names.length ? `${langName(rowLang.value)}: ${names.join(", ")} missing` : null;
}

const attentionActive = computed(() => needsAlt.value || unused.value || decorative.value);
const extraFilters = computed<ActiveFilter[]>(() => [
  ...(typeFilter.value !== "ALL" ? [{ key: "type", label: `Type: ${assetTypeLabel(typeFilter.value)}`, clear: () => (typeFilter.value = "ALL") }] : []),
  ...(needsAlt.value ? [{ key: "alt", label: altLabel.value, clear: () => (needsAlt.value = false) }] : []),
  ...(unused.value ? [{ key: "unused", label: NOT_USED, clear: () => (unused.value = false) }] : []),
  ...(decorative.value ? [{ key: "decorative", label: "Decorative", clear: () => (decorative.value = false) }] : []),
]);
const chips = computed(() => query.chips(extraFilters.value, languages.value));
const extrasActive = computed(() => typeFilter.value !== "ALL" || attentionActive.value);
const filtered = computed(() => query.isFiltered.value || extrasActive.value);
// The toolbar's "Clear filters" is the only one: it also resets the library's own filters (Type, Needs attention), shows
// while any of them is on, and hands focus to the search field because the button disappears when it is used.
const clearQuery = query.clear;
const queryFiltered = query.isFiltered;
query.isFiltered = computed(() => queryFiltered.value || extrasActive.value);
query.clear = () => {
  clearQuery();
  typeFilter.value = "ALL";
  needsAlt.value = unused.value = decorative.value = false;
  void nextTick(() => restoreFocus(document.querySelector<HTMLElement>("[role=search] input[type=search]"), "main h1"));
};

const collator = new Intl.Collator(undefined, { sensitivity: "base", numeric: true });
const sortValue = (a: Asset, key: string): number | string => {
  switch (key) {
    case "name":
      return a.internalName;
    case "type":
      return assetTypeLabel(a.type);
    case "size":
      return a.sizeBytes;
    case "used":
      return a.usageCount;
    default:
      return a.updatedAt;
  }
};
/** Every file that passes the filters except the status: what "(N archived)" counts, so it answers the same question as the rows. */
const matchingAnyStatus = computed(() => {
  const missing = query.missing.value;
  return assets.value.filter(
    (a) =>
      (typeFilter.value === "ALL" || a.type === typeFilter.value) &&
      assetMatches(a, query.q.value, query.lang.value) &&
      (!needsAlt.value || missingAlternativeText(a, rowLang.value)) &&
      (!unused.value || a.usageCount === 0) &&
      (!decorative.value || a.decorative) &&
      (!missing || missingTextIn(a, missing)),
  );
});
const rows = computed(() => {
  const list = matchingAnyStatus.value.filter((a) => matchesStatus(a, query.status.value));
  const sign = query.dir.value === "desc" ? -1 : 1;
  const key = query.sort.value;
  return [...list].sort((a, b) => {
    const x = sortValue(a, key);
    const y = sortValue(b, key);
    const c = typeof x === "number" && typeof y === "number" ? x - y : collator.compare(String(x), String(y));
    return (c || collator.compare(a.internalName, b.internalName)) * sign;
  });
});

// View ---------------------------------------------------------------------------------------------------

const VIEW_KEY = "iguide.media.view";
function storedView(): "grid" | "list" {
  try {
    return localStorage.getItem(VIEW_KEY) === "list" ? "list" : "grid";
  } catch {
    return "grid";
  }
}
const viewFrom = (value: unknown): "grid" | "list" | null => (value === "list" || value === "grid" ? value : null);
/** The address bar wins (`view=list`, so a link and Back keep the view), then the remembered choice. */
const view = ref<"grid" | "list">(viewFrom(route.query.view) ?? storedView());
watch(view, (value) => {
  try {
    localStorage.setItem(VIEW_KEY, value);
  } catch {
    // A blocked storage only loses the remembered view.
  }
  if (route.query.view !== value) void router.replace({ query: { ...route.query, view: value }, hash: route.hash });
});
watch(
  () => route.query.view,
  (value) => {
    const next = viewFrom(value);
    if (next && next !== view.value) view.value = next;
  },
);

const PAGE = 48;
const limit = ref(PAGE);
watch([() => query.q.value, query.status, query.missing, query.sort, query.dir, typeFilter, needsAlt, unused, decorative], () => (limit.value = PAGE));
const shown = computed(() => rows.value.slice(0, limit.value));
/** `ListTable` rows are `Orderable`; the library has no manual order, so every `sortOrder` is the same. */
type Row = Asset & { sortOrder: number };
const tableRows = computed<Row[]>(() => shown.value.map((a) => ({ ...a, sortOrder: 0 })));
const listRoot = ref<HTMLElement | null>(null);

async function showMore() {
  const from = limit.value;
  limit.value = Math.min(rows.value.length, from + PAGE);
  await nextTick();
  const first = listRoot.value?.querySelector<HTMLElement>(`[data-asset-index="${from}"]`);
  first?.focus();
  say(`Showing ${from + 1} to ${Math.min(rows.value.length, from + PAGE)} of ${rows.value.length} files`);
}

const ready = computed(() => !loading.value && !loadingRest.value && !loadError.value);
useScrollRestore(ready);
useResultAnnouncer(computed(() => rows.value.length), computed(() => assets.value.length), ready, "files shown");

const editorRoute = (a: Asset) => ({ name: "asset-editor", params: { projectId: projectId.value, assetId: a.id } });
// Name takes what the fixed columns leave (never under 14 rem: at 1024 px the fixed ones add up to 36 rem). Status holds the
// "Needs attention" chips, "Used in" wraps (C2-75).
const COLUMNS: ListColumn[] = [
  { key: "name", label: "Name", sortKey: "name", tree: true },
  { key: "details", label: "Type and size", sortKey: "type", class: "w-48" },
  { key: "status", label: "Status", class: "w-36" },
  { key: "used", label: "Used in", sortKey: "used", class: "w-28" },
  { key: "updated", label: "Updated", sortKey: "updated", class: "w-32" },
];
const usedText = (a: Asset) => (a.usageCount ? `Used in ${a.usageCount}` : NOT_USED);
/** Audio, video and the like have no picture to describe: "No alt text" can never match them (C3-82). */
const noAltReason = computed(() => {
  const type = typeFilter.value;
  return needsAlt.value && type !== "ALL" && type !== "IMAGE" && type !== "FLOOR_PLAN" ? `${assetTypeLabel(type)} files have no alternative text.` : null;
});
const counts = computed(() => statusCounts(assets.value));
const plural = (n: number) => `${formatNumber(n)} ${n === 1 ? "file" : "files"}`;
/**
 * The one count line: "Showing 48 of 85 files (1 archived)". The archived figure counts the files that pass every
 * other filter, so it answers the same question as the rows; it shows only while the status hides them. While the rest
 * of the library is still arriving the line says how many are in.
 */
const countText = computed(() => {
  if (loadingRest.value) return `${formatNumber(assets.value.length)} of ${plural(totalFiles.value)} loaded`;
  const archived = query.status.value === "NOT_ARCHIVED" ? matchingAnyStatus.value.filter((a) => a.status === "ARCHIVED").length : 0;
  const base = shown.value.length < rows.value.length ? `Showing ${formatNumber(shown.value.length)} of ${plural(rows.value.length)}` : plural(rows.value.length);
  return archived ? `${base} (${formatNumber(archived)} archived)` : base;
});

/** A chip in "Active filters" was removed: focus moves to the next chip, else the search field (the chip row may vanish). */
function removeFilter(filter: ActiveFilter) {
  const item = document.activeElement?.closest<HTMLElement>("li");
  focusSuccessor(item, ["[role=search] input[type=search]"]);
  filter.clear();
  // The chip row can move (the empty state gives way to the files and the footer): if the chip that took focus is gone, the search field has it.
  void nextTick(() => {
    const active = document.activeElement;
    if (!active || active === document.body || !active.isConnected) restoreFocus(document.querySelector<HTMLElement>("[role=search] input[type=search]"), "main h1");
  });
}
</script>

<template>
  <PageFrame @dragover.prevent="dragging = !uploading" @dragleave.self="dragging = false" @drop.prevent="onDrop">
    <PageHead :title="section.title" subtitle="Images, audio, video, documents and 3D models used by your content">
      <template #actions>
        <Button variant="primary" @click="openUpload()"><Upload aria-hidden="true" />Upload files</Button>
      </template>
    </PageHead>

    <div
      v-if="dragging"
      class="pointer-events-none fixed inset-4 z-sticky flex items-center justify-center rounded-lg border-2 border-dashed border-primary bg-accent/80 text-base font-bold text-primary"
    >
      Drop to upload
    </div>

    <ProblemAlert v-if="loadError" :error="loadError" action="load the media" @retry="load" />

    <div v-else class="rounded-lg border border-border bg-card shadow-1">
      <ListToolbar v-if="loading || assets.length" :query="query" :counts="counts" :languages="languages" search-placeholder="Name, file name or title" :sort-options="SORTS" :show-pending="false" :extra-active="extraFilters.length">
        <template #filters>
          <div class="flex flex-wrap items-center gap-x-3">
            <label for="media-type" class="text-sm font-medium text-ink-2">Type</label>
            <span class="inline-block min-w-36">
            <Select id="media-type" v-model="typeFilter" size="sm">
              <option value="ALL">All types</option>
              <option v-for="t in typeOptions" :key="t" :value="t">{{ assetTypeLabel(t) }}</option>
            </Select>
            </span>
          </div>
          <fieldset class="m-0 flex min-w-0 flex-wrap items-center gap-x-3 border-0 p-0">
            <legend class="float-left mr-3 p-0 text-sm font-medium text-ink-2">Needs attention</legend>
            <Checkbox v-model="needsAlt">{{ altLabel }}</Checkbox>
            <Checkbox v-model="unused">{{ NOT_USED }}</Checkbox>
            <Checkbox v-model="decorative">Decorative</Checkbox>
          </fieldset>
          <div class="ml-auto flex items-center gap-1" role="group" aria-label="View">
            <Button
              v-for="v in (['grid', 'list'] as const)"
              :key="v"
              :variant="view === v ? 'primary' : 'secondary'"
              size="sm"
              :aria-pressed="view === v"
              @click="view = v"
            >
              <LayoutGrid v-if="v === 'grid'" aria-hidden="true" /><ListIcon v-else aria-hidden="true" />{{ v === "grid" ? "Grid" : "List" }}
            </Button>
          </div>
        </template>
      </ListToolbar>

      <!-- The count line is there while loading too (an empty bar of the same height), so the grid does not move when it fills. -->
      <p v-if="!loading && assets.length" class="tabular border-b border-border px-4 py-2 text-compact text-muted-foreground" data-media-count>{{ countText }}</p>
      <p v-else-if="loading" class="border-b border-border px-4 py-2 text-compact" aria-hidden="true"><span class="inline-block h-4 w-40 animate-skeleton rounded-sm bg-muted align-middle"></span></p>
      <ProblemAlert v-if="restError" :error="restError" action="load every file" class="m-4 mb-0" @retry="loadRest()" />

      <div v-if="loading && view === 'grid'" class="grid animate-skeleton grid-cols-[repeat(auto-fill,minmax(min(100%,13rem),1fr))] gap-4 p-4" role="status" aria-busy="true" aria-label="Loading media">
        <div v-for="n in 8" :key="n" class="h-56 rounded-lg border border-border bg-muted"></div>
      </div>
      <!-- The list's skeleton keeps the column heads, so the page does not jump when the rows arrive. -->
      <div v-else-if="loading" role="status" aria-busy="true" aria-label="Loading media">
        <table class="w-full table-fixed border-separate border-spacing-0 text-sm" aria-hidden="true">
          <thead>
            <tr><th v-for="c in COLUMNS" :key="c.key" scope="col" class="list-th" :class="c.class">{{ c.label }}</th></tr>
          </thead>
          <tbody class="animate-skeleton">
            <tr v-for="n in 6" :key="n" class="h-[3.25rem]">
              <td v-for="c in COLUMNS" :key="c.key" class="border-b border-border px-4"><div class="h-4 rounded-sm bg-muted" :class="c.key === 'name' ? 'w-2/3' : 'w-3/4'"></div></td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-else ref="listRoot">
        <ul v-if="view === 'grid' && rows.length" class="m-0 grid list-none grid-cols-[repeat(auto-fill,minmax(min(100%,13rem),1fr))] gap-4 p-4" aria-label="Media files">
          <li v-for="(asset, i) in shown" :key="asset.id" class="min-w-0">
            <RouterLink
              :to="editorRoute(asset)"
              :data-asset-index="i"
              class="flex h-full flex-col overflow-hidden rounded-lg border border-border bg-card text-foreground no-underline shadow-1 hover:border-primary hover:bg-surface-hover hover:no-underline"
            >
              <AssetThumb :asset="asset" ratio="4 / 3" class="rounded-none border-0 border-b border-border" />
              <span class="flex flex-1 flex-col gap-1.5 p-3">
                <span class="line-clamp-2 min-h-10 break-words text-sm font-semibold">{{ asset.internalName }}</span>
                <span class="tabular text-xs text-muted-foreground">{{ assetTypeLabel(asset.type) }} · {{ assetMeta(asset) }}</span>
                <span v-if="missingLine(asset)" class="flex items-start gap-1 text-xs font-medium text-warning" data-missing><CircleAlert class="mt-px size-4 flex-none" aria-hidden="true" />{{ missingLine(asset) }}</span>
                <!-- Chips are the last block of every card, so their bottom edges line up across a row whatever the title or the warning needs. -->
                <span class="mt-auto flex flex-wrap gap-1.5 pt-1" data-card-chips>
                  <StatusChip :status="asset.status" />
                  <Chip tone="outline">{{ usedText(asset) }}</Chip>
                  <Chip v-if="asset.decorative" tone="neutral" :icon="EyeOff">Decorative</Chip>
                </span>
              </span>
            </RouterLink>
          </li>
        </ul>

        <ListTable
          v-else-if="view === 'list' && rows.length"
          :columns="COLUMNS"
          :rows="tableRows"
          :query="query"
          label="Media files"
          :row-label="(a: Row) => a.internalName"
          openable
          @open="(a: Row) => router.push(editorRoute(a))"
        >
          <template #cell-name="{ row, index }">
            <div class="flex min-w-0 items-center gap-3">
              <AssetThumb :asset="row" height="40px" class="w-14 flex-none" />
              <div class="min-w-0">
                <RouterLink :to="editorRoute(row)" :data-asset-index="index" class="line-clamp-2 break-words font-semibold">{{ row.internalName }}</RouterLink>
                <p class="truncate text-xs text-muted-foreground">{{ row.originalFilename }}</p>
                <p v-if="missingLine(row)" class="flex items-start gap-1 text-xs font-medium text-warning" data-missing><CircleAlert class="mt-px size-4 flex-none" aria-hidden="true" />{{ missingLine(row) }}</p>
              </div>
            </div>
          </template>
          <template #cell-details="{ row }">
            <span class="block font-medium">{{ assetTypeLabel(row.type) }}</span>
            <span class="tabular block text-compact text-muted-foreground">{{ assetMeta(row) }}</span>
          </template>
          <template #cell-status="{ row }">
            <span class="flex flex-wrap items-start gap-1.5">
              <StatusChip :status="row.status" />
              <Chip v-if="row.decorative" tone="neutral" :icon="EyeOff">Decorative</Chip>
            </span>
          </template>
          <template #cell-used="{ row }"><span class="tabular">{{ row.usageCount ? row.usageCount : NOT_USED }}</span></template>
          <template #cell-updated="{ row }"><time :datetime="row.updatedAt" class="tabular text-compact text-muted-foreground">{{ formatDateTime(row.updatedAt) }}</time></template>
        </ListTable>

        <!-- Filters hide everything: the toolbar's "Clear filters" is the one button, so only the chips are offered here. -->
        <div v-if="!loading && !rows.length && assets.length" class="flex flex-col items-center gap-3 px-6 py-10 text-center">
          <h2 class="text-base font-bold">No files match</h2>
          <p v-if="noAltReason" class="text-compact text-ink-2">{{ noAltReason }}</p>
          <ul class="flex flex-wrap justify-center gap-1.5" aria-label="Active filters">
            <li v-for="f in chips" :key="f.key"><FilterChip :label="f.label" @remove="removeFilter(f)" /></li>
          </ul>
          <p class="text-compact text-muted-foreground">Use “Clear filters” in the toolbar to see every file again.</p>
        </div>
        <ListEmpty v-else-if="!loading && !rows.length" noun="files" empty-title="No files yet">
          The media library holds the images, audio, video, documents and 3D models your content uses. Upload the first files, or drop them here.
          <template #actions><Button variant="primary" @click="openUpload()"><Upload aria-hidden="true" />Upload files</Button></template>
        </ListEmpty>

        <div v-if="shown.length < rows.length" class="flex flex-wrap items-center justify-center gap-3 px-4 pb-4 pt-2">
          <Button variant="secondary" @click="showMore">Show {{ Math.min(PAGE, rows.length - shown.length) }} more</Button>
        </div>
      </div>

      <footer v-if="filtered && !loading && rows.length" class="flex flex-wrap items-center gap-3 border-t border-border px-4 py-3 text-compact text-muted-foreground">
        <ul v-if="chips.length" class="flex flex-wrap gap-1.5" aria-label="Active filters">
          <li v-for="f in chips" :key="f.key"><FilterChip :label="f.label" @remove="removeFilter(f)" /></li>
        </ul>
      </footer>
    </div>

    <UploadDialog v-if="uploading" :project-id="projectId" :initial-files="droppedFiles" :existing="assets" @close="uploading = false" @uploaded="onUploaded" />
  </PageFrame>
</template>
