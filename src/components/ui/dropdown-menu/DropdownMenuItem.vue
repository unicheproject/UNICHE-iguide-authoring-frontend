<script setup lang="ts">
/** One menu item: 36 px (44 coarse), icon slot first, highlighted on keyboard and pointer focus. */
import { DropdownMenuItem, type DropdownMenuItemEmits, type DropdownMenuItemProps, useForwardPropsEmits } from "radix-vue";
import type { HTMLAttributes } from "vue";
import { cn } from "@/lib/utils";

const props = defineProps<DropdownMenuItemProps & { class?: HTMLAttributes["class"]; danger?: boolean }>();
const emits = defineEmits<DropdownMenuItemEmits>();
const forwarded = useForwardPropsEmits(props, emits);
</script>

<template>
  <DropdownMenuItem
    v-bind="{ ...forwarded, class: undefined }"
    :class="
      cn(
        'flex min-h-9 cursor-pointer select-none items-center gap-2 rounded-sm px-3 py-1.5 text-sm font-medium text-foreground no-underline [@media(pointer:coarse)]:min-h-11 data-[highlighted]:bg-accent-strong data-[highlighted]:[outline-style:solid] data-[highlighted]:outline-2 data-[highlighted]:-outline-offset-2 data-[highlighted]:outline-ring active:bg-surface-active data-[disabled]:cursor-not-allowed data-[disabled]:text-disabled-ink [&_svg]:size-4 [&_svg]:shrink-0',
        danger && 'text-destructive',
        props.class,
      )
    "
  >
    <slot />
  </DropdownMenuItem>
</template>
