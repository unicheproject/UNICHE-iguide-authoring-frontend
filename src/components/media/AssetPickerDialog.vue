<script setup lang="ts">
/**
 * Chooses an Asset for a field (mockup C-04): only the accepted types and never archived ones, searchable
 * by name, file name, and title, filtered by status and by what the Resource already uses, with an
 * "Upload new" tile. A click selects; the bottom bar shows whether the selected image has alternative
 * text before it is used.
 */
import { computed, ref } from "vue";
import AppDialog from "@/components/AppDialog.vue";
import { statusChipStyle } from "@/lib/format";
import { assetMatches, assetMeta, assetTypeLabel, missingAlternativeText, type Asset, type AssetType } from "@/platform/assets";
import { useAssetUpload } from "@/workspace/useAssetUpload";
import AssetThumb from "./AssetThumb.vue";

const props = defineProps<{
  projectId: string;
  title: string;
  assets: Asset[];
  accept: AssetType[];
  /** Assets already in this slot, not offered again. */
  excludeIds?: string[];
  /** Assets the Resource already uses elsewhere, for the "Used in this resource" filter. */
  usedIds?: string[];
  /** Language whose alternative text the bottom bar checks. */
  defaultLanguage?: string | null;
}>();
const emit = defineEmits<{ close: []; pick: [asset: Asset]; uploaded: [asset: Asset] }>();

const query = ref("");
const typeFilter = ref<"ALL" | AssetType>("ALL");
const statusFilter = ref<"ALL" | "DRAFT" | "ACTIVE">("ALL");
const onlyUsed = ref(false);
const selectedId = ref<string | null>(null);
const fileInput = ref<HTMLInputElement | null>(null);

const { entries, upload } = useAssetUpload(
  computed(() => props.projectId),
  (asset) => emit("uploaded", asset),
);

const choices = computed(() => {
  const excluded = new Set(props.excludeIds ?? []);
  const used = new Set(props.usedIds ?? []);
  return props.assets.filter(
    (a) =>
      props.accept.includes(a.type) &&
      a.status !== "ARCHIVED" &&
      !excluded.has(a.id) &&
      (typeFilter.value === "ALL" || a.type === typeFilter.value) &&
      (statusFilter.value === "ALL" || a.status === statusFilter.value) &&
      (!onlyUsed.value || used.has(a.id)) &&
      assetMatches(a, query.value),
  );
});

const selected = computed(() => props.assets.find((a) => a.id === selectedId.value) ?? null);
const typeNames = computed(() => props.accept.map((t) => assetTypeLabel(t).toLowerCase()).join(" or "));
const onlyImages = computed(() => props.accept.length === 1 && props.accept[0] === "IMAGE");
const confirmLabel = computed(() => (onlyImages.value ? "Use this image" : "Use this file"));
const altMissing = computed(() => (selected.value ? missingAlternativeText(selected.value, props.defaultLanguage ?? null) : false));

const acceptAttribute = computed(() =>
  props.accept
    .map((t) => ({ IMAGE: "image/*", FLOOR_PLAN: "image/*", AUDIO: "audio/*", VIDEO: "video/*" })[t as string] ?? "")
    .filter(Boolean)
    .join(","),
);

async function onFiles(event: Event) {
  const input = event.target as HTMLInputElement;
  if (!input.files?.length) return;
  const files = Array.from(input.files);
  input.value = "";
  const done = await upload([files[0]]);
  const asset = done[0]?.asset;
  if (asset && props.accept.includes(asset.type)) selectedId.value = asset.id;
}

const uploadingEntries = computed(() => entries.value.filter((e) => e.state !== "done"));

function confirm() {
  if (selected.value) emit("pick", selected.value);
}

function chip(selectedValue: boolean) {
  return selectedValue ? "border-primary bg-primary font-bold text-white" : "bg-card font-semibold text-gray-700";
}
</script>

<template>
  <AppDialog :title="title" width="960px" @close="emit('close')">
    <div class="flex flex-wrap gap-5">
      <!-- Filters -->
      <aside class="flex w-[200px] flex-none flex-col gap-4 text-xs">
        <div class="flex flex-col gap-1.5">
          <span class="small-label">Type</span>
          <template v-if="accept.length === 1">
            <span class="font-semibold text-gray-700">{{ assetTypeLabel(accept[0]) }} only</span>
          </template>
          <div v-else class="flex flex-wrap gap-1.5" role="group" aria-label="Filter by type">
            <button
              v-for="t in (['ALL', ...accept] as const)"
              :key="t"
              type="button"
              class="rounded-full border px-2.5 py-1 text-[10px]"
              :class="chip(typeFilter === t)"
              :aria-pressed="typeFilter === t"
              @click="typeFilter = t"
            >
              {{ t === "ALL" ? "All" : assetTypeLabel(t) }}
            </button>
          </div>
        </div>
        <div class="flex flex-col gap-1.5">
          <span class="small-label">Status</span>
          <div class="flex flex-wrap gap-1.5" role="group" aria-label="Filter by status">
            <button
              v-for="s in (['ALL', 'ACTIVE', 'DRAFT'] as const)"
              :key="s"
              type="button"
              class="rounded-full border px-2.5 py-1 text-[10px]"
              :class="chip(statusFilter === s)"
              :aria-pressed="statusFilter === s"
              @click="statusFilter = s"
            >
              {{ s === "ALL" ? "Any" : s }}
            </button>
          </div>
        </div>
        <label v-if="usedIds" class="flex items-center gap-2 font-semibold text-gray-700">
          <input v-model="onlyUsed" type="checkbox" class="h-4 w-4 accent-primary" />
          Used in this resource
        </label>
        <p class="text-[11px] text-muted-foreground">
          Alternative text and captions belong to the asset, so they are the same everywhere it is used.
        </p>
      </aside>

      <!-- Grid -->
      <div class="min-w-[min(100%,420px)] flex-1">
        <input
          v-model="query"
          type="search"
          aria-label="Search by name, filename or title"
          placeholder="Search by name, filename or title"
          class="mb-3 w-full rounded-lg border-[1.5px] px-3 py-[9px] text-[13px] focus:border-primary focus:outline-none"
        />
        <ul v-if="uploadingEntries.length" class="mb-3 flex flex-col gap-1.5">
          <li v-for="entry in uploadingEntries" :key="entry.key" class="text-xs">
            <div class="flex justify-between gap-2">
              <span class="truncate font-semibold">{{ entry.file.name }}</span>
              <span :class="entry.state === 'error' ? 'text-destructive' : 'text-muted-foreground'">
                {{ entry.state === "uploading" ? `${Math.round(entry.progress * 100)} %` : entry.state === "queued" ? "Queued" : "Failed" }}
              </span>
            </div>
            <div v-if="entry.state === 'uploading'" class="mt-1 h-1 overflow-hidden rounded bg-muted">
              <div class="h-full bg-primary transition-[width]" :style="{ width: `${entry.progress * 100}%` }"></div>
            </div>
            <p v-if="entry.message" role="alert" class="mt-0.5 text-destructive">{{ entry.message }}</p>
          </li>
        </ul>
        <ul class="grid max-h-[400px] grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-2.5 overflow-y-auto p-0.5" role="listbox" :aria-label="title">
          <li>
            <button
              type="button"
              class="flex h-full min-h-[128px] w-full flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed text-xs font-bold text-primary hover:border-primary"
              @click="fileInput?.click()"
            >
              <span class="text-lg" aria-hidden="true">+</span>
              Upload new
            </button>
            <input ref="fileInput" type="file" class="sr-only" :accept="acceptAttribute || undefined" tabindex="-1" @change="onFiles" />
          </li>
          <li v-for="asset in choices" :key="asset.id" role="option" :aria-selected="selectedId === asset.id">
            <button
              type="button"
              class="relative flex w-full flex-col gap-1.5 rounded-lg border-2 bg-card p-2 text-left"
              :class="selectedId === asset.id ? 'border-primary' : 'border-transparent ring-1 ring-gray-200 hover:ring-primary'"
              @click="selectedId = asset.id"
              @dblclick="emit('pick', asset)"
            >
              <span
                v-if="selectedId === asset.id"
                class="absolute right-1.5 top-1.5 z-[1] flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-white"
                aria-hidden="true"
              >
                ✓
              </span>
              <AssetThumb :asset="asset" height="80px" />
              <span class="truncate text-xs font-bold">{{ asset.internalName }}</span>
              <span class="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                <span class="truncate">{{ assetMeta(asset) }}</span>
                <span class="ml-auto rounded-full px-1.5 py-px text-[8px] font-extrabold uppercase" :style="statusChipStyle(asset.status)">{{ asset.status }}</span>
              </span>
            </button>
          </li>
        </ul>
        <p v-if="!choices.length" class="mt-3 text-[13px] text-muted-foreground">
          No {{ typeNames }} file {{ query || onlyUsed || statusFilter !== "ALL" ? "matches the filters" : "in the media library yet" }}. Upload one to use it here.
        </p>
      </div>
    </div>

    <template #actions>
      <div class="mr-auto flex min-w-0 items-center gap-2 self-center text-xs">
        <template v-if="selected">
          <span class="truncate font-bold">{{ selected.internalName }}</span>
          <span v-if="selected.type === 'IMAGE' && defaultLanguage" :class="altMissing ? 'font-semibold text-destructive' : 'text-[#0f7a6e]'">
            {{ altMissing ? `⚠ Alt text (${defaultLanguage}): missing` : `✓ Alt text (${defaultLanguage}): present` }}
          </span>
        </template>
        <span v-else class="text-muted-foreground">Nothing selected</span>
      </div>
      <button type="button" class="dialog-secondary" @click="emit('close')">Cancel</button>
      <button type="button" class="dialog-primary bg-primary" :disabled="!selected" @click="confirm">{{ confirmLabel }}</button>
    </template>
  </AppDialog>
</template>
