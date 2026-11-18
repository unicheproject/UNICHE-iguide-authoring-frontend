<script lang="ts">
const openDialogs: symbol[] = [];
</script>

<script setup lang="ts">
/**
 * Modal dialog (D-078). Sizes `sm` 28 rem, `md` 36, `lg` 52, `xl` 64 (`width` still sets an exact max width for older
 * callers). A header with the title and a close button, a body that scrolls, and a footer (slot `actions`) that stays
 * visible so Cancel and Create are reachable at 200 % zoom. Focus moves to the first visible field of the body (never a
 * visually hidden input), or to the heading when there is none (a confirmation), stays inside while it is open (Tab
 * wraps), and returns to the opener on close, or to the control that opened the menu the dialog came from, or to the
 * page (`restoreFocus`), never to `<body>`; Escape and the backdrop close it unless `busy`. A dialog opened over another sits one layer higher, and
 * only the top one answers Escape; an open menu or popover takes the Escape first.
 *
 * Round 3 (D-100..D-106, C3-92/93/94): the Close button comes first in the DOM, so it is the first Tab stop in every
 * dialog, and is placed last on the line with `order` (the visual position is unchanged). The panel's top edge is
 * anchored (the dialog grows downwards), so an error summary appearing does not move it. In a short window the footer
 * is sticky at the foot of the scrolling body, so the primary action is on screen without scrolling.
 */
import { X } from "lucide-vue-next";
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from "vue";
import { firstVisibleField, restoreFocus } from "@/lib/focus";

const props = withDefaults(
  defineProps<{
    title: string;
    size?: "sm" | "md" | "lg" | "xl";
    /** An exact max width (CSS length); overrides `size`. */
    width?: string;
    busy?: boolean;
    /** No close button (a dialog whose only way on is its action). */
    hideClose?: boolean;
    /** On a short viewport (under 600 px high, 200 % zoom) the footer scrolls with the body instead of taking a band; false keeps it fixed. */
    inlineFooterWhenShort?: boolean;
    /** The control focus returns to on close, when the caller knows it better than the element focused at mount. */
    returnFocusTo?: HTMLElement | null;
  }>(),
  {
    size: "md",
    width: undefined,
    busy: false,
    hideClose: false,
    inlineFooterWhenShort: true,
    returnFocusTo: null,
  },
);
const emit = defineEmits<{ close: [] }>();

// A short viewport keeps the body, not a header and footer band, in view (C2: the Asset picker showed under 4 rows).
const shortQuery = typeof window !== "undefined" ? window.matchMedia("(max-height: 599px)") : null;
const short = ref(shortQuery?.matches ?? false);
const onShort = (e: MediaQueryListEvent) => (short.value = e.matches);
const inlineFooter = computed(() => props.inlineFooterWhenShort && short.value);
onMounted(() => shortQuery?.addEventListener("change", onShort));
onBeforeUnmount(() => shortQuery?.removeEventListener("change", onShort));

const SIZES = { sm: "28rem", md: "36rem", lg: "52rem", xl: "64rem" } as const;
const maxWidth = computed(() => props.width ?? SIZES[props.size]);
// Depth at mount: a confirmation opened over another dialog is one layer higher.
const over = openDialogs.length > 0;

const panel = ref<HTMLElement | null>(null);
const heading = ref<HTMLElement | null>(null);
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
  if (event.key === "Escape") {
    // An open menu, listbox or popover closes first.
    if (!event.defaultPrevented && !document.querySelector("[data-radix-popper-content-wrapper]")) close();
    return;
  }
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
 * The control focus returns to. A dialog opened from a menu or popover item would otherwise remember the item, which
 * leaves with its menu; then the control that is still expanded (the menu's trigger) is the opener.
 */
function findOpener(): HTMLElement | null {
  const active = document.activeElement instanceof HTMLElement && document.activeElement !== document.body ? document.activeElement : null;
  if (active && !active.closest("[data-radix-popper-content-wrapper]")) return active;
  return document.querySelector<HTMLElement>('[aria-expanded="true"]') ?? active;
}

/** Focus is inside the panel. */
function holdsFocus(): boolean {
  return !!panel.value?.contains(document.activeElement);
}

function focusInitial() {
  if (!panel.value) return;
  const field = firstVisibleField(panel.value.querySelector("[data-dialog-body]") ?? panel.value);
  (field ?? heading.value ?? panel.value).focus();
}

onMounted(async () => {
  opener = props.returnFocusTo ?? findOpener();
  openDialogs.push(token);
  document.addEventListener("keydown", onKeydown);
  await nextTick();
  focusInitial();
  // A menu or popover that opened this dialog hands focus back to its trigger as it closes; take it back (C2-18).
  requestAnimationFrame(() => {
    if (panel.value && !holdsFocus()) focusInitial();
  });
});

onBeforeUnmount(() => {
  openDialogs.splice(openDialogs.indexOf(token), 1);
  document.removeEventListener("keydown", onKeydown);
  restoreFocus(opener);
});
</script>

<template>
  <Teleport to="body">
    <div
      class="fixed inset-0 flex items-start justify-center overflow-y-auto bg-scrim p-4 animate-fade-in sm:p-6"
      :class="over ? 'z-modal-over' : 'z-modal'"
      @click.self="close"
    >
      <div
        ref="panel"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="titleId"
        tabindex="-1"
        class="mt-[min(8dvh,4rem)] flex max-h-[calc(100dvh-min(8dvh,4rem)-2rem)] w-full flex-col rounded-lg border border-transparent bg-card shadow-3 animate-rise-in [@media(max-height:599px)]:mt-0 [@media(max-height:599px)]:max-h-[calc(100dvh-2rem)]"
        :style="{ maxWidth }"
      >
        <div class="flex flex-none items-center gap-3 px-6 pb-2 pt-5 [@media(max-height:599px)]:pt-3">
          <button
            v-if="!hideClose"
            type="button"
            class="order-2 -mr-2 inline-flex size-control flex-none items-center justify-center rounded-md text-muted-foreground hover:bg-surface-hover hover:text-foreground aria-disabled:opacity-60"
            aria-label="Close dialog"
            :aria-disabled="busy ? 'true' : undefined"
            @click="close"
          >
            <X class="size-5" aria-hidden="true" />
          </button>
          <h2 :id="titleId" ref="heading" tabindex="-1" class="order-1 min-w-0 flex-1 py-1 text-base font-bold">{{ title }}</h2>
        </div>
        <div data-dialog-body class="min-h-0 flex-1 overflow-y-auto px-6 pb-4 pt-2 text-sm">
          <slot />
          <footer v-if="$slots.actions && inlineFooter" class="sticky bottom-0 -mx-6 -mb-4 mt-4 flex flex-wrap justify-end gap-2 border-t border-border bg-card px-6 py-3">
            <slot name="actions" />
          </footer>
        </div>
        <footer v-if="$slots.actions && !inlineFooter" class="flex flex-none flex-wrap justify-end gap-2 border-t border-border px-6 py-4">
          <slot name="actions" />
        </footer>
        <div v-if="!$slots.actions" class="h-4 flex-none"></div>
      </div>
    </div>
  </Teleport>
</template>

