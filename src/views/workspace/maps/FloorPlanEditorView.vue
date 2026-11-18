<script setup lang="ts">
import { ImageUp, Trash2, X } from "lucide-vue-next";
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from "vue";
import EditorSection from "@/components/editor/EditorSection.vue";
import EditorShell from "@/components/editor/EditorShell.vue";
import { fanOutUnit, formatCoordinate, parseDecimal, rotationError, tidyCoordinate, UNIT_DIGITS, unitError } from "@/components/map/coordinates";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
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
import { say } from "@/lib/announcer";
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

const str = (v: number | null | undefined) => (v === null || v === undefined ? "" : formatCoordinate(v, UNIT_DIGITS));
/** A coordinate text as a number kept inside the plan; a text that is not a number sits at 0 until it is corrected. */
const unit = (v: string) => Math.min(1, Math.max(0, parseDecimal(v) ?? 0));
const fix = (n: number) => formatCoordinate(n, UNIT_DIGITS);
/** A position text as it should read once left (C3-75); a read-only field is never rewritten. */
const tidy = (text: string) => (readonly.value ? text : tidyCoordinate(text, UNIT_DIGITS));

/** The editable state from the form, for a DRAFT save and a working copy alike. */
function input(): Omit<UpdateFloorPlanInput, "version"> {
  return {
    internalName: form.internalName.trim(),
    assetId: form.assetId,
    placeId: form.placeId || null,
    positions: form.positions.map((p) => ({
      resourceType: p.resourceType,
      resourceId: p.resourceId,
      x: parseDecimal(p.x) ?? Number.NaN,
      y: parseDecimal(p.y) ?? Number.NaN,
      rotation: p.rotation.trim() === "" ? null : Number(p.rotation),
    })),
  };
}

/** Field checks on leaving a field, same sentences as Save, shown under the field and announced politely (C2-69). */
const blurErrors = reactive<Record<string, string>>({});

function check(path: string, text: string, kind: "x" | "y" | "rotation", label: string) {
  const error = kind === "rotation" ? rotationError(text) : unitError(text, kind);
  if (error) {
    blurErrors[path] = error;
    say(`${label}: ${error}`);
  } else {
    delete blurErrors[path];
  }
}

/** Clears a shown error as soon as the text becomes valid. */
function recheck(path: string, text: string, kind: "x" | "y" | "rotation") {
  if (!blurErrors[path]) return;
  if (!(kind === "rotation" ? rotationError(text) : unitError(text, kind))) delete blurErrors[path];
}

const fe = (path: string): string | undefined => editor.fieldError(path) ?? blurErrors[path];

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
    for (const key of Object.keys(blurErrors)) delete blurErrors[key];
    // Pins keep their numbers after a save: the platform returns positions in its own order, so items already shown
    // keep their place and new ones follow (C2-87).
    const before = new Map(form.positions.map((p, i) => [p.key, i]));
    const keyOf = (p: { resourceType: string; resourceId: string }) => `${p.resourceType}:${p.resourceId}`;
    const rank = (p: { resourceType: string; resourceId: string }) => before.get(keyOf(p)) ?? Number.MAX_SAFE_INTEGER;
    form.positions = plan.positions
      .map((p, i) => ({ p, i }))
      .sort((x, y) => rank(x.p) - rank(y.p) || x.i - y.i)
      .map(({ p }) => ({
        key: keyOf(p),
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
    form.positions.forEach((p, i) => {
      const x = unitError(p.x, "x");
      const y = unitError(p.y, "y");
      const r = rotationError(p.rotation);
      if (x) found[`positions[${i}].x`] = x;
      if (y) found[`positions[${i}].y`] = y;
      if (r) found[`positions[${i}].rotation`] = r;
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

// Placing ----------------------------------------------------------------------------------------------------

const coarsePointer = typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;
/** The unplaced item waiting for a tap or click on the plan ("armed"), as `TYPE:id`. */
const armed = ref<{ type: PlaceableType; id: string } | null>(null);
const armedTitle = computed(() => (armed.value ? title(armed.value.type, armed.value.id) : ""));
/** Shown in the prompt after a tap on a pin that is already there (D-114); the same words are announced. */
const takenNote = ref("");
/** How many items were placed without a click in this visit, so each gets its own spot on the spiral. */
let fanned = 0;

function arm(type: PlaceableType, id: string) {
  if (armed.value?.type === type && armed.value.id === id) return disarm();
  armed.value = { type, id };
  // The plan may be far above the list the author pressed Place in: bring it, and the bar under it, into view.
  takenNote.value = "";
  void nextTick(() => stage.value?.scrollIntoView({ block: "start", behavior: "auto" }));
  say(`${title(type, id)}: ${coarsePointer ? "tap" : "click"} the plan to place it, or choose Place near the centre. Escape cancels.`);
}

function disarm(announce = true) {
  if (!armed.value) return;
  const name = armedTitle.value;
  armed.value = null;
  takenNote.value = "";
  if (announce) say(`Placing ${name} cancelled.`);
}

function addPosition(type: PlaceableType, id: string, x: number, y: number) {
  form.positions.push({ key: `${type}:${id}`, resourceType: type, resourceId: id, x: fix(x), y: fix(y), rotation: "" });
  armed.value = null;
  takenNote.value = "";
  say(`${title(type, id)} placed at x ${fix(x)}, y ${fix(y)}. Drag it or use the arrow keys to move it.`);
}

/** The keyboard route: the item goes near the middle of the plan, spread so items do not stack. */
function placeNearCentre() {
  const target = armed.value;
  if (!target) return;
  fanned += 1;
  const spot = fanOutUnit(fanned);
  addPosition(target.type, target.id, spot.x, spot.y);
}

function onPlaneClick(event: MouseEvent) {
  if (!armed.value || !plane.value) return;
  const pin = (event.target as HTMLElement).closest<HTMLElement>("[data-pin]");
  if (pin) {
    if (dragMoved) {
      dragMoved = false;
      return;
    }
    // A tap on a spot that is taken is not a silent no-op: say whose it is and what to do (C3-71).
    const owner = form.positions.find((p) => p.key === pin.dataset.pin);
    if (owner) {
      takenNote.value = `That spot is taken by ${title(owner.resourceType, owner.resourceId)}. ${coarsePointer ? "Tap" : "Click"} an empty spot.`;
      say(takenNote.value);
    }
    return;
  }
  const r = plane.value.getBoundingClientRect();
  const x = Math.min(1, Math.max(0, (event.clientX - r.left) / r.width));
  const y = Math.min(1, Math.max(0, (event.clientY - r.top) / r.height));
  addPosition(armed.value.type, armed.value.id, x, y);
}

function onEscape(event: KeyboardEvent) {
  if (event.key === "Escape" && armed.value) {
    event.preventDefault();
    disarm();
  }
}
onMounted(() => window.addEventListener("keydown", onEscape));
onBeforeUnmount(() => window.removeEventListener("keydown", onEscape));

// Dragging on the image: markers move with the pointer, in normalized coordinates.
const plane = ref<HTMLDivElement | null>(null);
/** The plan and the armed bar under it, scrolled into view together when placing starts. */
const stage = ref<HTMLDivElement | null>(null);
const drag = ref<string | null>(null);
/** Whether the pointer moved a pin since it was pressed: a drag ends in a click that is not a tap on a taken spot. */
let dragMoved = false;

function startDrag(event: PointerEvent, key: string) {
  if (readonly.value) return;
  drag.value = key;
  dragMoved = false;
  (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
}

function onDrag(event: PointerEvent) {
  if (!drag.value || !plane.value) return;
  const r = plane.value.getBoundingClientRect();
  const x = fix(Math.min(1, Math.max(0, (event.clientX - r.left) / r.width)));
  const y = fix(Math.min(1, Math.max(0, (event.clientY - r.top) / r.height)));
  const p = form.positions.find((q) => q.key === drag.value);
  if (p) {
    Object.assign(p, { x, y });
    dragMoved = true;
  }
}

function endDrag() {
  const p = form.positions.find((q) => q.key === drag.value);
  drag.value = null;
  if (p) say(`${title(p.resourceType, p.resourceId)} moved to x ${p.x}, y ${p.y}.`);
}

/** Arrow keys nudge a focused marker by one percent (Shift: five), so placing works without a pointer; announced. */
function nudge(event: KeyboardEvent, p: PositionForm) {
  if (readonly.value) return;
  const step = event.shiftKey ? 0.05 : 0.01;
  const moves: Record<string, [number, number]> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
  const move = moves[event.key];
  if (!move) return;
  event.preventDefault();
  p.x = fix(Math.min(1, Math.max(0, unit(p.x) + move[0])));
  p.y = fix(Math.min(1, Math.max(0, unit(p.y) + move[1])));
  say(`${title(p.resourceType, p.resourceId)} at x ${p.x}, y ${p.y}.`);
}

const unplacedQuery = ref("");
const unplacedShown = computed(() => {
  const q = unplacedQuery.value.trim().toLowerCase();
  return q ? unplaced.value.filter((u) => title(u.type, u.id).toLowerCase().includes(q)) : unplaced.value;
});
// An item removed from the plan, or a plan that closes, ends an armed placement for it.
watch(
  () => form.positions.length,
  () => {
    if (armed.value && form.positions.some((p) => p.key === `${armed.value?.type}:${armed.value?.id}`)) armed.value = null;
  },
);

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
    <EditorSection id="plan" title="Plan and placement">
      <div class="grid gap-3 md:grid-cols-2">
        <FormField id="f-internalName" label="Name" hint="Only authors see it." :error="editor.fieldError('internalName')" v-slot="f">
          <Input :id="f.id" v-model="form.internalName" :readonly="readonly" :aria-describedby="f.describedBy" :invalid="f.invalid" />
        </FormField>
        <FormField id="f-placeId" label="Linked Place" hint="The indoor place whose page shows this plan." :error="editor.fieldError('placeId')" v-slot="f">
          <Select :id="f.id" v-model="form.placeId" :disabled="readonly" :aria-describedby="f.describedBy" :invalid="f.invalid">
            <option value="">No place</option>
            <option v-for="p in indoorPlaces" :key="p.id" :value="p.id">{{ p.label }}</option>
          </Select>
        </FormField>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <div class="min-w-0 flex-1 text-sm text-muted-foreground">
          <p>Coordinates run from 0 to 1: x from the left edge, y from the top.</p>
          <p>Plan image: <span class="inline-block max-w-full truncate align-bottom font-medium text-ink-2" :title="imageText">{{ imageText }}</span></p>
        </div>
        <Button v-if="!readonly" variant="secondary" size="sm" @click="pickingImage = true"><ImageUp aria-hidden="true" />Replace image</Button>
      </div>

      <div v-if="asset" ref="stage" class="flex flex-col gap-3">
        <!-- Docked above the plan, in the flow: never over the image, whatever the screen height (D-114). -->
        <Alert v-if="armed" tone="info" role="none" data-armed-bar :title="`${coarsePointer ? 'Tap' : 'Click'} the plan to place ${armedTitle}.`">
          <template v-if="takenNote"><span class="block font-semibold">{{ takenNote }}</span></template>
          Escape or Cancel stops placing. Without a pointer, place it near the centre and move it with the arrow keys or the x and y fields.
          <template #actions>
            <Button size="sm" variant="secondary" @click="placeNearCentre">Place near the centre</Button>
            <Button size="sm" variant="ghost" @click="disarm()"><X aria-hidden="true" />Cancel</Button>
          </template>
        </Alert>
        <div class="overflow-x-auto">
          <div
            ref="plane"
            class="plan-plane relative w-full select-none overflow-hidden rounded-lg border border-input bg-muted"
            :class="armed ? 'cursor-crosshair ring-2 ring-primary' : ''"
            @pointermove="onDrag"
            @pointerup="endDrag"
            @pointercancel="endDrag"
            @click="onPlaneClick"
          >
            <img :src="asset.url" alt="" class="block w-full" draggable="false" />
            <button
              v-for="(p, index) in form.positions"
              :key="p.key"
              type="button"
              :data-pin="p.key"
              class="plan-pin"
              :class="readonly ? 'cursor-default' : 'cursor-grab touch-none'"
              :style="{ left: `${unit(p.x) * 100}%`, top: `${unit(p.y) * 100}%` }"
              :aria-label="`${index + 1}. ${title(p.resourceType, p.resourceId)}${readonly ? '' : '. Arrow keys move it, Shift for larger steps'}`"
              :title="title(p.resourceType, p.resourceId)"
              @pointerdown="startDrag($event, p.key)"
              @keydown="nudge($event, p)"
            >
              <span class="plan-pin-dot">{{ index + 1 }}</span>
              <span v-if="p.rotation.trim() !== '' && !rotationError(p.rotation)" class="plan-pin-heading" :style="{ transform: `rotate(${Number(p.rotation)}deg)` }" aria-hidden="true"></span>
            </button>
          </div>
        </div>
      </div>
      <Alert v-else tone="warning" title="The plan image is not available.">Replace it from the media library.</Alert>
    </EditorSection>

    <EditorSection id="placed" title="Placed on this plan" :count="`${form.positions.length} placed, ${unplaced.length} not placed`">
      <div class="grid gap-5 md:grid-cols-2">
        <div class="min-w-0">
          <h3 class="mb-2 text-sm font-bold">Placed ({{ form.positions.length }})</h3>
          <ol v-if="form.positions.length" class="divide-y divide-border rounded-md border border-border">
            <li v-for="(p, index) in form.positions" :key="p.key" class="flex flex-col gap-2 p-3">
              <div class="flex items-center gap-2">
                <span class="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground" aria-hidden="true">{{ index + 1 }}</span>
                <span class="min-w-0 flex-1">
                  <span class="block break-words text-sm font-semibold">{{ title(p.resourceType, p.resourceId) }}</span>
                  <span class="block text-xs text-muted-foreground">{{ kindLabel(p.resourceType) }}</span>
                </span>
                <Button v-if="!readonly" variant="ghost" size="sm" :label="`Remove ${title(p.resourceType, p.resourceId)} from the plan`" @click="form.positions.splice(index, 1)">
                  <Trash2 aria-hidden="true" />Remove
                </Button>
              </div>
              <div class="grid grid-cols-3 gap-3 sm:pl-8">
                <FormField :id="`pos-${index}-x`" label="Across (x)" :error="fe(`positions[${index}].x`)" v-slot="f">
                  <Input :id="f.id" v-model="p.x" :data-path="`positions[${index}].x`" @blur="p.x = tidy(p.x); check(`positions[${index}].x`, p.x, 'x', `Across (x) of ${title(p.resourceType, p.resourceId)}`)" @input="recheck(`positions[${index}].x`, p.x, 'x')" :readonly="readonly" inputmode="decimal" autocomplete="off" :aria-label="`Across (x) of ${title(p.resourceType, p.resourceId)}, 0 to 1`" :aria-describedby="f.describedBy" :invalid="f.invalid" />
                </FormField>
                <FormField :id="`pos-${index}-y`" label="Down (y)" :error="fe(`positions[${index}].y`)" v-slot="f">
                  <Input :id="f.id" v-model="p.y" :data-path="`positions[${index}].y`" @blur="p.y = tidy(p.y); check(`positions[${index}].y`, p.y, 'y', `Down (y) of ${title(p.resourceType, p.resourceId)}`)" @input="recheck(`positions[${index}].y`, p.y, 'y')" :readonly="readonly" inputmode="decimal" autocomplete="off" :aria-label="`Down (y) of ${title(p.resourceType, p.resourceId)}, 0 to 1`" :aria-describedby="f.describedBy" :invalid="f.invalid" />
                </FormField>
                <FormField :id="`pos-${index}-r`" label="Facing (°)" :error="fe(`positions[${index}].rotation`)" v-slot="f">
                  <Input :id="f.id" v-model="p.rotation" :data-path="`positions[${index}].rotation`" @blur="check(`positions[${index}].rotation`, p.rotation, 'rotation', `Facing in degrees of ${title(p.resourceType, p.resourceId)}`)" @input="recheck(`positions[${index}].rotation`, p.rotation, 'rotation')" :readonly="readonly" inputmode="numeric" autocomplete="off" :aria-label="`Facing in degrees of ${title(p.resourceType, p.resourceId)}`" :aria-describedby="f.describedBy" :invalid="f.invalid" />
                </FormField>
              </div>
            </li>
          </ol>
          <p v-else class="text-sm text-muted-foreground">Nothing placed yet. Choose Place on an item, then {{ coarsePointer ? "tap" : "click" }} the plan.</p>
          <p v-if="form.positions.length" class="mt-2 text-xs text-muted-foreground">Facing turns the pin's small arrow, in whole degrees clockwise from straight up (0 to 359). Leave it empty when direction does not matter.</p>
        </div>

        <div class="min-w-0">
          <h3 class="mb-2 text-sm font-bold">Not placed ({{ unplaced.length }})</h3>
          <FormField v-if="unplaced.length > 6" id="unplaced-search" label="Search not placed" v-slot="f">
            <Input :id="f.id" v-model="unplacedQuery" type="search" autocomplete="off" />
          </FormField>
          <ul v-if="unplacedShown.length" class="mt-2 max-h-[26rem] divide-y divide-border overflow-y-auto rounded-md border border-border">
            <li v-for="u in unplacedShown" :key="`${u.type}:${u.id}`" class="flex items-center gap-2 px-3 py-2" :class="armed?.type === u.type && armed.id === u.id ? 'bg-accent' : ''">
              <span class="min-w-0 flex-1">
                <span class="block break-words text-sm font-semibold">{{ title(u.type, u.id) }}</span>
                <span class="block text-xs text-muted-foreground">{{ kindLabel(u.type) }}</span>
              </span>
              <Button
                v-if="!readonly"
                :variant="armed?.type === u.type && armed.id === u.id ? 'primary' : 'secondary'"
                size="sm"
                :aria-pressed="armed?.type === u.type && armed.id === u.id"
                @click="arm(u.type, u.id)"
              >
                {{ armed?.type === u.type && armed.id === u.id ? "Placing" : "Place" }}<span class="sr-only"> {{ title(u.type, u.id) }}</span>
              </Button>
            </li>
          </ul>
          <p v-else-if="unplaced.length" class="mt-2 text-sm text-muted-foreground">Nothing matches “{{ unplacedQuery }}”.</p>
          <p v-else class="text-sm text-muted-foreground">Every point of interest and place is on the plan.</p>
        </div>
      </div>
    </EditorSection>
  </EditorShell>

  <AssetPickerDialog
    v-if="pickingImage"
    :project-id="projectId"
    title="Choose the plan image"
    :assets="assets"
    :accept="['FLOOR_PLAN', 'IMAGE']"
    default-type="FLOOR_PLAN"
    @close="pickingImage = false"
    @pick="onPickImage"
    @uploaded="assets.unshift($event)"
  />
</template>

<style scoped>
/* Numbered pins at one size: 28 px drawn, a 44 px hit area where a finger is the pointer (D-081). */
.plan-pin {
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  transform: translate(-50%, -50%);
  border-radius: 9999px;
  background: transparent;
  border: 0;
  padding: 0;
}
@media (pointer: coarse) {
  .plan-pin {
    width: 44px;
    height: 44px;
  }
}
.plan-pin-dot {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.75rem;
  height: 1.75rem;
  border-radius: 9999px;
  border: 2px solid hsl(var(--card));
  background: hsl(var(--primary));
  color: hsl(var(--primary-foreground));
  font-size: 0.75rem;
  font-weight: 700;
  line-height: 1;
  box-shadow: var(--shadow-2);
}
.plan-pin-heading {
  position: absolute;
  inset: 0;
  pointer-events: none;
}
.plan-pin-heading::before {
  content: "";
  position: absolute;
  left: 50%;
  top: -3px;
  margin-left: -5px;
  border-left: 5px solid transparent;
  border-right: 5px solid transparent;
  border-bottom: 8px solid hsl(var(--primary));
}
@media (forced-colors: active) {
  .plan-pin-dot {
    border-color: CanvasText;
  }
  .plan-pin-heading::before {
    border-bottom-color: CanvasText;
  }
}
</style>
