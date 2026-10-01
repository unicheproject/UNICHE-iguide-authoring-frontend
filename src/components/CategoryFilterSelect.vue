<script setup lang="ts">
/** The Category select of a list toolbar; hidden while the Project has no Category for the kind. */
defineProps<{ options: { id: string; label: string }[] }>();
const selected = defineModel<string>({ required: true });
</script>

<template>
  <select
    v-if="options.length || selected !== 'ALL'"
    v-model="selected"
    aria-label="Filter by category"
    class="max-w-[220px] rounded-lg border-[1.5px] bg-card px-3 py-[8px] text-[12px] font-semibold"
    :class="selected !== 'ALL' ? 'border-primary text-primary' : ''"
  >
    <option value="ALL">All categories</option>
    <option value="NONE">In no category</option>
    <option v-for="o in options" :key="o.id" :value="o.id">{{ o.label }}</option>
  </select>
</template>
