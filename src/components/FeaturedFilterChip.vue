<script setup lang="ts">
/** "Featured" filter of a Content list (iGuide spec 12 section 3), inside the list filter menu; only kinds with `featured` show it. */
import { Star } from "lucide-vue-next";

const model = defineModel<boolean>({ required: true });
</script>

<template>
  <fieldset class="min-w-0">
    <legend class="mb-2 text-[11px] font-bold uppercase tracking-[0.06em] text-muted-foreground">Featured</legend>
    <label class="inline-flex cursor-pointer items-center gap-2 text-[13px] text-foreground">
      <input v-model="model" type="checkbox" class="size-4 accent-[hsl(var(--primary))]" />
      <Star class="size-3.5" :class="model ? 'fill-current text-primary' : 'text-muted-foreground'" aria-hidden="true" />
      Featured only
    </label>
  </fieldset>
</template>
