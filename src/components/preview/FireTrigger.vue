<script setup lang="ts">
/**
 * "Fire a trigger" of the Preview (`12` §3, D-082): a labelled choice of the triggers a visitor on the chosen surface
 * could meet, grouped by type, each named by its type and target ("QR code, Acropolis"), an explicit Fire button, a
 * persistent "Fired: QR code, Acropolis" chip with Reset, and the reasons triggers are missing: drafts in Live mode,
 * beacons on Web and Kiosk. With more than eight choices a filter field narrows the list. `fireById` (exposed) chooses and
 * fires one trigger, for `/preview?trigger=` (C2-61). Reset moves focus back to the choice. The parent owns what firing
 * does; this component never changes data.
 */
import { RotateCcw, Zap } from "lucide-vue-next";
import { computed, nextTick, ref, watch } from "vue";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { Input } from "@/components/ui/input";
import { HelpHint } from "@/components/ui/help-hint";
import { Select } from "@/components/ui/select";
import { hints } from "@/lib/glossary";
import { TRIGGER_LABELS, type Trigger, type TriggerType } from "@/platform/triggers";
import type { PreviewMode } from "@/workspace/previewData";
import { SURFACES, triggerReaches, type Surface } from "./surfaces";

const props = defineProps<{
  /** Every trigger of the Project that is not archived, whatever its status. */
  triggers: Trigger[];
  surface: Surface;
  mode: PreviewMode;
  /** The name of what a trigger opens, in the previewed language. */
  targetName: (trigger: Trigger) => string;
  /** The label of the trigger last fired, or null while none is (the parent clears it when the view changes). */
  fired: string | null;
}>();
const emit = defineEmits<{ fire: [trigger: Trigger, label: string]; reset: [] }>();

const TYPE_ORDER: TriggerType[] = ["QR_CODE", "BEACON", "GEO_PROXIMITY"];
const GROUP_LABELS: Record<TriggerType, string> = { QR_CODE: "QR codes", BEACON: "Bluetooth beacons", GEO_PROXIMITY: "Geo-proximity areas" };

const inMode = computed(() => props.triggers.filter((t) => props.mode === "WORKING" || t.status === "ACTIVE"));
const hiddenDrafts = computed(() => props.triggers.length - inMode.value.length);
const unreachable = computed(() => inMode.value.filter((t) => !triggerReaches(t, props.surface)));
const offered = computed(() => inMode.value.filter((t) => triggerReaches(t, props.surface)));

/** A long target name is cut so an option stays a line long; the full name is in the preview itself. */
const shorten = (name: string) => (name.length > 40 ? `${name.slice(0, 39).trimEnd()}…` : name);

/** "QR code, Acropolis"; two triggers with the same label get their code so they can be told apart. */
const labels = computed(() => {
  const plain = new Map(offered.value.map((t) => [t.id, `${TRIGGER_LABELS[t.triggerType]}, ${shorten(props.targetName(t))}`]));
  const count = new Map<string, number>();
  for (const label of plain.values()) count.set(label, (count.get(label) ?? 0) + 1);
  return new Map(
    offered.value.map((t) => {
      const label = plain.get(t.id)!;
      return [t.id, (count.get(label) ?? 0) > 1 && t.code ? `${label} (${t.code})` : label] as const;
    }),
  );
});
const filter = ref("");
const filterable = computed(() => offered.value.length > 8);
const shown = computed(() => {
  const q = filterable.value ? filter.value.trim().toLowerCase() : "";
  return q ? offered.value.filter((t) => (labels.value.get(t.id) ?? "").toLowerCase().includes(q) || t.id === chosen.value) : offered.value;
});
const groups = computed(() =>
  TYPE_ORDER.map((type) => ({ type, items: shown.value.filter((t) => t.triggerType === type) })).filter((g) => g.items.length),
);

const chosen = ref("");
// A choice that the surface or mode no longer offers is dropped rather than left selected.
watch(offered, (list) => {
  if (!list.some((t) => t.id === chosen.value)) chosen.value = "";
});

function fire() {
  const trigger = offered.value.find((t) => t.id === chosen.value);
  if (trigger) emit("fire", trigger, labels.value.get(trigger.id)!);
}
/** Chooses the trigger and fires it; false when the current surface or mode does not offer it. */
function fireById(id: string): boolean {
  if (!offered.value.some((t) => t.id === id)) return false;
  chosen.value = id;
  fire();
  return true;
}
async function reset() {
  emit("reset");
  await nextTick();
  document.getElementById("fire-trigger")?.focus();
}
defineExpose({ fireById });

const notes = computed(() => {
  const list: string[] = [];
  if (hiddenDrafts.value) list.push(`${hiddenDrafts.value} draft trigger${hiddenDrafts.value === 1 ? " is" : "s are"} hidden in Live. Visitors only meet active ones.`);
  if (unreachable.value.length) {
    const beacons = unreachable.value.filter((t) => t.triggerType === "BEACON").length;
    list.push(
      beacons === unreachable.value.length
        ? `${beacons} beacon trigger${beacons === 1 ? "" : "s"} not offered: beacons only work on Mobile.`
        : `${unreachable.value.length} trigger${unreachable.value.length === 1 ? " is" : "s are"} not offered on ${SURFACES[props.surface].label}.`,
    );
  }
  return list;
});
const reason = computed(() => (offered.value.length ? "Choose a trigger first." : "No trigger to fire in this view."));
</script>

<template>
  <div class="flex min-w-0 flex-col gap-1">
    <div class="flex flex-wrap items-center gap-x-2 gap-y-1">
      <label for="fire-trigger" class="text-xs font-semibold text-ink-2">Fire a trigger</label>
      <HelpHint label="What does Fire a trigger do?" class="-mx-2">{{ hints.fireTrigger }}</HelpHint>
      <Input v-if="filterable" v-model="filter" type="search" aria-label="Filter triggers" placeholder="Filter…" class="w-36" />
      <!-- One width for the choice, so a long name or the chip never changes it (C3-66). -->
      <div class="w-72 max-w-full">
      <Select id="fire-trigger" v-model="chosen" :disabled="!offered.length" aria-describedby="fire-trigger-notes">
        <option value="">{{ offered.length ? "Choose a trigger…" : "No triggers to fire" }}</option>
        <optgroup v-for="g in groups" :key="g.type" :label="GROUP_LABELS[g.type]">
          <option v-for="t in g.items" :key="t.id" :value="t.id">{{ labels.get(t.id) }}</option>
        </optgroup>
      </Select>
      </div>
      <Button variant="secondary" :disabled-reason="chosen ? undefined : reason" @click="fire()"><Zap aria-hidden="true" />Fire</Button>
    </div>
    <!-- Its own row, always reserved: what was fired, or why triggers are missing. The picture below never moves. -->
    <div id="fire-trigger-notes" class="flex min-h-8 min-w-0 flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
      <template v-if="fired">
        <Chip tone="info" class="max-w-full truncate"><span class="truncate">Fired: {{ fired }}</span></Chip>
        <Button variant="ghost" size="sm" @click="reset"><RotateCcw aria-hidden="true" />Reset</Button>
      </template>
      <p v-for="note in notes" :key="note">{{ note }}</p>
      <p v-if="!notes.length && !offered.length">This Project has no triggers yet. Add one under "How visitors reach it" in an editor.</p>
    </div>
  </div>
</template>
