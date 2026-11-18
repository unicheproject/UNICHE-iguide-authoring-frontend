<script setup lang="ts">
/**
 * Chooses an Asset for a field (mockup C-04, D-032, D-080): only the accepted types and never archived ones. Focus starts
 * in Search; the default status is Active (Draft and Any are one choice away, and the count of hidden drafts is
 * said); tiles or a list (with Play for audio and the languages a recording has text in), two-line names, a "No alt
 * text" cue on the tile before it is chosen, a polite status line for the selection, and "Upload new" with the upload
 * dialog's rows, limits and log. A single uploaded file is selected at once. Tiles and list rows are toggle buttons in
 * one roving Tab stop (arrows, Home, End move; Space selects; Enter on a selected one attaches it); double-click or
 * "Use this image" attaches it and says so. On a small or short screen (narrower than 768 px or lower than 600 px) the
 * filters, which hold the view switch, fold into a disclosure and the list view is the default, so rows come first.
 * Where focus goes after attaching is the caller's: the control that replaces "Add" carries `data-focus-fallback`.
 */
import { CircleAlert, Check, LayoutGrid, List as ListIcon, Pause, Play, Search, Upload } from "lucide-vue-next";
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import AppDialog from "@/components/AppDialog.vue";
import StatusChip from "@/components/StatusChip.vue";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import Checkbox from "@/components/ui/checkbox/Checkbox.vue";
import { say } from "@/lib/announcer";
import { formatBytes } from "@/lib/format";
import { acceptAttributeFor, assetMatches, assetTypeLabel, formatDuration, missingAlternativeText, type Asset, type AssetType } from "@/platform/assets";
import { useAssetUpload } from "@/workspace/useAssetUpload";
import AssetThumb from "./AssetThumb.vue";
import UploadEntryRow from "./UploadEntryRow.vue";
import UploadLimits from "./UploadLimits.vue";

const props = defineProps<{
  projectId: string;
  title: string;
  assets: Asset[];
  accept: AssetType[];
  /** Assets already in this slot, not offered again. */
  excludeIds?: string[];
  /** Assets the Resource already uses elsewhere, for the "Used in this resource" filter. */
  usedIds?: string[];
  /** Language whose alternative text the tiles and the status line check. */
  defaultLanguage?: string | null;
  /** The Type filter the dialog opens on; ignored unless it is one of `accept`. All types when absent. */
  defaultType?: AssetType;
}>();
const emit = defineEmits<{ close: []; pick: [asset: Asset]; uploaded: [asset: Asset] }>();

const query = ref("");
const typeFilter = ref<"ALL" | AssetType>(props.defaultType && props.accept.includes(props.defaultType) ? props.defaultType : "ALL");
const statusFilter = ref<"ALL" | "DRAFT" | "ACTIVE">("ACTIVE");
const onlyUsed = ref(false);
const selectedId = ref<string | null>(null);
const fileInput = ref<HTMLInputElement | null>(null);
const shortQuery = typeof window !== "undefined" ? window.matchMedia("(max-height: 599px)") : null;
/** A short viewport (200 % zoom on a laptop): the Cancel / Use row scrolls with the files instead of taking a fixed band. */
const short = ref(shortQuery?.matches ?? false);
const onShort = (e: MediaQueryListEvent) => (short.value = e.matches);
onMounted(() => shortQuery?.addEventListener("change", onShort));
onBeforeUnmount(() => shortQuery?.removeEventListener("change", onShort));
const roomy = !short.value && (typeof window === "undefined" || window.innerWidth >= 768);
const view = ref<"grid" | "list">(roomy ? "grid" : "list");
const filtersOpen = ref(false);
const results = ref<HTMLElement | null>(null);
/** The one tile or row that is a Tab stop; arrows move it (roving tabindex). */
const activeId = ref<string | null>(null);
const tabStopId = computed(() => {
  const ids = choices.value.map((a) => a.id);
  if (activeId.value && ids.includes(activeId.value)) return activeId.value;
  if (selectedId.value && ids.includes(selectedId.value)) return selectedId.value;
  return ids[0] ?? null;
});
/** A small image keeps its own size inside the thumbnail box (never stretched), at least 2 rem so a 1 px file is still seen. */
const THUMB_NATURAL = "[&_img]:size-auto [&_img]:min-h-8 [&_img]:min-w-8 [&_img]:max-h-full [&_img]:max-w-full";
const filterSummaryView = computed(() => (view.value === "grid" ? "tiles" : "list"));

function items(): HTMLButtonElement[] {
  return results.value ? [...results.value.querySelectorAll<HTMLButtonElement>("button[data-asset-id]")] : [];
}
/** The tile above or below `from` in the grid: the nearest in the adjacent row by horizontal centre. */
function neighbourRow(list: HTMLButtonElement[], from: HTMLButtonElement, dir: 1 | -1): HTMLButtonElement | null {
  const box = from.getBoundingClientRect();
  const cx = box.left + box.width / 2;
  const others = list.filter((b) => (dir === 1 ? b.getBoundingClientRect().top >= box.bottom - 2 : b.getBoundingClientRect().bottom <= box.top + 2));
  if (!others.length) return null;
  const rowTop = dir === 1 ? Math.min(...others.map((b) => b.getBoundingClientRect().top)) : Math.max(...others.map((b) => b.getBoundingClientRect().top));
  const row = others.filter((b) => Math.abs(b.getBoundingClientRect().top - rowTop) < 4);
  return row.reduce((best, b) => {
    const r = b.getBoundingClientRect();
    return Math.abs(r.left + r.width / 2 - cx) < Math.abs(best.getBoundingClientRect().left + best.getBoundingClientRect().width / 2 - cx) ? b : best;
  }, row[0]);
}
/** Arrow keys, Home and End move between tiles or rows; Enter on the selected one attaches it. */
function onNavigate(event: KeyboardEvent) {
  const list = items();
  const here = (event.target as HTMLElement).closest<HTMLButtonElement>("button[data-asset-id]");
  if (!here || !list.length) return;
  const at = list.indexOf(here);
  let next: HTMLButtonElement | null | undefined;
  const grid = view.value === "grid";
  if (event.key === "Home") next = list[0];
  else if (event.key === "End") next = list[list.length - 1];
  else if (event.key === "ArrowRight" && grid) next = list[Math.min(at + 1, list.length - 1)];
  else if (event.key === "ArrowLeft" && grid) next = list[Math.max(at - 1, 0)];
  else if (event.key === "ArrowDown") next = grid ? (neighbourRow(list, here, 1) ?? here) : list[Math.min(at + 1, list.length - 1)];
  else if (event.key === "ArrowUp") next = grid ? (neighbourRow(list, here, -1) ?? here) : list[Math.max(at - 1, 0)];
  else if (event.key === "Enter" && here.getAttribute("aria-pressed") === "true") {
    event.preventDefault();
    confirm();
    return;
  } else return;
  event.preventDefault();
  if (next) {
    activeId.value = next.dataset.assetId ?? null;
    next.focus();
    next.scrollIntoView({ block: "nearest" });
  }
}

const { entries, upload, retry, cancel, confirmHeld, skipHeld, ensureLimits, limits, limitsFailed, log } = useAssetUpload(
  computed(() => props.projectId),
  (asset) => emit("uploaded", asset),
  { existing: () => props.assets },
);
void ensureLimits();
const dragging = ref(false);
// A floor-plan field uploads its images as floor plans, so they get the floor-plan type and limit.
const asFloorPlan = computed(() => props.accept.includes("FLOOR_PLAN"));

const eligible = computed(() => {
  const excluded = new Set(props.excludeIds ?? []);
  return props.assets.filter((a) => props.accept.includes(a.type) && a.status !== "ARCHIVED" && !excluded.has(a.id));
});
const choices = computed(() => {
  const used = new Set(props.usedIds ?? []);
  return eligible.value.filter(
    (a) =>
      // The selected Asset, such as a file just uploaded, stays in view whatever the filters say.
      a.id === selectedId.value ||
      ((typeFilter.value === "ALL" || a.type === typeFilter.value) &&
        (statusFilter.value === "ALL" || a.status === statusFilter.value) &&
        (!onlyUsed.value || used.has(a.id)) &&
        assetMatches(a, query.value)),
  );
});
const hiddenDrafts = computed(() => (statusFilter.value === "ACTIVE" ? eligible.value.filter((a) => a.status === "DRAFT" && !choices.value.includes(a)).length : 0));

const selected = computed(() => props.assets.find((a) => a.id === selectedId.value) ?? null);
const typeNames = computed(() => props.accept.map((t) => assetTypeLabel(t).toLowerCase()).join(" or "));
const onlyImages = computed(() => props.accept.length === 1 && props.accept[0] === "IMAGE");
const confirmLabel = computed(() => (onlyImages.value ? "Use this image" : "Use this file"));
const altMissing = (a: Asset) => missingAlternativeText(a, props.defaultLanguage ?? null);
const isImageAsset = (a: Asset) => a.type === "IMAGE" || a.type === "FLOOR_PLAN";
const acceptAttribute = computed(() => acceptAttributeFor(props.accept));
const filterSummary = computed(() => `${statusFilter.value === "ALL" ? "Any status" : statusFilter.value === "ACTIVE" ? "Active" : "Draft"}${typeFilter.value === "ALL" ? "" : `, ${assetTypeLabel(typeFilter.value)}`}${onlyUsed.value ? ", used here" : ""}${hiddenDrafts.value ? `, ${hiddenDrafts.value} draft hidden` : ""}`);

/** Uploads every file; one fitting result is selected once it is in. */
async function uploadFiles(files: File[]) {
  if (!files.length) return;
  const done = await upload(files, { floorPlan: asFloorPlan.value });
  const fitting = done.map((e) => e.asset).filter((a): a is Asset => !!a && props.accept.includes(a.type));
  if (fitting.length === 1) {
    selectedId.value = fitting[0].id;
    say(`${fitting[0].internalName} uploaded and selected.`);
  }
}

function onFiles(event: Event) {
  const input = event.target as HTMLInputElement;
  const files = Array.from(input.files ?? []);
  input.value = "";
  void uploadFiles(files);
}

function onDrop(event: DragEvent) {
  dragging.value = false;
  void uploadFiles(Array.from(event.dataTransfer?.files ?? []));
}

const uploadingEntries = computed(() => entries.value.filter((e) => e.state !== "done"));
/** "1600 × 1067 · 420 KB", "03:12 · 4.1 MB" or "audio/mpeg · 3.1 MB"; the size keeps its no-break space (D-106). */
function metaOf(asset: Asset): string {
  const size = formatBytes(asset.sizeBytes);
  if (asset.width && asset.height) return `${asset.width} × ${asset.height} · ${size}`;
  if (asset.durationSeconds) return `${formatDuration(asset.durationSeconds)} · ${size}`;
  return `${asset.mimeType} · ${size}`;
}
const usedText = (asset: Asset) => (asset.usageCount ? `Used in ${asset.usageCount}` : "Not used yet");
const textLanguages = (asset: Asset) =>
  Object.entries(asset.translations)
    .filter(([, t]) => Object.values(t).some((v) => typeof v === "string" && v.trim()))
    .map(([code]) => code.toUpperCase())
    .join(", ");

function choose(asset: Asset) {
  selectedId.value = asset.id;
}
function attach(asset: Asset) {
  emit("pick", asset);
  say(`${asset.internalName} attached.`);
}
function confirm() {
  if (selected.value) attach(selected.value);
}

// One recording plays at a time.
const playingId = ref<string | null>(null);
let player: HTMLAudioElement | null = null;
function togglePlay(asset: Asset) {
  player?.pause();
  if (playingId.value === asset.id) {
    playingId.value = null;
    return;
  }
  player = new Audio(asset.url);
  player.addEventListener("ended", () => (playingId.value = null));
  void player.play().catch(() => (playingId.value = null));
  playingId.value = asset.id;
}
onBeforeUnmount(() => player?.pause());

const statusClass = computed(() => (selected.value && isImageAsset(selected.value) && altMissing(selected.value) ? "font-semibold text-destructive" : "text-ink-2"));
const status = computed(() => {
  const a = selected.value;
  if (!a) return "Nothing selected";
  const alt = isImageAsset(a) && props.defaultLanguage ? (a.decorative ? ". Decorative" : altMissing(a) ? `. No alt text (${props.defaultLanguage})` : `. Alt text (${props.defaultLanguage}) present`) : "";
  return `Selected: ${a.internalName}${alt}`;
});
</script>

<template>
  <AppDialog :title="title" size="xl" @close="emit('close')">
    <div
      class="flex flex-col gap-3 rounded-lg [@media(min-height:600px)]:min-h-[min(26rem,70dvh)]"
      :class="{ 'outline-dashed outline-2 outline-offset-4 outline-primary': dragging }"
      @dragover.prevent="dragging = true"
      @dragleave.self="dragging = false"
      @drop.prevent="onDrop"
    >
      <div class="flex flex-wrap items-end gap-3">
        <div class="flex min-w-[min(100%,16rem)] flex-1 flex-col gap-1">
          <label for="picker-search" class="text-xs font-semibold text-ink-2" :class="short && 'sr-only'">Search</label>
          <div class="relative">
            <Search class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <input id="picker-search" v-model="query" type="search" autocomplete="off" placeholder="Name, file name or title" class="ui-field w-full pl-9" />
          </div>
        </div>
        <!-- On a short screen the Upload new row is folded into this line, so the files get the room (C3-79). -->
        <Button v-if="short" variant="secondary" @click="fileInput?.click()"><Upload aria-hidden="true" />Upload new</Button>
      </div>

      <details :open="filtersOpen" class="rounded-md border border-border px-3" :class="short ? 'py-0' : 'py-2'" @toggle="filtersOpen = ($event.target as HTMLDetailsElement).open">
        <summary class="min-h-control cursor-pointer text-sm font-semibold leading-[2.5rem] text-ink-2">Filters and view <span class="font-normal text-muted-foreground">({{ filterSummary }}, {{ filterSummaryView }})</span></summary>
        <div class="mt-2 flex flex-wrap items-start gap-x-6 gap-y-2">
          <fieldset class="m-0 flex flex-wrap items-center gap-1.5 border-0 p-0">
            <legend class="float-left mr-2 p-0 text-xs font-semibold text-ink-2">View</legend>
            <Button v-for="v in (['grid', 'list'] as const)" :key="v" :variant="view === v ? 'primary' : 'secondary'" size="sm" :aria-pressed="view === v" @click="view = v">
              <LayoutGrid v-if="v === 'grid'" aria-hidden="true" /><ListIcon v-else aria-hidden="true" />{{ v === "grid" ? "Tiles" : "List" }}
            </Button>
          </fieldset>
          <fieldset v-if="accept.length > 1" class="m-0 flex flex-wrap items-center gap-1.5 border-0 p-0">
            <legend class="float-left mr-2 p-0 text-xs font-semibold text-ink-2">Type</legend>
            <Button v-for="t in (['ALL', ...accept] as const)" :key="t" size="sm" :variant="typeFilter === t ? 'primary' : 'secondary'" :aria-pressed="typeFilter === t" @click="typeFilter = t">
              {{ t === "ALL" ? "All" : assetTypeLabel(t) }}
            </Button>
          </fieldset>
          <p v-else class="text-xs text-ink-2"><span class="font-semibold">Type</span> {{ assetTypeLabel(accept[0]) }} only</p>
          <fieldset class="m-0 flex flex-wrap items-center gap-1.5 border-0 p-0">
            <legend class="float-left mr-2 p-0 text-xs font-semibold text-ink-2">Status</legend>
            <Button v-for="s in (['ACTIVE', 'DRAFT', 'ALL'] as const)" :key="s" size="sm" :variant="statusFilter === s ? 'primary' : 'secondary'" :aria-pressed="statusFilter === s" @click="statusFilter = s">
              {{ s === "ALL" ? "Any status" : s === "ACTIVE" ? "Active" : "Draft" }}
            </Button>
          </fieldset>
          <Checkbox v-if="usedIds" v-model="onlyUsed">Used in this resource</Checkbox>
        </div>
        <p class="mt-1 text-xs text-muted-foreground">Alternative text and captions belong to the asset, so they are the same everywhere it is used.</p>
      </details>

      <UploadLimits v-if="uploadingEntries.length || limitsFailed" :limits="limits" :failed="limitsFailed" :types="accept" @reload="ensureLimits" />
      <ul v-if="uploadingEntries.length" class="max-h-40 overflow-y-auto rounded-lg border border-border" aria-label="Uploads">
        <UploadEntryRow
          v-for="entry in uploadingEntries"
          :key="entry.key"
          :entry="entry"
          :project-id="projectId"
          @retry="retry(entry)"
          @cancel="cancel(entry)"
          @confirm="confirmHeld(entry)"
          @skip="skipHeld(entry)"
        />
      </ul>
      <div role="log" aria-label="Upload activity" aria-live="polite" class="sr-only"><p v-for="item in log" :key="item.id">{{ item.text }}</p></div>

      <!-- Tiles: toggle buttons, one Tab stop each; double-click attaches (D-042). -->
      <ul v-if="view === 'grid'" ref="results" class="m-0 grid list-none grid-cols-[repeat(auto-fill,minmax(min(100%,11rem),1fr))] gap-3 p-0.5" :aria-label="`${title}: arrow keys move between files`" @keydown="onNavigate">
        <li v-if="!short">
          <button
            type="button"
            class="flex h-full min-h-32 w-full flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-input p-2 text-sm font-semibold text-primary hover:border-primary hover:bg-surface-hover"
            @click="fileInput?.click()"
          >
            <Upload class="size-5" aria-hidden="true" />
            Upload new
            <span class="text-xs font-normal text-muted-foreground">or drop files here</span>
          </button>
        </li>
        <li v-for="asset in choices" :key="asset.id" class="relative">
          <button
            type="button"
            :data-asset-id="asset.id"
            :tabindex="tabStopId === asset.id ? 0 : -1"
            :aria-pressed="selectedId === asset.id"
            class="flex h-full w-full flex-col gap-1.5 rounded-lg border-2 bg-card p-2 text-left hover:bg-surface-hover"
            :class="selectedId === asset.id ? 'border-primary bg-accent' : 'border-border'"
            @click="choose(asset)"
            @focus="activeId = asset.id"
            @dblclick="attach(asset)"
          >
            <AssetThumb :asset="asset" ratio="4 / 3" :class="THUMB_NATURAL" />
            <span class="line-clamp-2 min-h-10 break-words text-sm font-semibold">{{ asset.internalName }}</span>
            <span class="tabular text-xs text-muted-foreground">{{ assetTypeLabel(asset.type) }} · {{ metaOf(asset) }}</span>
            <!-- The chip rows share one bottom edge across a row of tiles (C3-79). -->
            <span class="mt-auto flex flex-col gap-1.5">
              <span class="flex flex-wrap items-center gap-1">
                <StatusChip :status="asset.status" />
                <Chip v-if="isImageAsset(asset) && altMissing(asset)" tone="danger" :icon="CircleAlert">No alt text</Chip>
                <Chip v-if="selectedId === asset.id" tone="brand" :icon="Check">Selected</Chip>
              </span>
              <span class="text-xs text-muted-foreground">{{ usedText(asset) }}</span>
            </span>
          </button>
          <Button
            v-if="asset.type === 'AUDIO'"
            variant="secondary"
            size="icon"
            class="absolute right-3 top-3"
            :label="`${playingId === asset.id ? 'Pause' : 'Play'} ${asset.internalName}`"
            :tabindex="tabStopId === asset.id ? 0 : -1"
            @click="togglePlay(asset)"
          >
            <Pause v-if="playingId === asset.id" aria-hidden="true" /><Play v-else aria-hidden="true" />
          </Button>
        </li>
      </ul>

      <!-- List: one row per file, with Play and the languages of a recording. -->
      <ul v-else ref="results" class="m-0 list-none rounded-lg border border-border p-0" :aria-label="`${title}: arrow keys move between files`" @keydown="onNavigate">
        <li v-if="!short" class="border-b border-border">
          <button type="button" class="flex min-h-control w-full items-center gap-2 px-3 py-2 text-left text-sm font-semibold text-primary hover:bg-surface-hover" @click="fileInput?.click()">
            <Upload class="size-4" aria-hidden="true" />Upload new<span class="font-normal text-muted-foreground">or drop files here</span>
          </button>
        </li>
        <li v-for="asset in choices" :key="asset.id" class="flex items-center gap-2 border-b border-border last:border-b-0" :class="selectedId === asset.id ? 'bg-accent' : ''">
          <button
            type="button"
            :data-asset-id="asset.id"
            :tabindex="tabStopId === asset.id ? 0 : -1"
            :aria-pressed="selectedId === asset.id"
            class="flex min-w-0 flex-1 items-center gap-3 px-3 py-2 text-left hover:bg-surface-hover"
            @click="choose(asset)"
            @focus="activeId = asset.id"
            @dblclick="attach(asset)"
          >
            <AssetThumb :asset="asset" height="44px" class="w-16 flex-none" :class="THUMB_NATURAL" />
            <span class="min-w-0 flex-1">
              <span class="line-clamp-2 break-words text-sm font-semibold">{{ asset.internalName }}</span>
              <span class="tabular block text-xs text-muted-foreground">
                {{ assetTypeLabel(asset.type) }} · {{ metaOf(asset) }} · {{ usedText(asset) }}<template v-if="asset.type === 'AUDIO'"> · {{ textLanguages(asset) ? `Text in ${textLanguages(asset)}` : "No transcript" }}</template>
              </span>
            </span>
            <span class="flex flex-wrap justify-end gap-1">
              <StatusChip :status="asset.status" />
              <Chip v-if="isImageAsset(asset) && altMissing(asset)" tone="danger" :icon="CircleAlert">No alt text</Chip>
              <Chip v-if="selectedId === asset.id" tone="brand" :icon="Check">Selected</Chip>
            </span>
          </button>
          <Button
            v-if="asset.type === 'AUDIO'"
            variant="secondary"
            size="icon"
            class="mr-2"
            :label="`${playingId === asset.id ? 'Pause' : 'Play'} ${asset.internalName}`"
            :tabindex="tabStopId === asset.id ? 0 : -1"
            @click="togglePlay(asset)"
          >
            <Pause v-if="playingId === asset.id" aria-hidden="true" /><Play v-else aria-hidden="true" />
          </Button>
        </li>
      </ul>
      <input ref="fileInput" type="file" multiple class="hidden" aria-hidden="true" tabindex="-1" :accept="acceptAttribute || undefined" @change="onFiles" />

      <p v-if="hiddenDrafts" class="text-xs text-muted-foreground">
        {{ hiddenDrafts }} draft {{ hiddenDrafts === 1 ? "file is" : "files are" }} hidden.
        <Button variant="link" @click="statusFilter = 'ALL'">Show any status</Button>
      </p>

      <p v-if="!choices.length" class="text-sm text-muted-foreground">
        No {{ typeNames }} file {{ query || onlyUsed || statusFilter !== "ALL" || typeFilter !== "ALL" ? "matches the filters" : "in the media library yet" }}. Upload one to use it here.
      </p>
      <div v-if="short" class="flex flex-wrap items-center justify-end gap-2 border-t border-border pt-3">
        <p class="mr-auto min-w-0 text-xs" :class="statusClass" role="status" aria-live="polite">{{ status }}</p>
        <Button variant="secondary" @click="emit('close')">Cancel</Button>
        <Button variant="primary" :disabled-reason="selected ? undefined : 'Choose a file first'" @click="confirm">{{ confirmLabel }}</Button>
      </div>
    </div>

    <template v-if="!short" #actions>
      <p class="mr-auto min-w-0 self-center text-xs" :class="statusClass" role="status" aria-live="polite">{{ status }}</p>
      <Button variant="secondary" @click="emit('close')">Cancel</Button>
      <Button variant="primary" :disabled-reason="selected ? undefined : 'Choose a file first'" @click="confirm">{{ confirmLabel }}</Button>
    </template>
  </AppDialog>
</template>
