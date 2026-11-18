<script setup lang="ts">
/*
 * "How visitors reach it" (`12` §3, common to every Resource editor): the Interaction Triggers of a Place, Point
 * of Interest, Route, Guide, or Event, edited in its editor and saved with it (DECISIONS.md D-018). Camera recognition is deferred (`08`), so its chip is greyed
 * with the reason (backend D-026). Each type is offered by the surfaces able to run it (`13` §1, DECISIONS.md D-038):
 * greyed with the reason while none of them is enabled, and each row says which surfaces it runs on.
 */
import { Bluetooth, ChevronDown, CircleAlert, Pencil, Plus, QrCode, Trash2, MapPin, FlaskConical, TriangleAlert } from "lucide-vue-next";
import { computed, nextTick, onMounted, reactive, ref, watch } from "vue";
import { useRoute } from "vue-router";
import BackendQrCode from "@/components/editor/BackendQrCode.vue";
import EditorSection from "@/components/editor/EditorSection.vue";
import QrCodePreview from "@/components/editor/QrCodePreview.vue";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import FormField from "@/components/ui/field/FormField.vue";
import HelpHint from "@/components/ui/help-hint/HelpHint.vue";
import Input from "@/components/ui/input/Input.vue";
import { parseDecimal } from "@/components/map/coordinates";
import { say } from "@/lib/announcer";
import { askConfirm } from "@/stores/confirm";
import { fetchSurfaces, publicBaseUrlOf, type SurfaceName } from "@/platform/surfaces";
import {
  blankTrigger,
  SURFACE_LABELS,
  TRIGGER_LABELS,
  TRIGGER_SURFACES,
  triggerSurfaces,
  type TriggerForm,
  triggerCoordinateError,
  type TriggerType,
} from "@/platform/triggers";
import { useCurrentProject } from "@/workspace/currentProject";
import { capabilityOff, useProjectSettings } from "@/workspace/projectSettings";
import { sectionLocation } from "@/workspace/sections";
import type { Capability } from "@/platform/settings";
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
    card.value?.closest("section")?.scrollIntoView({ block: "start" });
    card.value?.focus({ preventScroll: true });
  },
  { immediate: true },
);

/** `triggers` is edited in place; `position` is where a new geo-proximity area is centred. */
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
/** The add buttons are short so the four of them fit one row; the full names are in the page for assistive technology. */
const ADD_LABEL: Record<(typeof ADDABLE)[number], string> = { BEACON: "Beacon", GEO_PROXIMITY: "Geo-proximity", QR_CODE: "QR code" };

// A type whose capability is off in App settings → Features is greyed with the reason too (`12` §3, CMS D-049).
const settings = useProjectSettings(computed(() => project.value.id));
const CAPABILITY: Record<(typeof ADDABLE)[number], Capability> = {
  BEACON: "LOCATION_TRIGGERS",
  GEO_PROXIMITY: "LOCATION_TRIGGERS",
  QR_CODE: "QR_TRIGGERS",
};
/** Why visitors cannot use a type in this Project: its Template lacks the capability, or Features turned it off. */
function switchedOff(type: TriggerType): "template" | "features" | null {
  const capability = CAPABILITY[type as (typeof ADDABLE)[number]];
  const s = settings.value;
  if (!capability || !capabilityOff(s, capability)) return null;
  return s!.capabilities.includes(capability) ? "features" : "template";
}
const OFF_TEXT = { template: "not offered by this Project's Template.", features: "turned off in" } as const;
const featuresLink = computed(() => sectionLocation(project.value.id, "features"));

const listOf = (surfaces: SurfaceName[]) => {
  const names = surfaces.map((s) => SURFACE_LABELS[s]);
  return names.length > 1 ? `${names.slice(0, -1).join(", ")} or ${names[names.length - 1]}` : names[0];
};

/** Why a type cannot be added: its capability is off, or no enabled surface can run it. */
function unavailable(type: TriggerType): string | null {
  const off = switchedOff(type);
  if (off) return `${TRIGGER_LABELS[type]}: ${OFF_TEXT[off]}`;
  const enabled = enabledSurfaces.value;
  if (!enabled || TRIGGER_SURFACES[type].some((s) => enabled.has(s))) return null;
  return `${TRIGGER_LABELS[type]}: needs the ${listOf(TRIGGER_SURFACES[type])} surface, which is not enabled.`;
}
const unavailableReasons = computed(() =>
  ADDABLE.flatMap((type) => {
    const text = unavailable(type);
    const off = switchedOff(type);
    return text ? [{ text, link: off === "features" ? "features" : off ? null : "surfaces" }] : [];
  }),
);

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

const TYPE_ICON = { BEACON: Bluetooth, GEO_PROXIMITY: MapPin, QR_CODE: QrCode } as const;
/** Short name of a row for buttons and announcements: "QR code 2 of 3" when there are several of the type. */
function rowName(t: TriggerForm): string {
  const same = props.triggers.filter((x) => x.type === t.type);
  return same.length > 1 ? `${TRIGGER_LABELS[t.type]} ${same.indexOf(t) + 1}` : TRIGGER_LABELS[t.type];
}

/** Removes a row after a confirmation, then moves focus to the next row (or the one before, or the Add buttons) and says so. */
async function remove(index: number) {
  const t = props.triggers[index];
  const name = rowName(t);
  const ok = await askConfirm({
    title: `Remove ${name}?`,
    body: t.type === "QR_CODE" && t.savedCode
      ? `Printed copies of the code ${t.savedCode} will stop opening this item once you save. Nothing is removed until you save.`
      : "Nothing is removed until you save.",
    confirmLabel: `Remove ${name}`,
    cancelLabel: "Keep it",
    danger: true,
  });
  if (!ok) return;
  props.triggers.splice(index, 1);
  say(`${name} removed. It is deleted when you save.`);
  await nextTick();
  const rows = card.value?.querySelectorAll<HTMLElement>("[data-trigger-row] [data-remove]");
  const next = rows?.[Math.min(index, (rows?.length ?? 0) - 1)];
  (next ?? card.value?.querySelector<HTMLElement>("[data-add-trigger]"))?.focus();
}

/** The Preview, where the row can be fired; a saved row is named in the query so the page can pick it. */
function previewTo(t: TriggerForm) {
  return { name: "preview", params: { projectId: project.value.id }, query: t.id ? { trigger: t.id } : {} };
}

/** Which rows are QR codes the card cannot show an image for because the Project has no public web address. */
const needsAddress = computed(() => publicBaseUrl.value === "" && props.triggers.some((t) => t.type === "QR_CODE"));
const surfacesLink = computed(() => ({ name: "project-surfaces", params: { projectId: project.value.id } }));

function usePosition(t: TriggerForm) {
  if (!props.position) return;
  t.latitude = props.position.latitude;
  t.longitude = props.position.longitude;
}

/**
 * Coordinate errors found on leaving a field, before any save (C2-69), by row key and axis. The editor's own error (from
 * Save) wins; typing in the field clears this one.
 */
const live = reactive<Record<string, string>>({});
function checkCoordinate(t: TriggerForm, axis: "latitude" | "longitude") {
  const key = `${t.key}.${axis}`;
  const value = parseDecimal(t[axis]);
  // A decimal comma that was accepted is shown as the point the API uses.
  if (value !== null && t[axis].includes(",")) t[axis] = String(value);
  const message = triggerCoordinateError(t, axis);
  if (message) {
    live[key] = message;
    say(`${rowName(t)}, ${axis}: ${message}`);
  } else {
    delete live[key];
    // The other axis may have been waiting for this one.
    const otherKey = `${t.key}.${axis === "latitude" ? "longitude" : "latitude"}`;
    if (live[otherKey] && !triggerCoordinateError(t, axis === "latitude" ? "longitude" : "latitude")) delete live[otherKey];
  }
}
/** Typing in a field takes its blur error away; it is checked again on leaving. */
const clearLive = (t: TriggerForm, axis: "latitude" | "longitude") => delete live[`${t.key}.${axis}`];
const err = (i: number, field: string) =>
  props.fieldError(`triggers[${i}].${field}`) ?? (field === "latitude" || field === "longitude" ? live[`${props.triggers[i]?.key}.${field}`] : undefined);
const FIELDS = ["code", "uuid", "major", "minor", "proximityMeters", "cooldownSeconds", "latitude", "longitude", "radiusMeters", "supportedSurfaces"];
const rowError = (i: number) => props.fieldError(`triggers[${i}]`);
const path = (i: number, field: string) => `triggers[${i}].${field}`;

/**
 * Saved rows are one line (type, summary, actions) and open with Edit (C3-30): three saved ways in used to be 240-330 px
 * each. The keys of the rows the author opened; a new row, a row with an error and a row that failed to save stay open.
 */
const opened = reactive(new Set<string>());
const hasProblem = (i: number) => !!props.triggers[i]?.problem || !!rowError(i) || FIELDS.some((f) => err(i, f));
/** A row can be folded away only when it is saved and nothing in it needs the author. */
const collapsible = (t: TriggerForm, i: number) => !!t.id && !hasProblem(i);
const isOpen = (t: TriggerForm, i: number) => !collapsible(t, i) || opened.has(t.key);
function toggle(t: TriggerForm) {
  if (opened.has(t.key)) opened.delete(t.key);
  else opened.add(t.key);
}
/** A failed row's sentence goes when its row is edited: it described the values that were sent. */
watch(
  () => props.triggers.map((t) => JSON.stringify({ ...t, problem: null })),
  (now, before) => {
    now.forEach((json, i) => {
      const t = props.triggers[i];
      if (t?.problem && before[i] !== undefined && before[i] !== json && props.triggers.length === before.length) t.problem = null;
    });
  },
);

const shortUuid = (uuid: string) => (uuid.length > 13 ? `${uuid.slice(0, 8)}…${uuid.slice(-4)}` : uuid);
/** What the collapsed row says: the QR code, the beacon's UUID and numbers, the area's centre and radius. */
function summaryOf(t: TriggerForm): string {
  const parts: string[] = [];
  if (t.type === "QR_CODE") parts.push(t.code.trim() || "Code generated on save");
  else if (t.type === "BEACON") parts.push(shortUuid(t.uuid.trim()), `${t.major}/${t.minor}`, `${t.proximityMeters} m`);
  else parts.push(`${t.latitude}, ${t.longitude}`, `${t.radiusMeters} m radius`);
  if (t.surfaces) parts.push(`${listOf(t.surfaces)} only`);
  return parts.join(" · ");
}

/** One short summary of what is wrong in a row beyond its fields, for the line under the row. */
const rowProblems = (i: number) => [rowError(i), err(i, "supportedSurfaces")].filter((m): m is string => !!m);
</script>

<template>
  <EditorSection
    id="triggers"
    title="How visitors reach it"
    :count="triggers.length ? `${triggers.length} way${triggers.length === 1 ? '' : 's'}` : 'Browsing only'"
  >
    <div ref="card" tabindex="-1" class="flex flex-col gap-4 outline-none">
      <Alert v-if="needsAddress" tone="warning" title="No QR image yet: the visitor app has no public web address">
        A QR code needs an address to open. The codes are kept and get their image once the address is set; until then you can test them in the Preview.
        <template #actions>
          <Button variant="secondary" size="sm" as-child><RouterLink :to="surfacesLink">Set the web address</RouterLink></Button>
        </template>
      </Alert>

      <p v-if="!triggers.length && !readonly" id="triggers-empty" class="m-0 text-sm text-muted-foreground">Visitors browse to it. Add a way to open it in place:</p>
      <p v-else-if="!triggers.length" class="m-0 text-sm text-muted-foreground">Visitors can only reach this by browsing.</p>

      <ul v-else class="flex flex-col gap-4">
        <li v-for="(t, i) in triggers" :key="t.key" data-trigger-row :data-open="isOpen(t, i) || undefined" class="rounded-md border border-border">
          <div class="flex flex-wrap items-center gap-x-2 gap-y-1 px-3 py-2">
            <Chip :tone="t.type === 'BEACON' ? 'info' : t.type === 'GEO_PROXIMITY' ? 'success' : 'neutral'">
              <component :is="TYPE_ICON[t.type]" aria-hidden="true" />{{ TRIGGER_LABELS[t.type] }}
            </Chip>
            <Chip v-if="unreachable(t)" tone="warning"><TriangleAlert aria-hidden="true" />Not enabled</Chip>
            <span v-if="!isOpen(t, i)" class="min-w-0 flex-1 truncate font-mono text-compact text-ink-2" :title="summaryOf(t)">{{ summaryOf(t) }}</span>
            <div class="ml-auto flex shrink-0 items-center gap-1">
              <Button
                v-if="collapsible(t, i)"
                variant="ghost"
                size="sm"
                type="button"
                :aria-expanded="isOpen(t, i)"
                :aria-controls="`${t.key}-body`"
                :aria-label="`${isOpen(t, i) ? 'Done with' : readonly ? 'Details of' : 'Edit'} ${rowName(t)}`"
                @click="toggle(t)"
              >
                <component :is="isOpen(t, i) ? ChevronDown : Pencil" aria-hidden="true" />{{ isOpen(t, i) ? "Done" : readonly ? "Details" : "Edit" }}
              </Button>
              <Button variant="ghost" size="sm" as-child>
                <RouterLink :to="previewTo(t)" :aria-label="`Test in preview for ${rowName(t)}`">
                  <FlaskConical aria-hidden="true" />Test
                </RouterLink>
              </Button>
              <Button v-if="!readonly" variant="ghost" size="sm" class="text-destructive" type="button" data-remove :aria-label="`Remove ${rowName(t)}`" @click="remove(i)">
                <Trash2 aria-hidden="true" />Remove
              </Button>
            </div>
            <p v-if="t.problem" class="m-0 flex w-full items-start gap-1.5 text-xs font-medium text-destructive" data-trigger-problem>
              <CircleAlert class="mt-px size-4 shrink-0" aria-hidden="true" />
              <span>Not saved: {{ t.problem }} Save again to retry this {{ TRIGGER_LABELS[t.type].toLowerCase() }}; the rest is saved.</span>
            </p>
          </div>

          <div v-if="isOpen(t, i)" :id="`${t.key}-body`" class="flex flex-col gap-3 border-t border-border p-4">
          <!-- Beacon: the UUID on a row of its own, then the four numbers -->
          <div v-if="t.type === 'BEACON'" class="grid grid-cols-2 gap-x-3 gap-y-3 sm:grid-cols-4">
            <FormField :id="`${t.key}-uuid`" label="UUID" :error="err(i, 'uuid')" class="col-span-2 sm:col-span-4" v-slot="f">
              <Input :id="f.id" v-model="t.uuid" :readonly="readonly" :data-path="path(i, 'uuid')" :aria-describedby="f.describedBy" :invalid="f.invalid" spellcheck="false" placeholder="e.g. e2c56db5-dffb-48d2-b060-d0f5a71096e0" class="font-mono text-compact" />
            </FormField>
            <FormField :id="`${t.key}-major`" label="Major" :error="err(i, 'major')" v-slot="f">
              <Input :id="f.id" v-model="t.major" :readonly="readonly" :data-path="path(i, 'major')" :aria-describedby="f.describedBy" :invalid="f.invalid" inputmode="numeric" placeholder="e.g. 100" class="font-mono text-compact" />
            </FormField>
            <FormField :id="`${t.key}-minor`" label="Minor" :error="err(i, 'minor')" v-slot="f">
              <Input :id="f.id" v-model="t.minor" :readonly="readonly" :data-path="path(i, 'minor')" :aria-describedby="f.describedBy" :invalid="f.invalid" inputmode="numeric" placeholder="e.g. 100" class="font-mono text-compact" />
            </FormField>
            <FormField :id="`${t.key}-radius`" label="Suggest within (m)" :error="err(i, 'proximityMeters')" v-slot="f">
              <Input :id="f.id" v-model="t.proximityMeters" :readonly="readonly" :data-path="path(i, 'proximityMeters')" :aria-describedby="f.describedBy" :invalid="f.invalid" inputmode="decimal" class="font-mono text-compact" />
            </FormField>
            <FormField :id="`${t.key}-wait`" label="Wait (s)" :error="err(i, 'cooldownSeconds')" v-slot="f">
              <Input :id="f.id" v-model="t.cooldownSeconds" :readonly="readonly" :data-path="path(i, 'cooldownSeconds')" :aria-describedby="f.describedBy" :invalid="f.invalid" inputmode="numeric" class="font-mono text-compact" />
            </FormField>
          </div>
          <p v-if="t.type === 'BEACON'" class="text-xs text-muted-foreground">
            Mobile app only: a beacon works while the app is open. Wait is how long before the app suggests it again. Until a beacon plugin is chosen, the app offers the item as an ordinary link.
          </p>

          <!-- Geo-proximity -->
          <template v-else-if="t.type === 'GEO_PROXIMITY'">
            <div class="grid grid-cols-2 gap-x-3 gap-y-3 sm:grid-cols-4">
              <FormField :id="`${t.key}-lat`" label="Latitude" :error="err(i, 'latitude')" v-slot="f">
                <Input :id="f.id" v-model="t.latitude" :readonly="readonly" :data-path="path(i, 'latitude')" :aria-describedby="f.describedBy" :invalid="f.invalid" inputmode="decimal" placeholder="e.g. 37.9715" class="font-mono text-compact" @input="clearLive(t, 'latitude')" @blur="checkCoordinate(t, 'latitude')" />
              </FormField>
              <FormField :id="`${t.key}-lng`" label="Longitude" :error="err(i, 'longitude')" v-slot="f">
                <Input :id="f.id" v-model="t.longitude" :readonly="readonly" :data-path="path(i, 'longitude')" :aria-describedby="f.describedBy" :invalid="f.invalid" inputmode="decimal" placeholder="e.g. 23.7257" class="font-mono text-compact" @input="clearLive(t, 'longitude')" @blur="checkCoordinate(t, 'longitude')" />
              </FormField>
              <FormField :id="`${t.key}-area`" label="Radius (m)" :error="err(i, 'radiusMeters')" v-slot="f">
                <Input :id="f.id" v-model="t.radiusMeters" :readonly="readonly" :data-path="path(i, 'radiusMeters')" :aria-describedby="f.describedBy" :invalid="f.invalid" inputmode="numeric" class="font-mono text-compact" />
              </FormField>
              <FormField :id="`${t.key}-wait`" label="Wait (s)" :error="err(i, 'cooldownSeconds')" v-slot="f">
                <Input :id="f.id" v-model="t.cooldownSeconds" :readonly="readonly" :data-path="path(i, 'cooldownSeconds')" :aria-describedby="f.describedBy" :invalid="f.invalid" inputmode="numeric" class="font-mono text-compact" />
              </FormField>
            </div>
            <div class="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <Button v-if="!readonly && position && position.latitude && position.longitude" variant="link" size="sm" type="button" @click="usePosition(t)">
                {{ positionLabel ?? "Use this position" }}
              </Button>
              <span>Suggested while the app is open and the visitor is inside the area; Wait is how long before it is suggested again.</span>
            </div>
          </template>

          <!-- QR code: the code, then the block that is always there -->
          <template v-else>
            <FormField :id="`${t.key}-code`" label="Code" :hint="t.code.trim() ? undefined : 'Leave empty to get a generated code when you save'" :error="err(i, 'code')" class="max-w-md" v-slot="f">
              <Input :id="f.id" v-model="t.code" :readonly="readonly" :data-path="path(i, 'code')" :aria-describedby="f.describedBy" :invalid="f.invalid" spellcheck="false" placeholder="e.g. K7F2A9QX" class="font-mono text-compact" />
            </FormField>
            <BackendQrCode v-if="hasBackendImage(t)" :project-id="project.id" :trigger-id="t.id!" :code="t.code.trim()" :runtime-url="t.runtimeUrl!" />
            <QrCodePreview
              v-else
              :url="null"
              :code="t.code.trim()"
              :image-src="null"
              :reason="publicBaseUrl === ''
                ? 'The QR image needs the app\'s public web address.'
                : t.id && t.code.trim() !== (t.savedCode ?? '')
                  ? 'Save to get the QR image for the changed code.'
                  : 'Save to get the code and its QR image.'"
            >
              <RouterLink v-if="publicBaseUrl === ''" :to="surfacesLink" class="text-sm font-semibold">Set the web address in App settings, Surfaces</RouterLink>
            </QrCodePreview>
          </template>

          <fieldset v-if="TRIGGER_SURFACES[t.type].length > 1" class="m-0 flex min-w-0 flex-wrap items-center gap-x-4 gap-y-1 border-0 p-0 text-sm">
            <legend class="float-left mr-3 p-0 font-semibold text-ink-2">Runs on</legend>
            <label v-for="s in TRIGGER_SURFACES[t.type]" :key="s" class="flex min-h-control items-center gap-2">
              <input
                type="checkbox"
                class="size-4"
                :checked="runsOn(t).includes(s)"
                :disabled="readonly || (runsOn(t).length === 1 && runsOn(t).includes(s))"
                @change="toggleSurface(t, s, ($event.target as HTMLInputElement).checked)"
              />
              {{ SURFACE_LABELS[s] }}<span v-if="enabledSurfaces && !enabledSurfaces.has(s)" class="text-muted-foreground">(not enabled)</span>
            </label>
          </fieldset>

          <p v-if="switchedOff(t.type)" class="flex items-start gap-1.5 text-xs font-medium text-warning">
            <TriangleAlert class="mt-px size-4 shrink-0" aria-hidden="true" />
            <span>
              Visitors cannot use it: {{ TRIGGER_LABELS[t.type] }} is {{ OFF_TEXT[switchedOff(t.type)!] }}
              <RouterLink v-if="switchedOff(t.type) === 'features'" :to="featuresLink">App settings, Features</RouterLink>
            </span>
          </p>
          <p v-else-if="unreachable(t)" class="flex items-start gap-1.5 text-xs font-medium text-warning">
            <TriangleAlert class="mt-px size-4 shrink-0" aria-hidden="true" />
            <span>None of the surfaces it runs on is enabled, so visitors cannot use it. Enable one in <RouterLink :to="surfacesLink">App settings, Surfaces</RouterLink>.</span>
          </p>
          <p v-for="m in rowProblems(i)" :key="m" class="text-xs font-medium text-destructive" role="alert">{{ m }}</p>
          </div>
        </li>
      </ul>

      <div v-if="!readonly" class="flex flex-wrap items-center gap-2" role="group" aria-label="Add a way to reach it" :aria-describedby="triggers.length ? undefined : 'triggers-empty'">
        <Button
          v-for="type in ADDABLE"
          :key="type"
          variant="secondary"
          size="sm"
          type="button"
          data-add-trigger
          :disabled-reason="unavailable(type) ?? undefined"
          @click="add(type)"
        >
          <Plus aria-hidden="true" /><span class="sr-only">Add </span>{{ ADD_LABEL[type] }}<span v-if="type === 'BEACON'" class="sr-only"> (Bluetooth)</span>
        </Button>
        <Button variant="secondary" size="sm" type="button" disabled-reason="Camera recognition is not part of the first release"><Plus aria-hidden="true" />AR scan<span class="sr-only"> target</span></Button>
        <HelpHint label="Why is AR scan target not available?">Camera recognition is deferred and not part of the first release.</HelpHint>
      </div>
      <ul v-if="!readonly && unavailableReasons.length" class="flex flex-col gap-1 text-xs text-muted-foreground">
        <li v-for="reason in unavailableReasons" :key="reason.text">
          {{ reason.text }}
          <RouterLink v-if="reason.link === 'features'" :to="featuresLink">App settings, Features</RouterLink>
          <RouterLink v-else-if="reason.link === 'surfaces'" :to="surfacesLink">App settings, Surfaces</RouterLink>
        </li>
      </ul>
    </div>
  </EditorSection>
</template>
