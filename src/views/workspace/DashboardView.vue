<script setup lang="ts">
import { computed } from "vue";
import PageHead from "@/components/PageHead.vue";
import { formatDate } from "@/lib/format";
import { findOrganisation } from "@/stores/projects";
import { useCurrentProject } from "@/workspace/currentProject";

const project = useCurrentProject();

const organisationName = computed(() => findOrganisation(project.value.orgId)?.name ?? "Organisation");

const details = computed(() => [
  { label: "Organisation", value: organisationName.value },
  { label: "Slug", value: project.value.slug, mono: true },
  { label: "Created", value: formatDate(project.value.createdAt) },
  { label: "Last updated", value: formatDate(project.value.updatedAt) },
]);
</script>

<template>
  <main class="relative min-w-0 flex-1 overflow-y-auto px-7 pb-16 pt-6">
    <PageHead
      title="Dashboard"
      :subtitle="`${project.name} · ${organisationName}. The UNICHE Catalogue confirmed your access to this Project.`"
      :status="project.status"
    />

    <div class="grid grid-cols-[repeat(auto-fill,minmax(190px,1fr))] gap-3.5">
      <div v-for="d in details" :key="d.label" class="min-w-0 rounded-[10px] border bg-card p-[18px]">
        <span class="block text-[10px] font-extrabold uppercase tracking-[0.1em] text-muted-foreground">{{ d.label }}</span>
        <span class="mt-1 block break-words text-[15px] font-bold" :class="d.mono ? 'font-mono text-[13px]' : ''">
          {{ d.value }}
        </span>
      </div>
    </div>
  </main>
</template>
