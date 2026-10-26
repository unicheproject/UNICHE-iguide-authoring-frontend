<script setup lang="ts">
/**
 * Page head of the mockup: 24px title, optional status chip and pending-changes chip on the same line, muted
 * subtitle, actions on the right.
 */
import { statusChipStyle } from "@/lib/format";

defineProps<{ title: string; subtitle?: string; status?: string; pending?: string }>();
</script>

<template>
  <div class="mb-[22px] flex flex-wrap items-start gap-5">
    <div class="min-w-[min(100%,300px)] flex-1">
      <div class="flex flex-wrap items-center gap-2.5">
        <h1 class="text-2xl font-extrabold leading-tight tracking-[-0.01em]">{{ title }}</h1>
        <span
          v-if="status"
          class="inline-flex items-center gap-[5px] rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.07em]"
          :style="statusChipStyle(status)"
        >
          <span class="inline-block h-1.5 w-1.5 rounded-full bg-current"></span>{{ status }}
        </span>
        <span
          v-if="pending"
          class="inline-flex items-center gap-[5px] rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.07em]"
          :style="statusChipStyle('PENDING')"
        >
          <span aria-hidden="true">✎</span>{{ pending }}
        </span>
      </div>
      <p v-if="subtitle" class="mt-1 max-w-[760px] text-[13px] text-muted-foreground">{{ subtitle }}</p>
    </div>
    <div v-if="$slots.actions" class="flex flex-wrap items-center gap-2.5">
      <slot name="actions" />
    </div>
  </div>
</template>
