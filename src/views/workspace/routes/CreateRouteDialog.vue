<script setup lang="ts">
/**
 * "New route" on the shared `FormDialog` (plan 2.4): Title first, then where the route runs (indoor or outdoor), the
 * slug under "Edit slug". "Create and open" creates the draft without stops; the list opens its editor.
 */
import { Check } from "lucide-vue-next";
import { ref, useId, watch } from "vue";
import FormDialog from "@/components/ui/dialog/FormDialog.vue";
import { ApiError } from "@/platform/api";
import type { ProjectLanguage } from "@/platform/languages";
import { createRoute, ROUTE_TYPE_HINTS, ROUTE_TYPES, routeTypeLabel, type Route, type RouteType } from "@/platform/routes";
import { createFailure } from "../createFailure";

const props = defineProps<{ projectId: string; defaultLanguage: ProjectLanguage }>();
const emit = defineEmits<{ close: []; created: [route: Route] }>();

const title = ref("");
const slug = ref("");
const type = ref<RouteType | "">("");
const typeName = useId();
const submitting = ref(false);
const errors = ref<Record<string, string>>({});
const formError = ref<string | null>(null);
const requestId = ref<string | null>(null);

watch(type, () => {
  if (errors.value.type) errors.value = {};
});

/** The kind's own check, run with Title and slug in one pass (C2-44). */
function validate(): Record<string, string> {
  return type.value ? {} : { type: "Choose where the route runs: indoor or outdoor." };
}

async function submit() {
  errors.value = {};
  formError.value = null;
  requestId.value = null;
  if (!type.value) return;
  submitting.value = true;
  try {
    emit("created", await createRoute(props.projectId, { title: title.value.trim(), slug: slug.value, type: type.value }));
  } catch (e) {
    if (!(e instanceof ApiError)) throw e;
    requestId.value = e.requestId;
    if (e.code === "DUPLICATE_VALUE") {
      errors.value = { slug: "Another route already uses this slug. Choose a different one." };
    } else if (e.status === 422 || e.status === 400) {
      const byField = e.fieldMessages();
      errors.value = byField;
      formError.value = Object.keys(byField).length ? null : createFailure(e, "route");
    } else {
      formError.value = createFailure(e, "route");
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
    heading="New route"
    intro="It starts as a draft without stops; add them in the editor, then activate it."
    noun="route"
    :default-language="defaultLanguage"
    :busy="submitting"
    :form-error="formError"
    :request-id="requestId"
    :labels="{ type: 'Setting' }"
    :validate="validate"
    :dirty="!!type"
    @close="emit('close')"
    @submit="submit"
  >
    <template #default="{ id }">
      <!-- The same radio cards as the Level of a Place and the scope and Level of a Category (C3-93). -->
      <fieldset :id="id('type')" class="min-w-0" :aria-invalid="errors.type ? 'true' : undefined">
        <legend class="mb-1.5 text-sm font-semibold text-ink-2">Setting<span class="ml-1 font-medium text-muted-foreground">(required)</span></legend>
        <div class="grid grid-cols-1 gap-2 min-[480px]:grid-cols-2">
          <label
            v-for="t in ROUTE_TYPES"
            :key="t"
            class="relative flex cursor-pointer flex-col gap-0.5 rounded-lg border px-3.5 py-3 hover:bg-surface-hover has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-primary"
            :class="type === t ? 'border-primary bg-accent' : errors.type ? 'border-destructive bg-card' : 'border-input bg-card'"
          >
            <input v-model="type" type="radio" :name="typeName" :value="t" :aria-describedby="errors.type ? `${id('type')}-err` : undefined" class="sr-only" />
            <span class="flex items-center gap-1.5 text-sm font-semibold">
              <Check v-if="type === t" class="size-4 text-primary" aria-hidden="true" :stroke-width="3" />{{ routeTypeLabel(t) }}
            </span>
            <span class="text-xs text-muted-foreground">{{ ROUTE_TYPE_HINTS[t] }}.</span>
          </label>
        </div>
        <p v-if="errors.type" :id="`${id('type')}-err`" class="mt-1.5 text-xs font-medium text-destructive">{{ errors.type }}</p>
      </fieldset>
    </template>
  </FormDialog>
</template>
