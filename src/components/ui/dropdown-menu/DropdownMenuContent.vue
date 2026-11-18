<script lang="ts">
// Attributes (an `aria-label`, `aria-labelledby`, a test id) go to the surface, not to the portal that wraps it, so the
// dialog or menu keeps its accessible name (axe `aria-dialog-name`).
export default { inheritAttrs: false };
</script>

<script setup lang="ts">
/** The menu surface in a portal, `popover` z-layer, `--shadow-2`. */
import {
  DropdownMenuContent,
  DropdownMenuPortal,
  type DropdownMenuContentEmits,
  type DropdownMenuContentProps,
  useForwardPropsEmits,
} from "radix-vue";
import type { HTMLAttributes } from "vue";
import { cn } from "@/lib/utils";

const props = withDefaults(defineProps<DropdownMenuContentProps & { class?: HTMLAttributes["class"] }>(), {
  sideOffset: 6,
  align: "end",
});
const emits = defineEmits<DropdownMenuContentEmits>();
const forwarded = useForwardPropsEmits(props, emits);
</script>

<template>
  <DropdownMenuPortal>
    <DropdownMenuContent
      v-bind="{ ...forwarded, ...$attrs, class: undefined }"
      :class="cn('z-popover-over min-w-48 max-w-[calc(100vw-1rem)] rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-2 animate-fade-in', props.class)"
    >
      <slot />
    </DropdownMenuContent>
  </DropdownMenuPortal>
</template>
