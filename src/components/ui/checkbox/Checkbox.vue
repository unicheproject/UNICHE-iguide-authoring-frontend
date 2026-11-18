<script setup lang="ts">
/**
 * Checkbox with its label: a 20 px box (24 px on a coarse pointer) with a control-border edge inside a 40 px (44 coarse) hit area. The label text
 * is the accessible name; `description` adds a hint linked with `aria-describedby`.
 */
import { Check } from "lucide-vue-next";
import { useId, type HTMLAttributes } from "vue";
import { cn } from "@/lib/utils";

defineProps<{ description?: string; disabled?: boolean; class?: HTMLAttributes["class"] }>();
const model = defineModel<boolean>({ default: false });
const hintId = useId();
</script>

<template>
  <label :class="cn('inline-flex min-h-control cursor-pointer items-start gap-3 py-2 text-sm [@media(pointer:coarse)]:min-h-11', disabled && 'cursor-not-allowed text-disabled-ink', $props.class)">
    <span class="relative mt-0.5 inline-flex size-5 shrink-0 [@media(pointer:coarse)]:size-6">
      <input
        v-model="model"
        type="checkbox"
        :disabled="disabled"
        :aria-describedby="description ? hintId : undefined"
        class="peer size-5 [@media(pointer:coarse)]:size-6 cursor-[inherit] appearance-none rounded-sm border border-input bg-card checked:border-primary checked:bg-primary active:border-primary disabled:bg-muted"
      />
      <Check class="pointer-events-none absolute inset-0 m-auto size-4 text-primary-foreground opacity-0 peer-checked:opacity-100" :stroke-width="3" aria-hidden="true" />
    </span>
    <span class="min-w-0">
      <span class="font-medium"><slot /></span>
      <span v-if="description" :id="hintId" class="block text-xs text-muted-foreground">{{ description }}</span>
    </span>
  </label>
</template>
