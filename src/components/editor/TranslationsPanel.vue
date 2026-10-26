<script setup lang="ts">
/**
 * The per-language texts of a Resource: language tabs, then its text fields in groups, the first group
 * always open and the others collapsible with a filled count, as in the mockup. Every field takes the
 * language's `lang` and text direction. Without Project languages it explains where to add them.
 */
import { computed, onBeforeUnmount, onMounted, reactive, watch } from "vue";
import { REVEAL_FIELD_EVENT } from "@/workspace/useResourceEditor";
import type { ProjectLanguage } from "@/platform/languages";

export interface TextFieldMeta {
  label: string;
  multiline: boolean;
  helper?: string;
}

export interface TextFieldGroup {
  id: string;
  /** Null for the always-open first group. */
  label: string | null;
  keys: string[];
  /** Initially open; groups without a label are always open. */
  open?: boolean;
}

const props = defineProps<{
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
}>();
const activeLanguage = defineModel<string | null>("activeLanguage", { required: true });

const active = computed(() => props.languages.find((l) => l.languageCode === activeLanguage.value) ?? null);
const current = computed(() => (active.value ? props.texts[active.value.languageCode] : undefined));
const openGroups = reactive<Record<string, boolean>>(Object.fromEntries(props.groups.map((g) => [g.id, g.open ?? true])));

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
onMounted(() => window.addEventListener(REVEAL_FIELD_EVENT, onReveal));
onBeforeUnmount(() => window.removeEventListener(REVEAL_FIELD_EVENT, onReveal));

function filledSummary(keys: string[]): string {
  const filled = current.value ? keys.filter((k) => current.value![k]?.trim()).length : 0;
  return filled === keys.length ? "All filled" : `${filled} of ${keys.length} filled`;
}

function error(field: string): string | undefined {
  return active.value ? props.fieldError(`translations.${active.value.languageCode}.${field}`) : undefined;
}
</script>

<template>
  <div v-if="!languages.length" class="rounded-lg border bg-card px-[22px] py-5 text-[13px] text-muted-foreground">
    The Project has no languages, so the texts cannot be edited.
    <RouterLink :to="{ name: 'project-languages', params: { projectId } }">Set up languages</RouterLink>
  </div>

  <template v-else>
    <div class="flex border-b-2" role="tablist" aria-label="Language">
      <button
        v-for="l in languages"
        :id="`tab-${l.languageCode}`"
        :key="l.languageCode"
        type="button"
        role="tab"
        :aria-selected="activeLanguage === l.languageCode"
        :aria-controls="`panel-${l.languageCode}`"
        class="-mb-0.5 border-b-2 px-5 py-2.5 text-xs font-bold uppercase tracking-[0.05em]"
        :class="activeLanguage === l.languageCode ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'"
        @click="activeLanguage = l.languageCode"
      >
        {{ l.displayName }}<span v-if="l.isDefault" class="ml-1 text-[9px] opacity-70">· default</span>
        <span v-if="errorLanguages.has(l.languageCode)" class="ml-1 text-destructive" aria-label="has errors">⚠</span>
      </button>
    </div>

    <section
      v-if="active && current"
      :id="`panel-${active.languageCode}`"
      role="tabpanel"
      :aria-labelledby="`tab-${active.languageCode}`"
      class="flex flex-col gap-[18px] rounded-lg border bg-card px-[22px] py-5"
    >
      <template v-for="group in groups" :key="group.id">
        <button
          v-if="group.label"
          type="button"
          class="flex items-center gap-2 border-t border-gray-100 pt-4 text-left"
          :aria-expanded="openGroups[group.id]"
          @click="openGroups[group.id] = !openGroups[group.id]"
        >
          <span class="text-[11px] font-extrabold uppercase tracking-[0.09em] text-muted-foreground">{{ group.label }}</span>
          <span class="text-[11px] text-muted-foreground">· {{ filledSummary(group.keys) }}</span>
          <span class="ml-auto text-[10px] text-muted-foreground" aria-hidden="true">{{ openGroups[group.id] ? "▴" : "▾" }}</span>
        </button>
        <template v-if="!group.label || openGroups[group.id]">
          <div v-for="field in group.keys" :key="field" class="flex flex-col gap-[7px]">
            <label :for="`f-${field}`" class="field-label">{{ meta[field].label }}</label>
            <textarea
              v-if="meta[field].multiline"
              :id="`f-${field}`"
              v-model="current[field]"
              :readonly="readonly"
              :lang="active.languageCode"
              :dir="active.direction.toLowerCase()"
              class="field-input min-h-[92px] resize-y"
              :class="{ invalid: error(field) }"
              :data-path="`translations.${active.languageCode}.${field}`"
              :aria-invalid="error(field) ? 'true' : undefined"
            ></textarea>
            <input
              v-else
              :id="`f-${field}`"
              v-model="current[field]"
              :readonly="readonly"
              type="text"
              :lang="active.languageCode"
              :dir="active.direction.toLowerCase()"
              class="field-input"
              :class="{ invalid: error(field) }"
              :data-path="`translations.${active.languageCode}.${field}`"
              :aria-invalid="error(field) ? 'true' : undefined"
            />
            <span v-if="field === (requiredField ?? 'title') && active.isDefault" class="text-xs text-muted-foreground">{{ titleRequiredHint }}</span>
            <span v-else-if="meta[field].helper" class="text-xs text-muted-foreground">{{ meta[field].helper }}</span>
            <span v-if="error(field)" class="text-xs font-semibold text-destructive">⚠ {{ error(field) }}</span>
          </div>
        </template>
      </template>
    </section>
  </template>
</template>
