<script setup lang="ts">
/**
 * Page head of the mockup: 24px title, optional status chip and pending-changes chip on the same line, muted
 * subtitle, actions on the right.
 */
import StatusChip from "@/components/StatusChip.vue";

defineProps<{ title: string; subtitle?: string; status?: string; pending?: string }>();
</script>

<template>
  <div class="mb-[22px] flex flex-wrap items-start gap-5">
    <div class="min-w-[min(100%,300px)] flex-1">
      <div class="flex flex-wrap items-center gap-2.5">
        <h1 class="text-2xl font-extrabold leading-tight tracking-[-0.01em]">{{ title }}</h1>
        <StatusChip v-if="status" :status="status" size="page" />
        <StatusChip v-if="pending" status="PENDING" :label="pending" size="page" />
      </div>
      <p v-if="subtitle" class="mt-1 max-w-[760px] text-[13px] text-muted-foreground">{{ subtitle }}</p>
    </div>
    <div v-if="$slots.actions" class="flex flex-wrap items-center gap-2.5">
      <slot name="actions" />
    </div>
  </div>
</template>
