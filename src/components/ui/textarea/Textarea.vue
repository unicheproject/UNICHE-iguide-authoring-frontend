<script setup lang="ts">
/**
 * Multi-line text field. `dir="auto"` by default (pass `dir` for a known language). `autogrow` grows it with its content between `minRows` (3) and `maxRows` (20), then it scrolls.
 */
import { nextTick, onMounted, ref, watch, type HTMLAttributes } from "vue";
import { cn } from "@/lib/utils";

const props = withDefaults(
  defineProps<{ invalid?: boolean; autogrow?: boolean; minRows?: number; maxRows?: number; class?: HTMLAttributes["class"] }>(),
  { minRows: 3, maxRows: 20 },
);
const model = defineModel<string | undefined>();
const el = ref<HTMLTextAreaElement | null>(null);

function fit() {
  const box = el.value;
  if (!props.autogrow || !box) return;
  const style = getComputedStyle(box);
  const line = parseFloat(style.lineHeight) || 21;
  const pad = parseFloat(style.paddingTop) + parseFloat(style.paddingBottom) + 2;
  box.style.height = "auto";
  const rows = Math.min(props.maxRows, Math.max(props.minRows, Math.ceil((box.scrollHeight - pad) / line)));
  box.style.height = `${rows * line + pad}px`;
}
onMounted(fit);
watch(model, () => void nextTick(fit));
</script>

<template>
  <textarea
    ref="el"
    v-model="model"
    dir="auto"
    :rows="minRows"
    :aria-invalid="invalid ? 'true' : undefined"
    :class="cn('ui-field resize-y', invalid && 'border-destructive', props.class)"
  />
</template>
