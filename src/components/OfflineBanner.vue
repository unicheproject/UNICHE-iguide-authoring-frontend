<script setup lang="ts">
/**
 * "Offline CMS" (`12` §6, DECISIONS.md D-040): while no request is answered, changes are disabled and this banner
 * says so; what is loaded stays readable. "Check again", or the browser regaining its network, asks the backend once;
 * any answer clears the banner.
 */
import { onBeforeUnmount, onMounted, ref } from "vue";
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
    class="flex flex-wrap items-center gap-3 border-b border-[#e8c98a] bg-[#fdf3e1] px-5 py-2.5 text-[13px] text-[#6b4500]"
  >
    <span aria-hidden="true">⚠</span>
    <p class="min-w-[min(100%,260px)] flex-1">
      <strong>You are offline.</strong> Saving and other changes are disabled; what is already loaded stays readable.
      Your unsaved changes stay in the form.
    </p>
    <button
      type="button"
      class="whitespace-nowrap rounded-full border border-[#c99a3f] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.06em] disabled:opacity-60"
      :disabled="checking"
      @click="check"
    >
      {{ checking ? "Checking…" : "Check again" }}
    </button>
  </div>
</template>
