<script setup lang="ts">
/**
 * Breadcrumb trail above a page title, in place of the prototype's "← Back" link (DECISIONS.md D-058): a crumb with
 * `to` links to its page; a crumb without one is the current page (`aria-current="page"`), truncated with an
 * ellipsis when it does not fit, its full text kept in a tooltip. Separators are hidden from screen readers.
 */
import { ChevronRight } from "lucide-vue-next";
import type { RouteLocationRaw } from "vue-router";

export interface Crumb {
  label: string;
  /** Where the crumb leads; without it the crumb is the current page. */
  to?: RouteLocationRaw;
}

defineProps<{ items: Crumb[] }>();
</script>

<template>
  <nav aria-label="Breadcrumb" class="mb-1.5 min-w-0 max-w-[1090px]">
    <ol class="m-0 flex min-w-0 list-none items-center p-0 text-xs leading-none">
      <li v-for="(item, i) in items" :key="i" class="flex items-center" :class="item.to ? 'shrink-0' : 'min-w-0'">
        <ChevronRight v-if="i > 0" class="mx-1 size-3.5 shrink-0 text-muted-foreground rtl:-scale-x-100" aria-hidden="true" :stroke-width="2.25" />
        <RouterLink
          v-if="item.to"
          :to="item.to"
          class="inline-flex min-h-6 items-center whitespace-nowrap rounded-sm font-bold tracking-[0.04em] text-primary no-underline underline-offset-[3px] hover:text-primary hover:underline"
        >
          {{ item.label }}
        </RouterLink>
        <span v-else aria-current="page" :title="item.label" class="block truncate py-[6px] font-semibold tracking-[0.02em] text-muted-foreground">
          {{ item.label }}
        </span>
      </li>
    </ol>
  </nav>
</template>
