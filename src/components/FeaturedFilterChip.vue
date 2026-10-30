<script setup lang="ts">
/** "Featured" filter of a Content list (iGuide spec 12 section 3); only kinds with `featured` show it. */
const model = defineModel<boolean>({ required: true });
</script>

<template>
  <button
    type="button"
    class="rounded-full border px-[13px] py-1.5 text-[11px]"
    :class="model ? 'border-primary bg-primary font-bold text-white' : 'bg-card font-semibold text-gray-700'"
    :aria-pressed="model"
    @click="model = !model"
  >
    ★ Featured
  </button>
</template>
