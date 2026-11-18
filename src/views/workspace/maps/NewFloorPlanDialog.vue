<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from "vue";
import AppDialog from "@/components/AppDialog.vue";
import AssetPickerDialog from "@/components/media/AssetPickerDialog.vue";
import AssetThumb from "@/components/media/AssetThumb.vue";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/field";
import FormErrorSummary from "@/components/ui/field/FormErrorSummary.vue";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
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
const requestId = ref<string | null>(null);
const summaryEl = ref<InstanceType<typeof FormErrorSummary> | null>(null);

/** Field key to its control's DOM id and its name in the summary, in the order of the form. */
const FIELDS = [
  { key: "assetId", id: "fp-asset", label: "Plan image" },
  { key: "internalName", id: "fp-name", label: "Name" },
  { key: "placeId", id: "fp-place", label: "Link to Place" },
] as const;

/** "N things to fix": every problem in form order, each a link that focuses its field (as the create dialogs do). */
const summary = computed(() => {
  const items = FIELDS.filter((f) => errors.value[f.key]).map((f) => ({ text: `${f.label}: ${errors.value[f.key]}`, path: f.key as string | null }));
  if (!items.length) return null;
  return { title: items.length === 1 ? "1 thing to fix" : `${items.length} things to fix`, items, requestId: requestId.value };
});

function focusField(key: string) {
  const field = FIELDS.find((f) => f.key === key);
  if (field) document.getElementById(field.id)?.focus();
}

/** The summary takes focus once it is drawn, so a screen reader reads the list before the fields. */
async function showSummary() {
  await nextTick();
  (summaryEl.value?.$el as HTMLElement | undefined)?.focus();
}

/**
 * The Plan image is the first field, but the dialog frame focuses the first text field (Name). Once the frame has
 * placed focus, move it to the first field in reading order (C3-76).
 */
onMounted(async () => {
  await nextTick();
  document.getElementById("fp-asset")?.focus();
});

const asset = computed(() => props.assets.find((a) => a.id === assetId.value) ?? null);
const indoorPlaces = computed(() =>
  props.places
    // A Place can have several plans (one per floor), so a Place with a plan stays in the list, marked.
    .filter((p) => p.status !== "ARCHIVED" && p.setting === "INDOOR")
    .map((p) => ({ id: p.id, label: `${placeTitle(p, null, props.defaultLanguage)}${props.linkedPlaceIds.includes(p.id) ? " (has a plan)" : ""}` })),
);

function onPick(a: Asset) {
  assetId.value = a.id;
  picking.value = false;
  if (!name.value.trim()) name.value = a.internalName.replace(/\.[a-z0-9]+$/i, "");
}

async function submit() {
  errors.value = {};
  formError.value = null;
  requestId.value = null;
  if (!name.value.trim()) errors.value.internalName = "Enter a name, such as Ground floor.";
  if (!assetId.value) errors.value.assetId = "Choose or upload the plan image.";
  if (Object.keys(errors.value).length) return showSummary();
  creating.value = true;
  try {
    emit("created", await createFloorPlan(props.projectId, { internalName: name.value.trim(), assetId: assetId.value!, placeId: placeId.value || null }));
  } catch (e) {
    if (!(e instanceof ApiError)) throw e;
    errors.value = e.fieldMessages();
    formError.value = Object.keys(errors.value).length ? null : e.message;
    requestId.value = e.requestId;
    await showSummary();
  } finally {
    creating.value = false;
  }
}
</script>

<template>
  <AppDialog title="New floor plan" size="md" :busy="creating" @close="emit('close')">
    <p class="mb-4 text-sm text-ink-2">A floor plan is an image of one floor. You place Points of Interest on it by clicking the image or typing coordinates.</p>
    <form id="new-fp-form" novalidate class="flex flex-col gap-4" @submit.prevent="submit">
      <FormErrorSummary v-if="summary" ref="summaryEl" :summary="summary" @select="focusField" />
      <Alert v-if="formError" tone="danger">{{ formError }}</Alert>
      <FormField id="fp-asset" label="Plan image" :error="errors.assetId" v-slot="f">
        <div class="flex items-center gap-3 rounded-md border px-3 py-2" :class="errors.assetId ? 'border-destructive' : 'border-input'">
          <AssetThumb v-if="asset" :asset="asset" height="56px" class="w-20 flex-none" />
          <span class="min-w-0 flex-1 truncate text-sm" :class="asset ? 'font-semibold' : 'text-muted-foreground'">{{ asset?.internalName ?? "No image chosen" }}</span>
          <Button :id="f.id" variant="secondary" size="sm" :label="`Plan image: ${asset ? 'Replace image' : 'Choose image'}`" :aria-invalid="errors.assetId ? 'true' : undefined" :aria-describedby="f.describedBy" @click="picking = true">
            {{ asset ? "Replace image" : "Choose image" }}
          </Button>
        </div>
      </FormField>
      <FormField id="fp-name" label="Name" hint="Only authors see it, such as Ground floor." :error="errors.internalName" v-slot="f">
        <Input :id="f.id" v-model="name" :aria-describedby="f.describedBy" :invalid="f.invalid" />
      </FormField>
      <FormField id="fp-place" label="Link to Place (optional)" hint="Only indoor places, such as a floor of the museum building. A Place can have several plans, one per floor." :error="errors.placeId" v-slot="f">
        <Select :id="f.id" v-model="placeId" :aria-describedby="f.describedBy" :invalid="f.invalid">
          <option value="">No place</option>
          <option v-for="p in indoorPlaces" :key="p.id" :value="p.id">{{ p.label }}</option>
        </Select>
      </FormField>
    </form>
    <AssetPickerDialog
      v-if="picking"
      :project-id="projectId"
      title="Choose the plan image"
      :assets="assets"
      :accept="['FLOOR_PLAN', 'IMAGE']"
      default-type="FLOOR_PLAN"
      @close="picking = false"
      @pick="onPick"
      @uploaded="emit('uploaded', $event)"
    />
    <template #actions>
      <Button variant="secondary" :disabled="creating" @click="emit('close')">Cancel</Button>
      <Button type="submit" form="new-fp-form" :loading="creating">{{ creating ? "Creating" : "Create floor plan" }}</Button>
    </template>
  </AppDialog>
</template>
