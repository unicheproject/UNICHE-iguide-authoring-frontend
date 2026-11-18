<script setup lang="ts">
/**
 * A native select drawn like the other fields (the platform's list is the most accessible one on touch and with
 * assistive technology). Options go in the default slot as `<option>` elements. Attributes (`id`, `name`,
 * `aria-describedby`, `disabled`, ...) reach the native `<select>`, so a `<label for>` and `FormField` find it; only
 * `style` stays on the wrapper.
 */
import { ChevronDown } from "lucide-vue-next";
import { computed, useAttrs, type HTMLAttributes } from "vue";
import { cn } from "@/lib/utils";

defineOptions({ inheritAttrs: false });
const props = defineProps<{ invalid?: boolean; /** `sm` is 32 px (44 on a coarse pointer), for filter bars and tables. */ size?: "md" | "sm"; class?: HTMLAttributes["class"] }>();
const model = defineModel<string | number | undefined>();
const attrs = useAttrs();
const forSelect = computed(() => Object.fromEntries(Object.entries(attrs).filter(([key]) => key !== "style")));
</script>

<template>
  <span class="relative inline-block w-full" :style="attrs.style as HTMLAttributes['style']">
    <select
      v-bind="forSelect"
      v-model="model"
      :aria-invalid="invalid ? 'true' : undefined"
      :class="cn('ui-field appearance-none pr-9', size === 'sm' && 'min-h-8 py-1 [@media(pointer:coarse)]:min-h-11', invalid && 'border-destructive', props.class)"
    >
      <slot />
    </select>
    <ChevronDown class="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-ink-2" aria-hidden="true" />
  </span>
</template>
