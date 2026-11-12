<script setup lang="ts">
/**
 * Translation completeness per language in a list row: a symbol (✓ complete, ◐ partly, ○ missing) beside the
 * language code, the full wording for screen readers, and the colour only as a third cue (`14` §4, D-042).
 */
import type { ProjectLanguage } from "@/platform/languages";

export type Completeness = "complete" | "partial" | "missing";

const props = defineProps<{
  languages: ProjectLanguage[];
  completeness: (languageCode: string) => Completeness;
}>();

const LOOK: Record<Completeness, { glyph: string; color: string; label: string }> = {
  complete: { glyph: "✓", color: "#0c6d62", label: "complete" },
  partial: { glyph: "◐", color: "#855400", label: "partly translated" },
  missing: { glyph: "○", color: "#6b7280", label: "not translated" },
};

const items = () =>
  props.languages.map((l) => {
    const look = LOOK[props.completeness(l.languageCode)];
    return { code: l.languageCode, ...look, label: `${l.displayName}: ${look.label}` };
  });
</script>

<template>
  <div class="flex flex-wrap gap-2">
    <span
      v-for="d in items()"
      :key="d.code"
      :title="d.label"
      class="inline-flex items-center gap-[3px] text-[10px] font-bold text-muted-foreground"
    >
      <span aria-hidden="true" class="text-[11px] leading-none" :style="{ color: d.color }">{{ d.glyph }}</span>
      <span aria-hidden="true">{{ d.code }}</span>
      <span class="sr-only">{{ d.label }}</span>
    </span>
  </div>
</template>
