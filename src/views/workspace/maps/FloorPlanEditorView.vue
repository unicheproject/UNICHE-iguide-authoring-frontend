<script setup lang="ts">
import { computed, reactive, ref } from "vue";
import EditorShell from "@/components/editor/EditorShell.vue";
import AssetPickerDialog from "@/components/media/AssetPickerDialog.vue";
import { listAssets, type Asset } from "@/platform/assets";
import {
  changeFloorPlanStatus,
  fetchFloorPlan,
  fetchFloorPlanReferences,
  floorPlanFromResponse,
  floorPlanWorkingCopyPayload,
  updateFloorPlan,
  type FloorPlan,
  type UpdateFloorPlanInput,
} from "@/platform/floorPlans";
import type { PlaceableType } from "@/platform/maps";
import { listPlaces, placeTitle, type Place } from "@/platform/places";
import { listPois, poiTitle, type Poi } from "@/platform/pois";
import type { ResourceReference } from "@/platform/references";
import { showToast } from "@/stores/toast";
import { useCurrentProject } from "@/workspace/currentProject";
import { referenceLink } from "@/workspace/referenceLinks";
import { useProjectLanguages } from "@/workspace/useProjectLanguages";
import { useResourceEditor } from "@/workspace/useResourceEditor";

const props = defineProps<{ planId: string }>();
const project = useCurrentProject();
const projectId = computed(() => project.value.id);
const { languages, defaultLanguage, loading: languagesLoading } = useProjectLanguages(projectId);

const pois = ref<Poi[]>([]);
const places = ref<Place[]>([]);
const assets = ref<Asset[]>([]);

interface PositionForm {
  key: string;
  resourceType: PlaceableType;
  resourceId: string;
  x: string;
  y: string;
  rotation: string;
}

const form = reactive({
  internalName: "",
  assetId: "",
  placeId: "",
  positions: [] as PositionForm[],
});

const str = (v: number | null | undefined) => (v === null || v === undefined ? "" : String(v));
const unit = (v: string) => Math.min(1, Math.max(0, Number(v) || 0));

/** The editable state from the form, for a DRAFT save and a working copy alike. */
function input(): Omit<UpdateFloorPlanInput, "version"> {
  return {
    internalName: form.internalName.trim(),
    assetId: form.assetId,
    placeId: form.placeId || null,
    positions: form.positions.map((p) => ({
      resourceType: p.resourceType,
      resourceId: p.resourceId,
      x: Number(p.x),
      y: Number(p.y),
      rotation: p.rotation.trim() === "" ? null : Number(p.rotation),
    })),
  };
}

const editor = useResourceEditor<FloorPlan>({
  kind: "floor plan",
  source: () => props.planId,
  languages,
  defaultLanguage,
  async load() {
    const [plan, allPois, allPlaces, library] = await Promise.all([
      fetchFloorPlan(projectId.value, props.planId),
      listPois(projectId.value),
      listPlaces(projectId.value),
      listAssets(projectId.value),
    ]);
    pois.value = allPois;
    places.value = allPlaces;
    assets.value = library;
    return plan;
  },
  save: (plan, version) => updateFloorPlan(projectId.value, plan.id, { version, ...input() }),
  workingCopy: {
    kind: "floor-plans",
    projectId: () => projectId.value,
    payload: () => floorPlanWorkingCopyPayload(input()),
    fromResponse: floorPlanFromResponse,
  },
  changeStatus: (plan, target, version) => changeFloorPlanStatus(projectId.value, plan.id, target, version),
  loadReferences: (plan) => fetchFloorPlanReferences(projectId.value, plan.id),
  resetForm(plan) {
    form.internalName = plan.internalName;
    form.assetId = plan.assetId;
    form.placeId = plan.placeId ?? "";
    form.positions = plan.positions.map((p) => ({
      key: `${p.resourceType}:${p.resourceId}`,
      resourceType: p.resourceType,
      resourceId: p.resourceId,
      x: str(p.x),
      y: str(p.y),
      rotation: str(p.rotation),
    }));
  },
  ensureLanguageRows: () => {},
  formState: () => form,
  validate() {
    const found: Record<string, string> = {};
    if (!form.internalName.trim()) found.internalName = "Enter a name.";
    const checkUnit = (path: string, v: string) => {
      const n = Number(v);
      if (!v.trim() || Number.isNaN(n) || n < 0 || n > 1) found[path] = "A value from 0 to 1.";
    };
    form.positions.forEach((p, i) => {
      checkUnit(`positions[${i}].x`, p.x);
      checkUnit(`positions[${i}].y`, p.y);
      const r = p.rotation.trim();
      if (r && (!/^\d+$/.test(r) || Number(r) > 359)) found[`positions[${i}].rotation`] = "Degrees from 0 to 359.";
    });
    return found;
  },
  describePath(path) {
    const position = /^positions\[(\d+)\]/.exec(path);
    if (position) {
      const p = form.positions[Number(position[1])];
      return p ? title(p.resourceType, p.resourceId) : `Position ${Number(position[1]) + 1}`;
    }
    return { internalName: "Name", assetId: "Plan image", placeId: "Linked Place" }[path] ?? path;
  },
});

const toReference = (r: ResourceReference) => referenceLink(projectId.value, r);
const readonly = computed(() => !editor.editable);

const poiById = computed(() => new Map(pois.value.map((p) => [p.id, p])));
const placeById = computed(() => new Map(places.value.map((p) => [p.id, p])));
function title(type: PlaceableType, id: string): string {
  if (type === "POI") {
    const poi = poiById.value.get(id);
    return poi ? poiTitle(poi, defaultLanguage.value) : "Unavailable point of interest";
  }
  const place = placeById.value.get(id);
  return place ? placeTitle(place, null, defaultLanguage.value) : "Unavailable place";
}
const kindLabel = (type: PlaceableType) => (type === "POI" ? "Point of Interest" : "Place");

const asset = computed(() => assets.value.find((a) => a.id === form.assetId) ?? null);
const imageText = computed(() => {
  const a = asset.value;
  if (!a) return "no image";
  return `${a.internalName}${a.width && a.height ? ` · ${a.width} × ${a.height} px` : ""}`;
});

const unplaced = computed(() => {
  const placed = new Set(form.positions.map((p) => p.key));
  return [
    ...pois.value.filter((p) => p.status !== "ARCHIVED").map((p) => ({ type: "POI" as const, id: p.id })),
    ...places.value.filter((p) => p.status !== "ARCHIVED").map((p) => ({ type: "PLACE" as const, id: p.id })),
  ].filter((r) => !placed.has(`${r.type}:${r.id}`));
});

function place(type: PlaceableType, id: string) {
  form.positions.push({ key: `${type}:${id}`, resourceType: type, resourceId: id, x: "0.5", y: "0.5", rotation: "" });
  showToast("Placed on the plan", `${title(type, id)} sits in the middle; drag it to where it is.`);
}

// Dragging on the image: markers move with the pointer, in normalized coordinates.
const plane = ref<HTMLDivElement | null>(null);
const drag = ref<string | null>(null);

function startDrag(event: PointerEvent, key: string) {
  if (readonly.value) return;
  drag.value = key;
  (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
}

function onDrag(event: PointerEvent) {
  if (!drag.value || !plane.value) return;
  const r = plane.value.getBoundingClientRect();
  const x = Math.min(1, Math.max(0, (event.clientX - r.left) / r.width)).toFixed(4);
  const y = Math.min(1, Math.max(0, (event.clientY - r.top) / r.height)).toFixed(4);
  const p = form.positions.find((q) => q.key === drag.value);
  if (p) Object.assign(p, { x, y });
}

/** Arrow keys nudge a focused marker by one percent, so placing works without a pointer. */
function nudge(event: KeyboardEvent, p: { x: string; y: string }) {
  if (readonly.value) return;
  const step = event.shiftKey ? 0.05 : 0.01;
  const moves: Record<string, [number, number]> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
  const move = moves[event.key];
  if (!move) return;
  event.preventDefault();
  p.x = unit(String(Number(p.x) + move[0])).toFixed(4);
  p.y = unit(String(Number(p.y) + move[1])).toFixed(4);
}

// Image and Place --------------------------------------------------------------------------------------------

const pickingImage = ref(false);
function onPickImage(a: Asset) {
  form.assetId = a.id;
  pickingImage.value = false;
}

const indoorPlaces = computed(() =>
  places.value
    .filter((p) => p.status !== "ARCHIVED" && (p.setting === "INDOOR" || p.id === form.placeId))
    .map((p) => ({ id: p.id, label: placeTitle(p, null, defaultLanguage.value) })),
);

const subtitle = computed(() => {
  const place = form.placeId ? placeById.value.get(form.placeId) : undefined;
  const of = place ? `Floor plan of ${placeTitle(place, null, defaultLanguage.value)}` : "Floor plan";
  return `${of} · normalized coordinates · ${imageText.value}`;
});

function errorAt(prefix: string): string | undefined {
  const messages = Object.entries(editor.errors).filter(([p]) => p.startsWith(prefix)).map(([, m]) => m);
  return messages.length ? messages.join(" ") : undefined;
}
</script>

<template>
  <EditorShell
    :editor="editor"
    back-label="Maps & Floor Plans"
    :back-to="{ name: 'floor-plans', params: { projectId } }"
    :title="editor.resource?.internalName ?? 'Floor plan'"
    :subtitle="subtitle"
    activation-hint="Activate it when its points of interest are placed."
    :reference-link="toReference"
    :pending="languagesLoading"
  >
    <section class="overflow-hidden rounded-lg border bg-card">
      <div class="flex flex-wrap items-center gap-2 border-b px-4 py-2.5">
        <span class="flex-1 text-[11px] text-muted-foreground">Coordinate system: normalized 0.00 – 1.00 · {{ imageText }}</span>
        <button v-if="!readonly" type="button" class="rounded-full border bg-white px-3 py-1 text-[11px] font-bold text-gray-700" @click="pickingImage = true">
          Replace image
        </button>
      </div>
      <div class="p-3">
        <div
          v-if="asset"
          ref="plane"
          class="relative w-full select-none overflow-hidden rounded-lg border bg-muted"
          @pointermove="onDrag"
          @pointerup="drag = null"
          @pointercancel="drag = null"
        >
          <img :src="asset.url" alt="" class="block w-full" draggable="false" />
          <button
            v-for="(p, index) in form.positions"
            :key="p.key"
            type="button"
            class="absolute flex h-[26px] w-[26px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white bg-primary text-[11px] font-extrabold text-white shadow-[0_2px_8px_rgba(0,0,0,0.25)]"
            :class="readonly ? 'cursor-default' : 'cursor-grab touch-none'"
            :style="{ left: `${unit(p.x) * 100}%`, top: `${unit(p.y) * 100}%`, transform: `translate(-50%, -50%) rotate(${Number(p.rotation) || 0}deg)` }"
            :aria-label="`${index + 1}. ${title(p.resourceType, p.resourceId)}: arrow keys move it`"
            :title="title(p.resourceType, p.resourceId)"
            @pointerdown="startDrag($event, p.key)"
            @keydown="nudge($event, p)"
          >
            {{ index + 1 }}
          </button>
        </div>
        <p v-else class="px-2 py-10 text-center text-[13px] text-muted-foreground">The plan image is not available. Replace it from the media library.</p>
      </div>
    </section>

    <div class="grid grid-cols-[repeat(auto-fit,minmax(min(100%,300px),1fr))] gap-[18px]">
      <section class="overflow-hidden rounded-lg border bg-card">
        <div class="border-b px-4 py-3">
          <h2 class="text-[11px] font-extrabold uppercase tracking-[0.09em] text-muted-foreground">Placed ({{ form.positions.length }})</h2>
        </div>
        <ol>
          <li v-for="(p, index) in form.positions" :key="p.key" class="border-b border-gray-100 px-4 py-2.5 last:border-b-0">
            <div class="flex items-center gap-2">
              <span class="flex h-5 w-5 flex-none items-center justify-center rounded-full bg-primary text-[10px] font-extrabold text-white">{{ index + 1 }}</span>
              <span class="min-w-0 flex-1">
                <span class="block truncate text-xs font-bold">{{ title(p.resourceType, p.resourceId) }}</span>
                <span class="block text-[10px] text-muted-foreground">{{ kindLabel(p.resourceType) }}</span>
              </span>
              <button v-if="!readonly" type="button" class="text-[10px] font-bold text-destructive" @click="form.positions.splice(index, 1)">Remove from plan</button>
            </div>
            <div class="mt-1.5 grid grid-cols-3 gap-2 pl-7">
              <label class="flex flex-col gap-0.5 text-[9px] font-bold uppercase text-muted-foreground">x<input v-model="p.x" :readonly="readonly" inputmode="decimal" class="field-input compact" /></label>
              <label class="flex flex-col gap-0.5 text-[9px] font-bold uppercase text-muted-foreground">y<input v-model="p.y" :readonly="readonly" inputmode="decimal" class="field-input compact" /></label>
              <label class="flex flex-col gap-0.5 text-[9px] font-bold uppercase text-muted-foreground">Rotation °<input v-model="p.rotation" :readonly="readonly" inputmode="numeric" class="field-input compact" /></label>
            </div>
            <p v-if="errorAt(`positions[${index}]`)" class="mt-1 pl-7 text-[11px] font-semibold text-destructive">⚠ {{ errorAt(`positions[${index}]`) }}</p>
          </li>
        </ol>
        <p v-if="!form.positions.length" class="px-4 py-3 text-xs text-muted-foreground">Nothing placed yet. Place items from the Unplaced list, then drag them.</p>
      </section>

      <section class="overflow-hidden rounded-lg border bg-card">
        <div class="border-b px-4 py-3">
          <h2 class="text-[11px] font-extrabold uppercase tracking-[0.09em] text-muted-foreground">Unplaced ({{ unplaced.length }})</h2>
        </div>
        <ul class="max-h-[420px] overflow-y-auto">
          <li v-for="u in unplaced" :key="`${u.type}:${u.id}`" class="flex items-center gap-2 border-b border-gray-100 px-4 py-2.5 last:border-b-0">
            <span class="min-w-0 flex-1">
              <span class="block truncate text-xs font-bold">{{ title(u.type, u.id) }}</span>
              <span class="block text-[10px] text-muted-foreground">{{ kindLabel(u.type) }}</span>
            </span>
            <button v-if="!readonly" type="button" class="text-[10px] font-bold uppercase tracking-[0.06em] text-primary" @click="place(u.type, u.id)">Place</button>
          </li>
        </ul>
        <p v-if="!unplaced.length" class="px-4 py-3 text-xs text-muted-foreground">Every point of interest and place is on the plan.</p>
      </section>
    </div>

    <template #aside>
      <section class="overflow-hidden rounded-lg border bg-card">
        <div class="border-b px-3.5 py-[11px]">
          <span class="text-[10px] font-extrabold uppercase tracking-[0.1em] text-muted-foreground">Details</span>
        </div>
        <div class="flex flex-col gap-1.5 px-3.5 py-3">
          <label for="fp-name" class="small-label">Name</label>
          <input id="fp-name" v-model="form.internalName" :readonly="readonly" class="field-input compact" :class="{ invalid: editor.fieldError('internalName') }" />
          <label for="fp-place" class="small-label mt-2">Linked Place</label>
          <select id="fp-place" v-model="form.placeId" :disabled="readonly" class="field-input compact" :class="{ invalid: editor.fieldError('placeId') }">
            <option value="">No place</option>
            <option v-for="p in indoorPlaces" :key="p.id" :value="p.id">{{ p.label }}</option>
          </select>
          <span v-if="editor.fieldError('placeId')" class="text-[11px] font-semibold text-destructive">⚠ {{ editor.fieldError("placeId") }}</span>
          <span v-else class="text-[11px] text-muted-foreground">The indoor place whose page shows this plan.</span>
        </div>
      </section>
    </template>
  </EditorShell>

  <AssetPickerDialog
    v-if="pickingImage"
    :project-id="projectId"
    title="Choose the plan image"
    :assets="assets"
    :accept="['FLOOR_PLAN', 'IMAGE']"
    @close="pickingImage = false"
    @pick="onPickImage"
    @uploaded="assets.unshift($event)"
  />
</template>

<style scoped>
.compact {
  padding: 6px 8px;
  font-size: 12px;
}
</style>
