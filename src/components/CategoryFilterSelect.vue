<script setup lang="ts">
/** The Category select of the list filter menu; hidden while the Project has no Category for the kind. */
defineProps<{ options: { id: string; label: string }[] }>();
const selected = defineModel<string>({ required: true });
</script>

<template>
  <!-- A visible label, not only the first option (`14` §4, DECISIONS.md D-042). -->
  <label v-if="options.length || selected !== 'ALL'" class="flex flex-col gap-2">
    <span class="text-[11px] font-bold uppercase tracking-[0.06em] text-muted-foreground">Category</span>
    <select
      v-model="selected"
      class="w-full rounded-lg border-[1.5px] bg-card px-3 py-[8px] text-[13px] text-foreground focus:border-primary"
      :class="selected !== 'ALL' ? 'border-primary font-semibold' : ''"
    >
      <option value="ALL">All categories</option>
      <option value="NONE">In no category</option>
      <option v-for="o in options" :key="o.id" :value="o.id">{{ o.label }}</option>
    </select>
  </label>
</template>
