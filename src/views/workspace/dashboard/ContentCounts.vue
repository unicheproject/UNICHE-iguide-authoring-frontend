<script setup lang="ts">
/**
 * Content counts (plan 2.5, D-077, D-092, D-112): one link per kind, "10 active · 8 draft", from list `totalElements`.
 * A count of zero is quieter (muted) but stays as text, and a kind with nothing at all is muted as a whole. Archived
 * content is not counted. In the side column the kinds are rows; below 1100 px, where the card sits in the single
 * column, they are two or three compact tiles per line so the card stays short (C3-60). Thousands are separated.
 */
import { formatNumber } from "@/lib/format";
import type { ContentCount } from "@/platform/overview";
import { sectionLocation } from "@/workspace/sections";

defineProps<{ projectId: string; counts: ContentCount[] }>();
</script>

<template>
  <section aria-labelledby="counts-title" class="rounded-lg border border-border bg-card shadow-1">
    <h2 id="counts-title" class="px-5 pb-3 pt-5 text-base font-bold">Content</h2>
    <ul class="grid grid-cols-2 sm:grid-cols-3 nav:grid-cols-1">
      <li v-for="c in counts" :key="c.kind.path" class="border-t border-border [&:nth-child(2n)]:border-l sm:[&:nth-child(3n+1)]:border-l-0 sm:[&:nth-child(3n+2)]:border-l sm:[&:nth-child(3n)]:border-l nav:!border-l-0">
        <RouterLink
          :to="sectionLocation(projectId, c.kind.section)"
          class="flex min-h-11 flex-col justify-center px-5 py-1.5 text-sm no-underline hover:bg-surface-hover lg:flex-row lg:flex-wrap lg:items-center lg:justify-between lg:gap-x-3 nav:min-h-row nav:py-2"
          :class="c.active + c.draft === 0 ? 'text-muted-foreground' : 'text-foreground'"
        >
          <span class="min-w-0 font-medium">{{ c.kind.label }}</span>
          <span class="tabular text-compact lg:text-sm">
            <span :class="c.active === 0 ? 'text-muted-foreground' : 'font-bold'">{{ formatNumber(c.active) }} active</span>
            <span class="text-muted-foreground"> · </span>
            <span :class="c.draft === 0 ? 'text-muted-foreground' : 'font-bold'">{{ formatNumber(c.draft) }} draft</span>
          </span>
        </RouterLink>
      </li>
    </ul>
  </section>
</template>
