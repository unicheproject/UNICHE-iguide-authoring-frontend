<script setup lang="ts">
/**
 * A visitor screen drawn at its real size and scaled to the width it is given. The default slot is the
 * screen's content, laid out in `em` so it follows the surface's base font size.
 */
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { SURFACES, type Surface } from "./surfaces";

const props = defineProps<{ surface: Surface; dir?: "ltr" | "rtl"; browserChrome?: boolean }>();

const screen = computed(() => SURFACES[props.surface]);
const host = ref<HTMLElement | null>(null);
const hostWidth = ref(300);
let observer: ResizeObserver | null = null;
onMounted(() => {
  observer = new ResizeObserver(([entry]) => (hostWidth.value = entry.contentRect.width));
  if (host.value) observer.observe(host.value);
});
onBeforeUnmount(() => observer?.disconnect());

const scale = computed(() => hostWidth.value / screen.value.width);
</script>

<template>
  <div ref="host" class="overflow-hidden" :class="browserChrome ? 'rounded-xl border bg-card shadow-sm' : ''">
    <div v-if="browserChrome" class="flex gap-1.5 border-b bg-muted px-3.5 py-2.5" aria-hidden="true">
      <span v-for="n in 3" :key="n" class="h-2.5 w-2.5 rounded-full bg-[#d1d5db]"></span>
    </div>
    <div class="relative overflow-hidden" :style="{ height: `${screen.height * scale}px` }">
      <div
        class="absolute left-0 top-0 flex origin-top-left flex-col bg-white text-[#030712]"
        :style="{ width: `${screen.width}px`, height: `${screen.height}px`, transform: `scale(${scale})`, fontSize: `${screen.font}px` }"
        :dir="dir ?? 'ltr'"
      >
        <slot />
      </div>
    </div>
  </div>
</template>
