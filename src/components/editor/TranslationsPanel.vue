<script setup lang="ts">
/**
 * The per-language texts of a Resource (plan 2.3, D-079): a real tab pattern for the languages (roving tabindex, Left,
 * Right, Home, End), each tab named in the language's own script with its `lang`, a completeness icon plus text
 * ("Complete", "3 of 5", "Missing") and an error marker; then the text fields in groups, the first always open and the
 * others collapsible with a filled count. In a language that is not the default, every field shows the default-language
 * text read-only beside it (stacked when the card is narrow) with a "Copy source" button, so a translator never
 * switches tabs to read what they translate. Every field takes its language's `lang` and text direction, an error is
 * linked to its field, and a field with an error opens its group.
 *
 * `structural` (default true) says whether the editor may show structural controls (reorder, add, remove of blocks,
 * stops, occurrences) at all; the default slot receives `structural` already combined with "this is the default
 * language", so an editor shows those controls only when `structural` is true. `v-model:source` exposes the
 * default-language texts to the editor.
 */
import { Check, CircleAlert, CircleDashed, CircleDot, Copy } from "lucide-vue-next";
import { computed, inject, nextTick, onBeforeUnmount, onMounted, reactive, watch, watchEffect } from "vue";
import { Button } from "@/components/ui/button";
import FormField from "@/components/ui/field/FormField.vue";
import Input from "@/components/ui/input/Input.vue";
import Textarea from "@/components/ui/textarea/Textarea.vue";
import { EDITOR_COMPLETENESS } from "@/platform/completeness";
import { EDITOR_ACTIVE, EDITOR_NEXT_MISSING } from "@/components/editor/EditorShell.vue";
import { FOCUS_FIRST_EMPTY_EVENT, REVEAL_FIELD_EVENT, type FocusFirstEmptyDetail } from "@/workspace/useResourceEditor";
import type { ProjectLanguage } from "@/platform/languages";

export interface TextFieldMeta {
  label: string;
  multiline: boolean;
  helper?: string;
  /** Sits beside the next `half` field from 34 rem (not when the source text is shown beside it). */
  half?: true;
}

export interface TextFieldGroup {
  id: string;
  /** Null for the always-open first group. */
  label: string | null;
  keys: string[];
  /** Initially open; groups without a label are always open. */
  open?: boolean;
}

const props = withDefaults(
  defineProps<{
    projectId: string;
    languages: ProjectLanguage[];
    /** Texts of every language, keyed by language code then field; edited in place. */
    texts: Record<string, Record<string, string>>;
    groups: TextFieldGroup[];
    meta: Record<string, TextFieldMeta>;
    readonly: boolean;
    errorLanguages: Set<string>;
    fieldError: (path: string) => string | undefined;
    /** Shown under the required field of the default language. */
    titleRequiredHint: string;
    /** The field required in the default language; "title" unless given, "" for none. */
    requiredField?: string;
    /** Whether the editor may offer reorder, add, and remove controls; they show in the default language only. */
    structural?: boolean;
    /** The section heading above the tabs (C2-67: every kind has "Texts"); `false` when the page draws its own. */
    heading?: string | false;
  }>(),
  { requiredField: undefined, structural: true, heading: "Texts" },
);
const activeLanguage = defineModel<string | null>("activeLanguage", { required: true });
/** The default language's texts, for editors that show them elsewhere. */
const source = defineModel<Record<string, string> | null>("source", { default: null });

defineSlots<{
  /** After the field groups of the language tab; `structural` is true only in the default language when allowed. */
  default?: (scope: { structural: boolean; language: ProjectLanguage; isDefault: boolean }) => unknown;
}>();

const active = computed(() => props.languages.find((l) => l.languageCode === activeLanguage.value) ?? null);
const current = computed(() => (active.value ? props.texts[active.value.languageCode] : undefined));
const defaultLanguage = computed(() => props.languages.find((l) => l.isDefault) ?? null);
const defaultTexts = computed(() => (defaultLanguage.value ? props.texts[defaultLanguage.value.languageCode] : undefined));
watchEffect(() => {
  source.value = defaultTexts.value ?? null;
});
const pair = computed(() => !!active.value && !active.value.isDefault && !!defaultLanguage.value && !!defaultTexts.value);
const allKeys = computed(() => props.groups.flatMap((g) => g.keys));
const openGroups = reactive<Record<string, boolean>>(Object.fromEntries(props.groups.map((g) => [g.id, g.open ?? true])));

/** The shell's completeness model (D-090): marks count Route stop texts, story blocks and alt text, not only these fields. */
const model = inject(EDITOR_COMPLETENESS, null);
/** "Next missing: Italiano", offered beside the tabs at every width; the side card keeps its copy too (C3-18). */
const nextMissing = inject(EDITOR_NEXT_MISSING, null);
/** Whether the Resource is ACTIVE: its Title hint then drops "before it can be activated" (C3-29). */
const resourceActive = inject(EDITOR_ACTIVE, null);
/** The required field is a one-line title that wraps and grows rather than clipping a long text (C2-54). */
const isTitle = (field: string) => field === (props.requiredField ?? "title") && !props.meta[field].multiline;
/** Enter would add a line break to a title; it stays one paragraph. */
const noEnter = (event: KeyboardEvent) => event.preventDefault();
const MARKS = {
  complete: { icon: Check, tone: "text-success" },
  missing: { icon: CircleDashed, tone: "text-muted-foreground" },
  partial: { icon: CircleDot, tone: "text-ink-2" },
} as const;

/** The tab's completeness mark: the shell's model when there is one, else a count of this panel's own fields. */
function completeness(l: ProjectLanguage) {
  const row = model?.value.perLanguage.find((r) => r.language.languageCode === l.languageCode);
  if (row) return { ...MARKS[row.state], text: row.mark };
  const texts = props.texts[l.languageCode];
  const total = allKeys.value.length;
  const filled = texts ? allKeys.value.filter((k) => texts[k]?.trim()).length : 0;
  if (filled === total) return { ...MARKS.complete, text: "Complete" };
  if (filled === 0) return { ...MARKS.missing, text: "Missing" };
  return { ...MARKS.partial, text: `${filled} of ${total}` };
}

/** Opens the collapsible group holding a field, so it can be focused or shows its error. */
function revealField(field: string) {
  const group = props.groups.find((g) => g.label && g.keys.includes(field));
  if (group) openGroups[group.id] = true;
}

// A group with an error in the language on screen opens by itself: a collapsed group renders no fields, so neither
// the message nor the focus could reach them otherwise.
watch(
  () => props.groups.flatMap((g) => g.keys.filter((k) => error(k))),
  (fields) => fields.forEach(revealField),
  { immediate: true },
);

// The editor asks before moving focus to a field (`focusField`), e.g. from a readiness item.
function onReveal(event: Event) {
  const path = (event as CustomEvent<{ path: string }>).detail?.path ?? "";
  const field = /^translations\.[^.]+\.([^.[]+)/.exec(path)?.[1];
  if (field) revealField(field);
}
/**
 * "Next missing" (C3-17): moves focus to the first empty field of the language on screen, opening the group that holds
 * it ("Practical details") first, and never to a field that already has text. The shell asks with
 * `FOCUS_FIRST_EMPTY_EVENT`; `handled` tells it whether a field was found, so it can go on to the next language.
 */
function onFocusFirstEmpty(event: Event) {
  const detail = (event as CustomEvent<FocusFirstEmptyDetail>).detail;
  if (!detail || detail.language !== active.value?.languageCode || props.readonly || !current.value) return;
  const field = allKeys.value.find((key) => !current.value![key]?.trim());
  if (!field) return;
  detail.handled = true;
  revealField(field);
  void nextTick(() => {
    const element = document.getElementById(`f-${field}`);
    if (!element) return;
    element.scrollIntoView({ block: "center" });
    element.focus({ preventScroll: true });
  });
}
onMounted(() => {
  window.addEventListener(REVEAL_FIELD_EVENT, onReveal);
  window.addEventListener(FOCUS_FIRST_EMPTY_EVENT, onFocusFirstEmpty);
});
onBeforeUnmount(() => {
  window.removeEventListener(REVEAL_FIELD_EVENT, onReveal);
  window.removeEventListener(FOCUS_FIRST_EMPTY_EVENT, onFocusFirstEmpty);
});

function filledSummary(keys: string[]): string {
  const filled = current.value ? keys.filter((k) => current.value![k]?.trim()).length : 0;
  return filled === keys.length ? "All filled" : `${filled} of ${keys.length} filled`;
}

function error(field: string): string | undefined {
  return active.value ? props.fieldError(`translations.${active.value.languageCode}.${field}`) : undefined;
}

/** Left, Right, Home, End move between the language tabs and select the one reached (WAI-ARIA tabs). */
function onTabKey(event: KeyboardEvent) {
  const codes = props.languages.map((l) => l.languageCode);
  const at = codes.indexOf(activeLanguage.value ?? "");
  const next =
    event.key === "ArrowRight" ? codes[(at + 1) % codes.length]
    : event.key === "ArrowLeft" ? codes[(at + codes.length - 1) % codes.length]
    : event.key === "Home" ? codes[0]
    : event.key === "End" ? codes[codes.length - 1]
    : null;
  if (!next) return;
  event.preventDefault();
  activeLanguage.value = next;
  void nextTick(() => document.getElementById(`tab-${next}`)?.focus());
}

function copySource(field: string) {
  if (!current.value || !defaultTexts.value || props.readonly) return;
  current.value[field] = defaultTexts.value[field] ?? "";
  void nextTick(() => document.getElementById(`f-${field}`)?.focus());
}

/**
 * Text direction of the fields: the language's own when it is known to be right-to-left, otherwise `auto`, so a title
 * that mixes scripts (an Arabic name inside an English sentence) keeps its punctuation in place (C3-50).
 */
const fieldDir = computed(() => (active.value?.direction.toLowerCase() === "rtl" ? "rtl" : "auto"));

/** The hint sits under the control (not above it) beside a source text or a `half` neighbour, so the two controls start level. */
const hintBelow = (field: string) => pair.value || !!props.meta[field].half;

/** The ids a field is described by: its source text (when beside it), and whatever FormField linked. */
const described = (field: string, linked: string | undefined) =>
  [pair.value ? `src-${field}` : null, hintBelow(field) && fieldHint(field) ? `hint-${field}` : null, linked].filter(Boolean).join(" ") || undefined;

/** The line under a field: the required-field hint in the default language, else the field's own helper. */
const fieldHint = (field: string) =>
  field === (props.requiredField ?? "title") && active.value?.isDefault
    ? props.readonly
      ? undefined
      : resourceActive?.value
        ? "Required in the default language."
        : props.titleRequiredHint
    : props.meta[field].helper;
</script>

<template>
  <div v-if="!languages.length" class="rounded-lg border bg-card p-6 text-sm text-muted-foreground">
    The Project has no languages, so the texts cannot be edited.
    <RouterLink :to="{ name: 'project-languages', params: { projectId } }">Set up languages</RouterLink>
  </div>

  <!-- One root, so the gap between the heading and the tab bar is 0 in every editor whatever its parent's gap is (C3-37). -->
  <div v-else class="flex flex-col">
    <h2 v-if="heading" class="m-0 text-base font-bold">{{ heading }}</h2>
    <div class="flex items-stretch border-b border-border">
    <!-- 4 px inset so the 2 px focus ring plus its offset is never clipped by the scroller (D-100). -->
    <div class="-m-1 flex min-w-0 flex-1 overflow-x-auto p-1" role="tablist" aria-label="Language" @keydown="onTabKey">
      <button
        v-for="l in languages"
        :id="`tab-${l.languageCode}`"
        :key="l.languageCode"
        type="button"
        role="tab"
        :aria-selected="activeLanguage === l.languageCode"
        :aria-controls="`panel-${l.languageCode}`"
        :tabindex="activeLanguage === l.languageCode ? 0 : -1"
        class="relative flex min-h-control shrink-0 flex-col items-start justify-center gap-0.5 px-4 py-1.5 text-left text-sm transition-ui hover:bg-surface-hover"
        :class="activeLanguage === l.languageCode ? 'font-semibold text-primary after:absolute after:inset-x-0 after:-bottom-1 after:h-0.5 after:bg-primary' : 'font-medium text-ink-2'"
        @click="activeLanguage = l.languageCode"
      >
        <span class="flex items-center gap-1.5">
          <bdi :lang="l.languageCode">{{ l.displayName }}</bdi>
          <span v-if="l.isDefault" class="text-xs font-medium text-muted-foreground">default</span>
          <span v-if="errorLanguages.has(l.languageCode)" class="inline-flex items-center gap-0.5 text-xs font-semibold text-destructive">
            <CircleAlert class="size-4" aria-hidden="true" />has errors
          </span>
        </span>
        <span class="flex items-center gap-1 text-xs font-medium" :class="completeness(l).tone">
          <component :is="completeness(l).icon" class="size-3.5" aria-hidden="true" />{{ completeness(l).text }}
        </span>
      </button>
    </div>
    <Button v-if="nextMissing" variant="ghost" size="sm" class="my-auto ml-2 shrink-0" data-next-missing @click="nextMissing.go()">{{ nextMissing.label }}</Button>
    </div>

    <div v-if="active && current" class="translation-wrap mt-4">
    <section
      :id="`panel-${active.languageCode}`"
      role="tabpanel"
      :aria-labelledby="`tab-${active.languageCode}`"
      class="translation-card rounded-lg border bg-card p-6 shadow-1"
    >
      <p v-if="pair" class="text-sm text-muted-foreground">
        Translating from <bdi :lang="defaultLanguage!.languageCode" class="font-semibold text-ink-2">{{ defaultLanguage!.displayName }}</bdi>
        into <bdi :lang="active.languageCode" class="font-semibold text-ink-2">{{ active.displayName }}</bdi>. The source text is beside each field.
      </p>
      <template v-for="group in groups" :key="group.id">
        <button
          v-if="group.label"
          type="button"
          class="group-disclosure flex min-h-control items-center gap-2 rounded-md border-t border-border px-2 pb-1 pt-4 text-left"
          :aria-expanded="openGroups[group.id]"
          @click="openGroups[group.id] = !openGroups[group.id]"
        >
          <span class="text-sm font-semibold text-ink-2">{{ group.label }}</span>
          <span class="text-xs text-muted-foreground">{{ filledSummary(group.keys) }}</span>
          <span class="ml-auto text-xs font-medium text-primary">{{ openGroups[group.id] ? "Hide" : "Show" }}</span>
        </button>
        <template v-if="!group.label || openGroups[group.id]">
          <div v-for="field in group.keys" :key="field" :class="pair ? 'translation-pair' : meta[field].half ? 'translation-half' : ''">
            <div v-if="pair" class="flex flex-col gap-1.5">
              <span class="text-sm font-semibold text-ink-2">{{ meta[field].label }} in <bdi :lang="defaultLanguage!.languageCode">{{ defaultLanguage!.displayName }}</bdi></span>
              <div
                :id="`src-${field}`"
                class="min-h-control whitespace-pre-wrap break-words rounded-md border border-border bg-muted px-3 py-2 text-sm text-ink-2"
                :lang="defaultLanguage!.languageCode"
                :dir="defaultLanguage!.direction.toLowerCase()"
              >
                <template v-if="defaultTexts![field]?.trim()">{{ defaultTexts![field] }}</template>
                <span v-else class="text-muted-foreground">No text in {{ defaultLanguage!.displayName }} yet.</span>
              </div>
              <div>
                <Button
                  variant="ghost"
                  size="sm"
                  :disabled-reason="readonly ? 'This item cannot be edited' : !defaultTexts![field]?.trim() ? 'There is no source text to copy' : undefined"
                  @click="copySource(field)"
                >
                  <Copy aria-hidden="true" />Copy source<span class="sr-only"> for {{ meta[field].label }}</span>
                </Button>
              </div>
            </div>
            <div class="flex flex-col gap-1.5">
              <FormField
                :id="`f-${field}`"
                :label="pair ? `${meta[field].label} in ${active.displayName}` : meta[field].label"
                :hint="hintBelow(field) ? undefined : fieldHint(field)"
                :error="error(field)"
                v-slot="f"
              >
                <Textarea
                  v-if="meta[field].multiline"
                  :id="f.id"
                  v-model="current[field]"
                  autogrow
                  :min-rows="2"
                  :readonly="readonly"
                  :lang="active.languageCode"
                  :dir="fieldDir"
                  :aria-describedby="described(field, f.describedBy)"
                  :invalid="f.invalid"
                  :data-path="`translations.${active.languageCode}.${field}`"
                />
                <Textarea
                  v-else-if="isTitle(field)"
                  :id="f.id"
                  v-model="current[field]"
                  autogrow
                  :min-rows="1"
                  :max-rows="4"
                  :readonly="readonly"
                  :lang="active.languageCode"
                  :dir="fieldDir"
                  :aria-describedby="described(field, f.describedBy)"
                  :invalid="f.invalid"
                  class="min-h-control resize-none"
                  :data-path="`translations.${active.languageCode}.${field}`"
                  @keydown.enter="noEnter"
                />
                <Input
                  v-else
                  :id="f.id"
                  v-model="current[field]"
                  :readonly="readonly"
                  type="text"
                  :lang="active.languageCode"
                  :dir="fieldDir"
                  :aria-describedby="described(field, f.describedBy)"
                  :invalid="f.invalid"
                  :data-path="`translations.${active.languageCode}.${field}`"
                />
              </FormField>
              <p v-if="hintBelow(field) && fieldHint(field)" :id="`hint-${field}`" class="text-xs text-muted-foreground">{{ fieldHint(field) }}</p>
            </div>
          </div>
        </template>
      </template>
      <slot :structural="structural && active.isDefault" :language="active" :is-default="active.isDefault" />
    </section>
    </div>
  </div>
</template>

<style scoped>
/* The disclosure box keeps a visible edge in forced colours, where the top rule alone can vanish (C3-63). */
@media (forced-colors: active) {
  .group-disclosure {
    border: 1px solid ButtonText;
  }
}
/* The source text sits beside its field when the card is wide enough, above it otherwise. */
.translation-wrap {
  container-type: inline-size;
}
/* Rows are 16 px apart (P4: the POI editor's length); `half` fields share a row from 34 rem. */
.translation-card {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 1rem;
}
.translation-card > :deep(*) {
  grid-column: 1 / -1;
}
.translation-pair {
  display: grid;
  gap: 1rem;
}
@container (min-width: 34rem) {
  .translation-card > :deep(.translation-half) {
    grid-column: auto;
  }
  .translation-card {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .translation-pair {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    align-items: start;
  }
}
</style>
