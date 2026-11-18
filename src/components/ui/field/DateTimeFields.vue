<script setup lang="ts">
/**
 * A date and time entered as typed parts, in the one way the CMS writes them (D-088): day, month by name, year, and
 * 24-hour time (hour, minute). It replaces the browser's `datetime-local`, `date` and `time` inputs, whose order, 12 or
 * 24 hour clock and popup follow the browser's region and cannot be labelled with their format. A group with a visible
 * legend, a format hint linked with `aria-describedby`, one visible label per part, and an error linked to the group.
 *
 * `v-model` is the value those inputs use: `YYYY-MM-DDTHH:mm` (`mode="datetime"`), `YYYY-MM-DD` (`"date"`) or `HH:mm`
 * (`"time"`). It is the empty string until every part is a real value (a 31 April is not), so a parent can treat
 * "" as "not entered". Typing never loses a half-entered date: the parts are kept while the model stays empty.
 *
 * Validation (D-104). Each part is checked when the person leaves it (hour 0-23, minute 0-59, year four digits, day
 * against the chosen month and year, so 31 February is wrong). A wrong part gets its own sentence under the group,
 * with an error icon, linked to that input by `aria-describedby`, `aria-invalid` on the input, and one polite
 * announcement. A blank part is "not entered", not wrong: the parent decides what a missing value means. While any
 * part is wrong the model is "" and is never replaced by another value, so a parent must not derive a different
 * date (for example an End) from it.
 *
 * Props: `legend` (visible group name), `mode`, `hint`, `error` (a parent-level sentence, for example "End is before
 * Start"), `readonly`, `disabled`, `required`, `dataPath` (the first part's `data-path`), `id` (base of the part ids),
 * `ended` (the date is in the past: the legend is muted and an "Ended" word is shown, no opacity involved).
 * Events: `update:modelValue` (the value above) and `validity` (`true` when no typed part is wrong), emitted whenever
 * it changes. Part ids: `<id>-day`, `-month`, `-year`, `-hour`, `-minute`; part error ids `<id>-<part>-error`.
 */
import { CircleAlert } from "lucide-vue-next";
import { computed, reactive, useId, watch } from "vue";
import { say } from "@/lib/announcer";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

const props = withDefaults(
  defineProps<{
    legend: string;
    mode?: "datetime" | "date" | "time";
    /** Extra words after the format hint ("Times are in Athens time."). */
    hint?: string;
    error?: string | null;
    readonly?: boolean;
    disabled?: boolean;
    required?: boolean;
    /** The path error summaries link to; put on the first part. */
    dataPath?: string;
    /** Base for the part ids, so a summary or a test can find them (`<id>-day`, `-month`, `-year`, `-hour`, `-minute`). */
    id?: string;
    /** The date is in the past and valid: the group reads as finished without dimming it with opacity. */
    ended?: boolean;
  }>(),
  { mode: "datetime", hint: undefined, error: undefined, dataPath: undefined, id: undefined },
);
const emit = defineEmits<{ validity: [valid: boolean] }>();
const model = defineModel<string>({ default: "" });

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const generated = useId();
const base = computed(() => props.id ?? `dt-${generated}`);
const hintId = computed(() => `${base.value}-hint`);
const errorId = computed(() => `${base.value}-error`);

const showDate = computed(() => props.mode !== "time");
const showTime = computed(() => props.mode !== "date");
const format = computed(() => {
  const date = "day, month name, year";
  const time = "24-hour time HH:MM";
  return props.mode === "date" ? `Format: ${date}` : props.mode === "time" ? `Format: ${time}` : `Format: ${date}, ${time}`;
});
const partErrorId = (key: keyof Parts) => `${base.value}-${key}-error`;

interface Parts {
  day: string;
  month: string;
  year: string;
  hour: string;
  minute: string;
}
const parts = reactive<Parts>({ day: "", month: "", year: "", hour: "", minute: "" });

const pad = (value: number, width = 2) => String(value).padStart(width, "0");

/** The parts of a model value; blank parts for an empty or unreadable one. */
function parse(value: string): Parts {
  const empty: Parts = { day: "", month: "", year: "", hour: "", minute: "" };
  const date = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  const time = /(?:T|^)(\d{2}):(\d{2})/.exec(value);
  return {
    ...empty,
    ...(date ? { year: String(+date[1]), month: String(+date[2]), day: String(+date[3]) } : {}),
    ...(time ? { hour: String(+time[1]), minute: pad(+time[2]) } : {}),
  };
}

/** The model value the parts make, or "" while any needed part is missing or not a real calendar or clock value. */
function compose(p: Parts): string {
  const number = (text: string) => (/^\d+$/.test(text) ? Number(text) : NaN);
  let date = "";
  let time = "";
  if (showDate.value) {
    const [d, m, y] = [number(p.day), number(p.month), number(p.year)];
    const real = new Date(Date.UTC(y, m - 1, d));
    if (!(y >= 1000 && y <= 9999 && m >= 1 && m <= 12 && d >= 1) || real.getUTCDate() !== d || real.getUTCMonth() !== m - 1) return "";
    date = `${pad(y, 4)}-${pad(m)}-${pad(d)}`;
  }
  if (showTime.value) {
    const [h, mi] = [number(p.hour), number(p.minute)];
    if (!(h >= 0 && h <= 23 && mi >= 0 && mi <= 59)) return "";
    time = `${pad(h)}:${pad(mi)}`;
  }
  return props.mode === "datetime" ? `${date}T${time}` : date || time;
}

Object.assign(parts, parse(model.value));
watch(model, (value) => {
  const own = compose(parts);
  // Our own emit coming back, or a clear while the person is mid-entry: keep what they typed.
  if (value === own || (value === "" && own === "")) return;
  Object.assign(parts, parse(value));
});

/** Pushes the parts to the model when they make a real value, "" otherwise. */
function commit() {
  const value = compose(parts);
  if (value !== model.value) model.value = value;
}

function onPart(key: keyof Parts, value: string | number | undefined) {
  parts[key] = String(value ?? "").replace(/\D/g, "").slice(0, key === "year" ? 4 : 2);
  commit();
}

/** Minutes always read with two digits once the person leaves the field. */
function tidyMinute() {
  if (/^\d$/.test(parts.minute)) parts.minute = pad(Number(parts.minute));
  commit();
}

/** Parts the person has left (or changed the month of): only these show a sentence. */
const touched = reactive<Record<keyof Parts, boolean>>({ day: false, month: false, year: false, hour: false, minute: false });

/** The sentence for each wrong part, or null. A blank part is never wrong here. */
const partErrors = computed<Record<keyof Parts, string | null>>(() => {
  const num = (text: string) => (/^\d+$/.test(text) ? Number(text) : NaN);
  const result: Record<keyof Parts, string | null> = { day: null, month: null, year: null, hour: null, minute: null };
  if (showDate.value) {
    const [d, m, y] = [num(parts.day), num(parts.month), num(parts.year)];
    if (parts.year !== "" && parts.year.length < 4) result.year = "Year must have four digits, for example 2026.";
    if (parts.day !== "") {
      if (d < 1 || d > 31) result.day = "Day must be from 1 to 31.";
      else if (m >= 1 && m <= 12) {
        const longest = y >= 1000 ? new Date(Date.UTC(y, m, 0)).getUTCDate() : new Date(Date.UTC(2024, m, 0)).getUTCDate();
        if (d > longest) result.day = `${MONTHS[m - 1]}${y >= 1000 ? ` ${y}` : ""} has ${longest} days.`;
      }
    }
  }
  if (showTime.value) {
    if (parts.hour !== "" && num(parts.hour) > 23) result.hour = "Hour must be from 0 to 23.";
    if (parts.minute !== "" && num(parts.minute) > 59) result.minute = "Minute must be from 0 to 59.";
  }
  return result;
});
const PART_ORDER: (keyof Parts)[] = ["day", "month", "year", "hour", "minute"];
/** The sentences currently shown, in reading order. */
const shown = computed(() =>
  PART_ORDER.filter((key) => touched[key] && partErrors.value[key]).map((key) => ({ key, text: partErrors.value[key] as string })),
);
const hasPartError = computed(() => PART_ORDER.some((key) => partErrors.value[key]));
const invalid = computed(() => !!props.error || shown.value.length > 0);
const partInvalid = (key: keyof Parts) => !!props.error || (touched[key] && !!partErrors.value[key]);
const describedBy = computed(() =>
  [hintId.value, props.error ? errorId.value : null, ...shown.value.map((line) => partErrorId(line.key))].filter(Boolean).join(" "),
);
const partDescribedBy = (key: keyof Parts) =>
  [hintId.value, touched[key] && partErrors.value[key] ? partErrorId(key) : null, props.error ? errorId.value : null].filter(Boolean).join(" ");

watch(hasPartError, (value) => emit("validity", !value), { immediate: true });

/** Marks a part as left and announces its sentence once. */
function leave(key: keyof Parts) {
  if (key === "minute") tidyMinute();
  touched[key] = true;
  // The day depends on month and year: re-check it when either is left.
  if ((key === "month" || key === "year") && parts.day !== "") touched.day = true;
  // Leaving the month or year can change what is wrong with the day ("February 2027 has 28 days"): say that instead.
  const text = partErrors.value[key] ?? ((key === "month" || key === "year") && touched.day ? partErrors.value.day : null);
  if (text) say(text);
}
</script>

<template>
  <fieldset class="min-w-0" :disabled="disabled" :aria-describedby="describedBy" :aria-invalid="invalid ? 'true' : undefined">
    <legend class="mb-1.5 text-sm font-semibold" :class="ended && !invalid ? 'text-muted-foreground' : 'text-ink-2'">
      {{ legend }}<span v-if="required" class="ml-1 font-medium text-muted-foreground">(required)</span>
      <span v-if="ended && !invalid" class="ml-1 font-medium text-muted-foreground">(ended)</span>
    </legend>
    <p :id="hintId" class="mb-1.5 text-xs text-muted-foreground">{{ hint ? `${format}. ${hint}` : `${format}.` }}</p>
    <div class="flex flex-wrap items-end gap-x-3 gap-y-2">
      <template v-if="showDate">
        <div class="flex flex-col gap-1">
          <label :for="`${base}-day`" class="text-xs font-semibold text-muted-foreground">Day</label>
          <Input
            :id="`${base}-day`"
            :model-value="parts.day"
            inputmode="numeric"
            autocomplete="off"
            placeholder="DD"
            maxlength="2"
            :readonly="readonly"
            :invalid="partInvalid('day')"
            :aria-describedby="partDescribedBy('day')"
            :data-path="dataPath"
            class="w-16 text-center tabular"
            @update:model-value="onPart('day', $event)"
            @blur="leave('day')"
          />
        </div>
        <div class="flex flex-col gap-1">
          <label :for="`${base}-month`" class="text-xs font-semibold text-muted-foreground">Month</label>
          <Select
            :id="`${base}-month`"
            :model-value="parts.month"
            :disabled="readonly"
            :invalid="partInvalid('month')"
            :aria-describedby="partDescribedBy('month')"
            class="w-40"
            @update:model-value="onPart('month', $event)"
            @blur="leave('month')"
          >
            <option value="" disabled>Month</option>
            <option v-for="(name, index) in MONTHS" :key="name" :value="String(index + 1)">{{ name }}</option>
          </Select>
        </div>
        <div class="flex flex-col gap-1">
          <label :for="`${base}-year`" class="text-xs font-semibold text-muted-foreground">Year</label>
          <Input
            :id="`${base}-year`"
            :model-value="parts.year"
            inputmode="numeric"
            autocomplete="off"
            placeholder="YYYY"
            maxlength="4"
            :readonly="readonly"
            :invalid="partInvalid('year')"
            :aria-describedby="partDescribedBy('year')"
            class="w-24 text-center tabular"
            @update:model-value="onPart('year', $event)"
            @blur="leave('year')"
          />
        </div>
      </template>
      <template v-if="showTime">
        <div class="flex flex-col gap-1">
          <label :for="`${base}-hour`" class="text-xs font-semibold text-muted-foreground">Hour (0 to 23)</label>
          <Input
            :id="`${base}-hour`"
            :model-value="parts.hour"
            inputmode="numeric"
            autocomplete="off"
            placeholder="HH"
            maxlength="2"
            :readonly="readonly"
            :invalid="partInvalid('hour')"
            :aria-describedby="partDescribedBy('hour')"
            :data-path="showDate ? undefined : dataPath"
            class="w-16 text-center tabular"
            @update:model-value="onPart('hour', $event)"
            @blur="leave('hour')"
          />
        </div>
        <span class="pb-2 text-sm font-semibold" aria-hidden="true">:</span>
        <div class="flex flex-col gap-1">
          <label :for="`${base}-minute`" class="text-xs font-semibold text-muted-foreground">Minute</label>
          <Input
            :id="`${base}-minute`"
            :model-value="parts.minute"
            inputmode="numeric"
            autocomplete="off"
            placeholder="MM"
            maxlength="2"
            :readonly="readonly"
            :invalid="partInvalid('minute')"
            :aria-describedby="partDescribedBy('minute')"
            class="w-16 text-center tabular"
            @update:model-value="onPart('minute', $event)"
            @blur="leave('minute')"
          />
        </div>
      </template>
    </div>
    <p v-for="line in shown" :id="partErrorId(line.key)" :key="line.key" class="mt-1.5 flex items-start gap-1.5 text-xs font-medium text-destructive">
      <CircleAlert class="mt-px size-4 shrink-0" aria-hidden="true" />
      <span>{{ line.text }}</span>
    </p>
    <p v-if="error" :id="errorId" class="mt-1.5 flex items-start gap-1.5 text-xs font-medium text-destructive">
      <CircleAlert class="mt-px size-4 shrink-0" aria-hidden="true" />
      <span>{{ error }}</span>
    </p>
  </fieldset>
</template>
