<script setup lang="ts">
/**
 * The inline "Preview in app" panel (D-075, D-113, `12` §3 "below the action"): it renders where it is placed, so it
 * pushes the content below it down and never covers the form. No focus trap, no inert background: the CMS chrome stays
 * operable while it is open. Focus moves into it when it opens; Escape (when nothing else claimed it) and the header's
 * Close emit `close`, and the owner returns focus to the action that opened it. The header holds the Surface tabs, Expand
 * and Close in one row (from `EditorShell`'s `EDITOR_PREVIEW`). Height is capped at 70 % of the window with its own scroll;
 * Expand raises the cap to the window minus what sticks above the content, lines the panel up under the sticky bars (the
 * picture stays in view), and is offered only when it would show clearly more than the collapsed panel does. The preview content is `ResourcePreview`.
 */
import { Maximize2, Minimize2, X } from "lucide-vue-next";
import { computed, inject, nextTick, onBeforeUnmount, onMounted, ref } from "vue";
import { EDITOR_PREVIEW } from "@/components/editor/EditorShell.vue";
import ResourcePreview from "@/components/editor/ResourcePreview.vue";
import { Button } from "@/components/ui/button";
import type { PreviewModel } from "@/workspace/preview";

defineOptions({ inheritAttrs: false });
defineProps<{
  model: PreviewModel;
  /** The form holds unsaved changes (the preview then says it shows them). */
  dirty: boolean;
}>();
const emit = defineEmits<{ close: [] }>();

const shell = inject(EDITOR_PREVIEW);
if (!shell) throw new Error("PreviewPanel must be rendered inside EditorShell (EDITOR_PREVIEW is not provided).");
const expanded = shell.expanded;

/** Expanding must show at least this many pixels more, or the control would do nothing the author can see. */
const MIN_GAIN = 48;
const panel = ref<HTMLElement | null>(null);
const overflows = ref(false);
const room = ref(0);
let observer: ResizeObserver | null = null;

/**
 * What sticks above the content, in pixels: the app header plus the editor's own sticky bars (`--sticky-stack-h`,
 * published by the editor shell, which does not count the app header).
 */
function stackHeight(): number {
  const raw = getComputedStyle(document.documentElement).getPropertyValue("--sticky-stack-h").trim();
  const bars = raw.endsWith("px") ? Number.parseFloat(raw) : 0;
  return (document.querySelector("header")?.getBoundingClientRect().height ?? 56) + bars;
}
/** The expanded cap: the window minus the sticky stack and a 16 px margin. */
const expandedCap = () => window.innerHeight - stackHeight() - 16;
/** The measured expanded cap, once the panel is lined up under the stack; the CSS cap is the fallback until then. */
const cap = ref<number | null>(null);
function measure() {
  const el = panel.value;
  if (!el || expanded.value) return;
  overflows.value = el.scrollHeight > el.clientHeight + 1;
  room.value = expandedCap() - el.clientHeight;
}
/** Expand is hidden while the panel fits or would grow by less than {@link MIN_GAIN}; Collapse is always there. */
const canExpand = computed(() => expanded.value || (overflows.value && room.value >= MIN_GAIN));
const maxHeight = computed(() => (expanded.value ? `${cap.value ?? expandedCap()}px` : "70dvh"));

function onKeydown(event: KeyboardEvent) {
  if (event.key !== "Escape" || event.defaultPrevented) return;
  // A dialog, menu, or popover that is open takes the Escape first.
  if (document.querySelector('[role="dialog"], [role="menu"], [data-state="open"][data-radix-popper-content-wrapper]')) return;
  event.preventDefault();
  emit("close");
}

onMounted(async () => {
  window.addEventListener("keydown", onKeydown);
  window.addEventListener("resize", measure);
  if (panel.value) {
    observer = new ResizeObserver(measure);
    observer.observe(panel.value);
    for (const child of Array.from(panel.value.children)) observer.observe(child);
  }
  await nextTick();
  measure();
  // Focus moves in and brings the panel into view when it opened below the fold (zoom 200, short windows).
  panel.value?.focus();
});
onBeforeUnmount(() => {
  window.removeEventListener("keydown", onKeydown);
  window.removeEventListener("resize", measure);
  observer?.disconnect();
});

/**
 * Expand or collapse; focus stays on the button (its label changes in place). Expanding lines the panel's top up under
 * the sticky bars, so the taller panel fits the window with its header and the picture in view (never scrolled away).
 */
function toggle() {
  const expanding = !expanded.value;
  cap.value = null;
  shell?.toggleExpand();
  void nextTick(() => {
    measure();
    if (!expanding || !panel.value) return;
    panel.value.scrollIntoView({ block: "start" });
    cap.value = Math.max(0, window.innerHeight - panel.value.getBoundingClientRect().top - 16);
  });
}
</script>

<template>
  <div
    ref="panel"
    tabindex="-1"
    class="preview-panel overflow-y-auto overscroll-contain rounded-lg border bg-card shadow-1"
    :style="{ maxHeight }"
  >
    <ResourcePreview :model="model" :dirty="dirty">
      <template #controls>
        <div class="ml-auto flex items-center gap-1">
          <Button v-if="canExpand" variant="ghost" @click="toggle">
            <component :is="expanded ? Minimize2 : Maximize2" aria-hidden="true" />{{ expanded ? "Collapse" : "Expand" }}<span class="sr-only"> the preview</span>
          </Button>
          <Button variant="secondary" @click="emit('close')"><X aria-hidden="true" />Close<span class="sr-only"> the preview</span></Button>
        </div>
      </template>
    </ResourcePreview>
  </div>
</template>

<style scoped>
.preview-panel {
  animation: preview-open 180ms var(--ease-out, cubic-bezier(0.16, 1, 0.3, 1));
}
@keyframes preview-open {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }
}
@media (prefers-reduced-motion: reduce) {
  .preview-panel {
    animation: none;
  }
}
</style>
