<script setup lang="ts">
/**
 * A status chip: symbol, word, and colour together, so the status never rests on colour alone (`14` §4,
 * DECISIONS.md D-042). `status="PENDING"` with a `label` is the "Pending changes" chip of a working copy.
 */
import { statusChipStyle, statusGlyph } from "@/lib/format";

withDefaults(defineProps<{ status: string; label?: string; size?: "page" | "row" }>(), { size: "row" });
</script>

<template>
  <span
    class="inline-flex items-center gap-[5px] whitespace-nowrap rounded-full text-[10px] font-bold uppercase tracking-[0.07em]"
    :class="size === 'page' ? 'px-2.5 py-1' : 'px-[9px] py-[3px]'"
    :style="statusChipStyle(status)"
  >
    <span aria-hidden="true">{{ statusGlyph(status) }}</span>{{ label ?? status }}
  </span>
</template>
