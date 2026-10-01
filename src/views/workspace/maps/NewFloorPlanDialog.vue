<script setup lang="ts">
import { computed, ref } from "vue";
import AppDialog from "@/components/AppDialog.vue";
import AssetPickerDialog from "@/components/media/AssetPickerDialog.vue";
import AssetThumb from "@/components/media/AssetThumb.vue";
import { ApiError } from "@/platform/api";
import type { Asset } from "@/platform/assets";
import { createFloorPlan, type FloorPlan } from "@/platform/floorPlans";
import { placeTitle, type Place } from "@/platform/places";

const props = defineProps<{
  projectId: string;
  assets: Asset[];
  places: Place[];
  linkedPlaceIds: string[];
  defaultLanguage: string | null;
  initialPlaceId?: string | null;
}>();
const emit = defineEmits<{ close: []; created: [plan: FloorPlan]; uploaded: [asset: Asset] }>();

const name = ref("");
const assetId = ref<string | null>(null);
const placeId = ref(props.initialPlaceId ?? "");
const picking = ref(false);
const creating = ref(false);
const errors = ref<Record<string, string>>({});
const formError = ref<string | null>(null);

const asset = computed(() => props.assets.find((a) => a.id === assetId.value) ?? null);
const indoorPlaces = computed(() =>
  props.places
    .filter((p) => p.status !== "ARCHIVED" && p.setting === "INDOOR" && (!props.linkedPlaceIds.includes(p.id) || p.id === props.initialPlaceId))
    .map((p) => ({ id: p.id, label: placeTitle(p, null, props.defaultLanguage) })),
);

function onPick(a: Asset) {
  assetId.value = a.id;
  picking.value = false;
  if (!name.value.trim()) name.value = a.internalName.replace(/\.[a-z0-9]+$/i, "");
}

async function submit() {
  errors.value = {};
  formError.value = null;
  if (!name.value.trim()) errors.value.internalName = "Enter a name, such as Ground floor.";
  if (!assetId.value) errors.value.assetId = "Choose or upload the plan image.";
  if (Object.keys(errors.value).length) return;
  creating.value = true;
  try {
    emit("created", await createFloorPlan(props.projectId, { internalName: name.value.trim(), assetId: assetId.value!, placeId: placeId.value || null }));
  } catch (e) {
    if (!(e instanceof ApiError)) throw e;
    errors.value = e.fieldMessages();
    formError.value = Object.keys(errors.value).length ? null : e.message;
  } finally {
    creating.value = false;
  }
}
</script>

<template>
  <AppDialog title="New floor plan" width="560px" :busy="creating" @close="emit('close')">
    <p class="mb-4 text-[13px] text-gray-700">A floor plan is an image of one floor. Place Points of Interest on it with normalized coordinates.</p>
    <form id="new-fp-form" novalidate class="flex flex-col gap-4" @submit.prevent="submit">
      <p v-if="formError" role="alert" class="text-[13px] font-semibold text-destructive">{{ formError }}</p>
      <div class="flex flex-col gap-1.5">
        <span class="field-label">Plan image</span>
        <div class="flex items-center gap-3 rounded-lg border px-3 py-2.5" :class="{ 'border-destructive': errors.assetId }">
          <AssetThumb v-if="asset" :asset="asset" height="56px" class="w-20 flex-none" />
          <span class="min-w-0 flex-1 truncate text-xs" :class="asset ? 'font-bold' : 'text-muted-foreground'">{{ asset?.internalName ?? "No image" }}</span>
          <button type="button" class="text-[11px] font-bold text-primary" @click="picking = true">{{ asset ? "Replace" : "Choose image" }}</button>
        </div>
        <span v-if="errors.assetId" class="text-xs font-semibold text-destructive">⚠ {{ errors.assetId }}</span>
      </div>
      <div class="flex flex-col gap-1.5">
        <label for="fp-name" class="field-label">Name</label>
        <input id="fp-name" v-model="name" class="field-input" :class="{ invalid: errors.internalName }" />
        <span v-if="errors.internalName" class="text-xs font-semibold text-destructive">⚠ {{ errors.internalName }}</span>
      </div>
      <div class="flex flex-col gap-1.5">
        <label for="fp-place" class="field-label">Link to Place (optional)</label>
        <select id="fp-place" v-model="placeId" class="field-input" :class="{ invalid: errors.placeId }">
          <option value="">No place</option>
          <option v-for="p in indoorPlaces" :key="p.id" :value="p.id">{{ p.label }}</option>
        </select>
        <span v-if="errors.placeId" class="text-xs font-semibold text-destructive">⚠ {{ errors.placeId }}</span>
        <span v-else class="text-xs text-muted-foreground">Only indoor places, such as a floor of the museum building.</span>
      </div>
    </form>
    <AssetPickerDialog
      v-if="picking"
      :project-id="projectId"
      title="Choose the plan image"
      :assets="assets"
      :accept="['FLOOR_PLAN', 'IMAGE']"
      @close="picking = false"
      @pick="onPick"
      @uploaded="emit('uploaded', $event)"
    />
    <template #actions>
      <button type="button" class="dialog-secondary" :disabled="creating" @click="emit('close')">Cancel</button>
      <button type="submit" form="new-fp-form" class="dialog-primary bg-primary" :disabled="creating">{{ creating ? "Creating…" : "Create floor plan" }}</button>
    </template>
  </AppDialog>
</template>
