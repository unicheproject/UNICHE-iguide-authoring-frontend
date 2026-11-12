<script setup lang="ts">
/**
 * A visitor screen drawn at its real size and scaled to the width it is given, or with `card` unscaled in the
 * editors' "Preview in app" card (D-059). The default slot is the screen's content, laid out in `em` so it follows the
 * surface's base font size. Its background, text colour, and font come from the theme variables a parent sets
 * (`workspace/projectTheme.ts`), with the CMS default otherwise.
 */
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { SURFACES, type Surface } from "./surfaces";

const props = defineProps<{
  surface: Surface;
  dir?: "ltr" | "rtl";
  lang?: string;
  browserChrome?: boolean;
  /**
   * As the prototype's "Preview in app" card (D-059): the screen at the width it is given (a phone at most 390px), as
   * tall as its content, unscaled, in a thin rounded frame; the pop-up around it scrolls.
   */
  card?: boolean;
}>();

const screen = computed(() => SURFACES[props.surface]);
const host = ref<HTMLElement | null>(null);
const hostWidth = ref(300);
let observer: ResizeObserver | null = null;
onMounted(() => {
  observer = new ResizeObserver(([entry]) => (hostWidth.value = entry.contentRect.width));
  if (host.value) observer.observe(host.value);
});
onBeforeUnmount(() => observer?.disconnect());

/** Base font of a `card` screen: the surface's own, a kiosk's eased to the card's width. */
const CARD_FONT: Record<Surface, number> = { MOBILE: 15, WEB: 15, KIOSK: 17 };
const scale = computed(() => hostWidth.value / screen.value.width);
</script>

<template>
  <div v-if="card" data-preview-frame class="flex justify-center">
    <div
      class="flex w-full flex-col overflow-hidden border border-[#d1d5db] bg-[var(--t-bg,#fff)] text-[var(--t-text,#030712)] shadow-[0_8px_24px_rgba(0,0,0,0.10)] [font-family:var(--t-body,inherit)]"
      :class="surface === 'MOBILE' ? 'max-w-[390px] rounded-[16px]' : 'rounded-[8px]'"
      :style="{ fontSize: `${CARD_FONT[surface]}px` }"
      :dir="dir ?? 'ltr'"
      :lang="lang"
    >
      <slot />
    </div>
  </div>
  <!-- `data-preview-frame`: the stand-in app inside has its own page outline, as the iframe of `12` §3 will. -->
  <div v-else ref="host" data-preview-frame class="overflow-hidden" :class="browserChrome ? 'rounded-xl border bg-card shadow-sm' : ''">
    <div v-if="browserChrome" class="flex gap-1.5 border-b bg-muted px-3.5 py-2.5" aria-hidden="true">
      <span v-for="n in 3" :key="n" class="h-2.5 w-2.5 rounded-full bg-[#d1d5db]"></span>
    </div>
    <div class="relative overflow-hidden" :style="{ height: `${screen.height * scale}px` }">
      <div
        class="absolute left-0 top-0 flex origin-top-left flex-col bg-[var(--t-bg,#fff)] text-[var(--t-text,#030712)] [font-family:var(--t-body,inherit)]"
        :style="{ width: `${screen.width}px`, height: `${screen.height}px`, transform: `scale(${scale})`, fontSize: `${screen.font}px` }"
        :dir="dir ?? 'ltr'"
        :lang="lang"
      >
        <slot />
      </div>
    </div>
  </div>
</template>
