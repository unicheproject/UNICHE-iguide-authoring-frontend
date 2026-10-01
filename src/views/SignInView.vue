<script setup lang="ts">
import { ref } from "vue";
import { Button } from "@/components/ui/button";
import { login } from "@/platform/auth";

const redirecting = ref(false);

function signIn() {
  redirecting.value = true;
  void login();
}
</script>

<template>
  <main class="flex flex-1 items-center justify-center p-6">
    <section
      aria-labelledby="sign-in-title"
      class="w-full max-w-[440px] rounded-[10px] border bg-card px-8 py-9 text-center"
    >
      <span class="text-[11px] font-extrabold uppercase tracking-[0.16em] text-primary">iGuide CMS</span>
      <h1 id="sign-in-title" class="mt-2 text-2xl font-extrabold leading-tight tracking-[-0.01em]">
        Sign in to author your guides
      </h1>
      <p class="mt-3 text-[13px] text-muted-foreground">
        iGuide uses your UNICHE account. Once you are signed in, every UNICHE tool opens without asking
        again.
      </p>
      <Button class="mt-7" :disabled="redirecting" @click="signIn">
        {{ redirecting ? "Opening UNICHE sign-in…" : "Sign in with UNICHE" }}
      </Button>
    </section>
  </main>
</template>
