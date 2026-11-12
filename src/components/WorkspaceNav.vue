<script setup lang="ts">
import { ref, toRef, watch } from "vue";
import { useRoute } from "vue-router";
import { sectionOff, useProjectSettings } from "@/workspace/projectSettings";
import { navOwner, sectionLocation, workspaceNav } from "@/workspace/sections";

const props = defineProps<{ projectId: string }>();

// A content kind whose capability is off stays in the menu, greyed with the reason (`12` §3, CMS D-049).
const settings = useProjectSettings(toRef(props, "projectId"));

const route = useRoute();

// Below 768 CSS pixels (a narrow window, or 200% zoom on a laptop) the menu is a disclosure above the page instead
// of a fixed column, so nothing scrolls sideways (WCAG 1.4.10, D-054). It closes when a section opens.
const open = ref(false);
watch(() => route.fullPath, () => (open.value = false));

function isActive(slug: string | null): boolean {
  if (slug === null) return route.name === "project";
  // Dedicated pages declare their section in the route meta; placeholders carry it as a parameter.
  const current = (route.meta.section ?? route.params.section) as string | undefined;
  return !!current && navOwner(current) === slug;
}
</script>

<template>
  <div class="flex-none border-b bg-card px-4 py-2 md:hidden">
    <button
      type="button"
      class="flex items-center gap-2 text-[13px] font-bold text-primary"
      aria-controls="workspace-nav"
      :aria-expanded="open"
      @click="open = !open"
    >
      <span aria-hidden="true">{{ open ? "✕" : "☰" }}</span> Menu
    </button>
  </div>
  <nav
    id="workspace-nav"
    aria-label="Primary"
    class="workspace-nav overflow-y-auto overscroll-contain border-b bg-card pb-4 pt-2.5 md:block md:w-[236px] md:flex-[0_0_236px] md:border-b-0 md:border-r md:pb-10"
    :class="open ? 'block' : 'hidden'"
  >
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
        <span class="whitespace-nowrap text-[9px] font-extrabold uppercase tracking-[0.16em] text-gray-500">
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
        :title="sectionOff(settings, entry.section.slug) ?? undefined"
      >
        <span class="min-w-0 flex-1" :class="{ 'text-gray-500': sectionOff(settings, entry.section.slug) && !isActive(entry.section.slug) }">
          {{ entry.section.title }}
        </span>
        <template v-if="sectionOff(settings, entry.section.slug)">
          <span class="off-pill" aria-hidden="true">off</span>
          <span class="sr-only">, off. {{ sectionOff(settings, entry.section.slug) }}</span>
        </template>
      </RouterLink>
    </template>
  </nav>
</template>

<style scoped>
/* Opened above the page on a small screen, the menu keeps part of the page in view and scrolls itself (D-062). */
@media (max-width: 767.98px) and (min-height: 420px) {
  .workspace-nav {
    max-height: 55dvh;
  }
}
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
.off-pill {
  flex: none;
  border: 1px solid #e5e7eb;
  border-radius: 999px;
  background: #f3f4f6;
  padding: 1px 7px;
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #4b5563;
}
.nav-item.active,
.nav-item.active:hover {
  border-left-color: #4c1d8b;
  background: rgba(76, 29, 139, 0.08);
  font-weight: 700;
  color: #4c1d8b;
}
</style>
