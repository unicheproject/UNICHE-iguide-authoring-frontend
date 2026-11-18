<script setup lang="ts">
/**
 * "New category" on the shared `FormDialog` (plan 2.4, `12` §3 Category): Name first, then "Applies to" (Points of
 * Interest or Routes; nothing is preselected, so the choice is the author's), "Level" (top-level, or a subcategory with
 * its parent among the top-level Categories of the same scope), the identifier under "Edit code". The platform field is
 * `code` (`03` §10); the frame's slug carries it, and the editor and the list name it the same way. A choice shows a
 * check mark besides its border and tint, so it never relies on colour. A Subcategory needs a parent the author chose: the
 * select starts on "Choose a parent" and nothing is created without one (C2-38). "Create and open" creates the draft.
 */
import { Check } from "lucide-vue-next";
import { computed, ref, useId, watch } from "vue";
import FormDialog from "@/components/ui/dialog/FormDialog.vue";
import FormField from "@/components/ui/field/FormField.vue";
import Select from "@/components/ui/select/Select.vue";
import { describeError } from "@/lib/errors";
import { ApiError } from "@/platform/api";
import { CATEGORY_SCOPES, createCategory, parentChoices, scopeLabel, type Category, type CategoryScope } from "@/platform/categories";
import type { ProjectLanguage } from "@/platform/languages";

const props = defineProps<{ projectId: string; defaultLanguage: ProjectLanguage; categories: Category[]; initialParentId: string | null }>();
const emit = defineEmits<{ close: []; created: [category: Category] }>();

const name = ref("");
const slug = ref("");
const initialParent = props.categories.find((c) => c.id === props.initialParentId) ?? null;
/** Empty until chosen, unless the dialog opened from a category's "Add subcategory" (the parent's scope applies). */
const scope = ref<CategoryScope | "">(initialParent?.scope ?? "");
const sub = ref(!!initialParent);
const parentId = ref(initialParent?.id ?? "");
const submitting = ref(false);
const errors = ref<Record<string, string>>({});
const formError = ref<string | null>(null);
const requestId = ref<string | null>(null);

const scopeName = useId();
const levelName = useId();
const parents = computed(() => (scope.value ? parentChoices(props.categories, scope.value, props.defaultLanguage.languageCode) : []));

const SCOPE_HINTS: Record<CategoryScope, string> = {
  POI: "Groups points of interest, such as Sculpture.",
  ROUTE: "Groups routes, such as Short tours.",
};
const LEVELS = [
  { sub: false, label: "Top-level", hint: "A main group with its own subcategories." },
  { sub: true, label: "Subcategory", hint: "Sits under a top-level category of the same kind." },
] as const;

// The parent is never chosen for the author (C2-38): a scope change drops a parent that does not belong to it, and
// the select starts on "Choose a parent" until the author picks one.
watch(scope, () => {
  if (!parents.value.some((p) => p.id === parentId.value)) parentId.value = "";
  clear("scope");
});
watch(sub, (isSub) => {
  if (!isSub) parentId.value = "";
  clear("parentCategoryId");
});
watch(parentId, () => clear("parentCategoryId"));

/** The kind's own checks, run in the same pass as the Name and the code. */
function validate(): Record<string, string> {
  const found: Record<string, string> = {};
  if (!scope.value) found.scope = "Choose what the category applies to: points of interest or routes.";
  else if (sub.value && !parentId.value) {
    found.parentCategoryId = parents.value.length
      ? "Choose a parent category, or choose Top-level."
      : `Create a top-level category for ${scopeLabel(scope.value)} first, or choose Top-level.`;
  }
  return found;
}
/** Something other than the Name and the code was typed or chosen, so closing asks first. */
const dirty = computed(() => scope.value !== (initialParent?.scope ?? "") || sub.value !== !!initialParent || parentId.value !== (initialParent?.id ?? ""));
function clear(key: string) {
  if (!errors.value[key]) return;
  const { [key]: _gone, ...rest } = errors.value;
  errors.value = rest;
}

async function submit() {
  errors.value = {};
  formError.value = null;
  requestId.value = null;
  if (!scope.value) return;
  if (sub.value && !parentId.value) return;
  submitting.value = true;
  try {
    emit(
      "created",
      await createCategory(props.projectId, {
        name: name.value.trim(),
        code: slug.value,
        scope: scope.value,
        parentCategoryId: sub.value ? parentId.value || null : null,
      }),
    );
  } catch (e) {
    if (!(e instanceof ApiError)) throw e;
    requestId.value = e.requestId;
    if (e.code === "DUPLICATE_VALUE") {
      errors.value = { slug: "Another category already uses this slug. Choose a different one." };
    } else if (e.status === 422 || e.status === 400) {
      // The platform names the field `code`; the dialog shows it as the slug.
      const { code, name: nameMessage, ...rest } = e.fieldMessages();
      errors.value = { ...rest, ...(code ? { slug: code } : {}), ...(nameMessage ? { title: nameMessage } : {}) };
      formError.value = Object.keys(errors.value).length ? null : describeError(e, "create the category").body;
    } else {
      // One sentence per failure (D-087): chosen by status and code, never the platform's own words.
      formError.value = describeError(e, "create the category").body;
    }
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <FormDialog
    v-model:title="name"
    v-model:slug="slug"
    v-model:errors="errors"
    heading="New category"
    intro="The category starts as a draft. Points of interest or routes are put in it from their editors; categories have two levels at most."
    noun="category"
    title-label="Name"
    slug-label="Code"
    slug-hint="The category's identifier in the platform. Unique in the Project."
    :default-language="defaultLanguage"
    :busy="submitting"
    :form-error="formError"
    :request-id="requestId"
    :labels="{ scope: 'Applies to', parentCategoryId: 'Parent category' }"
    :validate="validate"
    :dirty="dirty"
    @close="emit('close')"
    @submit="submit"
  >
    <template #default="{ id }">
      <fieldset :id="id('scope')" class="min-w-0" :aria-invalid="errors.scope ? 'true' : undefined" :aria-describedby="errors.scope ? `${id('scope')}-err` : `${id('scope')}-hint`">
        <legend class="mb-1.5 text-sm font-semibold text-ink-2">Applies to<span class="ml-1 font-medium text-muted-foreground">(required)</span></legend>
        <div class="grid grid-cols-1 gap-2 min-[480px]:grid-cols-2">
          <label
            v-for="s in CATEGORY_SCOPES"
            :key="s"
            class="relative flex cursor-pointer flex-col gap-0.5 rounded-lg border px-3.5 py-3 hover:bg-surface-hover has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-primary"
            :class="scope === s ? 'border-primary bg-accent' : errors.scope ? 'border-destructive bg-card' : 'border-input bg-card'"
          >
            <input v-model="scope" type="radio" :name="scopeName" :value="s" class="sr-only" />
            <span class="flex items-center gap-1.5 text-sm font-semibold">
              <Check v-if="scope === s" class="size-4 text-primary" aria-hidden="true" :stroke-width="3" />{{ scopeLabel(s) }}
            </span>
            <span class="text-xs text-muted-foreground">{{ SCOPE_HINTS[s] }}</span>
          </label>
        </div>
        <p v-if="errors.scope" :id="`${id('scope')}-err`" class="mt-1.5 text-xs font-medium text-destructive">{{ errors.scope }}</p>
        <p v-else :id="`${id('scope')}-hint`" class="mt-1.5 text-xs text-muted-foreground">A category in use cannot change this later.</p>
      </fieldset>

      <fieldset class="min-w-0">
        <legend class="mb-1.5 text-sm font-semibold text-ink-2">Level</legend>
        <div class="grid grid-cols-1 gap-2 min-[480px]:grid-cols-2">
          <label
            v-for="level in LEVELS"
            :key="String(level.sub)"
            class="relative flex cursor-pointer flex-col gap-0.5 rounded-lg border px-3.5 py-3 hover:bg-surface-hover has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-primary"
            :class="sub === level.sub ? 'border-primary bg-accent' : 'border-input bg-card'"
          >
            <input v-model="sub" type="radio" :name="levelName" :value="level.sub" class="sr-only" />
            <span class="flex items-center gap-1.5 text-sm font-semibold">
              <Check v-if="sub === level.sub" class="size-4 text-primary" aria-hidden="true" :stroke-width="3" />{{ level.label }}
            </span>
            <span class="text-xs text-muted-foreground">{{ level.hint }}</span>
          </label>
        </div>
      </fieldset>

      <FormField v-if="sub" label="Parent category" required :error="errors.parentCategoryId" :id="id('parentCategoryId')" v-slot="f">
        <Select v-model="parentId" :id="f.id" :aria-describedby="f.describedBy" :invalid="f.invalid" :disabled="!scope">
          <option v-if="!scope" value="">Choose what it applies to first</option>
          <option v-else-if="!parents.length" value="">No top-level category for {{ scopeLabel(scope) }} yet</option>
          <option v-else value="">Choose a parent</option>
          <option v-for="o in parents" :key="o.id" :value="o.id">{{ o.label }}</option>
        </Select>
      </FormField>
    </template>
  </FormDialog>
</template>
