<script setup lang="ts">
/**
 * Page head (D-073): the page's `h1` (20/700), the status chip, the Pending chip and the `#status` slot (the Dashboard's visitor-app line) on the same line, a muted subtitle
 * capped at 68 characters, and actions on the right (they wrap below on a narrow page). `section` (a section slug) adds
 * the notice shown when that capability is off for the Project. The `h1` takes focus after navigation.
 *
 * Offline (C3-86): while the CMS is offline, a primary or danger action in `#actions` is `aria-disabled` with the
 * offline reason in its description (it stays focusable); activating it announces the reason instead of failing
 * silently. An action that already states its own reason is left alone.
 */
import { nextTick, onMounted, onUpdated, ref, useId, watch } from "vue";
import CapabilityNotice from "@/components/CapabilityNotice.vue";
import StatusChip from "@/components/StatusChip.vue";
import { say } from "@/lib/announcer";
import { connection, offlineReason } from "@/stores/connection";

defineProps<{ title: string; subtitle?: string; subtitleClass?: string; status?: string; pending?: string; section?: string }>();

const actions = ref<HTMLElement | null>(null);
const reasonId = useId();
const MUTATING = "[data-variant=primary], [data-variant=danger]";
/** Marks the actions this component blocked, so it can undo only its own changes when the connection returns. */
const OWN = "data-offline-blocked";

function syncOffline() {
  const root = actions.value;
  if (!root) return;
  for (const el of root.querySelectorAll<HTMLElement>(MUTATING)) {
    if (connection.offline) {
      if (el.getAttribute("aria-disabled") === "true" && !el.hasAttribute(OWN)) continue;
      el.setAttribute("aria-disabled", "true");
      el.setAttribute(OWN, "");
      el.setAttribute("aria-describedby", reasonId);
      el.title = offlineReason() ?? "";
    } else if (el.hasAttribute(OWN)) {
      el.removeAttribute(OWN);
      el.removeAttribute("aria-disabled");
      el.removeAttribute("aria-describedby");
      el.removeAttribute("title");
    }
  }
}

/** Catches the click before the action's own handler or link navigation sees it. */
function onActionClick(event: MouseEvent) {
  if (!connection.offline || !(event.target instanceof Element)) return;
  if (!event.target.closest(`[${OWN}]`)) return;
  event.preventDefault();
  event.stopImmediatePropagation();
  say(offlineReason() ?? "You are offline.");
}

onMounted(syncOffline);
onUpdated(syncOffline);
watch(() => connection.offline, () => void nextTick(syncOffline));
</script>

<template>
  <div class="mb-6">
    <div class="flex flex-wrap items-start gap-x-5 gap-y-3">
      <div class="min-w-[min(100%,18rem)] flex-1">
        <div class="flex flex-wrap items-center gap-x-3 gap-y-1">
          <h1 tabindex="-1" class="min-w-0 text-lg font-bold">{{ title }}</h1>
          <StatusChip v-if="status" :status="status" />
          <StatusChip v-if="pending" status="PENDING" :label="pending" />
          <slot name="status" />
        </div>
        <p v-if="subtitle" class="mt-1 max-w-prose text-sm text-muted-foreground" :class="subtitleClass">{{ subtitle }}</p>
      </div>
      <div v-if="$slots.actions" ref="actions" class="flex flex-wrap items-center gap-2" @click.capture="onActionClick">
        <slot name="actions" />
        <span v-if="connection.offline" :id="reasonId" class="sr-only">{{ offlineReason() }}</span>
      </div>
    </div>
    <CapabilityNotice v-if="section" :section="section" class="mt-4" />
  </div>
</template>
