<script lang="ts">
import type { InjectionKey } from "vue";

/**
 * A dialog that shows an error summary (`role="alert"`) provides `true` here, so its fields' messages are not alerts
 * as well: one alert per error (C3-93). The message stays linked by `aria-describedby`.
 */
export const QUIET_FIELD_ERRORS: InjectionKey<boolean> = Symbol("quiet-field-errors");
</script>

<script setup lang="ts">
/**
 * A labelled field: visible label (600), optional hint, the control, and an error with icon and text. The control is
 * the default slot and receives `{ id, describedBy, invalid }`; bind them (`:id`, `:aria-describedby`, `:invalid`) so the
 * label, hint and error are linked (`14` §4). `required` marks the label with text, not only a star.
 */
import { CircleAlert } from "lucide-vue-next";
import { computed, inject, useId } from "vue";

const props = defineProps<{
  label: string;
  hint?: string;
  error?: string | null;
  required?: boolean;
  /** Use an existing control id (for example one that error summaries link to). */
  id?: string;
}>();

const quiet = inject(QUIET_FIELD_ERRORS, false);
const generated = useId();
const controlId = computed(() => props.id ?? `f-${generated}`);
const hintId = computed(() => `${controlId.value}-hint`);
const errorId = computed(() => `${controlId.value}-error`);
const describedBy = computed(() => [props.hint ? hintId.value : null, props.error ? errorId.value : null].filter(Boolean).join(" ") || undefined);
</script>

<template>
  <div class="flex flex-col gap-1.5">
    <label :for="controlId" class="text-sm font-semibold text-ink-2">
      {{ label }}<span v-if="required" class="ml-1 font-medium text-muted-foreground">(required)</span>
    </label>
    <p v-if="hint" :id="hintId" class="text-xs text-muted-foreground">{{ hint }}</p>
    <slot :id="controlId" :described-by="describedBy" :invalid="!!error" />
    <p v-if="error" :id="errorId" :role="quiet ? undefined : 'alert'" class="flex items-start gap-1.5 text-xs font-medium text-destructive">
      <CircleAlert class="mt-px size-4 shrink-0" aria-hidden="true" />
      <span>{{ error }}</span>
    </p>
  </div>
</template>
