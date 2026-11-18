<script setup lang="ts">
/**
 * "New point of interest" on the shared `FormDialog` (plan 2.4): Title first, then the Place and the Category, the
 * exhibit code behind nothing more than an optional field, the slug under "Edit slug". "Create and open" creates the
 * draft and the list opens its editor.
 */
import { computed, ref } from "vue";
import FormDialog from "@/components/ui/dialog/FormDialog.vue";
import FormField from "@/components/ui/field/FormField.vue";
import Input from "@/components/ui/input/Input.vue";
import Select from "@/components/ui/select/Select.vue";
import { ApiError } from "@/platform/api";
import { setResourceCategory } from "@/platform/categories";
import type { ProjectLanguage } from "@/platform/languages";
import { createPoi, POI_CODE_PATTERN, type Poi } from "@/platform/pois";
import { showToast } from "@/stores/toast";
import type { PlaceOption } from "../places/placeTree";
import { createFailure } from "../createFailure";

const props = defineProps<{
  projectId: string;
  defaultLanguage: ProjectLanguage;
  placeOptions: PlaceOption[];
  /** Categories that apply to Points of Interest; the Category field is left out while there are none. */
  categoryOptions: { id: string; label: string }[];
  /** The Places could not be read: the Place field says so instead of offering an empty list. */
  placesFailed?: boolean;
}>();
const emit = defineEmits<{ close: []; created: [poi: Poi] }>();

const title = ref("");
const slug = ref("");
// The only Place is the obvious one (the Dashboard guide opens this dialog right after the first Place).
const placeId = ref(props.placeOptions.length === 1 ? props.placeOptions[0]!.id : "");
const categoryId = ref("");
const code = ref("");
const submitting = ref(false);
const errors = ref<Record<string, string>>({});
const formError = ref<string | null>(null);
const requestId = ref<string | null>(null);

const trimmedCode = computed(() => code.value.trim());
const dirty = computed(() => !!(trimmedCode.value || categoryId.value || (placeId.value && props.placeOptions.length !== 1)));

/** The kind's own checks, run with Title and slug in one pass (C2-44). */
function validate(): Record<string, string> {
  const c = trimmedCode.value;
  if (c && (c.length > 32 || !POI_CODE_PATTERN.test(c))) return { code: "Letters, digits and single hyphens, at most 32 characters, for example KN-001." };
  return {};
}

async function submit() {
  errors.value = {};
  formError.value = null;
  requestId.value = null;
  submitting.value = true;
  try {
    const poi = await createPoi(props.projectId, {
      title: title.value.trim(),
      slug: slug.value,
      placeId: placeId.value || null,
      code: trimmedCode.value || null,
    });
    if (categoryId.value) {
      try {
        await setResourceCategory(props.projectId, "pois", poi.id, categoryId.value);
      } catch (e) {
        if (!(e instanceof ApiError)) throw e;
        showToast("Category not set", "The point of interest was created. Choose its category in the editor.", "warning", { requestId: e.requestId, persist: true });
      }
    }
    emit("created", poi);
  } catch (e) {
    if (!(e instanceof ApiError)) throw e;
    requestId.value = e.requestId;
    if (e.code === "DUPLICATE_VALUE") {
      const field = Object.keys(e.fieldMessages())[0] ?? "slug";
      errors.value = {
        [field]: field === "code" ? "Another point of interest already uses this exhibit code." : "Another point of interest already uses this slug.",
      };
    } else if (e.status === 422 || e.status === 400) {
      const byField = e.fieldMessages();
      errors.value = byField;
      formError.value = Object.keys(byField).length ? null : createFailure(e, "point of interest");
    } else {
      formError.value = createFailure(e, "point of interest");
    }
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <FormDialog
    v-model:title="title"
    v-model:slug="slug"
    v-model:errors="errors"
    heading="New point of interest"
    intro="It starts as a draft. Visitors see it once it is complete and you activate it."
    noun="point of interest"
    :default-language="defaultLanguage"
    :busy="submitting"
    :form-error="formError"
    :request-id="requestId"
    :labels="{ placeId: 'Place', categoryId: 'Category', code: 'Exhibit code' }"
    :validate="validate"
    :dirty="dirty"
    @close="emit('close')"
    @submit="submit"
  >
    <template #default="{ id }">
      <FormField
        label="Place"
        :hint="placesFailed ? 'The places could not be loaded. Create the point of interest and choose its place in the editor.' : undefined"
        :error="errors.placeId"
        :id="id('placeId')"
        v-slot="f"
      >
        <Select v-model="placeId" :id="f.id" :aria-describedby="f.describedBy" :invalid="f.invalid" :disabled="placesFailed">
          <option value="">Not inside a Place</option>
          <option v-for="o in placeOptions" :key="o.id" :value="o.id">{{ o.label }}</option>
        </Select>
      </FormField>
      <FormField v-if="categoryOptions.length" label="Category" :error="errors.categoryId" :id="id('categoryId')" v-slot="f">
        <Select v-model="categoryId" :id="f.id" :aria-describedby="f.describedBy" :invalid="f.invalid">
          <option value="">No category</option>
          <option v-for="o in categoryOptions" :key="o.id" :value="o.id">{{ o.label }}</option>
        </Select>
      </FormField>
      <FormField label="Exhibit code" hint="Optional. Visitors can type it in, for example KN-001." :error="errors.code" :id="id('code')" v-slot="f">
        <Input v-model="code" type="text" autocomplete="off" spellcheck="false" class="mono" :id="f.id" :aria-describedby="f.describedBy" :invalid="f.invalid" />
      </FormField>
    </template>
  </FormDialog>
</template>
