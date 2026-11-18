<script setup lang="ts">
/**
 * A native select for choosing one Place or Category that grows a filter field above it once it has `FILTER_FROM` or
 * more options (C2-67: no `ui/` combobox exists, and the platform's own list stays the most accessible control on
 * touch and with a screen reader). Typing narrows the options by name; the chosen one always stays in the list and
 * "N of M match" is read out politely. The filter field has a visible label, and Enter picks the one option that
 * matches (C3-33). The closed select shows the plain title: a tree's indentation (leading spaces in the label) becomes
 * option padding, so only the open list is indented. Below the threshold it is the plain select. `id`,
 * `aria-describedby`, `disabled` reach the select, so `FormField` links its label, hint and error.
 */
import { computed, ref, useId } from "vue";
import { say } from "@/lib/announcer";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

/** From this many options on the filter field shows. */
const FILTER_FROM = 25;

defineOptions({ inheritAttrs: false });
const props = defineProps<{
  options: { id: string; label: string }[];
  /** The option for "none", with the empty value; omitted when a choice is required. */
  emptyLabel?: string;
  /** Text of the option for a chosen value that is not in `options` (archived or unavailable). */
  missingLabel?: string;
  /** What the filter field is called for assistive technology: "Filter places". */
  filterLabel: string;
  invalid?: boolean;
  disabled?: boolean;
}>();
const model = defineModel<string>({ required: true });

const query = ref("");
const filterId = useId();
/** A label's indentation: leading spaces or no-break spaces, counted as steps; the rest is the plain title. */
const parsed = (label: string) => {
  const title = label.replace(/^[\s\u00a0]+/, "");
  return { title, depth: Math.min(6, Math.round((label.length - title.length) / 2)) };
};
const filtering = computed(() => props.options.length >= FILTER_FROM);
const shown = computed(() => {
  const q = query.value.trim().toLocaleLowerCase();
  if (!filtering.value || !q) return props.options;
  return props.options.filter((o) => o.id === model.value || o.label.toLocaleLowerCase().includes(q));
});
/** The one option the filter matches, when there is exactly one: Enter chooses it. */
const onlyMatch = computed(() => {
  const q = query.value.trim().toLocaleLowerCase();
  if (!filtering.value || !q) return null;
  const hits = props.options.filter((o) => o.label.toLocaleLowerCase().includes(q));
  return hits.length === 1 ? hits[0] : null;
});
function chooseOnly() {
  const hit = onlyMatch.value;
  if (!hit) return;
  model.value = hit.id;
  query.value = "";
  say(`${parsed(hit.label).title} chosen.`);
}
const missing = computed(() => !!model.value && !props.options.some((o) => o.id === model.value));
/** "3 of 57 match", only while something is typed. */
const status = computed(() => {
  const q = query.value.trim();
  if (!filtering.value || !q) return "";
  const matches = props.options.filter((o) => o.label.toLocaleLowerCase().includes(q.toLocaleLowerCase())).length;
  return matches ? `${matches} of ${props.options.length} match` : "Nothing matches. Clear the filter to see every option.";
});
</script>

<template>
  <div class="flex flex-col gap-1.5">
    <template v-if="filtering && !disabled">
      <label :for="filterId" class="text-xs font-medium text-ink-2">{{ filterLabel }}</label>
      <Input :id="filterId" v-model="query" type="search" :placeholder="`Type to narrow the list`" autocomplete="off" @keydown.enter.prevent="chooseOnly" />
      <span role="status" class="min-h-0 text-xs text-muted-foreground empty:hidden">{{ status }}</span>
    </template>
    <Select v-model="model" v-bind="$attrs" :disabled="disabled" :invalid="invalid">
      <option v-if="emptyLabel !== undefined" value="">{{ emptyLabel }}</option>
      <option v-if="missing" :value="model">{{ missingLabel ?? "(unavailable)" }}</option>
      <option v-for="o in shown" :key="o.id" :value="o.id" :style="parsed(o.label).depth ? { paddingInlineStart: `${parsed(o.label).depth * 0.75}rem` } : undefined">{{ parsed(o.label).title }}</option>
    </Select>
  </div>
</template>
