<script setup lang="ts">
/**
 * "New event" on the shared `FormDialog` (plan 2.4): Title first (default-language label), the slug under "Edit slug",
 * "Create and open". The event starts as a draft; the list opens its editor.
 */
import { ref } from "vue";
import FormDialog from "@/components/ui/dialog/FormDialog.vue";
import { describeError } from "@/lib/errors";
import { ApiError } from "@/platform/api";
import type { ProjectLanguage } from "@/platform/languages";
import { createEvent, type CmsEvent } from "@/platform/events";

const props = defineProps<{ projectId: string; defaultLanguage: ProjectLanguage }>();
const emit = defineEmits<{ close: []; created: [event: CmsEvent] }>();

const title = ref("");
const slug = ref("");
const submitting = ref(false);
const errors = ref<Record<string, string>>({});
const formError = ref<string | null>(null);
const requestId = ref<string | null>(null);

async function submit() {
  errors.value = {};
  formError.value = null;
  requestId.value = null;
  submitting.value = true;
  try {
    emit("created", await createEvent(props.projectId, { title: title.value.trim(), slug: slug.value }));
  } catch (e) {
    if (!(e instanceof ApiError)) throw e;
    requestId.value = e.requestId;
    if (e.code === "DUPLICATE_VALUE") {
      errors.value = { slug: "Another event already uses this slug. Choose a different one." };
    } else if (e.status === 422 || e.status === 400) {
      const byField = e.fieldMessages();
      errors.value = byField;
      formError.value = Object.keys(byField).length ? null : describeError(e, "create the event").body;
    } else {
      // One sentence per failure (D-087): chosen by status and code, never the platform's own words.
      formError.value = describeError(e, "create the event").body;
    }
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <FormDialog
    v-model:title="title"
    v-model:slug="slug"
    v-model:errors="errors"
    heading="New event"
    intro="It starts as a draft without dates. Add its dates in the editor, then activate it."
    noun="event"
    :default-language="defaultLanguage"
    :busy="submitting"
    :form-error="formError"
    :request-id="requestId"
    @close="emit('close')"
    @submit="submit"
  />
</template>
