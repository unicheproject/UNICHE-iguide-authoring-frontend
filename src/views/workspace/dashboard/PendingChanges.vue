<script setup lang="ts">
/**
 * "Waiting for you to apply" (`12` §3, D-077): the Working Copies of ACTIVE items, newest first. Apply and Discard live
 * in the editor, so the title is the link. Who saved a copy is absent until the API says (G-025). Pending is
 * counted for the six Resource kinds only: Assets ignore `pending=true` (C1-52).
 */
import { computed } from "vue";
import type { RouteLocationRaw } from "vue-router";
import { formatDateTime } from "@/lib/format";
import { sectionLocation } from "@/workspace/sections";
import { CONTENT_KINDS, KIND_SINGULAR, PENDING_ROWS, RESOURCE_KINDS, type PendingChanges, type ResourceKindPath } from "@/platform/dashboardData";

const props = defineProps<{ projectId: string; pending: PendingChanges }>();

const EDITOR: Record<ResourceKindPath, { name: string; param: string }> = {
  places: { name: "place-editor", param: "placeId" },
  pois: { name: "poi-editor", param: "poiId" },
  routes: { name: "route-editor", param: "routeId" },
  guides: { name: "guide-editor", param: "guideId" },
  events: { name: "event-editor", param: "eventId" },
  categories: { name: "category-editor", param: "categoryId" },
};

const to = (kind: ResourceKindPath, id: string): RouteLocationRaw => ({
  name: EDITOR[kind].name,
  params: { projectId: props.projectId, [EDITOR[kind].param]: id },
});

const rows = computed(() => props.pending.items.slice(0, PENDING_ROWS));
/** Kinds that have pending changes, each linking to its list filtered to them ("See all"). */
const kinds = computed(() =>
  RESOURCE_KINDS.filter((k) => props.pending.perKind[k] > 0).map((k) => ({
    kind: k,
    label: CONTENT_KINDS.find((c) => c.path === k)?.label ?? k,
    count: props.pending.perKind[k],
    to: { ...sectionLocation(props.projectId, k), query: { pending: "1" } } as RouteLocationRaw,
  })),
);
</script>

<template>
  <section aria-labelledby="pending-title" class="rounded-lg border border-border bg-card shadow-1">
    <div class="px-5 pb-3 pt-5">
      <h2 id="pending-title" class="text-base font-bold">Waiting for you to apply</h2>
      <p class="mt-1 text-sm text-muted-foreground">
        {{ pending.total }} {{ pending.total === 1 ? "item has" : "items have" }} saved changes visitors do not see yet. Open one to apply or
        discard them.
      </p>
    </div>
    <div class="overflow-x-auto">
      <table class="w-full text-sm">
        <caption class="sr-only">Items with pending changes, most recently saved first</caption>
        <thead class="bg-muted text-left text-compact text-ink-2">
          <tr>
            <th scope="col" class="px-5 py-2 font-semibold">Title</th>
            <th scope="col" class="px-3 py-2 font-semibold">Kind</th>
            <th scope="col" class="px-5 py-2 font-semibold">Saved</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in rows" :key="`${row.kind}-${row.id}`" class="border-t border-border">
            <td class="min-w-0 max-w-[22rem] px-5 py-2 font-medium">
              <RouterLink :to="to(row.kind, row.id)" class="hit-44 line-clamp-2 break-words"><bdi>{{ row.title }}</bdi></RouterLink>
            </td>
            <td class="whitespace-nowrap px-3 py-2 text-ink-2">{{ KIND_SINGULAR[row.kind] }}</td>
            <td class="whitespace-nowrap px-5 py-2 text-ink-2 tabular">{{ formatDateTime(row.savedAt) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <div class="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-border px-5 py-3 text-compact text-muted-foreground">
      <span class="tabular">Showing {{ rows.length }} of {{ pending.total }}</span>
      <template v-if="pending.total > rows.length || kinds.length > 1">
        <span>See all:</span>
        <RouterLink v-for="k in kinds" :key="k.kind" :to="k.to" class="hit-44 font-medium">
          {{ k.label }} ({{ k.count }})
        </RouterLink>
      </template>
      <RouterLink v-else-if="kinds[0]" :to="kinds[0].to" class="hit-44 font-medium">See all</RouterLink>
    </div>
  </section>
</template>
