<script setup lang="ts">
/**
 * Short text tooltip on hover and keyboard focus (Radix). The trigger is the default slot (use a focusable element);
 * `text` is the tip. A tooltip adds a hint; anything essential also exists as visible text (`14` §4).
 */
import { TooltipArrow, TooltipContent, TooltipPortal, TooltipProvider, TooltipRoot, TooltipTrigger } from "radix-vue";

withDefaults(defineProps<{ text: string; side?: "top" | "right" | "bottom" | "left" }>(), { side: "top" });
</script>

<template>
  <TooltipProvider :delay-duration="300">
    <TooltipRoot>
      <TooltipTrigger as-child><slot /></TooltipTrigger>
      <TooltipPortal>
        <TooltipContent
          :side="side"
          :side-offset="6"
          class="z-popover-over max-w-72 rounded-md bg-foreground px-2.5 py-1.5 text-xs font-medium text-background shadow-2 animate-fade-in"
        >
          {{ text }}
          <TooltipArrow class="fill-foreground" />
        </TooltipContent>
      </TooltipPortal>
    </TooltipRoot>
  </TooltipProvider>
</template>
