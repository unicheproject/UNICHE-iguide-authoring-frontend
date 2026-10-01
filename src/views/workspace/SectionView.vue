<script setup lang="ts">
import { computed } from "vue";
import PageHead from "@/components/PageHead.vue";
import SectionTabs from "@/components/SectionTabs.vue";
import { useCurrentProject } from "@/workspace/currentProject";
import { findSection } from "@/workspace/sections";

const props = defineProps<{ section: string }>();

// The router only admits known section slugs, so the lookup always succeeds.
const current = computed(() => findSection(props.section)!);
const project = useCurrentProject();
</script>

<template>
  <main class="relative min-w-0 flex-1 overflow-y-auto px-7 pb-16 pt-6">
    <PageHead :title="current.title" :subtitle="current.subtitle" />
    <SectionTabs :project-id="project.id" :section="current.slug" />

    <div class="max-w-[640px] rounded-[10px] border bg-card px-[18px] py-4">
      <strong class="block text-[13px] font-bold">Not available yet</strong>
      <p class="mt-1 text-[13px] text-muted-foreground">
        {{ current.title }} is part of the iGuide CMS design, but the authoring backend does not offer it yet.
      </p>
    </div>
  </main>
</template>
