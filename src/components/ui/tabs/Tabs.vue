<script setup lang="ts">
/** Tab group with roving tabindex and arrow, Home and End keys (Radix). `v-model` is the selected tab value. */
import { TabsRoot, type TabsRootEmits, type TabsRootProps, useForwardPropsEmits } from "radix-vue";

const props = defineProps<TabsRootProps>();
const emits = defineEmits<TabsRootEmits>();
const forwarded = useForwardPropsEmits(props, emits);
</script>

<template>
  <TabsRoot v-bind="forwarded"><slot /></TabsRoot>
</template>
