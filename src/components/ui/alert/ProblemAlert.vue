<script setup lang="ts">
/**
 * A failed request as a banner (D-087): the heading and one fixed sentence chosen by status and `code`
 * (`describeError`), the one request-id row (`RequestIdRow`: label, id, Copy), and, when the parent listens to `retry`, a "Try again" button.
 * The server's `detail` is never shown. Use it in cards, dialogs and page states in place of printing `error.message`;
 * toasts take the same text through `showErrorToast`. `action` completes the sentence ("save the place"); `title`
 * replaces the heading when the surface has a better one ("The place was not saved").
 */
import { computed, getCurrentInstance } from "vue";
import Alert from "./Alert.vue";
import { Button } from "@/components/ui/button";
import { describeError } from "@/lib/errors";

const props = defineProps<{
  /** What failed: an `ApiError` or anything thrown. */
  error: unknown;
  /** Completes the sentence: "The CMS could not <action>." */
  action?: string;
  /** Overrides the heading. */
  title?: string;
}>();
const emit = defineEmits<{ retry: [] }>();

const described = computed(() => describeError(props.error, props.action));
/** Whether the parent handles `retry`, which is what shows the button. */
const canRetry = computed(() => !!getCurrentInstance()?.vnode.props?.onRetry);
</script>

<template>
  <Alert tone="danger" :title="title ?? described.title" :request-id="described.requestId">
    <p>{{ described.body }}</p>
    <div v-if="canRetry" class="mt-2 flex flex-wrap gap-2">
      <Button variant="secondary" size="sm" @click="emit('retry')">Try again</Button>
    </div>
  </Alert>
</template>
