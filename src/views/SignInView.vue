<script setup lang="ts">
/**
 * Sign-in (`12` §4): one brand (the header carries the logo; the card does not repeat it), one sentence of what happens, one button. The page sets its own document title and
 * moves focus to nothing until the author acts, so the skip link stays the first tab stop.
 */
import { ref } from "vue";
import PageFrame from "@/components/PageFrame.vue";
import { Button } from "@/components/ui/button";
import { login } from "@/platform/auth";
import { useHeldTitle } from "./heldTitle";

const redirecting = ref(false);

useHeldTitle(ref("Sign in"));

function signIn() {
  redirecting.value = true;
  void login();
}
</script>

<template>
  <PageFrame narrow>
    <section aria-labelledby="sign-in-title" class="mx-auto mt-6 w-full max-w-md rounded-lg sm:mt-16 border border-border bg-card px-8 py-10 text-center shadow-1">
      <h1 id="sign-in-title" tabindex="-1" class="text-xl font-bold">Sign in to iGuide CMS</h1>
      <p class="mx-auto mt-3 max-w-prose text-sm text-muted-foreground">
        Use your UNICHE account. If you are already signed in to another UNICHE tool, you will not be asked again.
      </p>
      <Button class="mt-7 w-full sm:w-auto sm:min-w-56" :loading="redirecting" @click="signIn">
        {{ redirecting ? "Opening UNICHE sign-in" : "Sign in with UNICHE" }}
      </Button>
    </section>
  </PageFrame>
</template>
