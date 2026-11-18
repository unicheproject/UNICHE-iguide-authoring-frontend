<script lang="ts">
import type { InjectionKey } from "vue";

/** One entry of the editor's "On this page" rail. */
export interface EditorSectionInfo {
  id: string;
  label: string;
  /** A short state mark shown in the rail beside the label, such as "Italiano missing" or "3 of 5". */
  state?: string;
}

/** What `EditorShell` provides so a section registers itself in the rail without the editor listing it twice. */
export interface EditorSectionRegistry {
  set: (info: EditorSectionInfo) => void;
  remove: (id: string) => void;
}

/** Injection key shared by `EditorShell` and `EditorSection`. */
export const EDITOR_SECTIONS: InjectionKey<EditorSectionRegistry> = Symbol("editor-sections");
</script>

<script setup lang="ts">
/**
 * One section of an editor form (plan 2.3, section order Texts, core setup, Media, How visitors reach it, Details): a
 * card with an `h2`, an optional filled count, an optional state mark and, when `collapsible`, a show/hide toggle (the
 * "Details" section starts collapsed). It registers itself in the shell's "On this page" rail by `id`, and opens by
 * itself when a field inside it is asked to take focus (`REVEAL_FIELD_EVENT`). Anchors and focus land under the sticky
 * bars because `<main>` carries `scroll-padding-top` from the measured `--sticky-stack-h` (D-089); the section only
 * adds a small gap.
 */
import { ChevronDown } from "lucide-vue-next";
import { inject, onBeforeUnmount, onMounted, ref, watchEffect } from "vue";
import { REVEAL_FIELD_EVENT } from "@/workspace/useResourceEditor";

const props = withDefaults(
  defineProps<{
    id: string;
    title: string;
    /** How much of the section is filled, "3 of 5"; shown beside the title. */
    count?: string;
    /** Text for the rail's state mark when it differs from `count`. */
    state?: string;
    collapsible?: boolean;
    /** With `collapsible`: whether it starts open. */
    defaultOpen?: boolean;
    /** One line under the title. */
    description?: string;
  }>(),
  { count: undefined, state: undefined, collapsible: false, defaultOpen: true, description: undefined },
);

const open = ref(!props.collapsible || props.defaultOpen);
const root = ref<HTMLElement | null>(null);
const registry = inject(EDITOR_SECTIONS, null);

watchEffect(() => registry?.set({ id: props.id, label: props.title, state: props.state ?? props.count }));
onBeforeUnmount(() => registry?.remove(props.id));

function onReveal(event: Event) {
  if (open.value || !root.value) return;
  const path = (event as CustomEvent<{ path: string }>).detail?.path ?? "";
  const field = path.replace(/\[\d+\]/g, "").split(".").pop() ?? "";
  const hit = root.value.querySelector(`[data-path="${CSS.escape(path)}"], #f-${CSS.escape(field)}`);
  if (hit) open.value = true;
}
onMounted(() => window.addEventListener(REVEAL_FIELD_EVENT, onReveal));
onBeforeUnmount(() => window.removeEventListener(REVEAL_FIELD_EVENT, onReveal));
</script>

<template>
  <section :id="id" ref="root" :aria-labelledby="`${id}-heading`" class="editor-section scroll-mt-4 rounded-lg border bg-card shadow-1">
    <h2 :id="`${id}-heading`" class="m-0 text-base font-bold">
      <button
        v-if="collapsible"
        type="button"
        class="flex min-h-control w-full items-center gap-3 rounded-lg px-6 py-3 text-left"
        :aria-expanded="open"
        :aria-controls="`${id}-body`"
        @click="open = !open"
      >
        {{ title }}
        <span v-if="count" class="text-sm font-medium text-muted-foreground">{{ count }}</span>
        <ChevronDown class="ml-auto size-5 text-muted-foreground transition-transform" :class="open ? 'rotate-180' : ''" aria-hidden="true" />
      </button>
      <span v-else class="flex min-h-control items-center gap-3 px-6 pt-4">
        {{ title }}
        <span v-if="count" class="text-sm font-medium text-muted-foreground">{{ count }}</span>
      </span>
    </h2>
    <p v-if="description" class="px-6 text-sm text-muted-foreground">{{ description }}</p>
    <div v-show="open" :id="`${id}-body`" class="flex flex-col gap-4 px-6 pb-6 pt-3"><slot /></div>
  </section>
</template>
