<script setup lang="ts">
/**
 * The toast stack (D-078): up to three white cards bottom right, role icon and role-coloured title, optional body and
 * request id (with copy), a dismiss button. Success and info use `role="status"`, warnings `role="alert"`; an error is
 * announced once through the assertive live region (`say`), so its toast has no role of its own. Identical toasts
 * collapse with a count ("x3"). The stack sits above a sticky footer through `--toast-offset-bottom`. In a wide editor it
 * docks over the side column (same right edge and width, `useToastDock`) so it never covers the form; below 1180 px an
 * editor gets a full-width stack with a 16 px gutter. Neutral confirmations (Discarded, Archived, Link copied) use the
 * check icon. Timers pause while a toast is hovered or focused; errors stay until dismissed. Dismissing a focused toast
 * hands focus to its successor (D-103); a route change clears stale toasts (D-102).
 */
import { CircleAlert, CircleCheck, Info, TriangleAlert, X } from "lucide-vue-next";
import { computed, nextTick, watch, type Component } from "vue";
import RequestIdRow from "@/components/ui/alert/RequestIdRow.vue";
import { focusSuccessor } from "@/lib/focus";
import { toastDock, useToastDock } from "@/lib/toastOffset";
import { dismissToast, pauseToast, resumeToast, toastState, type ToastTone } from "@/stores/toast";

const icons: Record<ToastTone, Component> = { success: CircleCheck, neutral: CircleCheck, warning: TriangleAlert, error: CircleAlert, info: Info };
const ink: Record<ToastTone, string> = { success: "text-success", neutral: "text-foreground", warning: "text-warning", error: "text-destructive", info: "text-info" };

const { measure } = useToastDock();
// The side column can move while toasts are up (route change, resize): measure when the stack changes.
watch(() => toastState.items.length, () => nextTick(measure), { immediate: true });
const stackStyle = computed(() => {
  const bottom = "calc(1rem + var(--toast-offset-bottom, 0px))";
  if (toastDock.mode === "side") return { bottom, right: `${toastDock.right}px`, width: `${toastDock.width}px` };
  return { bottom, right: "var(--toast-inset-right, 1.5rem)" };
});
const stackClass = computed(() =>
  toastDock.mode === "side" ? "" : toastDock.mode === "full" ? "inset-x-4" : "inset-x-4 sm:inset-x-auto",
);

/** A toast with a title only is one line (40 px high with a 32 px dismiss button; "Link copied", D-102). */
const oneLine = (toast: { body: string; requestId: string | null }) => !toast.body && !toast.requestId;

/** Dismisses a toast; when it holds focus, focus goes to the next toast action, else the previous, else the page heading. */
function dismiss(event: Event | null, id: number) {
  const toastEl = (event?.currentTarget as HTMLElement | null)?.closest<HTMLElement>("[data-toast]") ?? null;
  focusSuccessor(toastEl, ["main h1"]);
  dismissToast(id);
}
</script>

<template>
  <div
    data-focus-skip
    class="pointer-events-none fixed z-toast flex flex-col items-end gap-2"
    :class="stackClass"
    :style="stackStyle"
  >
    <div
      v-for="toast in toastState.items"
      :key="toast.id"
      :role="toast.tone === 'warning' ? 'alert' : toast.tone === 'error' ? undefined : 'status'"
      data-toast
      class="pointer-events-auto flex w-full gap-3 rounded-lg border border-border bg-card px-4 shadow-2 animate-rise-in"
      :class="[toastDock.mode === 'full' ? '' : 'max-w-sm', oneLine(toast) ? 'items-center py-1.5' : 'items-start py-3']"
      @mouseenter="pauseToast(toast.id)"
      @mouseleave="resumeToast(toast.id)"
      @focusin="pauseToast(toast.id)"
      @focusout="resumeToast(toast.id)"
    >
      <component :is="icons[toast.tone]" class="mt-0.5 size-5 flex-none" :class="ink[toast.tone]" aria-hidden="true" />
      <div class="min-w-0 flex-1">
        <strong class="block text-sm font-bold" :class="ink[toast.tone]">{{ toast.title }}<span v-if="toast.count > 1" class="ml-1 font-semibold text-muted-foreground"> x{{ toast.count }}</span></strong>
        <span v-if="toast.body" class="block text-sm text-ink-2">{{ toast.body }}</span>
        <RequestIdRow v-if="toast.requestId" :id="toast.requestId" compact class="mt-1" />
      </div>
      <button
        type="button"
        class="-mr-1 inline-flex flex-none items-center justify-center rounded-md text-muted-foreground hover:bg-surface-hover hover:text-foreground active:bg-surface-active"
        :class="oneLine(toast) ? 'size-8 [@media(pointer:coarse)]:size-11' : '-mt-1 size-control'"
        aria-label="Dismiss notification"
        @click="dismiss($event, toast.id)"
      >
        <X class="size-4" aria-hidden="true" />
      </button>
    </div>
  </div>
</template>
