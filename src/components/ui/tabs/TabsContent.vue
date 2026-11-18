<script setup lang="ts">
/** The panel of one tab. */
import { TabsContent, type TabsContentProps } from "radix-vue";

const props = defineProps<TabsContentProps>();
</script>

<template>
  <TabsContent v-bind="props"><slot /></TabsContent>
</template>
