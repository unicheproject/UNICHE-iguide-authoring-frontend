<script setup lang="ts">
import { computed, nextTick, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import AppHeader from "@/components/AppHeader.vue";
import AppToast from "@/components/AppToast.vue";
import ConfirmDialog from "@/components/ConfirmDialog.vue";
import OfflineBanner from "@/components/OfflineBanner.vue";
import SessionErrorView from "@/views/SessionErrorView.vue";
import SignInView from "@/views/SignInView.vue";
import { session } from "@/platform/auth";
import { loadProjects } from "@/stores/projects";

// The visitor app preview in its own tab shows no CMS chrome.
const route = useRoute();
const bare = computed(() => route.meta.bare === true);

// Only <main> scrolls (D-062), so the router's window scrolling does nothing: a new page starts at its top here.
// A change of query only (a list filter) keeps the position.
useRouter().afterEach((to, from) => {
  if (to.path === from.path) return;
  void nextTick(() => {
    document.querySelector("main")?.scrollTo({ top: 0 });
    window.scrollTo({ top: 0 });
  });
});

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
      href="#"
      class="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[90] focus:rounded-full focus:bg-primary focus:px-4 focus:py-2 focus:text-xs focus:font-bold focus:text-primary-foreground focus:no-underline focus:shadow-lg"
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
  </div>
</template>
