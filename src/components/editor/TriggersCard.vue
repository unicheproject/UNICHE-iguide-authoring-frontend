<script setup lang="ts">
/*
 * "How visitors reach it" (`12` §3, common to every Resource editor): the Interaction Triggers of a Place, Point
 * of Interest, Route, Guide, or Event, edited in its editor and saved with it (DECISIONS.md D-018). Camera recognition is deferred (`08`), so its chip is greyed
 * with the reason (backend D-026).
 */
import { computed } from "vue";
import BackendQrCode from "@/components/editor/BackendQrCode.vue";
import QrCodePreview from "@/components/editor/QrCodePreview.vue";
import { blankTrigger, TRIGGER_CHIP_CLASS as CHIP, TRIGGER_LABELS, type TriggerForm, type TriggerType } from "@/platform/triggers";
import { useCurrentProject } from "@/workspace/currentProject";

const project = useCurrentProject();

/** The stand-in link of a QR code: the CMS preview of the visitor app with the runtime's `?t=` (DECISIONS.md D-019). */
function qrUrl(code: string): string {
  return `${window.location.origin}/projects/${encodeURIComponent(project.value.id)}/app-preview?t=${encodeURIComponent(code)}`;
}

/** Whether the backend's QR image applies: a saved QR row whose code is unchanged, once the app has an address. */
function hasBackendImage(t: TriggerForm): boolean {
  return !!t.id && !!t.runtimeUrl && t.code.trim() === (t.savedCode ?? "");
}

const props = defineProps<{
  triggers: TriggerForm[];
  readonly: boolean;
  fieldError: (path: string) => string | undefined;
  /** Where a new geo-proximity area is centred, such as the Point of Interest's position. */
  position?: { latitude: string; longitude: string } | null;
  /** The button that copies `position` into an area, such as "Use the place's position". */
  positionLabel?: string;
}>();

/** The Project has a public web address once any saved QR code has a runtime URL. */
const hasAddress = computed(() => props.triggers.some((t) => !!t.runtimeUrl));

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
  <section class="overflow-hidden rounded-lg border bg-card" aria-labelledby="triggers-heading">
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
            <input
              v-model="t.uuid"
              :readonly="readonly"
              :aria-label="`Beacon ${i + 1} UUID`"
              placeholder="UUID, e.g. e2c56db5-dffb-48d2-b060-d0f5a71096e0"
              spellcheck="false"
              class="field-input min-w-[240px] flex-[3] font-mono text-[13px]"
              :class="invalid(i, 'uuid')"
            />
            <span class="text-muted-foreground" aria-hidden="true">/</span>
            <input v-model="t.major" :readonly="readonly" :aria-label="`Beacon ${i + 1} major`" placeholder="major" inputmode="numeric" class="field-input w-[90px] font-mono text-[13px]" :class="invalid(i, 'major')" />
            <span class="text-muted-foreground" aria-hidden="true">/</span>
            <input v-model="t.minor" :readonly="readonly" :aria-label="`Beacon ${i + 1} minor`" placeholder="minor" inputmode="numeric" class="field-input w-[90px] font-mono text-[13px]" :class="invalid(i, 'minor')" />
          </template>

          <template v-else-if="t.type === 'GEO_PROXIMITY'">
            <input v-model="t.latitude" :readonly="readonly" :aria-label="`Area ${i + 1} latitude`" placeholder="latitude" inputmode="decimal" class="field-input w-[130px] font-mono text-[13px]" :class="invalid(i, 'latitude')" />
            <input v-model="t.longitude" :readonly="readonly" :aria-label="`Area ${i + 1} longitude`" placeholder="longitude" inputmode="decimal" class="field-input w-[130px] font-mono text-[13px]" :class="invalid(i, 'longitude')" />
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
            <input
              v-model="t.code"
              :readonly="readonly"
              :aria-label="`QR code ${i + 1}`"
              placeholder="Generated when saved"
              spellcheck="false"
              class="field-input min-w-[200px] flex-1 font-mono text-[13px]"
              :class="invalid(i, 'code')"
            />
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
          <span>Mobile app only, while it is open.</span>
        </div>
        <div v-else-if="t.type === 'GEO_PROXIMITY'" class="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <label class="flex items-center gap-1.5">
            then waits
            <input v-model="t.cooldownSeconds" :readonly="readonly" inputmode="numeric" class="field-input w-[80px] font-mono text-[12px]" :class="invalid(i, 'cooldownSeconds')" />
            s before suggesting it again
          </label>
          <span>Web and mobile, while the app is open.</span>
        </div>
        <BackendQrCode
          v-else-if="hasBackendImage(t)"
          :project-id="project.id"
          :trigger-id="t.id!"
          :code="t.code.trim()"
          :runtime-url="t.runtimeUrl!"
        />
        <p v-else-if="hasAddress" class="text-xs text-muted-foreground">
          {{ t.code.trim() ? "Save to see the QR image for this code." : "Save to get a generated code and its QR image, or type your own code." }}
        </p>
        <QrCodePreview v-else-if="t.code.trim()" :url="qrUrl(t.code.trim())" :code="t.code.trim()">
          <p v-if="t.id" class="text-muted-foreground">
            Set the public web address in
            <RouterLink :to="{ name: 'project-surfaces', params: { projectId: project.id } }" class="font-semibold text-primary">
              App settings → Surfaces
            </RouterLink>
            to get the real QR image.
          </p>
        </QrCodePreview>
        <p v-else class="text-xs text-muted-foreground">
          {{ t.id ? "This QR code has no code yet." : "Save to get a generated code and its QR image, or type your own code." }}
        </p>

        <ul v-if="rowError(i) || ['code', 'uuid', 'major', 'minor', 'proximityMeters', 'cooldownSeconds', 'latitude', 'longitude', 'radiusMeters'].some((f) => err(i, f))">
          <li v-if="rowError(i)" class="text-xs font-semibold text-destructive">⚠ {{ rowError(i) }}</li>
          <template v-for="f in ['code', 'uuid', 'major', 'minor', 'proximityMeters', 'cooldownSeconds', 'latitude', 'longitude', 'radiusMeters']" :key="f">
            <li v-if="err(i, f)" class="text-xs font-semibold text-destructive">⚠ {{ err(i, f) }}</li>
          </template>
        </ul>
      </li>
    </ul>

    <div v-if="!readonly" class="flex flex-wrap items-center gap-2.5 px-5 py-3.5">
      <span class="mr-1 text-[11px] font-extrabold uppercase tracking-[0.09em] text-muted-foreground">Add</span>
      <button v-for="type in (['BEACON', 'GEO_PROXIMITY', 'QR_CODE'] as const)" :key="type" type="button" class="add-chip" @click="add(type)">
        + {{ TRIGGER_LABELS[type] }}
      </button>
      <button type="button" class="add-chip" disabled title="Camera recognition is deferred: not part of the first release.">
        + AR scan target
      </button>
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
