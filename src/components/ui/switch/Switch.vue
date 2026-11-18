<script setup lang="ts">
/**
 * An on/off switch (a checkbox with `role="switch"`). The label says what is switched; state is announced as on/off by
 * the role, and the knob position plus the track fill show it (the off track has a control-border outline).
 */
import { useId, type HTMLAttributes } from "vue";
import { cn } from "@/lib/utils";

defineProps<{ description?: string; disabled?: boolean; class?: HTMLAttributes["class"] }>();
const model = defineModel<boolean>({ default: false });
const hintId = useId();
</script>

<template>
  <label :class="cn('inline-flex min-h-control cursor-pointer items-center gap-3 py-1 text-sm', disabled && 'cursor-not-allowed text-disabled-ink', $props.class)">
    <span class="relative inline-flex h-6 w-11 shrink-0">
      <input
        v-model="model"
        type="checkbox"
        role="switch"
        :disabled="disabled"
        :aria-describedby="description ? hintId : undefined"
        class="peer h-6 w-11 cursor-[inherit] appearance-none rounded-full border border-input bg-card transition-ui duration-2 checked:border-primary checked:bg-primary disabled:bg-muted"
      />
      <span
        class="pointer-events-none absolute left-1 top-1 size-4 rounded-full bg-input transition-ui duration-2 peer-checked:translate-x-5 peer-checked:bg-primary-foreground"
        aria-hidden="true"
      ></span>
    </span>
    <span class="min-w-0">
      <span class="font-medium"><slot /></span>
      <span v-if="description" :id="hintId" class="block text-xs text-muted-foreground">{{ description }}</span>
    </span>
  </label>
</template>
