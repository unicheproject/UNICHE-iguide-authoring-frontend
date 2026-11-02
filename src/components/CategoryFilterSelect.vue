<script setup lang="ts">
/** The Category select of a list toolbar; hidden while the Project has no Category for the kind. */
defineProps<{ options: { id: string; label: string }[] }>();
const selected = defineModel<string>({ required: true });
</script>

<template>
  <!-- A visible label, not only the first option (`14` §4, DECISIONS.md D-042). -->
  <label v-if="options.length || selected !== 'ALL'" class="inline-flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground">
    Category
    <select
      v-model="selected"
      class="max-w-[220px] rounded-lg border-[1.5px] bg-card px-3 py-[8px] text-[12px] font-semibold text-foreground"
      :class="selected !== 'ALL' ? 'border-primary text-primary' : ''"
    >
      <option value="ALL">All categories</option>
      <option value="NONE">In no category</option>
      <option v-for="o in options" :key="o.id" :value="o.id">{{ o.label }}</option>
    </select>
  </label>
</template>
