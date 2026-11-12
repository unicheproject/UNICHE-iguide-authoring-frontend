<script lang="ts">
const openDialogs: symbol[] = [];
</script>

<script setup lang="ts">
/**
 * Modal dialog of the CMS mockup. Focus moves into it on open, stays inside while it is open (Tab wraps), and goes
 * back to the opener on close; Escape and the backdrop close it unless `busy` (`14` §4, DECISIONS.md D-042).
 */
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from "vue";

const props = withDefaults(
  defineProps<{
    title: string;
    width?: string;
    busy?: boolean;
    /**
     * A pop-up card anchored below the control that opened it, as the prototype's "Preview in app" (D-059): no title
     * row (the content draws its own header and Close), `title` names it for assistive technology, a clear backdrop.
     */
    popover?: boolean;
  }>(),
  {
    width: "520px",
    busy: false,
    popover: false,
  },
);
const emit = defineEmits<{ close: [] }>();

const panel = ref<HTMLElement | null>(null);
// Open dialogs, newest last: a confirmation can open over another dialog, and only the top one answers Escape.
const token = Symbol("dialog");
const titleId = `dialog-${Math.random().toString(36).slice(2, 9)}`;
let opener: HTMLElement | null = null;

function close() {
  if (!props.busy) emit("close");
}

const FOCUSABLE = "a[href], input:not([disabled]):not([type=hidden]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), [tabindex]:not([tabindex='-1'])";

function onKeydown(event: KeyboardEvent) {
  if (openDialogs[openDialogs.length - 1] !== token) return;
  if (event.key === "Escape") close();
  if (event.key !== "Tab" || !panel.value) return;
  const focusable = [...panel.value.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((el) => el.offsetParent !== null);
  if (!focusable.length) {
    event.preventDefault();
    panel.value.focus();
    return;
  }
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  const inside = panel.value.contains(document.activeElement);
  if (event.shiftKey && (document.activeElement === first || !inside)) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && (document.activeElement === last || !inside)) {
    event.preventDefault();
    first.focus();
  }
}

/**
 * Where a `popover` sits: below its opener, right edges aligned, at most 560px wide and 16px clear of the window's
 * edges; kept on screen when the opener is low or scrolled away, and following it when the page scrolls.
 */
const place = ref({ top: 16, left: 16, width: 560, maxHeight: 600 });
const GUTTER = 16;
function placePopover() {
  const vw = document.documentElement.clientWidth;
  const vh = window.innerHeight;
  const width = Math.min(560, vw - 2 * GUTTER);
  const rect = opener?.getBoundingClientRect();
  const right = rect && rect.width ? rect.right : vw - GUTTER;
  const left = Math.min(Math.max(right - width, GUTTER), vw - GUTTER - width);
  const below = rect && rect.height ? rect.bottom + 8 : GUTTER;
  // Below the opener while at least 320px are left there; otherwise lifted so the card keeps a useful height.
  const top = below >= GUTTER && vh - GUTTER - below >= 320 ? below : Math.max(GUTTER, Math.min(below, vh - GUTTER - 520));
  place.value = { top, left, width, maxHeight: vh - top - GUTTER };
}
const popoverStyle = computed(() => ({
  top: `${place.value.top}px`,
  left: `${place.value.left}px`,
  width: `${place.value.width}px`,
  maxHeight: `${place.value.maxHeight}px`,
}));
let frame = 0;
function schedulePlace() {
  cancelAnimationFrame(frame);
  frame = requestAnimationFrame(placePopover);
}

onMounted(async () => {
  opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  openDialogs.push(token);
  document.addEventListener("keydown", onKeydown);
  if (props.popover) {
    placePopover();
    window.addEventListener("resize", schedulePlace);
    window.addEventListener("scroll", schedulePlace, true);
  }
  await nextTick();
  // A pop-up card starts in its content (the chosen tab, or the first field), not on Close.
  const first =
    (props.popover && panel.value?.querySelector<HTMLElement>("[data-dialog-body] [role=tab][aria-selected=true], [data-dialog-body] input, [data-dialog-body] button:not([disabled])")) ||
    panel.value?.querySelector<HTMLElement>("input, select, textarea, button:not([disabled])");
  (first ?? panel.value)?.focus();
});

/**
 * The pop-up card's clear backdrop only catches clicks (to close it); the mouse wheel over it scrolls whatever lies
 * underneath, such as the editor the card previews, and the card follows its button (DECISIONS.md D-066).
 */
function scrollUnderneath(event: WheelEvent) {
  const backdrop = event.currentTarget as HTMLElement;
  if (event.target !== backdrop) return;
  backdrop.style.pointerEvents = "none";
  let target = document.elementFromPoint(event.clientX, event.clientY) as HTMLElement | null;
  backdrop.style.pointerEvents = "";
  const vertical = Math.abs(event.deltaY) >= Math.abs(event.deltaX);
  const delta = vertical ? event.deltaY : event.deltaX;
  // The page moves, not a text box under the backdrop; an area already at its end hands the scroll to its parent.
  const scrolls = (el: HTMLElement) => {
    if (el.matches("textarea, input, select")) return false;
    const style = getComputedStyle(el);
    if (!/(auto|scroll)/.test(vertical ? style.overflowY : style.overflowX)) return false;
    const position = vertical ? el.scrollTop : el.scrollLeft;
    const room = vertical ? el.scrollHeight - el.clientHeight : el.scrollWidth - el.clientWidth;
    return delta > 0 ? position < room - 1 : position > 0;
  };
  while (target && !scrolls(target)) target = target.parentElement;
  // Line and page deltas (some mice, Firefox) become pixels.
  const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? window.innerHeight : 1;
  (target ?? document.scrollingElement)?.scrollBy({ top: event.deltaY * unit, left: event.deltaX * unit });
}

onBeforeUnmount(() => {
  openDialogs.splice(openDialogs.indexOf(token), 1);
  document.removeEventListener("keydown", onKeydown);
  window.removeEventListener("resize", schedulePlace);
  window.removeEventListener("scroll", schedulePlace, true);
  cancelAnimationFrame(frame);
  opener?.focus();
});
</script>

<template>
  <Teleport to="body">
    <div v-if="popover" class="fixed inset-0 z-50" @click.self="close" @wheel.passive="scrollUnderneath">
      <div
        ref="panel"
        role="dialog"
        aria-modal="true"
        :aria-label="title"
        tabindex="-1"
        data-dialog-body
        class="dialog-popover fixed overflow-y-auto overflow-x-hidden rounded-[10px] border bg-white shadow-[0_18px_44px_rgba(3,7,18,0.22)] focus:outline-none"
        :style="popoverStyle"
      >
        <slot />
      </div>
    </div>
    <div
      v-else
      class="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(3,7,18,0.45)] p-6"
      @click.self="close"
    >
      <div
        ref="panel"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="titleId"
        tabindex="-1"
        class="max-h-[82vh] w-full overflow-y-auto rounded-xl bg-white px-[26px] py-6 shadow-[0_16px_40px_rgba(0,0,0,0.12)] focus:outline-none"
        :style="{ maxWidth: width }"
      >
        <h2 :id="titleId" class="mb-2.5 text-[17px] font-extrabold">{{ title }}</h2>
        <slot />
        <div class="mt-4 flex flex-wrap justify-end gap-2.5">
          <slot name="actions" />
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
/* One short entrance from just below the opener; none when the author asks for reduced motion. */
@media (prefers-reduced-motion: no-preference) {
  .dialog-popover {
    animation: dialog-popover-in 160ms cubic-bezier(0.16, 1, 0.3, 1);
  }
}
@keyframes dialog-popover-in {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }
}
</style>
