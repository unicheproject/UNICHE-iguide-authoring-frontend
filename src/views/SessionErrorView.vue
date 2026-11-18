<script setup lang="ts">
/**
 * The full-page state for a sign-in that could not finish (configuration missing, sign-in service silent, a token the CMS
 * cannot use, a session that keeps ending). It speaks to the author: what happened and the one next step; the names of
 * settings, hosts and clients sit in the collapsed "Technical details" (D-078, C1-64). "Try again" is offered only where
 * trying again can help.
 */
import { CloudOff, KeyRound, Settings, ShieldAlert } from "lucide-vue-next";
import { computed } from "vue";
import PageFrame from "@/components/PageFrame.vue";
import { Button } from "@/components/ui/button";
import { StateCard } from "@/components/ui/state-card";
import { login, type SessionError } from "@/platform/auth";
import { useHeldTitle } from "./heldTitle";

const props = defineProps<{ error: SessionError }>();

const icon = computed(() => {
  switch (props.error.kind) {
    case "configuration":
      return Settings;
    case "unreachable":
      return CloudOff;
    case "session-loop":
      return KeyRound;
    default:
      return ShieldAlert;
  }
});
/** Retrying helps when the sign-in service did not answer or the session ended again; a missing setting needs the operator. */
const canRetry = computed(() => props.error.kind === "unreachable" || props.error.kind === "session-loop");

useHeldTitle(computed(() => props.error.title));

function retry() {
  window.location.reload();
}

function signInAgain() {
  void login();
}
</script>

<template>
  <PageFrame narrow>
    <StateCard class="mt-6 sm:mt-16" :title="error.title" :icon="icon">
      <p>{{ error.detail }}</p>
      <template v-if="canRetry" #actions>
        <Button v-if="error.kind === 'session-loop'" @click="signInAgain">Sign in again</Button>
        <Button v-else @click="retry">Try again</Button>
      </template>
      <template v-if="error.technical" #details>
        <p class="mono break-words">{{ error.technical }}</p>
      </template>
    </StateCard>
  </PageFrame>
</template>
