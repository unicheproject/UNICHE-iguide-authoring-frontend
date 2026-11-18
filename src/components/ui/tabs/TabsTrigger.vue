<script setup lang="ts">
/** One tab: 14/600, 44 px on touch, a 2 px primary underline when selected (a Highlight underline in forced colours). */
import { TabsTrigger, type TabsTriggerProps } from "radix-vue";
import type { HTMLAttributes } from "vue";
import { cn } from "@/lib/utils";

const props = defineProps<TabsTriggerProps & { class?: HTMLAttributes["class"] }>();
</script>

<template>
  <TabsTrigger
    v-bind="{ value: props.value, disabled: props.disabled }"
    :class="
      cn(
        '-mb-px inline-flex min-h-control items-center gap-2 whitespace-nowrap border-b-2 border-transparent px-4 text-sm font-semibold text-muted-foreground transition-ui duration-1 hover:text-foreground active:bg-surface-active data-[state=active]:border-primary data-[state=active]:text-primary',
        props.class,
      )
    "
  >
    <slot />
  </TabsTrigger>
</template>
