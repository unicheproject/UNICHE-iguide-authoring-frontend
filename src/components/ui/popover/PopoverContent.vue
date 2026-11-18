<script lang="ts">
// Attributes (an `aria-label`, `aria-labelledby`, a test id) go to the surface, not to the portal that wraps it, so the
// dialog or menu keeps its accessible name (axe `aria-dialog-name`).
export default { inheritAttrs: false };
</script>

<script setup lang="ts">
/** The popover surface: white, 8 px radius, `--shadow-2`, in the `popover` z-layer, rendered in a portal. */
import { PopoverContent, PopoverPortal, type PopoverContentEmits, type PopoverContentProps, useForwardPropsEmits } from "radix-vue";
import type { HTMLAttributes } from "vue";
import { cn } from "@/lib/utils";

const props = withDefaults(defineProps<PopoverContentProps & { class?: HTMLAttributes["class"] }>(), {
  align: "start",
  sideOffset: 6,
});
const emits = defineEmits<PopoverContentEmits>();
const forwarded = useForwardPropsEmits(props, emits);
</script>

<template>
  <PopoverPortal>
    <PopoverContent
      v-bind="{ ...forwarded, ...$attrs, class: undefined }"
      :class="cn('z-popover-over max-w-[calc(100vw-1rem)] rounded-md border border-border bg-popover p-3 text-popover-foreground shadow-2 animate-fade-in', props.class)"
    >
      <slot />
    </PopoverContent>
  </PopoverPortal>
</template>
