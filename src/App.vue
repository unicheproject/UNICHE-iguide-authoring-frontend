<script setup lang="ts">
import { computed, watch } from "vue";
import { useRoute } from "vue-router";
import AppHeader from "@/components/AppHeader.vue";
import AppToast from "@/components/AppToast.vue";
import ConfirmDialog from "@/components/ConfirmDialog.vue";
import OfflineBanner from "@/components/OfflineBanner.vue";
import SessionEndedDialog from "@/components/SessionEndedDialog.vue";
import SessionErrorView from "@/views/SessionErrorView.vue";
import SignInView from "@/views/SignInView.vue";
import { announcements } from "@/lib/announcer";
import { session } from "@/platform/auth";
import { loadProjects } from "@/stores/projects";

// The visitor app preview in its own tab shows no CMS chrome.
const route = useRoute();
const bare = computed(() => route.meta.bare === true);

// Title, focus on the page heading, the "<page> loaded" announcement and scrolling `<main>` to the top on every route
// change are done by `lib/routeAnnouncer.ts`, installed in `router.ts`.

/** Skip link target: the page's own <main>, focused without being added to the tab order. */
function skipToMain() {
  const main = document.querySelector<HTMLElement>("main");
  if (!main) return;
  if (!main.hasAttribute("tabindex")) main.setAttribute("tabindex", "-1");
  main.focus();
}

watch(
  () => session.status,
  (status) => {
    if (status === "authenticated") void loadProjects();
  },
  { immediate: true },
);
</script>

<template>
  <div class="app-shell flex min-h-screen flex-col bg-background">
    <a
      v-if="!bare"
      href="#main"
      class="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-skip focus:inline-flex focus:min-h-control focus:items-center focus:rounded-md focus:bg-primary focus:px-4 focus:text-sm focus:font-semibold focus:text-primary-foreground focus:no-underline focus:shadow-2"
      @click.prevent="skipToMain"
    >
      Skip to content
    </a>
    <AppHeader v-if="!bare" />
    <OfflineBanner v-if="!bare && session.status === 'authenticated'" />
    <!-- The page's <main> fills this and scrolls; a screen without one (sign-in) scrolls here. -->
    <div class="flex min-h-0 flex-1 items-stretch overflow-y-auto">
      <SignInView v-if="session.status === 'unauthenticated'" />
      <SessionErrorView v-else-if="session.status === 'error' && session.error" :error="session.error" />
      <RouterView v-else-if="session.status === 'authenticated'" />
    </div>
    <AppToast />
    <ConfirmDialog />
    <SessionEndedDialog />
    <!-- Live regions for `lib/announcer.ts`: route changes, saves, uploads, offline state. -->
    <div class="sr-only" role="status" aria-live="polite" aria-atomic="true">{{ announcements.polite }}</div>
    <div class="sr-only" role="alert" aria-live="assertive" aria-atomic="true">{{ announcements.assertive }}</div>
  </div>
</template>
