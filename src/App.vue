<script setup lang="ts">
import { computed, watch } from "vue";
import { useRoute } from "vue-router";
import AppHeader from "@/components/AppHeader.vue";
import AppToast from "@/components/AppToast.vue";
import ConfirmDialog from "@/components/ConfirmDialog.vue";
import SessionErrorView from "@/views/SessionErrorView.vue";
import SignInView from "@/views/SignInView.vue";
import { session } from "@/platform/auth";
import { loadProjects } from "@/stores/projects";

// The visitor app preview in its own tab shows no CMS chrome.
const route = useRoute();
const bare = computed(() => route.meta.bare === true);

watch(
  () => session.status,
  (status) => {
    if (status === "authenticated") void loadProjects();
  },
  { immediate: true },
);
</script>

<template>
  <div class="flex min-h-screen flex-col bg-background" :class="{ 'min-w-[820px]': !bare }">
    <AppHeader v-if="!bare" />
    <div class="flex min-h-0 flex-1 items-stretch">
      <SignInView v-if="session.status === 'unauthenticated'" />
      <SessionErrorView v-else-if="session.status === 'error' && session.error" :error="session.error" />
      <RouterView v-else-if="session.status === 'authenticated'" />
    </div>
    <AppToast />
    <ConfirmDialog />
  </div>
</template>
