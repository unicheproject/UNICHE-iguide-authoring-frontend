<script setup lang="ts">
/**
 * The frame of every create dialog (plan 2.4, D-078): title, the kind's own fields, the slug behind an "Edit slug"
 * disclosure, a shared error summary that takes focus, a sticky footer and a primary "Create and open" button with a
 * busy state. Built on `AppDialog`, so Esc, the backdrop, focus return and the 200 % zoom behaviour are shared.
 *
 * The frame owns the Title and the slug: `v-model:title`, `v-model:slug` (derived from the title until the author edits
 * it), their client checks and errors. The kind's fields go in the default slot, after the Title, and receive
 * `{ id, errors }`: `id(key)` is the DOM id of the field named `key` (use it for `FormField :id` so the summary can
 * focus it), `errors` is the shared map. Put the choice that needs a legend in a `<fieldset>`; mark an invalid
 * group with `aria-invalid="true"` and an `id` from `id(key)`.
 *
 * Flow: the form's `submit` runs the frame's checks (title present, slug pattern); when they pass it emits `submit`.
 * The parent checks its own fields (writing into `v-model:errors`), calls the API and sets `errors` / `formError` from
 * the answer. Any error shows in one `FormErrorSummary` ("3 things to fix", links that focus the field, request id)
 * which takes focus; the slug disclosure opens itself when the slug is the problem. Initial focus is on the Title.
 *
 * Round 2 (D-091, C2-44): every check runs in ONE pass: the frame's (Title, slug) and the kind's own through the
 * `validate` prop, so the author never fixes one error to meet the next. The summary lists the problems in the order of
 * the form, not the order the checks ran. A key the frame cannot name (an unmapped 422 field) shows its message without
 * the raw key and without a link. The slug is capped at 100 characters. Esc, the backdrop and the close button ask
 * "Discard what you typed?" first when the Title, the slug or the kind's fields (`dirty`) hold text (`confirmDiscard`,
 * on by default); Cancel leaves at once, it is the explicit choice. Required fields are marked "(required)" by
 * `FormField required`: mark every required field of the kind the same way and nothing else. In a short window (zoom
 * 200 %) the intro line goes and the gaps shrink so the body shows at least four lines and scrolls.
 */
import { ChevronDown, ChevronRight } from "lucide-vue-next";
import { computed, nextTick, provide, ref, useId, watch } from "vue";
import AppDialog from "@/components/AppDialog.vue";
import { Button } from "@/components/ui/button";
import FormErrorSummary, { type ErrorSummaryLine } from "@/components/ui/field/FormErrorSummary.vue";
import FormField, { QUIET_FIELD_ERRORS } from "@/components/ui/field/FormField.vue";
import Input from "@/components/ui/input/Input.vue";
import { SLUG_PATTERN, slugify } from "@/lib/format";
import { askConfirm } from "@/stores/confirm";
import type { ProjectLanguage } from "@/platform/languages";

const props = withDefaults(
  defineProps<{
    /** Dialog heading: "New point of interest". */
    heading: string;
    /** One sentence under the heading: what a new item is. */
    intro?: string;
    /** What the item is called in error and hint text: "point of interest". */
    noun: string;
    /** The Project's default language: labels the Title and sets its direction and `lang`. */
    defaultLanguage: ProjectLanguage;
    /** A request in flight: the primary button shows progress, Cancel and Esc are blocked. */
    busy?: boolean;
    /** The platform's answer that belongs to no field (unreachable, unexpected), with its request id. */
    formError?: string | null;
    requestId?: string | null;
    /** The primary button; default "Create and open". */
    submitLabel?: string;
    /** Field key to the label shown in the summary, for the kind's own fields (`title` and `slug` are built in). */
    labels?: Record<string, string>;
    /** The Title field's name ("Title"; a Category says "Name"). */
    titleLabel?: string;
    /** The slug field's name ("Slug"; a Category says "Code"). */
    slugLabel?: string;
    /** Replaces the slug field's hint (default: web address and QR code); a kind without a web address says what the value is. */
    slugHint?: string;
    /** Why the primary button is off, when it is (kept focusable and explained). */
    disabledReason?: string;
    /**
     * The kind's own checks, run in the same pass as Title and slug: return the error per field key (the keys of
     * `labels` and the ids from the slot's `id(key)`). Nothing is created while it returns any.
     */
    validate?: () => Record<string, string>;
    /** The kind's own fields hold something the author typed or chose, so closing asks first. */
    dirty?: boolean;
    /** Ask before Esc, the backdrop or the close button discard typed text; default true. */
    confirmDiscard?: boolean;
  }>(),
  {
    intro: undefined,
    busy: false,
    formError: null,
    requestId: null,
    submitLabel: "Create and open",
    labels: () => ({}),
    disabledReason: undefined,
    titleLabel: "Title",
    slugLabel: "Slug",
    slugHint: undefined,
    validate: undefined,
    dirty: false,
    confirmDiscard: true,
  },
);
const emit = defineEmits<{ close: []; submit: [] }>();

const title = defineModel<string>("title", { required: true });
const slug = defineModel<string>("slug", { required: true });
/** Field errors by key (`title`, `slug`, the kind's keys, `""` for a message without a field). */
const errors = defineModel<Record<string, string>>("errors", { default: () => ({}) });

// The error summary is the one alert; field messages stay linked to their fields without announcing again.
provide(QUIET_FIELD_ERRORS, true);

const uid = useId();
const idOf = (key: string) => `fd-${uid}-${key}`;
const formId = `fd-form-${uid}`;

const slugOpen = ref(false);
const slugEdited = ref(false);
const summaryHost = ref<HTMLElement | null>(null);

// The address follows the title until the author types one of their own.
/** The longest address the platform accepts. */
const SLUG_MAX = 100;
watch(title, (value) => {
  if (!slugEdited.value) slug.value = slugify(value).slice(0, SLUG_MAX).replace(/-+$/, "");
});
function onSlugInput(value: string | number | undefined) {
  slugEdited.value = true;
  slug.value = String(value ?? "").slice(0, SLUG_MAX);
  clearError("slug");
}
function onTitleInput() {
  clearError("title");
}
function clearError(key: string) {
  if (!errors.value[key]) return;
  const { [key]: _gone, ...rest } = errors.value;
  errors.value = rest;
}

const titleFieldLabel = computed(() => `${props.titleLabel} · ${props.defaultLanguage.displayName}`);
const labelOf = (key: string) => (key === "title" ? props.titleLabel : key === "slug" ? props.slugLabel : (props.labels[key] ?? ""));

/** Position of a field in the form (DOM order), so the summary reads top to bottom; fields the form lacks go last. */
function formPosition(key: string): number {
  const el = typeof document === "undefined" ? null : document.getElementById(idOf(key));
  const form = typeof document === "undefined" ? null : document.getElementById(formId);
  if (!el || !form) return Number.MAX_SAFE_INTEGER;
  return [...form.querySelectorAll("*")].indexOf(el);
}

const lines = computed<ErrorSummaryLine[]>(() => {
  const named = Object.entries(errors.value).filter(([key, message]) => key && message);
  const out: ErrorSummaryLine[] = named
    .map(([key, message]) => ({ key, message, at: formPosition(key) }))
    .sort((a, b) => a.at - b.at)
    // A key the form has no field for (an unmapped 422 path) shows its message only: no raw key, no dead link.
    .map(({ key, message, at }) => (at === Number.MAX_SAFE_INTEGER && !labelOf(key) ? { text: message, path: null } : { text: labelOf(key) ? `${labelOf(key)}: ${message}` : message, path: key }));
  if (errors.value[""]) out.push({ text: errors.value[""], path: null });
  if (props.formError) out.push({ text: props.formError, path: null });
  return out;
});
const summary = computed(() => ({
  // A failure that belongs to no field is not "things to fix": it says what did not happen (D-105).
  title: lines.value.length && lines.value.every((line) => !line.path)
    ? `The ${props.noun} was not created`
    : lines.value.length === 1 ? "1 thing to fix" : `${lines.value.length} things to fix`,
  items: lines.value,
  requestId: props.requestId,
}));

/** Moves focus to the field the summary names; opens the slug disclosure first when that is the field. */
async function focusField(key: string) {
  if (key === "slug" && !slugOpen.value) {
    slugOpen.value = true;
    await nextTick();
  }
  const el = document.getElementById(idOf(key));
  const target = el?.matches("input, select, textarea, button") ? el : el?.querySelector<HTMLElement>("input, select, textarea, button");
  target?.focus();
}

// The summary takes focus whenever the set of problems changes or the author submits again with the same ones.
const attempts = ref(0);
const signature = computed(() => JSON.stringify([errors.value, props.formError]));
watch(
  [signature, attempts],
  async () => {
    if (!lines.value.length) return;
    if (errors.value.slug && !slugOpen.value) slugOpen.value = true;
    await nextTick();
    summaryHost.value?.querySelector<HTMLElement>("[data-error-summary]")?.focus();
  },
  { flush: "post" },
);

function onSubmit() {
  if (props.busy) return;
  attempts.value++;
  const next: Record<string, string> = {};
  if (!title.value.trim()) next.title = `Enter a ${props.titleLabel.toLowerCase()} in the default language.`;
  // An empty title already says what is wrong; the slug is only named when it is present and invalid, or typed empty.
  if (!SLUG_PATTERN.test(slug.value) && (title.value.trim() || slugEdited.value)) {
    next.slug = "Use lowercase Latin letters, digits and single hyphens, for example acropolis-east.";
  } else if (slug.value.length > SLUG_MAX) {
    next.slug = `Use at most ${SLUG_MAX} characters.`;
  }
  // The kind's own checks join the same pass; the frame's message wins when both name a field.
  Object.assign(next, { ...props.validate?.(), ...next });
  errors.value = next;
  if (Object.keys(next).length) return;
  emit("submit");
}

const slugDisclosureId = idOf("slug-panel");

const isDirty = computed(() => props.dirty || !!title.value.trim() || slugEdited.value);

/** Esc, the backdrop and the close button: ask before typed text is lost. */
async function requestClose() {
  if (props.busy) return;
  if (props.confirmDiscard && isDirty.value) {
    const discard = await askConfirm({
      title: "Discard what you typed?",
      body: `The new ${props.noun} has not been created. What you entered here will be lost.`,
      confirmLabel: "Discard",
      cancelLabel: "Keep editing",
      danger: true,
    });
    if (!discard) return;
  }
  emit("close");
}
</script>

<template>
  <AppDialog :title="heading" size="md" :busy="busy" @close="requestClose">
    <p v-if="intro" class="mb-4 text-sm text-ink-2 [@media(max-height:520px)]:hidden">{{ intro }}</p>
    <form :id="formId" data-form-dialog novalidate class="flex flex-col gap-5 [@media(max-height:520px)]:gap-3" @submit.prevent="onSubmit">
      <div ref="summaryHost" aria-live="off">
        <FormErrorSummary v-if="lines.length" :summary="summary" @select="focusField" />
      </div>

      <FormField :label="titleFieldLabel" required :error="errors.title" :id="idOf('title')" v-slot="f">
        <Input
          v-model="title"
          type="text"
          autocomplete="off"
          :id="f.id"
          :aria-describedby="f.describedBy"
          :invalid="f.invalid"
          :dir="defaultLanguage.direction === 'RTL' ? 'rtl' : 'auto'"
          :lang="defaultLanguage.languageCode"
          @input="onTitleInput"
        />
      </FormField>

      <slot :id="idOf" :errors="errors" />

      <div class="flex flex-col gap-2">
        <div class="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
          <span class="text-ink-2">{{ slugLabel }}:</span>
          <code class="mono min-w-0 break-all" :class="slug ? 'text-foreground' : 'text-muted-foreground'">{{ slug || "built from the title" }}</code>
          <button
            type="button"
            class="inline-flex min-h-8 items-center gap-1 rounded-sm font-semibold text-primary underline-offset-4 hover:underline [@media(pointer:coarse)]:min-h-11"
            :aria-expanded="slugOpen"
            :aria-controls="slugDisclosureId"
            @click="slugOpen = !slugOpen"
          >
            <ChevronDown v-if="slugOpen" class="size-4" aria-hidden="true" />
            <ChevronRight v-else class="size-4" aria-hidden="true" />
            Edit {{ slugLabel.toLowerCase() }}
          </button>
        </div>
        <div v-show="slugOpen" :id="slugDisclosureId">
          <FormField
            :label="slugLabel"
            :hint="slugHint ?? `Part of the ${noun}'s web address and of its QR code. Unique in the Project.`"
            :error="errors.slug"
            :id="idOf('slug')"
            v-slot="f"
          >
            <Input
              :model-value="slug"
              type="text"
              autocomplete="off"
              spellcheck="false"
              class="mono"
              :id="f.id"
              :aria-describedby="f.describedBy"
              :invalid="f.invalid"
              :maxlength="SLUG_MAX"
              @update:model-value="onSlugInput"
            />
          </FormField>
        </div>
      </div>
    </form>

    <template #actions>
      <Button variant="secondary" :disabled="busy" @click="emit('close')">Cancel</Button>
      <Button type="submit" variant="primary" :form="formId" :loading="busy" :disabled-reason="disabledReason">
        {{ busy ? "Creating…" : submitLabel }}
      </Button>
    </template>
  </AppDialog>
</template>

<style>
/* A short window (200 % zoom on a laptop): the frame gives its height to the body, so at least four lines of the form show. */
@media (max-height: 520px) {
  [role="dialog"]:has([data-form-dialog]) > div:first-child {
    padding-top: 0.5rem;
    padding-bottom: 0;
  }
  [role="dialog"]:has([data-form-dialog]) > footer {
    padding-top: 0.5rem;
    padding-bottom: 0.5rem;
  }
  [role="dialog"]:has([data-form-dialog]) [data-dialog-body] {
    padding-top: 0;
    padding-bottom: 1rem;
  }
}
</style>
