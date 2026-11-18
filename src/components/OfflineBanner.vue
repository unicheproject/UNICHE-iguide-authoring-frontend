<script setup lang="ts">
/**
 * "Offline CMS" (`12` §6, DECISIONS.md D-040, D-078, D-097, C3-86): while no request is answered, changes are disabled
 * and this notice says so; what is loaded stays readable. It is a row of its own between the header and the page, in the
 * flow, so it never covers "New ..." or any page-head action and never slides under a sticky editor head (round 2 floated
 * it over the page). The page below gives up that height only while the notice shows; that is one deliberate move, made
 * by a change the author can see. One `role="alert"`; "Check again", or the browser regaining its network, asks the
 * backend once, and any answer clears it. It is only shown after the browser reports offline or two requests failed.
 */
import { WifiOff } from "lucide-vue-next";
import { onBeforeUnmount, onMounted, ref } from "vue";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/platform/api";
import { connection } from "@/stores/connection";

const checking = ref(false);

async function check() {
  if (checking.value) return;
  checking.value = true;
  try {
    await apiRequest("/me/authorization");
  } catch {
    // Still offline, or answered with an error, which clears the state all the same.
  } finally {
    checking.value = false;
  }
}

onMounted(() => window.addEventListener("online", check));
onBeforeUnmount(() => window.removeEventListener("online", check));
</script>

<template>
  <div
    v-if="connection.offline"
    role="alert"
    class="flex flex-none flex-wrap items-center gap-x-3 gap-y-2 border-b border-warning/40 bg-warning-tint px-4 py-2 text-sm text-foreground nav:px-6"
  >
    <WifiOff class="size-5 flex-none text-warning" aria-hidden="true" />
    <p class="min-w-[min(100%,12rem)] flex-1">
      <strong class="text-warning">You are offline.</strong> Changes are disabled; what is loaded stays readable, and unsaved changes stay in the form.
    </p>
    <Button variant="secondary" size="sm" :loading="checking" @click="check">{{ checking ? "Checking" : "Check again" }}</Button>
  </div>
</template>
