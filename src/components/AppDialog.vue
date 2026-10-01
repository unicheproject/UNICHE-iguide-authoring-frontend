<script setup lang="ts">
/**
 * Modal dialog of the CMS mockup. Focus moves into it on open and back to the opener on close; Escape and
 * the backdrop close it unless `busy`.
 */
import { nextTick, onBeforeUnmount, onMounted, ref } from "vue";

const props = withDefaults(defineProps<{ title: string; width?: string; busy?: boolean }>(), {
  width: "520px",
  busy: false,
});
const emit = defineEmits<{ close: [] }>();

const panel = ref<HTMLElement | null>(null);
const titleId = `dialog-${Math.random().toString(36).slice(2, 9)}`;
let opener: HTMLElement | null = null;

function close() {
  if (!props.busy) emit("close");
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === "Escape") close();
}

onMounted(async () => {
  opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  document.addEventListener("keydown", onKeydown);
  await nextTick();
  const first = panel.value?.querySelector<HTMLElement>("input, select, textarea, button:not([disabled])");
  (first ?? panel.value)?.focus();
});

onBeforeUnmount(() => {
  document.removeEventListener("keydown", onKeydown);
  opener?.focus();
});
</script>

<template>
  <Teleport to="body">
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(3,7,18,0.45)] p-6" @click.self="close">
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
