<script setup lang="ts">
import { Check, Lock } from "lucide-vue-next";
import { computed, reactive, ref } from "vue";
import CategoryIcon from "@/components/CategoryIcon.vue";
import EditorSection from "@/components/editor/EditorSection.vue";
import OtherSettings from "@/components/editor/OtherSettings.vue";
import EditorShell from "@/components/editor/EditorShell.vue";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { say } from "@/lib/announcer";
import RadioChips, { type RadioChipOption } from "./RadioChips.vue";
import TranslationsPanel, { type TextFieldGroup, type TextFieldMeta } from "@/components/editor/TranslationsPanel.vue";
import { SLUG_PATTERN } from "@/lib/format";
import {
  CATEGORY_ICONS,
  CATEGORY_SCOPES,
  categoryFromResponse,
  categoryLabel,
  categoryName,
  categoryWorkingCopyPayload,
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
  type UpdateCategoryInput,
} from "@/platform/categories";
import type { ResourceReference } from "@/platform/references";
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
/** What uses this Category: the where-used list, for the side card and the lock reasons. */
const usedBy = ref<ResourceReference[]>([]);

const form = reactive({
  code: "",
  scope: "POI" as CategoryScope,
  parentCategoryId: "",
  icon: "",
  translations: {} as Record<string, Texts<TextKey>>,
});

/** The editable state from the form, for a DRAFT save and a working copy alike. */
function input(): Omit<UpdateCategoryInput, "version"> {
  return {
    code: form.code,
    scope: form.scope,
    parentCategoryId: form.parentCategoryId || null,
    icon: form.icon || null,
    translations: textsForApi(TEXT_KEYS, languageCodes(), form.translations),
  };
}

const editor = useResourceEditor<Category>({
  kind: "category",
  source: () => props.categoryId,
  languages,
  defaultLanguage,
  async load() {
    const [category, categories, references] = await Promise.all([
      fetchCategory(projectId.value, props.categoryId),
      listCategories(projectId.value),
      // A failed where-used lookup only hides the list; the counts and the deactivate dialog still work.
      fetchCategoryReferences(projectId.value, props.categoryId).catch(() => [] as ResourceReference[]),
    ]);
    all.value = categories;
    usedBy.value = references;
    return category;
  },
  save: (category, version) => updateCategory(projectId.value, category.id, { version, ...input() }),
  workingCopy: {
    kind: "categories",
    projectId: () => projectId.value,
    payload: () => categoryWorkingCopyPayload(input()),
    fromResponse: categoryFromResponse,
  },
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

// Category setup ------------------------------------------------------------------------------------------

/**
 * Applies to, Level, Icon and Code are the same in every language: under another language's tab they fold into one
 * collapsed "Other settings (all languages)" disclosure, as in the POI and Place editors (D-079, C3-52).
 */
const otherFolded = computed(() => !!editor.activeLanguage && editor.activeLanguage !== defaultLanguage.value);

const children = computed(() => all.value.filter((c) => c.parentCategoryId === props.categoryId && c.status !== "ARCHIVED"));
const parents = computed(() => parentChoices(all.value, form.scope, defaultLanguage.value, props.categoryId));
/** How many items use it: the where-used list when it loaded (what the Deactivate dialog shows), else the Category's own count. */
const used = computed(() => usedBy.value.length || (editor.resource?.resourceCount ?? 0));
const usedNoun = computed(() => {
  const poi = editor.resource?.scope === "POI";
  return used.value === 1 ? (poi ? "point of interest" : "route") : poi ? "points of interest" : "routes";
});
/** A Category in use keeps what it applies to (`12` §3 Category): the other choice is disabled with the reason. */
const scopeLocked = computed(() => used.value > 0 && !!editor.resource);
const scopeLockReason = computed(
  () => `It cannot change while ${used.value} ${usedNoun.value} ${used.value === 1 ? "uses" : "use"} this category. Choose another category in ${used.value === 1 ? "that one" : "each of them"} first (see “Used in”).`,
);

const scopeOptions = computed<RadioChipOption[]>(() =>
  CATEGORY_SCOPES.map((s) => ({ value: s, label: scopeLabel(s), disabled: scopeLocked.value && s !== editor.resource?.scope })),
);
const scope = computed({
  get: () => form.scope,
  set(value: string) {
    if (value === form.scope) return;
    form.scope = value as CategoryScope;
    // Parents belong to one scope: a new scope starts at the top level.
    const hadParent = !!form.parentCategoryId;
    form.parentCategoryId = "";
    say(`Applies to ${scopeLabel(form.scope)}.${hadParent ? " Level reset to top-level." : ""}`);
  },
});

const noParentAvailable = computed(() => !parents.value.length);
const levelBlock = computed(() => {
  if (children.value.length) return "This category has subcategories, so it stays top-level. Categories have two levels at most.";
  return "";
});
const levelOptions = computed<RadioChipOption[]>(() => [
  { value: "top", label: "Top-level" },
  { value: "sub", label: "Subcategory", disabled: !!levelBlock.value || (noParentAvailable.value && !form.parentCategoryId) },
]);
const level = computed({
  get: () => (form.parentCategoryId ? "sub" : "top"),
  set(value: string) {
    if (value === "top") form.parentCategoryId = "";
    else if (parents.value.length) form.parentCategoryId = parents.value[0].id;
  },
});
const levelNote = computed(() => {
  if (children.value.length) {
    return `Subcategories: ${children.value.map((c) => categoryName(c, defaultLanguage.value)).join(", ")}. ${levelBlock.value}`;
  }
  const parent = all.value.find((c) => c.id === form.parentCategoryId);
  if (parent) return `Sits under ${categoryName(parent, defaultLanguage.value)}. A subcategory cannot have subcategories of its own.`;
  if (noParentAvailable.value) return `Subcategory is off: there is no top-level category for ${scopeLabel(form.scope)} yet. Create one first.`;
  return "Categories have two levels at most: a category and its subcategories.";
});

const iconOptions = computed(() => [{ key: "", label: "None" }, ...ICON_KEYS.map((key) => ({ key, label: CATEGORY_ICONS[key][0] }))]);
const iconName = computed(() => (form.icon && CATEGORY_ICONS[form.icon] ? CATEGORY_ICONS[form.icon][0] : "None"));
const iconGroup = "cat-icon";

const activationHint = computed(() =>
  form.parentCategoryId ? "Activate it once it has a default-language name and its parent is active." : "Activate it once the default-language name is set.",
);

/** Moves the author to the shell's "Used in" card, which lists what blocks a change (one card, no second "Used by"). */
function showUsedBy() {
  const heading = document.getElementById("used-in-heading");
  if (!heading) return;
  heading.tabIndex = -1;
  heading.scrollIntoView({ block: "center" });
  heading.focus();
  say("Where this category is used.");
}

// Icon grid -----------------------------------------------------------------------------------------------

/** How many icons sit in one row of the grid as laid out now (it wraps with the width): the icons sharing the first one's top. */
function iconColumns(radios: HTMLInputElement[]): number {
  const top = radios[0]?.closest("label")?.offsetTop;
  return Math.max(1, radios.filter((r) => r.closest("label")?.offsetTop === top).length);
}

/** Arrow keys move through the grid as it looks: Up and Down by a row, Left and Right by one (the radio group's default). */
function onIconKey(event: KeyboardEvent) {
  if (readonly.value || (event.key !== "ArrowDown" && event.key !== "ArrowUp")) return;
  const target = event.target as HTMLInputElement;
  if (target.type !== "radio") return;
  const radios = [...(event.currentTarget as HTMLElement).querySelectorAll<HTMLInputElement>('input[type="radio"]')];
  const at = radios.indexOf(target);
  const next = radios[at + (event.key === "ArrowDown" ? 1 : -1) * iconColumns(radios)];
  event.preventDefault();
  if (!next) return;
  form.icon = next.value;
  next.focus();
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

    <OtherSettings :folded="otherFolded" :section-ids="['setup', 'details']" summary="Category setup, Details">
      <EditorSection id="setup" title="Category setup">
        <div class="flex flex-col gap-2">
          <RadioChips
            id="f-scope"
            v-model="scope"
            legend="Applies to"
            :options="scopeOptions"
            :disabled="readonly"
            :invalid="!!editor.fieldError('scope')"
            describedBy="cat-scope-help"
          />
          <p v-if="editor.fieldError('scope')" id="cat-scope-help" class="text-xs font-medium text-destructive">{{ editor.fieldError("scope") }}</p>
          <p v-else id="cat-scope-help" class="text-xs text-muted-foreground">
            <template v-if="scopeLocked">
              <Lock class="mr-1 inline size-3.5 align-text-bottom" aria-hidden="true" />{{ scopeLockReason }}
              <Button variant="link" class="ml-1 min-h-0 p-0 text-xs" @click="showUsedBy">Show where it is used</Button>
            </template>
            <template v-else>Which kind of content can be put in this category. It is fixed once something uses it.</template>
          </p>
        </div>

        <div class="flex flex-col gap-2">
          <RadioChips v-model="level" legend="Level" :options="levelOptions" :disabled="readonly" describedBy="cat-level-help" />
          <FormField v-if="form.parentCategoryId" label="Parent category" :error="editor.fieldError('parentCategoryId')" id="f-parentCategoryId" v-slot="f" class="max-w-sm">
            <Select v-model="form.parentCategoryId" :id="f.id" :disabled="readonly" :invalid="f.invalid" :aria-describedby="f.describedBy">
              <option v-for="o in parents" :key="o.id" :value="o.id">{{ o.label }}</option>
              <option v-if="!parents.some((o) => o.id === form.parentCategoryId)" :value="form.parentCategoryId">Unavailable category</option>
            </Select>
          </FormField>
          <p id="cat-level-help" class="text-xs text-muted-foreground">{{ levelNote }}</p>
        </div>

        <fieldset id="f-icon" tabindex="-1" class="m-0 flex min-w-0 flex-col gap-2 border-0 p-0" aria-describedby="cat-icon-help">
          <legend class="mb-2 p-0 text-sm font-semibold text-ink-2">Icon</legend>
          <!-- Native radios: one Tab stop, arrow keys move and choose, the group name is the legend. -->
          <div class="grid grid-cols-[repeat(auto-fill,minmax(5.5rem,1fr))] gap-2" @keydown="onIconKey">
            <label
              v-for="o in iconOptions"
              :key="o.key || 'none'"
              class="relative flex min-h-[4.5rem] cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border px-1.5 py-2 text-center text-xs transition-ui duration-1 has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-primary"
              :class="[
                form.icon === o.key ? 'border-2 border-primary bg-accent font-semibold text-primary' : 'border-input bg-card text-ink-2 hover:bg-surface-hover',
                readonly && form.icon !== o.key && 'text-disabled-ink hover:bg-card',
                readonly ? 'cursor-default' : '',
              ]"
            >
              <input v-model="form.icon" type="radio" :name="iconGroup" :value="o.key" :disabled="readonly" class="peer sr-only" />
              <Check v-if="form.icon === o.key" class="absolute right-1 top-1 size-4 rounded-full bg-primary p-0.5 text-primary-foreground" :stroke-width="3" aria-hidden="true" />
              <CategoryIcon :icon="o.key || null" :size="24" />
              <span class="break-words">{{ o.label }}</span>
            </label>
          </div>
          <p v-if="editor.fieldError('icon')" id="cat-icon-help" class="text-xs font-medium text-destructive">{{ editor.fieldError("icon") }}</p>
          <p v-else id="cat-icon-help" class="text-xs text-muted-foreground">
            Chosen: <span class="font-semibold text-foreground">{{ iconName }}</span>. Marks the category on maps, filters and lists in the visitor app.
          </p>
        </fieldset>
      </EditorSection>

      <EditorSection id="details" title="Details" collapsible :default-open="false" :count="form.code ? 'Code set' : undefined">
        <FormField label="Code" :error="editor.fieldError('code')" hint="Identifies the category in filters and links. Unique in the Project." id="f-code" v-slot="f">
          <Input :id="f.id" v-model="form.code" :readonly="readonly" spellcheck="false" class="font-mono" :invalid="f.invalid" :aria-describedby="f.describedBy" />
        </FormField>
      </EditorSection>
    </OtherSettings>
  </EditorShell>
</template>
