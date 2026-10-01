<script setup lang="ts">
import { Button } from "@/components/ui/button";
import type { SessionError } from "@/platform/auth";

defineProps<{ error: SessionError }>();

function retry() {
  window.location.reload();
}
</script>

<template>
  <main class="flex flex-1 items-center justify-center p-6">
    <section
      role="alert"
      class="w-full max-w-[520px] rounded-lg border border-l-[3px] border-l-destructive bg-card px-6 py-5"
    >
      <strong class="block text-[13px] font-bold text-destructive">{{ error.title }}</strong>
      <p class="mt-1.5 text-[13px] text-gray-700">{{ error.detail }}</p>
      <Button variant="outline" size="sm" class="mt-4" @click="retry">Try again</Button>
    </section>
  </main>
</template>
