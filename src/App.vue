<script setup lang="ts">
import { watch } from "vue";
import AppHeader from "@/components/AppHeader.vue";
import AppToast from "@/components/AppToast.vue";
import SessionErrorView from "@/views/SessionErrorView.vue";
import SignInView from "@/views/SignInView.vue";
import { session } from "@/platform/auth";
import { loadProjects } from "@/stores/projects";

watch(
  () => session.status,
  (status) => {
    if (status === "authenticated") void loadProjects();
  },
  { immediate: true },
);
</script>

<template>
  <div class="flex min-h-screen min-w-[820px] flex-col bg-background">
    <AppHeader />
    <div class="flex min-h-0 flex-1 items-stretch">
      <SignInView v-if="session.status === 'unauthenticated'" />
      <SessionErrorView v-else-if="session.status === 'error' && session.error" :error="session.error" />
      <RouterView v-else-if="session.status === 'authenticated'" />
    </div>
    <AppToast />
  </div>
</template>
