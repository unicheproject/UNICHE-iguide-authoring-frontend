<script setup lang="ts">
/**
 * The Interaction Triggers of one list row as chips on their own line under its slug (spec 12 section 3, Content
 * library), or a muted text when it has none, such as "No trigger, only reachable by browsing" for a Point of Interest.
 * At most two chips show, then one "+N" chip whose title and screen-reader text list the rest (D-110, C3-43): the line
 * never grows past one row or overprints the next column. Each chip has a drawn icon for its type (QR code, beacon,
 * geo) and its label; a DRAFT trigger is an outline chip with "(draft)" in words (D-070). With `unavailable` (the read
 * failed) the line says "Triggers not loaded" instead of vanishing (C3-87).
 */
import { Bluetooth, MapPin, QrCode } from "lucide-vue-next";
import { computed, type Component } from "vue";
import { Chip } from "@/components/ui/chip";
import { TRIGGER_LABELS, triggerLabel, type Trigger, type TriggerType } from "@/platform/triggers";

const props = defineProps<{
  triggers: Trigger[];
  /** Shown when there are no triggers; nothing is shown when absent. */
  emptyText?: string;
  /** The triggers could not be read: say so. */
  unavailable?: boolean;
}>();

/** Chips shown before "+N". */
const SHOWN = 2;
const ICONS: Record<TriggerType, Component> = { QR_CODE: QrCode, BEACON: Bluetooth, GEO_PROXIMITY: MapPin };

const shown = computed(() => props.triggers.slice(0, SHOWN));
const rest = computed(() => props.triggers.slice(SHOWN));
const describe = (t: Trigger) => `${TRIGGER_LABELS[t.triggerType]}${t.status === "DRAFT" ? " (draft)" : ""}: ${triggerLabel(t)}`;
const restText = computed(() => rest.value.map(describe).join("; "));
</script>

<template>
  <p v-if="unavailable" class="mt-1 block text-xs text-muted-foreground">Triggers not loaded</p>
  <ul v-else-if="triggers.length" class="m-0 mt-1 flex w-full min-w-0 list-none flex-wrap gap-1 p-0">
    <li v-for="t in shown" :key="t.id" class="min-w-0 max-w-full">
      <Chip
        :tone="t.status === 'DRAFT' ? 'outline' : 'neutral'"
        :icon="ICONS[t.triggerType]"
        :title="`${TRIGGER_LABELS[t.triggerType]}${t.status === 'DRAFT' ? ' (draft)' : ''}`"
        class="max-w-full"
      >
        <span class="min-w-0 truncate">{{ triggerLabel(t) }}<template v-if="t.status === 'DRAFT'">&nbsp;(draft)</template></span>
      </Chip>
    </li>
    <li v-if="rest.length">
      <Chip tone="outline" :title="restText">+{{ rest.length }}<span class="sr-only"> more: {{ restText }}</span></Chip>
    </li>
  </ul>
  <p v-else-if="emptyText" class="mt-0.5 block text-xs text-muted-foreground">{{ emptyText }}</p>
</template>
