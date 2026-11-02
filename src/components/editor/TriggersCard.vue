<script setup lang="ts">
/*
 * "How visitors reach it" (`12` §3, common to every Resource editor): the Interaction Triggers of a Place, Point
 * of Interest, Route, Guide, or Event, edited in its editor and saved with it (DECISIONS.md D-018). Camera recognition is deferred (`08`), so its chip is greyed
 * with the reason (backend D-026). Each type is offered by the surfaces able to run it (`13` §1, DECISIONS.md D-038):
 * greyed with the reason while none of them is enabled, and each row says which surfaces it runs on.
 */
import { computed, nextTick, onMounted, ref, watch } from "vue";
import { useRoute } from "vue-router";
import BackendQrCode from "@/components/editor/BackendQrCode.vue";
import { fetchSurfaces, publicBaseUrlOf, type SurfaceName } from "@/platform/surfaces";
import {
  blankTrigger,
  SURFACE_LABELS,
  TRIGGER_CHIP_CLASS as CHIP,
  TRIGGER_LABELS,
  TRIGGER_SURFACES,
  triggerSurfaces,
  type TriggerForm,
  type TriggerType,
} from "@/platform/triggers";
import { useCurrentProject } from "@/workspace/currentProject";
import { TRIGGERS_HASH } from "@/workspace/referenceLinks";

const project = useCurrentProject();

/** Whether the backend's QR image applies: a saved QR row whose code is unchanged, once the app has an address. */
function hasBackendImage(t: TriggerForm): boolean {
  return publicBaseUrl.value !== "" && !!t.id && !!t.runtimeUrl && t.code.trim() === (t.savedCode ?? "");
}

// A "Used in" trigger link lands here (DECISIONS.md D-037): the card scrolls into view and takes focus.
const route = useRoute();
const card = ref<HTMLElement | null>(null);
watch(
  () => route.hash,
  async (hash) => {
    if (hash !== TRIGGERS_HASH) return;
    await nextTick();
    card.value?.scrollIntoView({ block: "start" });
    card.value?.focus({ preventScroll: true });
  },
  { immediate: true },
);

const props = defineProps<{
  triggers: TriggerForm[];
  readonly: boolean;
  fieldError: (path: string) => string | undefined;
  /** Where a new geo-proximity area is centred, such as the Point of Interest's position. */
  position?: { latitude: string; longitude: string } | null;
  /** The button that copies `position` into an area, such as "Use the place's position". */
  positionLabel?: string;
}>();


// The Project's enabled surfaces; null while unknown, when nothing is greyed (the backend still checks).
const enabledSurfaces = ref<Set<SurfaceName> | null>(null);
/**
 * The address QR codes encode, from App settings → Surfaces (`11` §9, DECISIONS.md D-039): a string, "" when the
 * Project has none, null while unknown.
 */
const publicBaseUrl = ref<string | null>(null);
onMounted(async () => {
  try {
    const surfaces = await fetchSurfaces(project.value.id);
    enabledSurfaces.value = new Set(surfaces.filter((s) => s.enabled).map((s) => s.surface));
    publicBaseUrl.value = publicBaseUrlOf(surfaces) ?? "";
  } catch {
    enabledSurfaces.value = null;
    publicBaseUrl.value = null;
  }
});

const ADDABLE = ["BEACON", "GEO_PROXIMITY", "QR_CODE"] as const;

const listOf = (surfaces: SurfaceName[]) => {
  const names = surfaces.map((s) => SURFACE_LABELS[s]);
  return names.length > 1 ? `${names.slice(0, -1).join(", ")} or ${names[names.length - 1]}` : names[0];
};

/** Why a type cannot be added: no enabled surface can run it. */
function unavailable(type: TriggerType): string | null {
  const enabled = enabledSurfaces.value;
  if (!enabled || TRIGGER_SURFACES[type].some((s) => enabled.has(s))) return null;
  return `${TRIGGER_LABELS[type]}: needs the ${listOf(TRIGGER_SURFACES[type])} surface, which is not enabled.`;
}
const unavailableReasons = computed(() => ADDABLE.map(unavailable).filter((r): r is string => !!r));

const runsOn = (t: TriggerForm) => triggerSurfaces(t.type, t.surfaces);

/** Ticks or unticks a surface; all of the type's surfaces ticked is stored as "every surface" (null). */
function toggleSurface(t: TriggerForm, surface: SurfaceName, on: boolean) {
  const all = TRIGGER_SURFACES[t.type];
  const next = all.filter((s) => (s === surface ? on : runsOn(t).includes(s)));
  if (!next.length) return;
  t.surfaces = next.length === all.length ? null : next;
}

/** A row none of whose surfaces is enabled: visitors cannot use it anywhere yet. */
function unreachable(t: TriggerForm): boolean {
  const enabled = enabledSurfaces.value;
  return !!enabled && !runsOn(t).some((s) => enabled.has(s));
}

function add(type: TriggerType) {
  const defaults =
    type === "GEO_PROXIMITY" && props.position ? { latitude: props.position.latitude, longitude: props.position.longitude } : {};
  props.triggers.push(blankTrigger(type, defaults));
}

function remove(index: number) {
  props.triggers.splice(index, 1);
}

function usePosition(t: TriggerForm) {
  if (!props.position) return;
  t.latitude = props.position.latitude;
  t.longitude = props.position.longitude;
}

const err = (i: number, field: string) => props.fieldError(`triggers[${i}].${field}`);
const rowError = (i: number) => props.fieldError(`triggers[${i}]`);
const invalid = (i: number, field: string) => ({ invalid: !!err(i, field) });
</script>

<template>
  <section id="triggers" ref="card" tabindex="-1" class="overflow-hidden rounded-lg border bg-card" aria-labelledby="triggers-heading">
    <div class="flex flex-wrap items-baseline gap-2 border-b px-5 py-3.5">
      <h2 id="triggers-heading" class="text-[11px] font-extrabold uppercase tracking-[0.09em] text-muted-foreground">How visitors reach it</h2>
      <span class="ml-auto text-xs text-muted-foreground">Beacons, places on the map, and QR codes open this in place</span>
    </div>

    <p v-if="!triggers.length" class="border-b px-5 py-4 text-[13px] text-muted-foreground">
      Only reachable by browsing. Add a Bluetooth beacon, a geo-proximity area, or a QR code to open it in place.
    </p>

    <ul v-else class="divide-y border-b">
      <li v-for="(t, i) in triggers" :key="t.key" class="flex flex-col gap-2 px-5 py-3.5">
        <div class="flex flex-wrap items-center gap-3">
          <span class="whitespace-nowrap rounded-full px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.07em]" :class="CHIP[t.type]">
            {{ TRIGGER_LABELS[t.type] }}
          </span>

          <template v-if="t.type === 'BEACON'">
            <label class="flex min-w-[200px] flex-1 items-center gap-1.5 text-xs text-muted-foreground">
              UUID
              <input
                v-model="t.uuid"
                :readonly="readonly"
                :aria-label="`Beacon ${i + 1} UUID`"
                placeholder="UUID, e.g. e2c56db5-dffb-48d2-b060-d0f5a71096e0"
                spellcheck="false"
                class="field-input min-w-[240px] flex-[3] font-mono text-[13px]"
                :class="invalid(i, 'uuid')"
                :aria-invalid="err(i, 'uuid') ? 'true' : undefined" :aria-describedby="err(i, 'uuid') ? `trigger-errors-${t.key}` : undefined"
              />
            </label>
            <label class="flex items-center gap-1.5 text-xs text-muted-foreground">
              major
              <input v-model="t.major" :readonly="readonly" :aria-label="`Beacon ${i + 1} major`" placeholder="major" inputmode="numeric" class="field-input w-[90px] font-mono text-[13px]" :class="invalid(i, 'major')" :aria-invalid="err(i, 'major') ? 'true' : undefined" :aria-describedby="err(i, 'major') ? `trigger-errors-${t.key}` : undefined" />
            </label>
            <label class="flex items-center gap-1.5 text-xs text-muted-foreground">
              minor
              <input v-model="t.minor" :readonly="readonly" :aria-label="`Beacon ${i + 1} minor`" placeholder="minor" inputmode="numeric" class="field-input w-[90px] font-mono text-[13px]" :class="invalid(i, 'minor')" :aria-invalid="err(i, 'minor') ? 'true' : undefined" :aria-describedby="err(i, 'minor') ? `trigger-errors-${t.key}` : undefined" />
            </label>
          </template>

          <template v-else-if="t.type === 'GEO_PROXIMITY'">
            <label class="flex items-center gap-1.5 text-xs text-muted-foreground">
              latitude
              <input v-model="t.latitude" :readonly="readonly" :aria-label="`Area ${i + 1} latitude`" placeholder="latitude" inputmode="decimal" class="field-input w-[130px] font-mono text-[13px]" :class="invalid(i, 'latitude')" :aria-invalid="err(i, 'latitude') ? 'true' : undefined" :aria-describedby="err(i, 'latitude') ? `trigger-errors-${t.key}` : undefined" />
            </label>
            <label class="flex items-center gap-1.5 text-xs text-muted-foreground">
              longitude
              <input v-model="t.longitude" :readonly="readonly" :aria-label="`Area ${i + 1} longitude`" placeholder="longitude" inputmode="decimal" class="field-input w-[130px] font-mono text-[13px]" :class="invalid(i, 'longitude')" :aria-invalid="err(i, 'longitude') ? 'true' : undefined" :aria-describedby="err(i, 'longitude') ? `trigger-errors-${t.key}` : undefined" />
            </label>
            <label class="flex items-center gap-1.5 text-xs text-muted-foreground">
              radius
              <input v-model="t.radiusMeters" :readonly="readonly" inputmode="numeric" class="field-input w-[80px] font-mono text-[13px]" :class="invalid(i, 'radiusMeters')" />
              m
            </label>
            <button
              v-if="!readonly && position && position.latitude && position.longitude"
              type="button"
              class="text-[11px] font-bold text-primary"
              @click="usePosition(t)"
            >
              {{ positionLabel ?? "Use this position" }}
            </button>
          </template>

          <template v-else>
            <label class="flex min-w-[200px] flex-1 items-center gap-1.5 text-xs text-muted-foreground">
              Code
              <input
                v-model="t.code"
                :readonly="readonly"
                :aria-label="`QR code ${i + 1}`"
                placeholder="Generated when saved"
                spellcheck="false"
                class="field-input min-w-[200px] flex-1 font-mono text-[13px]"
                :class="invalid(i, 'code')"
                :aria-invalid="err(i, 'code') ? 'true' : undefined" :aria-describedby="err(i, 'code') ? `trigger-errors-${t.key}` : undefined"
              />
            </label>
          </template>

          <button
            v-if="!readonly"
            type="button"
            class="ml-auto px-1.5 text-lg leading-none text-muted-foreground hover:text-destructive"
            :aria-label="`Remove ${TRIGGER_LABELS[t.type]} ${i + 1}`"
            @click="remove(i)"
          >
            ×
          </button>
        </div>

        <fieldset class="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <legend class="float-left mr-1 font-semibold">Runs on</legend>
          <template v-if="TRIGGER_SURFACES[t.type].length > 1">
            <label v-for="s in TRIGGER_SURFACES[t.type]" :key="s" class="flex items-center gap-1.5">
              <input
                type="checkbox"
                :checked="runsOn(t).includes(s)"
                :disabled="readonly || (runsOn(t).length === 1 && runsOn(t).includes(s))"
                @change="toggleSurface(t, s, ($event.target as HTMLInputElement).checked)"
              />
              {{ SURFACE_LABELS[s] }}<span v-if="enabledSurfaces && !enabledSurfaces.has(s)"> (not enabled)</span>
            </label>
          </template>
          <span v-else>
            {{ SURFACE_LABELS[TRIGGER_SURFACES[t.type][0]] }} only<span v-if="enabledSurfaces && !enabledSurfaces.has(TRIGGER_SURFACES[t.type][0])"> (not enabled)</span>
          </span>
        </fieldset>
        <p v-if="unreachable(t)" class="text-xs font-semibold text-[#9a6200]">
          ⚠ None of the surfaces it runs on is enabled, so visitors cannot use it. Enable one in
          <RouterLink :to="{ name: 'project-surfaces', params: { projectId: project.id } }" class="text-primary">App settings → Surfaces</RouterLink>.
        </p>

        <div v-if="t.type === 'BEACON'" class="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <label class="flex items-center gap-1.5">
            suggests it within
            <input v-model="t.proximityMeters" :readonly="readonly" inputmode="decimal" class="field-input w-[70px] font-mono text-[12px]" :class="invalid(i, 'proximityMeters')" />
            m
          </label>
          <label class="flex items-center gap-1.5">
            then waits
            <input v-model="t.cooldownSeconds" :readonly="readonly" inputmode="numeric" class="field-input w-[80px] font-mono text-[12px]" :class="invalid(i, 'cooldownSeconds')" />
            s before suggesting it again
          </label>
          <span>While the app is open. Until a beacon plugin is chosen, the app offers it as an ordinary link.</span>
        </div>
        <div v-else-if="t.type === 'GEO_PROXIMITY'" class="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <label class="flex items-center gap-1.5">
            then waits
            <input v-model="t.cooldownSeconds" :readonly="readonly" inputmode="numeric" class="field-input w-[80px] font-mono text-[12px]" :class="invalid(i, 'cooldownSeconds')" />
            s before suggesting it again
          </label>
          <span>While the app is open.</span>
        </div>
        <BackendQrCode
          v-else-if="hasBackendImage(t)"
          :project-id="project.id"
          :trigger-id="t.id!"
          :code="t.code.trim()"
          :runtime-url="t.runtimeUrl!"
        />
        <p v-else-if="publicBaseUrl === ''" class="text-xs font-semibold text-[#9a6200]">
          ⚠ No QR image: the visitor app has no public web address for the code to open. Set it in
          <RouterLink :to="{ name: 'project-surfaces', params: { projectId: project.id } }" class="text-primary">
            App settings → Surfaces
          </RouterLink>;
          the code {{ t.code.trim() ? "is kept" : "is generated when saved" }} and its image appears once the address is set.
        </p>
        <p v-else class="text-xs text-muted-foreground">
          {{ t.code.trim() ? "Save to see the QR image for this code." : "Save to get a generated code and its QR image, or type your own code." }}
        </p>

        <ul :id="`trigger-errors-${t.key}`" v-if="rowError(i) || ['code', 'supportedSurfaces', 'uuid', 'major', 'minor', 'proximityMeters', 'cooldownSeconds', 'latitude', 'longitude', 'radiusMeters'].some((f) => err(i, f))">
          <li v-if="rowError(i)" class="text-xs font-semibold text-destructive">⚠ {{ rowError(i) }}</li>
          <template v-for="f in ['code', 'supportedSurfaces', 'uuid', 'major', 'minor', 'proximityMeters', 'cooldownSeconds', 'latitude', 'longitude', 'radiusMeters']" :key="f">
            <li v-if="err(i, f)" class="text-xs font-semibold text-destructive">⚠ {{ err(i, f) }}</li>
          </template>
        </ul>
      </li>
    </ul>

    <div v-if="!readonly" class="flex flex-wrap items-center gap-2.5 px-5 py-3.5">
      <span class="mr-1 text-[11px] font-extrabold uppercase tracking-[0.09em] text-muted-foreground">Add</span>
      <button
        v-for="type in ADDABLE"
        :key="type"
        type="button"
        class="add-chip"
        :disabled="!!unavailable(type)"
        :aria-describedby="unavailable(type) ? 'triggers-unavailable' : undefined"
        @click="add(type)"
      >
        + {{ TRIGGER_LABELS[type] }}
      </button>
      <button type="button" class="add-chip" disabled title="Camera recognition is deferred: not part of the first release.">
        + AR scan target
      </button>
      <ul v-if="unavailableReasons.length" id="triggers-unavailable" class="w-full text-xs text-muted-foreground">
        <li v-for="reason in unavailableReasons" :key="reason">
          {{ reason }}
          <RouterLink :to="{ name: 'project-surfaces', params: { projectId: project.id } }" class="text-primary">App settings → Surfaces</RouterLink>
        </li>
      </ul>
    </div>
  </section>
</template>

<style scoped>
.add-chip {
  border: 1px solid #e5e7eb;
  border-radius: 9999px;
  padding: 0.4rem 0.9rem;
  font-size: 12px;
  font-weight: 700;
  color: #374151;
  background: #fff;
}
.add-chip:hover:not(:disabled) {
  border-color: hsl(var(--primary));
  color: hsl(var(--primary));
}
.add-chip:disabled {
  color: #9ca3af;
  cursor: not-allowed;
}
</style>
