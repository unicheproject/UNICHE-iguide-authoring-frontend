<script setup lang="ts">
/**
 * The "What is this?" pattern: a 40 px hit area (44 on a coarse pointer) with a 16 px icon, that opens a popover with a short explanation (default slot), so a term
 * such as "Working Copy" or "Exhibit code" is explained once, where it appears, without leaving the form.
 * `label` names the button for assistive technology ("What is a Working Copy?").
 */
import { CircleHelp } from "lucide-vue-next";
import type { HTMLAttributes } from "vue";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

defineProps<{ label: string; /** Classes for the button (for example `size-6 align-text-bottom` to sit against a sentence). */ class?: HTMLAttributes["class"]; }>();
</script>

<template>
  <Popover>
    <PopoverTrigger as-child>
      <button
        type="button"
        :aria-label="label"
        :class="cn('inline-flex size-10 items-center justify-center rounded-full text-muted-foreground hover:bg-surface-hover hover:text-foreground active:bg-surface-active [@media(pointer:coarse)]:size-11', $props.class)"
      >
        <CircleHelp class="size-4" aria-hidden="true" />
      </button>
    </PopoverTrigger>
    <PopoverContent class="w-72 text-sm"><slot /></PopoverContent>
  </Popover>
</template>
