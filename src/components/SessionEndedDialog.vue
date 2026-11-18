<script setup lang="ts">
/**
 * "Your session ended. [Sign in again]" (plan 2.4, D-078, D-097; "Your unsaved edits are kept in this browser" only while an editor holds some, C3-92), shown
 * before the single redirect to sign-in. Shown while `sessionNotice.ended` is set. It can be dismissed (Escape, the close
 * button or "Stay on this page"): the author may want to copy text out of the form first, and nothing here may trap
 * them. Dismissing does not sign in; the next request that needs a session shows it again.
 */
import AppDialog from "@/components/AppDialog.vue";
import { Button } from "@/components/ui/button";
import { login } from "@/platform/auth";
import { clearSessionEnded, sessionNotice } from "@/stores/sessionNotice";

/** Starts the sign-in again. */
function signIn() {
  clearSessionEnded();
  void login();
}
</script>

<template>
  <AppDialog v-if="sessionNotice.ended" title="Your session ended" size="sm" @close="clearSessionEnded()">
    <p v-if="sessionNotice.unsaved" class="pb-1 text-sm text-ink-2">
      Your unsaved edits are kept in this browser. Sign in again to carry on where you were, or stay on this page to copy
      something first; changes cannot be saved until you sign in.
    </p>
    <p v-else class="pb-1 text-sm text-ink-2">Sign in again to carry on where you were. Nothing is waiting to be saved.</p>
    <template #actions>
      <Button variant="secondary" @click="clearSessionEnded()">Stay on this page</Button>
      <Button @click="signIn">Sign in again</Button>
    </template>
  </AppDialog>
</template>
