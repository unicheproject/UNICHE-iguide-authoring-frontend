<script setup lang="ts">
/**
 * "On this page" rail (plan 2.3): a link per section with its state mark, the section in view marked
 * `aria-current="location"` (scroll-spy), and a click that scrolls the section under the sticky header and moves focus
 * to its heading. It is a `SideCard` (D-109). Sections come from the shell (`sections` prop plus every `EditorSection` that registered itself).
 */
import { onBeforeUnmount, onMounted, ref, watch } from "vue";
import type { EditorSectionInfo } from "@/components/editor/EditorSection.vue";
import SideCard from "@/components/editor/SideCard.vue";

const props = defineProps<{ sections: EditorSectionInfo[] }>();

const current = ref<string | null>(null);
let observer: IntersectionObserver | null = null;
const seen = new Map<string, number>();

function observe() {
  observer?.disconnect();
  seen.clear();
  if (!props.sections.length) return;
  // The sticky editor header covers the top of the scrolling area; a section counts as current from just below it.
  // `--sticky-stack-h` holds only the editor's own bars; the app header above `<main>` covers the top as well.
  const stack = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--sticky-stack-h")) || 0;
  const app = document.querySelector("header")?.getBoundingClientRect().bottom ?? 0;
  const offset = `${Math.ceil(stack + app) || 56}px`;
  observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) seen.set(entry.target.id, entry.isIntersecting ? entry.boundingClientRect.top : Infinity);
      const visible = [...seen.entries()].filter(([, top]) => top !== Infinity).sort((a, b) => a[1] - b[1]);
      if (visible.length) current.value = visible[0][0];
    },
    { rootMargin: `-${offset.trim() || "56px"} 0px -55% 0px`, threshold: [0, 1] },
  );
  for (const section of props.sections) {
    const el = document.getElementById(section.id);
    if (el) observer.observe(el);
  }
  current.value = current.value ?? props.sections[0].id;
}

onMounted(observe);
watch(() => props.sections.map((s) => s.id).join("|"), () => requestAnimationFrame(observe));
onBeforeUnmount(() => observer?.disconnect());

function go(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  current.value = id;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  el.scrollIntoView({ block: "start", behavior: reduce ? "auto" : "smooth" });
  document.getElementById(`${id}-heading`)?.querySelector<HTMLElement>("button")?.focus({ preventScroll: true });
}
</script>

<template>
  <SideCard v-if="sections.length > 1" as="nav" title="On this page" heading-id="editor-rail-heading">
    <ul class="-mx-2 flex flex-col">
      <li v-for="section in sections" :key="section.id">
        <a
          :href="`#${section.id}`"
          :aria-current="current === section.id ? 'location' : undefined"
          class="flex min-h-9 items-center justify-between gap-2 rounded-md px-2 py-1.5 text-sm font-medium text-ink-2 no-underline hover:bg-surface-hover aria-[current=location]:bg-accent aria-[current=location]:font-semibold aria-[current=location]:text-primary"
          @click.prevent="go(section.id)"
        >
          <span>{{ section.label }}</span>
          <span v-if="section.state" class="text-xs font-normal text-muted-foreground">{{ section.state }}</span>
        </a>
      </li>
    </ul>
  </SideCard>
</template>
