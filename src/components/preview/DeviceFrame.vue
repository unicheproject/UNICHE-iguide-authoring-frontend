<script setup lang="ts">
/**
 * A visitor screen drawn at its real size (`surfaces.ts`) and scaled: "fit" (the default, "Fit width") shrinks it to the
 * width it is given and never above real size, so a Kiosk is as large as the page allows and its tall screen scrolls inside
 * a window-high area instead of being shrunk to 33 % (D-093); "100" draws it unscaled and lets the host scroll sideways,
 * "50" draws it at half size (D-082). It also emits `fit` (the Fit width scale, whatever the zoom) and `overflow`. The scale in use is emitted, so the caller can state it ("Shown at 57 %"). The
 * default slot is the screen's content, laid out in `em` so it follows the surface's base font size; its colours and
 * font come from the theme variables a parent sets (`workspace/projectTheme.ts`), the CMS default otherwise. Only a
 * Web screen is drawn in browser chrome; a phone and a kiosk are bare screens.
 */
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { SURFACES, surfaceSize, type Orientation, type Surface, type Zoom } from "./surfaces";

const props = withDefaults(
  defineProps<{
    surface: Surface;
    orientation?: Orientation;
    zoom?: Zoom;
    dir?: "ltr" | "rtl";
    lang?: string;
    /** Draws a Web screen under a browser bar. */
    browserChrome?: boolean;
    /** The screen cannot be focused or clicked (a picture of the app); the frame itself still scrolls. */
    inert?: boolean;
    /** Pixels of the window a Kiosk frame leaves free for the page around it when it fits. */
    reservedHeight?: number;
  }>(),
  { orientation: "portrait", zoom: "fit", dir: "ltr", lang: undefined, browserChrome: false, inert: false, reservedHeight: 220 },
);
const emit = defineEmits<{ scale: [scale: number]; fit: [scale: number]; overflow: [sideways: boolean] }>();

const size = computed(() => surfaceSize(props.surface, props.orientation));
const font = computed(() => SURFACES[props.surface].font);
const host = ref<HTMLElement | null>(null);
const hostWidth = ref(0);
const windowHeight = ref(typeof window === "undefined" ? 900 : window.innerHeight);
const overflowing = ref(false);
let observer: ResizeObserver | null = null;

function measure() {
  windowHeight.value = window.innerHeight;
  if (host.value) overflowing.value = host.value.scrollWidth > host.value.clientWidth + 1;
}
onMounted(() => {
  observer = new ResizeObserver(([entry]) => {
    hostWidth.value = entry.contentRect.width;
    measure();
  });
  if (host.value) observer.observe(host.value);
  window.addEventListener("resize", measure);
});
onBeforeUnmount(() => {
  observer?.disconnect();
  window.removeEventListener("resize", measure);
});

/** The width-fitting scale: the width it is given, never above real size. */
const fitScale = computed(() => (hostWidth.value ? Math.min(1, hostWidth.value / size.value.width) : 1));
/** The scale drawn. */
const scale = computed(() => (props.zoom === "100" ? 1 : props.zoom === "50" ? 0.5 : fitScale.value));
/** A Kiosk screen is 1920 tall: it scrolls inside an area as high as the window leaves room for. */
const maxHeight = computed(() => (props.surface === "KIOSK" ? Math.max(420, windowHeight.value - props.reservedHeight) : null));
const scrollsDown = computed(() => maxHeight.value !== null && outer.value.height > maxHeight.value);
watch(scale, (value) => emit("scale", value), { immediate: true });
watch(fitScale, (value) => emit("fit", value), { immediate: true });
watch(overflowing, (value) => emit("overflow", value), { immediate: true });
watch([() => props.zoom, () => props.surface, () => props.orientation, scale], () => void Promise.resolve().then(measure));

const outer = computed(() => ({ width: size.value.width * scale.value, height: size.value.height * scale.value }));
</script>

<template>
  <!-- `data-preview-frame`: the stand-in app inside has its own page outline, as the iframe of `12` §3 will. -->
  <div
    ref="host"
    data-preview-frame
    :data-scale="scale.toFixed(3)"
    class="w-full overflow-x-auto"
    :class="{ 'overflow-y-auto': maxHeight !== null }"
    :style="maxHeight !== null ? { maxHeight: `${maxHeight}px` } : undefined"
    :tabindex="overflowing || scrollsDown ? 0 : undefined"
    :role="overflowing || scrollsDown ? 'group' : undefined"
    :aria-label="overflowing || scrollsDown ? (overflowing ? 'Preview at real size, scrolls sideways' : 'Preview screen, scrolls') : undefined"
  >
    <div class="mx-auto overflow-hidden rounded-lg border border-input bg-card shadow-2" :style="{ width: `${outer.width}px` }">
      <div v-if="browserChrome && surface === 'WEB'" class="flex gap-2 border-b border-border bg-muted px-3 py-2.5" aria-hidden="true">
        <span v-for="n in 3" :key="n" class="size-2.5 rounded-full bg-input"></span>
      </div>
      <div class="relative overflow-hidden" :style="{ height: `${outer.height}px` }">
        <div
          class="absolute left-0 top-0 flex origin-top-left flex-col bg-[var(--t-bg,#fff)] text-[var(--t-text,#030712)] [font-family:var(--t-body,inherit)]"
          :style="{ width: `${size.width}px`, height: `${size.height}px`, transform: `scale(${scale})`, fontSize: `${font}px` }"
          :dir="dir"
          :lang="lang"
          :inert="inert"
          :aria-hidden="inert ? 'true' : undefined"
        >
          <slot />
        </div>
      </div>
    </div>
  </div>
</template>
