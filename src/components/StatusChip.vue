<script setup lang="ts">
/**
 * The status chip (D-070, D-072): a drawn icon, the word in sentence case, and a tone, so status never rests on colour
 * alone (`14` §4). `DRAFT` has a dashed circle on sunken grey, `ARCHIVED` an outline with an archive box, `ACTIVE` a
 * check on success; `status="PENDING"` with a `label` is the "Pending changes" chip of a Working Copy. `size` is kept
 * for older callers and no longer changes the look: every chip is 24 px tall. `wrap` lets a long label ("Pending changes" in a narrow Status column) break onto two lines as a
 * rounded pill instead of overflowing.
 */
import { computed } from "vue";
import { Chip } from "@/components/ui/chip";
import { statusInfo } from "@/lib/format";

const props = withDefaults(defineProps<{ status: string; label?: string; size?: "page" | "row"; wrap?: boolean }>(), { size: "row", label: undefined, wrap: false });
const info = computed(() => statusInfo(props.status));
</script>

<template>
  <Chip :tone="info.tone" :icon="info.icon" :class="wrap && 'max-w-full whitespace-normal rounded-lg py-0.5 text-left'">{{ label ?? info.label }}</Chip>
</template>
