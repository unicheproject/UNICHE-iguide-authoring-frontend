<script setup lang="ts">
/**
 * What a list shows when a read it needs failed (C2-94, C3-87): one `ProblemAlert` with the request id and "Try again".
 * Pass the first failure of the rows, the Project's languages or any other read the list depends on; the list never
 * infers "Add a language first", "no rows" or a "0" from a failed request. `what` completes "The CMS could not load
 * <what>." The card takes focus's place when it appears and focus is on nothing (the table it replaced), and
 * "Try again" hands focus to the page heading before the card goes (focus has a successor, D-103).
 *
 * Props: `error`, `what`; event `retry` (listen with `@retry`).
 */
import { onMounted } from "vue";
import { ProblemAlert } from "@/components/ui/alert";
import { focusHeading } from "@/lib/focus";

defineProps<{
  error: unknown;
  /** Plural, lower case: "the points of interest". */
  what: string;
}>();
const emit = defineEmits<{ retry: [] }>();

onMounted(() => {
  const active = document.activeElement;
  if (!active || active === document.body) focusHeading();
});

function retry() {
  focusHeading();
  emit("retry");
}
</script>

<template>
  <ProblemAlert :error="error" :action="`load ${what}`" class="m-4" @retry="retry" />
</template>
