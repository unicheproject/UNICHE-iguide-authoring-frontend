<script setup lang="ts">
/**
 * The one banner for readiness, restore notices, offline state and error cards (D-078): tint fill, 1 px border at 30 %
 * of the ink, a role icon, an optional title, the body (default slot), actions (slot) and an optional request id.
 * No coloured side stripe. `danger` and `warning` are announced as alerts, the others as status.
 */
import { CircleAlert, CircleCheck, Info, TriangleAlert } from "lucide-vue-next";
import { computed, type Component, type HTMLAttributes } from "vue";
import { cn } from "@/lib/utils";
import RequestIdRow from "./RequestIdRow.vue";

const props = withDefaults(
  defineProps<{
    tone?: "info" | "success" | "warning" | "danger";
    title?: string;
    requestId?: string | null;
    /** Overrides the live-region role (a static notice on page load is `status`, not `alert`). */
    role?: "alert" | "status" | "none";
    class?: HTMLAttributes["class"];
  }>(),
  { tone: "info" },
);

const icons: Record<string, Component> = { info: Info, success: CircleCheck, warning: TriangleAlert, danger: CircleAlert };
const skin: Record<string, string> = {
  info: "border-info/30 bg-info-tint text-info",
  success: "border-success/30 bg-success-tint text-success",
  warning: "border-warning/30 bg-warning-tint text-warning",
  danger: "border-destructive/30 bg-destructive-tint text-destructive",
};
const liveRole = computed(() => props.role ?? (props.tone === "danger" || props.tone === "warning" ? "alert" : "status"));
</script>

<template>
  <div :role="liveRole === 'none' ? undefined : liveRole" :class="cn('flex gap-3 rounded-lg border px-4 py-3', skin[tone], props.class)">
    <component :is="icons[tone]" class="mt-0.5 size-5 shrink-0" aria-hidden="true" />
    <div class="min-w-0 flex-1 text-sm">
      <p v-if="title" class="font-bold">{{ title }}</p>
      <div class="text-foreground" :class="title && 'mt-0.5'"><slot /></div>
      <RequestIdRow v-if="requestId" :id="requestId" class="mt-1" />
      <div v-if="$slots.actions" class="mt-2 flex flex-wrap gap-2"><slot name="actions" /></div>
    </div>
  </div>
</template>
