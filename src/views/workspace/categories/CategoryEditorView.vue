<script setup lang="ts">
import { computed, reactive, ref } from "vue";
import CategoryIcon from "@/components/CategoryIcon.vue";
import EditorShell from "@/components/editor/EditorShell.vue";
import TranslationsPanel, { type TextFieldGroup, type TextFieldMeta } from "@/components/editor/TranslationsPanel.vue";
import { SLUG_PATTERN } from "@/lib/format";
import {
  CATEGORY_ICONS,
  CATEGORY_SCOPES,
  categoryLabel,
  categoryName,
  changeCategoryStatus,
  fetchCategory,
  fetchCategoryReferences,
  listCategories,
  parentChoices,
  scopeLabel,
  updateCategory,
  type Category,
  type CategoryScope,
  type CategoryTranslation,
} from "@/platform/categories";
import type { ResourceReference } from "@/platform/references";
import { showToast } from "@/stores/toast";
import { useCurrentProject } from "@/workspace/currentProject";
import { describeTranslationPath, ensureTextRows, textsForApi, textsFrom, type Texts } from "@/workspace/formFields";
import { referenceLink } from "@/workspace/referenceLinks";
import { filledFields, translationStatus } from "@/workspace/translationStatus";
import { useProjectLanguages } from "@/workspace/useProjectLanguages";
import { useResourceEditor } from "@/workspace/useResourceEditor";

const props = defineProps<{ categoryId: string }>();
const project = useCurrentProject();
const projectId = computed(() => project.value.id);
const { languages, defaultLanguage, loading: languagesLoading } = useProjectLanguages(projectId);
const languageCodes = () => languages.value.map((l) => l.languageCode);

type TextKey = keyof CategoryTranslation;
const TEXT_KEYS: TextKey[] = ["name", "description"];
const TEXT_META: Record<TextKey, TextFieldMeta> = {
  name: { label: "Name", multiline: false, helper: "Shown as a filter and on the content it groups." },
  description: { label: "Description", multiline: true, helper: "Optional. Shown on the category's own page in the visitor app." },
};
const GROUPS: TextFieldGroup[] = [{ id: "main", label: null, keys: ["name", "description"] }];
const FIELD_NAMES: Record<string, string> = { code: "Code", scope: "Applies to", parentCategoryId: "Level", icon: "Icon" };
const ICON_KEYS = Object.keys(CATEGORY_ICONS);

const all = ref<Category[]>([]);

const form = reactive({
  code: "",
  scope: "POI" as CategoryScope,
  parentCategoryId: "",
  icon: "",
  translations: {} as Record<string, Texts<TextKey>>,
});

const editor = useResourceEditor<Category>({
  kind: "category",
  source: () => props.categoryId,
  languages,
  defaultLanguage,
  async load() {
    const [category, categories] = await Promise.all([fetchCategory(projectId.value, props.categoryId), listCategories(projectId.value)]);
    all.value = categories;
    return category;
  },
  save: (category, version) =>
    updateCategory(projectId.value, category.id, {
      version,
      code: form.code,
      scope: form.scope,
      parentCategoryId: form.parentCategoryId || null,
      icon: form.icon || null,
      translations: textsForApi(TEXT_KEYS, languageCodes(), form.translations),
    }),
  changeStatus: (category, target, version) => changeCategoryStatus(projectId.value, category.id, target, version),
  loadReferences: (category) => fetchCategoryReferences(projectId.value, category.id),
  resetForm(category) {
    form.code = category.code;
    form.scope = category.scope;
    form.parentCategoryId = category.parentCategoryId ?? "";
    form.icon = category.icon ?? "";
    form.translations = Object.fromEntries(Object.entries(category.translations).map(([code, t]) => [code, textsFrom(TEXT_KEYS, t)]));
  },
  ensureLanguageRows: () => ensureTextRows(TEXT_KEYS, languageCodes(), form.translations),
  formState: () => form,
  validate() {
    const found: Record<string, string> = {};
    if (!SLUG_PATTERN.test(form.code)) found.code = "Use lowercase Latin letters, digits, and single hyphens.";
    return found;
  },
  describePath: (path) => describeTranslationPath(path, languages.value, TEXT_META) ?? FIELD_NAMES[path] ?? path,
});

const toReference = (r: ResourceReference) => referenceLink(projectId.value, r);
const readonly = computed(() => !editor.editable);
const heading = computed(() => (editor.resource ? categoryName(editor.resource, defaultLanguage.value) : "Category"));
const subtitle = computed(() =>
  editor.resource ? `${scopeLabel(editor.resource.scope)} · ${categoryLabel(editor.resource, all.value, defaultLanguage.value)}` : "",
);

// Category setup (mockup "Category setup": Applies to, Level, icon) ------------------------------------

const children = computed(() => all.value.filter((c) => c.parentCategoryId === props.categoryId && c.status !== "ARCHIVED"));
const parents = computed(() => parentChoices(all.value, form.scope, defaultLanguage.value, props.categoryId));
const used = computed(() => editor.resource?.resourceCount ?? 0);

function chooseScope(scope: CategoryScope) {
  if (scope === form.scope || readonly.value) return;
  if (used.value && editor.resource?.scope !== scope) {
    showToast(
      "Category in use",
      `Remove it from its ${scopeLabel(editor.resource!.scope)} before changing what it applies to.`,
      "warning",
    );
    return;
  }
  form.scope = scope;
  form.parentCategoryId = "";
}

function chooseLevel(subcategory: boolean) {
  if (readonly.value || subcategory === !!form.parentCategoryId) return;
  if (!subcategory) {
    form.parentCategoryId = "";
    return;
  }
  if (children.value.length) {
    showToast("Two levels only", "This category has subcategories, so it stays top-level.", "warning");
    return;
  }
  if (!parents.value.length) {
    showToast("No parent available", `Create a top-level category for ${scopeLabel(form.scope)} first.`, "warning");
    return;
  }
  form.parentCategoryId = parents.value[0].id;
}

const levelNote = computed(() => {
  if (children.value.length) {
    return `Subcategories: ${children.value.map((c) => categoryName(c, defaultLanguage.value)).join(", ")}. Categories have two levels at most.`;
  }
  const parent = all.value.find((c) => c.id === form.parentCategoryId);
  return parent
    ? `Sits under ${categoryName(parent, defaultLanguage.value)}. A subcategory cannot have subcategories of its own.`
    : "Categories have two levels at most: a category and its subcategories.";
});

const activationHint = computed(() =>
  form.parentCategoryId ? "Activate it once it has a default-language name and its parent is active." : "Activate it once the default-language name is set.",
);

function chip(selected: boolean) {
  return selected ? "border-primary bg-primary text-white" : "border-gray-200 bg-white text-gray-700 hover:border-primary";
}

// The Translations panel counts the fields the content list counts for its completion dots.
const translationRows = computed(() => translationStatus(languages.value, 2, (code) => filledFields(form.translations[code], ["name", "description"] as const)));
</script>

<template>
  <EditorShell
    tabbed
    :editor="editor"
    back-label="Categories"
    :back-to="{ name: 'categories', params: { projectId } }"
    :title="heading"
    :subtitle="subtitle"
    :activation-hint="activationHint"
    :reference-link="toReference"
    :pending="languagesLoading"
    :translations="translationRows"
  >
    <TranslationsPanel
      v-model:active-language="editor.activeLanguage"
      :project-id="projectId"
      :languages="languages"
      :texts="form.translations"
      :groups="GROUPS"
      :meta="TEXT_META"
      :readonly="readonly"
      :error-languages="editor.languagesWithErrors"
      :field-error="editor.fieldError"
      title-required-hint="Required in the default language before the category can be activated."
      required-field="name"
    />

    <section class="overflow-hidden rounded-lg border bg-card">
      <div class="border-b px-5 py-3.5">
        <h2 class="text-[11px] font-extrabold uppercase tracking-[0.09em] text-muted-foreground">Category setup</h2>
      </div>
      <div class="flex flex-col gap-[18px] px-5 py-[18px]">
        <div class="flex flex-col gap-2" role="group" aria-labelledby="cat-scope-label">
          <span id="cat-scope-label" class="small-label">Applies to</span>
          <div class="flex flex-wrap gap-[7px]">
            <button
              v-for="s in CATEGORY_SCOPES"
              :key="s"
              type="button"
              :disabled="readonly"
              :aria-pressed="form.scope === s"
              class="rounded-full border-[1.5px] px-3.5 py-[7px] text-[11px] font-bold disabled:cursor-default"
              :class="chip(form.scope === s)"
              @click="chooseScope(s)"
            >
              {{ scopeLabel(s) }}
            </button>
          </div>
          <span v-if="editor.fieldError('scope')" class="text-xs font-semibold text-destructive">⚠ {{ editor.fieldError("scope") }}</span>
        </div>

        <div class="flex flex-col gap-2" role="group" aria-labelledby="cat-level-label">
          <span id="cat-level-label" class="small-label">Level</span>
          <div class="flex flex-wrap gap-[7px]">
            <button
              v-for="level in ([[false, 'Top-level'], [true, 'Subcategory']] as const)"
              :key="String(level[0])"
              type="button"
              :disabled="readonly"
              :aria-pressed="!!form.parentCategoryId === level[0]"
              class="rounded-full border-[1.5px] px-3.5 py-[7px] text-[11px] font-bold disabled:cursor-default"
              :class="chip(!!form.parentCategoryId === level[0])"
              @click="chooseLevel(level[0])"
            >
              {{ level[1] }}
            </button>
          </div>
          <select
            v-if="form.parentCategoryId"
            v-model="form.parentCategoryId"
            :disabled="readonly"
            aria-label="Parent category"
            class="field-input max-w-[360px]"
            :class="{ invalid: editor.fieldError('parentCategoryId') }"
          >
            <option v-for="o in parents" :key="o.id" :value="o.id">{{ o.label }}</option>
            <option v-if="!parents.some((o) => o.id === form.parentCategoryId)" :value="form.parentCategoryId">Unavailable category</option>
          </select>
          <span v-if="editor.fieldError('parentCategoryId')" class="text-xs font-semibold text-destructive">⚠ {{ editor.fieldError("parentCategoryId") }}</span>
          <span v-else class="text-[11px] text-muted-foreground">{{ levelNote }}</span>
        </div>

        <div class="flex flex-col gap-2" role="group" aria-labelledby="cat-icon-label">
          <span id="cat-icon-label" class="small-label">Icon</span>
          <div class="flex flex-wrap gap-1.5">
            <button
              v-for="key in ['', ...ICON_KEYS]"
              :key="key || 'none'"
              type="button"
              :disabled="readonly"
              :aria-pressed="form.icon === key"
              :title="key ? CATEGORY_ICONS[key][0] : 'None'"
              class="flex w-[72px] flex-col items-center gap-1 rounded-lg border-[1.5px] px-1.5 py-2 text-[10px] font-semibold disabled:cursor-default"
              :class="form.icon === key ? 'border-primary bg-[#f5f0fb] text-primary' : 'border-gray-200 bg-white text-gray-700 hover:border-primary'"
              @click="form.icon = key"
            >
              <CategoryIcon :icon="key || null" :size="20" />
              <span class="truncate">{{ key ? CATEGORY_ICONS[key][0] : "None" }}</span>
            </button>
          </div>
          <span v-if="editor.fieldError('icon')" class="text-xs font-semibold text-destructive">⚠ {{ editor.fieldError("icon") }}</span>
          <span v-else class="text-[11px] text-muted-foreground">Marks the category on maps, filters, and lists in the visitor app.</span>
        </div>
      </div>
    </section>

    <section class="overflow-hidden rounded-lg border bg-card">
      <div class="border-b px-5 py-3.5">
        <h2 class="text-[11px] font-extrabold uppercase tracking-[0.09em] text-muted-foreground">Details</h2>
      </div>
      <div class="flex flex-col gap-1.5 px-5 py-[18px]">
        <label for="f-code" class="small-label">Code</label>
        <input id="f-code" v-model="form.code" :readonly="readonly" spellcheck="false" class="field-input font-mono text-[13px]" :class="{ invalid: editor.fieldError('code') }" />
        <span v-if="editor.fieldError('code')" class="text-xs font-semibold text-destructive">⚠ {{ editor.fieldError("code") }}</span>
        <span v-else class="text-xs text-muted-foreground">Identifies the category in filters and links. Unique in the Project.</span>
      </div>
    </section>

    <template #aside>
      <section v-if="editor.resource" class="overflow-hidden rounded-lg border bg-card">
        <div class="border-b px-3.5 py-[11px]">
          <span class="text-[10px] font-extrabold uppercase tracking-[0.1em] text-muted-foreground">Content</span>
        </div>
        <p class="px-3.5 py-3.5 text-[13px] text-gray-700">
          {{ used }} {{ editor.resource.scope === "ROUTE" ? (used === 1 ? "route" : "routes") : used === 1 ? "point of interest" : "points of interest" }}
          in this category. Choose the category in each {{ editor.resource.scope === "ROUTE" ? "route" : "point of interest" }}'s editor.
        </p>
      </section>
    </template>
  </EditorShell>
</template>
