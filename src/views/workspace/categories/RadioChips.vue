<script setup lang="ts">
/**
 * A small single choice drawn as chips on native radio buttons (so the arrow keys, one Tab stop and the group name
 * come from the platform; Home and End, which radios lack, select the first and the last enabled chip and keep the
 * page from scrolling, C3-13). The chosen chip shows a check mark and a filled tint, not only a border. The group is a
 * `fieldset` with its visible legend; a disabled option stays visible and the page says why (`describedBy`).
 */
import { Check } from "lucide-vue-next";
import { ref, useId } from "vue";

export interface RadioChipOption {
  value: string;
  label: string;
  disabled?: boolean;
}

const props = defineProps<{
  legend: string;
  options: RadioChipOption[];
  /** Disables the whole group. */
  disabled?: boolean;
  /** Id of the text that explains a disabled option or an error. */
  describedBy?: string;
  /** Id for the fieldset, so an error summary can move focus to the group. */
  id?: string;
  invalid?: boolean;
}>();
const model = defineModel<string>({ required: true });
const name = useId();
const group = ref<HTMLElement | null>(null);

/** Home and End select the first and the last enabled option and focus it (roving, as arrow keys do). */
function onKeydown(event: KeyboardEvent) {
  if ((event.key !== "Home" && event.key !== "End") || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
  if (!(event.target instanceof HTMLInputElement) || event.target.type !== "radio") return;
  const enabled = props.options.filter((o) => !props.disabled && !o.disabled);
  const target = event.key === "Home" ? enabled[0] : enabled[enabled.length - 1];
  event.preventDefault();
  if (!target) return;
  model.value = target.value;
  const inputs = [...(group.value?.querySelectorAll<HTMLInputElement>("input[type=radio]") ?? [])];
  inputs[props.options.indexOf(target)]?.focus();
}
</script>

<template>
  <fieldset :id="id" ref="group" tabindex="-1" class="m-0 flex min-w-0 flex-col gap-2 border-0 p-0" :aria-describedby="describedBy" :aria-invalid="invalid ? 'true' : undefined" @keydown="onKeydown">
    <legend class="mb-2 p-0 text-sm font-semibold text-ink-2">{{ legend }}</legend>
    <div class="flex flex-wrap gap-2">
      <label
        v-for="o in options"
        :key="o.value"
        class="relative inline-flex min-h-control cursor-pointer items-center gap-2 rounded-full border px-4 text-sm font-semibold transition-ui duration-1 has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-primary"
        :class="[
          model === o.value ? 'border-primary bg-accent text-primary' : 'border-input bg-card text-ink-2 hover:bg-surface-hover',
          (disabled || o.disabled) && (model === o.value ? 'cursor-default' : 'cursor-not-allowed text-disabled-ink hover:bg-card'),
        ]"
      >
        <input v-model="model" type="radio" :name="name" :value="o.value" :disabled="disabled || o.disabled" class="peer sr-only" />
        <Check v-if="model === o.value" class="size-4" :stroke-width="3" aria-hidden="true" />
        {{ o.label }}
      </label>
    </div>
  </fieldset>
</template>
