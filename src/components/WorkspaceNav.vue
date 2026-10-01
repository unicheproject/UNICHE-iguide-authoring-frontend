<script setup lang="ts">
import { useRoute } from "vue-router";
import { navOwner, sectionLocation, workspaceNav } from "@/workspace/sections";

defineProps<{ projectId: string }>();

const route = useRoute();

function isActive(slug: string | null): boolean {
  if (slug === null) return route.name === "project";
  // Dedicated pages declare their section in the route meta; placeholders carry it as a parameter.
  const current = (route.meta.section ?? route.params.section) as string | undefined;
  return !!current && navOwner(current) === slug;
}
</script>

<template>
  <nav aria-label="Primary" class="w-[236px] flex-[0_0_236px] overflow-y-auto border-r bg-card pb-10 pt-2.5">
    <RouterLink
      :to="{ name: 'project', params: { projectId } }"
      class="nav-item"
      :class="{ active: isActive(null) }"
      :aria-current="isActive(null) ? 'page' : undefined"
    >
      Dashboard
    </RouterLink>
    <template v-for="(entry, index) in workspaceNav" :key="index">
      <div v-if="'group' in entry" class="flex items-center gap-2 px-4 pb-[7px] pt-[18px]">
        <span class="whitespace-nowrap text-[9px] font-extrabold uppercase tracking-[0.16em] text-gray-400">
          {{ entry.group }}
        </span>
        <span class="h-px flex-1 bg-muted"></span>
      </div>
      <RouterLink
        v-else
        :to="sectionLocation(projectId, entry.section.slug)"
        class="nav-item"
        :class="{ active: isActive(entry.section.slug) }"
        :aria-current="isActive(entry.section.slug) ? 'page' : undefined"
      >
        {{ entry.section.title }}
      </RouterLink>
    </template>
  </nav>
</template>

<style scoped>
/* Menu item of the mockup: 3px left marker, purple tint and bold text when active. */
.nav-item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  border-left: 3px solid transparent;
  padding: 7px 14px 7px 13px;
  font-size: 13px;
  font-weight: 500;
  color: #374151;
  text-decoration: none;
}
.nav-item:hover {
  background: #f3f4f6;
  color: #374151;
  text-decoration: none;
}
.nav-item.active,
.nav-item.active:hover {
  border-left-color: #4c1d8b;
  background: rgba(76, 29, 139, 0.08);
  font-weight: 700;
  color: #4c1d8b;
}
</style>
