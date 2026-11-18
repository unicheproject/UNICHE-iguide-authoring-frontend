<script setup lang="ts">
/**
 * A searchable single choice (WAI-ARIA combobox with list autocomplete) for the Event's Place, Point of interest and
 * Route (plan 5 P5b): type to filter, arrows move, Enter picks, Esc closes. The first option is "None". An option can
 * carry a `note` ("Draft") that is shown as text beside its name, so a draft is never chosen by surprise. Give it a
 * visible label through `FormField` (pass `:id` and `:aria-describedby`).
 */
import { ChevronDown } from "lucide-vue-next";
import { computed, nextTick, ref, useId, watch } from "vue";
import { say } from "@/lib/announcer";
import { fold } from "@/lib/utils";

export interface ComboOption {
  id: string;
  /** The name. Leading spaces (a Place's tree indent) are shown as an indent in the list and dropped everywhere else. */
  label: string;
  /** Short text after the name, such as "Draft". */
  note?: string;
}

/** The name without its tree indent. */
const plain = (label: string): string => label.trim();
/** How many tree levels the label is indented by (three spaces per level, see `parentOptions`). */
const depthOf = (label: string): number => Math.floor((label.length - label.trimStart().length) / 3);

const props = withDefaults(
  defineProps<{
    id: string;
    options: ComboOption[];
    disabled?: boolean;
    invalid?: boolean;
    describedBy?: string;
    noneLabel?: string;
    /** What the singular thing is called, for the empty message: "place". */
    noun: string;
  }>(),
  { describedBy: undefined, noneLabel: "None" },
);
const model = defineModel<string>({ required: true });

const listId = useId();
const open = ref(false);
const query = ref("");
const active = ref(0);

const selected = computed(() => props.options.find((o) => o.id === model.value) ?? null);
const selectedText = computed(() => (selected.value ? plain(selected.value.label) : model.value ? "Unavailable" : props.noneLabel));
/** What the field shows: the typed search while open, the chosen name otherwise. */
const shown = computed(() => (open.value ? query.value : selectedText.value));

const rows = computed<ComboOption[]>(() => {
  const q = fold(query.value.trim());
  const hits = q ? props.options.filter((o) => fold(o.label).includes(q)) : props.options;
  return q && !fold(props.noneLabel).includes(q) ? hits : [{ id: "", label: props.noneLabel }, ...hits];
});
const optionId = (index: number) => `${listId}-o${index}`;

function show() {
  if (props.disabled || open.value) return;
  open.value = true;
  query.value = "";
  const at = rows.value.findIndex((o) => o.id === model.value);
  active.value = Math.max(at, 0);
  void nextTick(scrollActive);
}

function hide() {
  open.value = false;
  query.value = "";
}

function pick(option: ComboOption) {
  model.value = option.id;
  hide();
  say(`${plain(option.label)} chosen.`);
}

function scrollActive() {
  document.getElementById(optionId(active.value))?.scrollIntoView({ block: "nearest" });
}

function move(by: number) {
  if (!open.value) return show();
  if (!rows.value.length) return;
  active.value = (active.value + by + rows.value.length) % rows.value.length;
  void nextTick(scrollActive);
}

function onKey(event: KeyboardEvent) {
  switch (event.key) {
    case "ArrowDown":
      event.preventDefault();
      move(1);
      break;
    case "ArrowUp":
      event.preventDefault();
      move(-1);
      break;
    case "Home":
      if (open.value) {
        event.preventDefault();
        active.value = 0;
        void nextTick(scrollActive);
      }
      break;
    case "End":
      if (open.value) {
        event.preventDefault();
        active.value = rows.value.length - 1;
        void nextTick(scrollActive);
      }
      break;
    case "Enter":
      if (open.value) {
        event.preventDefault();
        const row = rows.value[active.value];
        if (row) pick(row);
      }
      break;
    case "Escape":
      if (open.value) {
        event.preventDefault();
        event.stopPropagation();
        hide();
      }
      break;
    case "Tab":
      hide();
      break;
  }
}

function onInput(event: Event) {
  query.value = (event.target as HTMLInputElement).value;
  open.value = true;
  active.value = 0;
}

// The count of matches is spoken as the author types; a screen reader does not see the list change otherwise.
watch(
  () => [open.value, query.value, rows.value.length] as const,
  ([isOpen, q, count]) => {
    if (isOpen && q.trim()) say(count ? `${count} ${count === 1 ? "match" : "matches"}.` : `No ${props.noun} matches.`);
  },
);
</script>

<template>
  <div class="relative">
    <input
      :id="id"
      type="text"
      role="combobox"
      autocomplete="off"
      spellcheck="false"
      :value="shown"
      :disabled="disabled"
      :aria-invalid="invalid ? 'true' : undefined"
      :aria-describedby="describedBy"
      aria-autocomplete="list"
      :aria-expanded="open"
      :aria-controls="listId"
      :aria-activedescendant="open && rows.length ? optionId(active) : undefined"
      :placeholder="open ? `Type to search` : undefined"
      dir="auto"
      class="ui-field cursor-pointer pr-9"
      :class="{ 'border-destructive': invalid, 'text-ink-2': !open && !model, 'cursor-not-allowed': disabled }"
      @focus="show"
      @click="show"
      @input="onInput"
      @keydown="onKey"
      @blur="hide"
    />
    <ChevronDown class="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-ink-2 transition-transform" :class="{ 'rotate-180': open }" aria-hidden="true" />
    <ul
      v-show="open"
      :id="listId"
      role="listbox"
      :aria-label="`${noun} choices`"
      class="absolute inset-x-0 top-full z-popover mt-1 max-h-64 overflow-y-auto rounded-md border border-border bg-popover py-1 shadow-2"
    >
      <li
        v-for="(row, index) in rows"
        :id="optionId(index)"
        :key="row.id || 'none'"
        role="option"
        :aria-selected="row.id === model"
        class="flex min-h-control cursor-pointer items-center gap-2 px-3 py-1.5 text-sm"
        :class="index === active ? 'bg-accent text-foreground' : 'hover:bg-surface-hover'"
        @mousedown.prevent
        @click="pick(row)"
        @mousemove="active = index"
      >
        <span dir="auto" class="min-w-0 flex-1 break-words" :class="{ 'font-semibold': row.id === model }" :style="depthOf(row.label) ? { paddingInlineStart: `${depthOf(row.label) * 1.25}rem` } : undefined">{{ plain(row.label) }}</span>
        <span v-if="row.note" class="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs text-ink-2">{{ row.note }}</span>
        <span v-if="row.id === model" class="shrink-0 text-xs font-semibold text-primary">Chosen</span>
      </li>
      <li v-if="rows.length === 0" role="presentation" class="px-3 py-2 text-sm text-muted-foreground">No {{ noun }} matches “{{ query.trim() }}”.</li>
    </ul>
  </div>
</template>
