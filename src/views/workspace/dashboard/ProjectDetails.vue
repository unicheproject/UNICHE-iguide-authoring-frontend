<script setup lang="ts">
/**
 * Project details (plan 2.5, D-077, D-112): organisation, slug, template and dates, collapsed because they rarely change.
 * When the viewer dismissed the first-run guide and it would still apply, "Show the guide again" brings it back.
 */
import { ChevronRight } from "lucide-vue-next";
import { computed, nextTick } from "vue";
import { Button } from "@/components/ui/button";
import { say } from "@/lib/announcer";
import { formatDate } from "@/lib/format";
import type { Project } from "@/platform/catalogue";
import { useGuideMemory } from "./guideState";

const props = defineProps<{
  project: Project;
  /** Null while the organisations are still loading. */
  organisationName: string | null;
  /** The guide was dismissed and its conditions still hold, so it can be restored. */
  canRestoreGuide: boolean;
}>();

const rows = computed(() => [
  { label: "Organisation", value: props.organisationName ?? "Not loaded yet", mono: false },
  { label: "Slug", value: props.project.slug, mono: true },
  ...(props.project.template
    ? [{ label: "Template", value: `${props.project.template.name} v${props.project.template.version}`, mono: false }]
    : []),
  { label: "Created", value: formatDate(props.project.createdAt), mono: false },
  { label: "Last updated", value: formatDate(props.project.updatedAt), mono: false },
]);

const guide = useGuideMemory(computed(() => props.project.id));
async function restore() {
  guide.restore();
  say("First-run guide shown");
  await nextTick();
  document.getElementById("guide-title")?.focus();
}
</script>

<template>
  <details class="group rounded-lg border border-border bg-card shadow-1">
    <summary class="flex min-h-control cursor-pointer list-none items-center gap-2 px-5 py-3 text-base font-bold [&::-webkit-details-marker]:hidden">
      <ChevronRight class="size-4 shrink-0 transition-transform group-open:rotate-90" aria-hidden="true" />
      Project details
    </summary>
    <dl class="flex flex-col gap-2 border-t border-border px-5 py-3 text-sm">
      <div v-for="r in rows" :key="r.label" class="flex flex-wrap justify-between gap-x-4">
        <dt class="text-muted-foreground">{{ r.label }}</dt>
        <dd class="min-w-0 break-words font-medium" :class="r.mono && 'mono'">{{ r.value }}</dd>
      </div>
    </dl>
    <div v-if="canRestoreGuide" class="border-t border-border px-5 py-3">
      <Button variant="secondary" size="sm" @click="restore">Show the guide again</Button>
    </div>
  </details>
</template>
