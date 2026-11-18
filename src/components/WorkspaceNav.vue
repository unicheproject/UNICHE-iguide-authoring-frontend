<script setup lang="ts">
/**
 * The workspace menu (D-073): a 232 px column from 1100 px, an off-canvas drawer below it (scrim, focus trap, Esc
 * closes and returns focus to the header button, 44 px items). Items carry a 20 px icon; a capability that is off stays
 * in the list, greyed, with an "Off" chip on the same single line; the reason is read through `aria-describedby` and
 * shown on the destination page (D-097, C2-19). Arrow keys, Home and End move between items. While `pending` (the
 * Project is not confirmed yet) the menu is `inert`, so no click lands on a Project that may not open (C2-21).
 */
import { X } from "lucide-vue-next";
import { computed, nextTick, onBeforeUnmount, ref, toRef, watch } from "vue";
import { useMediaQuery } from "@vueuse/core";
import { useRoute } from "vue-router";
import { Chip } from "@/components/ui/chip";
import { restoreFocus } from "@/lib/focus";
import { navDrawer, setNavDrawer } from "@/stores/navDrawer";
import { sectionOff, useProjectSettings } from "@/workspace/projectSettings";
import { navOwner, sectionIcon, sectionLocation, workspaceNav } from "@/workspace/sections";

const props = defineProps<{ projectId: string; pending?: boolean }>();

// A content kind whose capability is off stays in the menu, greyed with the reason (`12` §3, CMS D-049).
const settings = useProjectSettings(toRef(props, "projectId"));
const route = useRoute();
const nav = ref<HTMLElement | null>(null);

// Below 1100 CSS pixels (a narrow window, or 200% zoom on a laptop) the menu is a drawer, so nothing scrolls sideways
// (WCAG 1.4.10, D-054).
const drawerMode = useMediaQuery("(max-width: 1099.98px)");
const open = computed(() => drawerMode.value && navDrawer.open);

function isActive(slug: string | null): boolean {
  if (slug === null) return route.name === "project";
  // Dedicated pages declare their section in the route meta; placeholders carry it as a parameter.
  const current = (route.meta.section ?? route.params.section) as string | undefined;
  return !!current && navOwner(current) === slug;
}

function close(returnFocus = true) {
  const wasOpen = navDrawer.open;
  setNavDrawer(false);
  if (wasOpen && returnFocus) restoreFocus(document.getElementById("nav-toggle"));
}

watch(() => route.fullPath, () => setNavDrawer(false));
watch(drawerMode, (isDrawer) => {
  if (!isDrawer) setNavDrawer(false);
});
watch(open, async (now) => {
  if (!now) return;
  await nextTick();
  (nav.value?.querySelector<HTMLElement>("a[aria-current='page']") ?? nav.value?.querySelector<HTMLElement>("a"))?.focus();
});
onBeforeUnmount(() => setNavDrawer(false));

function items(): HTMLElement[] {
  return nav.value ? [...nav.value.querySelectorAll<HTMLElement>("a[href], button:not([disabled])")] : [];
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === "Escape" && open.value) {
    event.stopPropagation();
    close();
    return;
  }
  const list = items();
  const index = list.indexOf(document.activeElement as HTMLElement);
  if (event.key === "ArrowDown" || event.key === "ArrowUp" || event.key === "Home" || event.key === "End") {
    if (!list.length) return;
    event.preventDefault();
    const next =
      event.key === "Home" ? 0 : event.key === "End" ? list.length - 1 : (index + (event.key === "ArrowDown" ? 1 : -1) + list.length) % list.length;
    list[next].focus();
  } else if (event.key === "Tab" && open.value && list.length) {
    // The drawer is modal: Tab wraps inside it.
    if (event.shiftKey && index <= 0) {
      event.preventDefault();
      list[list.length - 1].focus();
    } else if (!event.shiftKey && index === list.length - 1) {
      event.preventDefault();
      list[0].focus();
    }
  }
}
</script>

<template>
  <div v-if="open" class="fixed inset-0 z-drawer bg-scrim animate-fade-in nav:hidden" aria-hidden="true" @click="close()"></div>
  <nav
    id="workspace-nav"
    ref="nav"
    aria-label="Menu"
    :inert="pending || undefined"
    :aria-busy="pending ? 'true' : undefined"
    :aria-modal="open ? 'true' : undefined"
    :role="open ? 'dialog' : undefined"
    class="flex-col overflow-y-auto overscroll-contain bg-card pb-6 nav:static nav:flex nav:w-nav nav:flex-none nav:border-r nav:border-border max-nav:fixed max-nav:inset-y-0 max-nav:left-0 max-nav:z-drawer max-nav:w-[min(20rem,calc(100vw-3rem))] max-nav:shadow-3"
    :class="open ? 'flex max-nav:animate-slide-in-left' : 'max-nav:hidden'"
    @keydown="onKeydown"
  >
    <div class="flex h-header flex-none items-center justify-between border-b border-border px-4 nav:hidden">
      <span class="text-base font-bold">Menu</span>
      <button
        type="button"
        class="inline-flex size-11 items-center justify-center rounded-md text-foreground hover:bg-surface-hover"
        aria-label="Close menu"
        @click="close()"
      >
        <X class="size-5" aria-hidden="true" />
      </button>
    </div>
    <div class="flex flex-col gap-0.5 px-2 pt-3">
      <RouterLink
        :to="{ name: 'project', params: { projectId } }"
        class="nav-item"
        :aria-current="isActive(null) ? 'page' : undefined"
      >
        <component :is="sectionIcon(null)" class="size-5 shrink-0" aria-hidden="true" />
        <span class="min-w-0 flex-1">Dashboard</span>
      </RouterLink>
      <template v-for="(entry, index) in workspaceNav" :key="index">
        <p v-if="'group' in entry" class="px-3 pb-1 pt-5 text-xs font-semibold text-muted-foreground">{{ entry.group }}</p>
        <hr v-else-if="'divider' in entry" class="mx-3 my-2 border-border" />
        <RouterLink
          v-else
          :to="sectionLocation(projectId, entry.section.slug)"
          class="nav-item"
          :class="sectionOff(settings, entry.section.slug) && !isActive(entry.section.slug) && 'text-muted-foreground'"
          :aria-current="isActive(entry.section.slug) ? 'page' : undefined"
          :aria-describedby="sectionOff(settings, entry.section.slug) ? `nav-off-${entry.section.slug}` : undefined"
        >
          <component :is="sectionIcon(entry.section.slug)" class="size-5 shrink-0" aria-hidden="true" />
          <span class="min-w-0 flex-1 truncate">{{ entry.section.title }}</span>
          <template v-if="sectionOff(settings, entry.section.slug)">
            <Chip tone="outline" class="flex-none">Off</Chip>
            <span :id="`nav-off-${entry.section.slug}`" class="sr-only">Off: {{ sectionOff(settings, entry.section.slug) }}</span>
          </template>
        </RouterLink>
      </template>
    </div>
  </nav>
</template>

<style scoped>
/* Menu item: 36 px (44 in the drawer and on touch), brand tint and a 3 px inset marker on the current one. */
.nav-item {
  display: flex;
  min-height: 2.25rem;
  align-items: center;
  gap: 0.75rem;
  border-radius: 0.5rem;
  padding: 0.375rem 0.75rem;
  @apply text-compact;
  font-weight: 500;
  color: hsl(var(--ink-2));
  text-decoration: none;
  transition:
    background-color var(--dur-1) var(--ease-std),
    color var(--dur-1) var(--ease-std);
}
.nav-item:hover {
  background: hsl(var(--surface-hover));
  color: hsl(var(--foreground));
  text-decoration: none;
}
.nav-item[aria-current="page"],
.nav-item[aria-current="page"]:hover {
  background: hsl(var(--accent));
  box-shadow: inset 3px 0 0 hsl(var(--primary));
  font-weight: 600;
  color: hsl(var(--primary));
}
@media (max-width: 1099.98px), (pointer: coarse) {
  .nav-item {
    min-height: 2.75rem;
  }
}
</style>
