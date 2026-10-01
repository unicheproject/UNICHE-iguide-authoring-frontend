<script setup lang="ts">
import { computed, ref, watch } from "vue";
import AppDialog from "@/components/AppDialog.vue";
import { SLUG_PATTERN, slugify } from "@/lib/format";
import { ApiError } from "@/platform/api";
import { CATEGORY_SCOPES, createCategory, parentChoices, scopeLabel, type Category, type CategoryScope } from "@/platform/categories";
import type { ProjectLanguage } from "@/platform/languages";

const props = defineProps<{ projectId: string; defaultLanguage: ProjectLanguage; categories: Category[]; initialParentId: string | null }>();
const emit = defineEmits<{ close: []; created: [category: Category] }>();

const name = ref("");
const code = ref("");
const codeEdited = ref(false);
const initialParent = props.categories.find((c) => c.id === props.initialParentId) ?? null;
const scope = ref<CategoryScope>(initialParent?.scope ?? "POI");
const sub = ref(!!initialParent);
const parentId = ref(initialParent?.id ?? "");
const submitting = ref(false);
const errors = ref<Record<string, string>>({});
const formError = ref<string | null>(null);

watch(name, (value) => {
  if (!codeEdited.value) code.value = slugify(value);
});

const parents = computed(() => parentChoices(props.categories, scope.value, props.defaultLanguage.languageCode));
watch(scope, () => {
  if (!parents.value.some((p) => p.id === parentId.value)) parentId.value = parents.value[0]?.id ?? "";
});
function chooseLevel(subcategory: boolean) {
  sub.value = subcategory;
  if (subcategory && !parentId.value) parentId.value = parents.value[0]?.id ?? "";
}
const nameLabel = computed(() => `Name · ${props.defaultLanguage.displayName}`);

async function submit() {
  errors.value = {};
  formError.value = null;
  if (!name.value.trim()) errors.value.name = "Enter a name, such as Sculpture or For children.";
  if (!SLUG_PATTERN.test(code.value)) errors.value.code = "Use lowercase Latin letters, digits, and single hyphens.";
  if (sub.value && !parentId.value) errors.value.parentCategoryId = `Create a top-level category for ${scopeLabel(scope.value)} first.`;
  if (Object.keys(errors.value).length) return;
  submitting.value = true;
  try {
    emit("created", await createCategory(props.projectId, {
        name: name.value.trim(),
        code: code.value,
        scope: scope.value,
        parentCategoryId: sub.value ? parentId.value || null : null,
      }));
  } catch (e) {
    if (!(e instanceof ApiError)) throw e;
    if (e.code === "DUPLICATE_VALUE") {
      errors.value = { code: "Another category already uses this code. Choose a different one." };
    } else if (e.status === 422 || e.status === 400) {
      const byField = e.fieldMessages();
      errors.value = byField;
      formError.value = byField[""] ?? (Object.keys(byField).length ? null : e.message);
    } else {
      formError.value = e.platformUnavailable ? "The UNICHE platform is not reachable. Nothing was created." : e.message;
    }
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <AppDialog title="New category" :busy="submitting" @close="emit('close')">
    <p class="mb-4 text-[13px] text-gray-700">
      The category starts as a draft. Points of Interest or Routes are put in it from their editors; categories have two
      levels at most.
    </p>
    <form id="create-category-form" novalidate class="flex flex-col gap-4" @submit.prevent="submit">
      <p v-if="formError" role="alert" class="text-[13px] font-semibold text-destructive">{{ formError }}</p>
      <div class="flex flex-col gap-1.5">
        <label for="category-name" class="field-label">{{ nameLabel }}</label>
        <input
          id="category-name"
          v-model="name"
          type="text"
          autocomplete="off"
          :lang="defaultLanguage.languageCode"
          :dir="defaultLanguage.direction.toLowerCase()"
          class="field-input"
          :class="{ invalid: errors.name }"
        />
        <span v-if="errors.name" class="text-xs font-semibold text-destructive">⚠ {{ errors.name }}</span>
      </div>
      <div class="flex flex-col gap-2" role="group" aria-labelledby="category-scope-label">
        <span id="category-scope-label" class="field-label">Applies to</span>
        <div class="flex flex-wrap gap-[7px]">
          <button
            v-for="s in CATEGORY_SCOPES"
            :key="s"
            type="button"
            :aria-pressed="scope === s"
            class="rounded-full border-[1.5px] px-3.5 py-[7px] text-[11px] font-bold"
            :class="scope === s ? 'border-primary bg-primary text-white' : 'border-gray-200 bg-white text-gray-700 hover:border-primary'"
            @click="scope = s"
          >
            {{ scopeLabel(s) }}
          </button>
        </div>
      </div>
      <div class="flex flex-col gap-2" role="group" aria-labelledby="category-level-label">
        <span id="category-level-label" class="field-label">Level</span>
        <div class="flex flex-wrap gap-[7px]">
          <button
            v-for="level in ([[false, 'Top-level'], [true, 'Subcategory']] as const)"
            :key="String(level[0])"
            type="button"
            :aria-pressed="sub === level[0]"
            class="rounded-full border-[1.5px] px-3.5 py-[7px] text-[11px] font-bold"
            :class="sub === level[0] ? 'border-primary bg-primary text-white' : 'border-gray-200 bg-white text-gray-700 hover:border-primary'"
            @click="chooseLevel(level[0])"
          >
            {{ level[1] }}
          </button>
        </div>
        <select v-if="sub" v-model="parentId" aria-label="Parent category" class="field-input max-w-[360px]" :class="{ invalid: errors.parentCategoryId }">
          <option v-if="!parents.length" value="">No top-level category for {{ scopeLabel(scope) }} yet</option>
          <option v-for="o in parents" :key="o.id" :value="o.id">{{ o.label }}</option>
        </select>
        <span v-if="errors.parentCategoryId" class="text-xs font-semibold text-destructive">⚠ {{ errors.parentCategoryId }}</span>
        <span v-else class="text-xs text-muted-foreground">Categories have two levels at most: a category and its subcategories.</span>
      </div>
      <div class="flex flex-col gap-1.5">
        <label for="category-code" class="field-label">Code</label>
        <input
          id="category-code"
          :value="code"
          type="text"
          autocomplete="off"
          spellcheck="false"
          class="field-input font-mono text-[13px]"
          :class="{ invalid: errors.code }"
          @input="codeEdited = true; code = ($event.target as HTMLInputElement).value"
        />
        <span v-if="errors.code" class="text-xs font-semibold text-destructive">⚠ {{ errors.code }}</span>
        <span v-else class="text-xs text-muted-foreground">Identifies the category in filters and links. Unique in the Project.</span>
      </div>
    </form>
    <template #actions>
      <button type="button" class="dialog-secondary" :disabled="submitting" @click="emit('close')">Cancel</button>
      <button type="submit" form="create-category-form" class="dialog-primary bg-primary" :disabled="submitting">
        {{ submitting ? "Creating…" : "Create category" }}
      </button>
    </template>
  </AppDialog>
</template>
