<script setup lang="ts">
/**
 * Tab strip made of router links (section tabs such as Maps / Floor plans). Each tab is a link with
 * `aria-current="page"` on the current one, optionally with a count; the look matches `TabsTrigger`.
 */
import type { RouteLocationRaw } from "vue-router";

export interface LinkTab {
  key: string;
  label: string;
  to: RouteLocationRaw;
  /** Shown after the label, when known. */
  count?: number | null;
}

defineProps<{ tabs: LinkTab[]; current: string; label: string }>();
</script>

<template>
  <nav :aria-label="label" class="-m-1 mb-4 flex overflow-x-auto border-b border-border p-1">
    <RouterLink
      v-for="tab in tabs"
      :key="tab.key"
      :to="tab.to"
      :aria-current="tab.key === current ? 'page' : undefined"
      class="ui-tab -mb-px inline-flex min-h-control items-center gap-2 whitespace-nowrap border-b-2 px-4 text-sm font-semibold no-underline transition-ui duration-1 hover:no-underline active:bg-surface-active"
      :class="tab.key === current ? 'border-primary text-primary hover:text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'"
    >
      {{ tab.label }}
      <span v-if="tab.count != null" class="rounded-full tabular-nums bg-muted px-2 text-xs font-semibold text-ink-2">{{ tab.count }}</span>
    </RouterLink>
  </nav>
</template>
