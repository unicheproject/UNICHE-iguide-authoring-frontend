<script setup lang="ts">
/**
 * The one request-id row (D-105): the label, the id in monospace and a "Copy request id" button, the same in alerts,
 * error summaries, dialogs, list cards, Maps and toasts. A failure to copy (clipboard blocked) leaves the id on the
 * screen to select. Props: `id` the request id; `compact` uses a 32 px button (44 on a coarse pointer) for toasts.
 */
import { Copy } from "lucide-vue-next";
import { ref } from "vue";
import { Button } from "@/components/ui/button";
import { say } from "@/lib/announcer";

const props = defineProps<{ id: string; compact?: boolean }>();
const copied = ref(false);

async function copy() {
  try {
    await navigator.clipboard.writeText(props.id);
    copied.value = true;
    say("Request id copied");
  } catch {
    // The id stays on screen.
  }
}
</script>

<template>
  <p class="mono flex flex-wrap items-center gap-x-1 gap-y-0.5 text-muted-foreground" data-request-id>
    <span>Request id <span class="break-all text-foreground">{{ id }}</span></span>
    <Button variant="ghost" size="sm" :class="compact && 'px-2'" @click="copy"><Copy />{{ copied ? "Copied" : "Copy request id" }}</Button>
  </p>
</template>
