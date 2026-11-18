<script setup lang="ts">
/**
 * Translation completeness per language in a list row: a drawn icon (check complete, dotted circle partly, empty
 * circle missing), the language's own name with its `lang`, and the full wording for screen readers, so state never rests
 * on colour (`14` §4, D-070). With `to`, each language is a link into the editor on that language. The legend is in the
 * list footer (`ListFooter legend`). Keeps the props it always had; `to` and `names` (language name instead of code)
 * are additions. `route` is the short form for list rows: every dot links to that editor route with `?lang=<code>`, so
 * the editor opens on that language's tab (C2-50). Each language is one unit that never breaks inside a word; extra
 * languages wrap between units (C2-42). Round 3 (D-110, C3-101): each unit is 32 px high (44 on a coarse pointer), and
 * the `route` links carry `back` (`listBackQuery`), so the editor's breadcrumb returns to the same worklist (C3-51).
 */
import { Check, Circle, CircleDot } from "lucide-vue-next";
import type { Component } from "vue";
import { useRoute, type RouteLocationRaw } from "vue-router";
import type { ProjectLanguage } from "@/platform/languages";
import { listBackQuery } from "@/workspace/listBack";

export type Completeness = "complete" | "partial" | "missing";

const props = defineProps<{
  languages: ProjectLanguage[];
  completeness: (languageCode: string) => Completeness;
  /** Makes each language a link; return null for none. */
  to?: (languageCode: string) => RouteLocationRaw | null;
  /** The row's editor route; each dot links to it with `?lang=<language code>` (ignored when `to` is given). */
  route?: RouteLocationRaw;
  /** The language's own name ("Ελληνικά") instead of its code ("EL"); the code keeps tight legacy columns one line each. */
  names?: boolean;
}>();

const LOOK: Record<Completeness, { icon: Component; ink: string; label: string }> = {
  complete: { icon: Check, ink: "text-success", label: "complete" },
  partial: { icon: CircleDot, ink: "text-warning", label: "partly translated" },
  missing: { icon: Circle, ink: "text-muted-foreground", label: "not translated" },
};

const current = useRoute();

/** The row's route plus `?lang=`; only for a route given as an object (a path string is left alone). */
function withLang(code: string): RouteLocationRaw | null {
  const route = props.route;
  if (!route) return null;
  if (typeof route === "string") return `${route}${route.includes("?") ? "&" : "?"}lang=${encodeURIComponent(code)}`;
  const back = listBackQuery(current.query);
  return { ...route, query: { ...("query" in route ? route.query : {}), lang: code, ...(back ? { back } : {}) } } as RouteLocationRaw;
}

const items = () =>
  props.languages.map((l) => {
    const look = LOOK[props.completeness(l.languageCode)];
    return { code: l.languageCode, name: l.displayName, ...look, target: props.to?.(l.languageCode) ?? withLang(l.languageCode) };
  });
</script>

<template>
  <ul class="m-0 flex list-none flex-wrap gap-x-3 p-0">
    <li v-for="d in items()" :key="d.code" :title="`${d.name}: ${d.label}`" class="whitespace-nowrap">
      <component
        :is="d.target ? 'RouterLink' : 'span'"
        :to="d.target ?? undefined"
        class="inline-flex min-h-8 items-center gap-1 text-compact font-medium text-ink-2 [@media(pointer:coarse)]:min-h-11"
        :class="d.target && 'rounded-sm hover:underline'"
      >
        <component :is="d.icon" class="size-4 shrink-0" :class="d.ink" aria-hidden="true" :stroke-width="d.icon === Check ? 3 : 2" />
        <bdi :lang="d.code">{{ names ? d.name : d.code.toUpperCase() }}</bdi>
        <span class="sr-only">: {{ d.label }}</span>
      </component>
    </li>
  </ul>
</template>
