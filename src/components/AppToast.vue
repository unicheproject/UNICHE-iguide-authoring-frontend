<script setup lang="ts">
import { computed } from "vue";
import { dismissToast, toastState } from "@/stores/toast";

const marks = { success: "#0f7a6e", warning: "#9a6200", error: "#c0185e", info: "#2d5aa0" } as const;
const mark = computed(() => (toastState.current ? marks[toastState.current.tone] : marks.success));
</script>

<template>
  <div aria-live="polite" class="pointer-events-none fixed bottom-[22px] right-[22px] z-[60]">
    <div
      v-if="toastState.current"
      :key="toastState.current.id"
      class="pointer-events-auto flex max-w-[380px] items-start gap-3 rounded-lg border border-l-4 bg-white px-4 py-3.5 shadow-[0_16px_40px_rgba(0,0,0,0.12)]"
      :style="{ borderLeftColor: mark }"
    >
      <div class="min-w-0">
        <strong class="block text-[13px] font-bold">{{ toastState.current.title }}</strong>
        <span v-if="toastState.current.body" class="text-xs text-muted-foreground">{{ toastState.current.body }}</span>
      </div>
      <button type="button" class="ml-auto text-sm text-muted-foreground" aria-label="Dismiss" @click="dismissToast">✕</button>
    </div>
  </div>
</template>
