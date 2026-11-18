<script setup lang="ts">
/**
 * The title link of a list row (D-110, C3-48, C3-50, C3-51): one component for all six lists, so the link looks and
 * behaves alike. The text sits in `<bdi>` (an Arabic or Greek title next to Latin punctuation never reorders), wraps
 * anywhere inside its cell, and the link has a 44 px hit area (`hit-44`). It carries the list the author came from:
 * `back` is `listBackQuery` of the list's address (the editor's breadcrumb and Back return to the same worklist), and
 * while "Needs translation in <language>" is on, `lang` opens the editor on that language's tab.
 *
 * Pass `to` as a route object (`{ name, params }`); a `query` of its own is kept and extended.
 */
import { computed } from "vue";
import { useRoute, type RouteLocationRaw } from "vue-router";
import { listBackQuery } from "@/workspace/listBack";

const props = defineProps<{
  to: Exclude<RouteLocationRaw, string>;
  /** Greyed (an ARCHIVED row). */
  muted?: boolean;
  /** The "Needs translation" language of the list (`query.missing.value`); opens the editor on that language. */
  missing?: string;
}>();

const route = useRoute();
const target = computed<RouteLocationRaw>(() => {
  const back = listBackQuery(route.query);
  const own = "query" in props.to && props.to.query ? props.to.query : {};
  return {
    ...props.to,
    query: { ...own, ...(props.missing ? { lang: props.missing } : {}), ...(back ? { back } : {}) },
  } as RouteLocationRaw;
});
</script>

<template>
  <RouterLink
    :to="target"
    class="hit-44 font-semibold no-underline [overflow-wrap:anywhere] hover:underline"
    :class="muted ? 'text-muted-foreground' : 'text-foreground'"
  >
    <bdi><slot /></bdi>
  </RouterLink>
</template>
