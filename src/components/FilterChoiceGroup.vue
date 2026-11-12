<script setup lang="ts" generic="T extends string">
/**
 * One single-choice filter inside the list filter menu (status, kind, type): a labelled radio group drawn as pills,
 * so arrow keys move the choice and the chosen pill carries a check mark as well as its colour (`14` §4).
 */
import { useId } from "vue";
import { Check } from "lucide-vue-next";

defineProps<{ legend: string; options: { value: T; label: string }[] }>();
const model = defineModel<T>({ required: true });
const name = useId();
</script>

<template>
  <fieldset class="min-w-0">
    <legend class="mb-2 text-[11px] font-bold uppercase tracking-[0.06em] text-muted-foreground">{{ legend }}</legend>
    <div class="flex flex-wrap gap-1.5">
      <label
        v-for="o in options"
        :key="o.value"
        class="relative inline-flex cursor-pointer items-center gap-1 rounded-full border px-[13px] py-1.5 text-[11px] transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-primary"
        :class="model === o.value ? 'border-primary bg-primary font-bold text-white' : 'bg-card font-semibold text-gray-700 hover:border-primary/50 hover:bg-accent'"
      >
        <input v-model="model" type="radio" :name="name" :value="o.value" class="sr-only" />
        <Check v-if="model === o.value" class="-ml-0.5 size-3" aria-hidden="true" :stroke-width="3" />
        {{ o.label }}
      </label>
    </div>
  </fieldset>
</template>
