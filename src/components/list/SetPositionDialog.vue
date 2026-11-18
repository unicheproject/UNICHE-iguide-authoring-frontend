<script setup lang="ts">
/**
 * "Move to position" (D-076): a small dialog with one numeric field, the current place and the valid range, so a far
 * move takes one step instead of fifty. The keyboard alternative to drag for long distances (`14` §4). Enter confirms,
 * Esc cancels; an out-of-range or non-whole number is explained at the field and the dialog stays open.
 */
import { CircleAlert } from "lucide-vue-next";
import { computed, ref, useId } from "vue";
import AppDialog from "@/components/AppDialog.vue";
import { Button } from "@/components/ui/button";
import FormField from "@/components/ui/field/FormField.vue";
import Input from "@/components/ui/input/Input.vue";

const props = defineProps<{
  /** The row's name. */
  title: string;
  /** Its current 1-based place among the visible siblings. */
  current: number;
  /** How many siblings there are. */
  count: number;
}>();
const emit = defineEmits<{ confirm: [position: number]; close: [] }>();

const uid = useId();
const fieldId = `pos-${uid}`;
const errorId = `${fieldId}-error`;
const value = ref(String(props.current));
const touched = ref(false);
const parsed = computed(() => (/^\d+$/.test(value.value.trim()) ? Number(value.value.trim()) : NaN));
const error = computed(() => {
  if (!touched.value) return "";
  if (Number.isNaN(parsed.value)) return `Enter a whole number from 1 to ${props.count}.`;
  if (parsed.value < 1 || parsed.value > props.count) return `Enter a number from 1 to ${props.count}.`;
  return "";
});

function submit() {
  touched.value = true;
  if (Number.isNaN(parsed.value) || parsed.value < 1 || parsed.value > props.count) return;
  if (parsed.value === props.current) return emit("close");
  emit("confirm", parsed.value);
}
</script>

<template>
  <AppDialog :title="`Move ${title}`" size="sm" @close="emit('close')">
    <form id="set-position-form" novalidate @submit.prevent="submit">
      <!-- The error is announced the moment it appears (role="alert") and linked to the field (aria-describedby). -->
      <FormField label="New position" :hint="`Now at ${current} of ${count}. Choose 1 to ${count}.`" :id="fieldId" v-slot="f">
        <Input
          :id="f.id"
          v-model="value"
          type="text"
          inputmode="numeric"
          autocomplete="off"
          class="w-28 tabular"
          :aria-describedby="[f.describedBy, error ? errorId : null].filter(Boolean).join(' ') || undefined"
          :invalid="!!error"
          @focus="($event.target as HTMLInputElement).select()"
        />
        <p v-if="error" :id="errorId" role="alert" class="flex items-start gap-1.5 text-xs font-medium text-destructive">
          <CircleAlert class="mt-px size-4 shrink-0" aria-hidden="true" /><span>{{ error }}</span>
        </p>
      </FormField>
    </form>
    <template #actions>
      <Button variant="secondary" @click="emit('close')">Cancel</Button>
      <Button variant="primary" type="submit" form="set-position-form">Move</Button>
    </template>
  </AppDialog>
</template>
