<script setup lang="ts">
/**
 * "New place" on the shared `FormDialog` (plan 2.4): Title first, then the Level (stands on its own, or sits inside
 * another place; the second is greyed with its reason while no place exists), the slug under "Edit slug". The setting
 * is not asked (DECISIONS.md D-057): a sub-place takes its parent's, a top-level place starts outdoor, and the editor
 * changes it. "Create and open" creates the draft and the list opens its editor.
 */
import { Check } from "lucide-vue-next";
import { computed, ref, useId, watch } from "vue";
import FormDialog from "@/components/ui/dialog/FormDialog.vue";
import FormField from "@/components/ui/field/FormField.vue";
import Select from "@/components/ui/select/Select.vue";
import { ApiError } from "@/platform/api";
import type { ProjectLanguage } from "@/platform/languages";
import { createPlace, type Place, type PlaceSetting, type PlaceType } from "@/platform/places";
import type { PlaceOption } from "./placeTree";
import { createFailure } from "../createFailure";

const props = defineProps<{
  projectId: string;
  defaultLanguage: ProjectLanguage;
  parentOptions: PlaceOption[];
  /** "Add sub-place" from a row's menu: opens as a Sub-place of this Place. Empty for "New place". */
  initialParentId?: string;
}>();
const emit = defineEmits<{ close: []; created: [place: Place] }>();

const title = ref("");
const slug = ref("");
const startParent = props.parentOptions.some((o) => o.id === props.initialParentId) ? (props.initialParentId ?? "") : "";
const sub = ref(!!startParent);
const parentPlaceId = ref(startParent);
const submitting = ref(false);
const errors = ref<Record<string, string>>({});
const formError = ref<string | null>(null);
const requestId = ref<string | null>(null);

const levelName = useId();
const subReasonId = useId();
const noParents = computed(() => !props.parentOptions.length);
const LEVELS = [
  { sub: false, label: "Top-level place", hint: "Stands on its own, such as a site or a region." },
  { sub: true, label: "Sub-place", hint: "Sits inside another place, such as a room in a building." },
] as const;

// A Sub-place starts with no parent chosen: the author picks it (C2-38), nothing is preselected on their behalf.
function clearParentError() {
  if (!errors.value.parentPlaceId) return;
  const { parentPlaceId: _gone, ...rest } = errors.value;
  errors.value = rest;
}
watch(sub, (isSub) => {
  if (!isSub) parentPlaceId.value = "";
  clearParentError();
});
watch(parentPlaceId, clearParentError);

const dirty = computed(() => sub.value && !startParent);

/** The kind's own check, run with Title and slug in one pass: a Sub-place needs its Parent. */
function validate(): Record<string, string> {
  return sub.value && !parentPlaceId.value ? { parentPlaceId: "Choose the place it sits inside." } : {};
}

/** A sub-place takes over its parent's setting, a top-level place starts outdoor; the editor's type changes it. */
const setting = computed<PlaceSetting>(() =>
  sub.value ? (props.parentOptions.find((o) => o.id === parentPlaceId.value)?.setting ?? "OUTDOOR") : "OUTDOOR",
);
const type = computed<PlaceType>(() => (setting.value === "INDOOR" ? "ROOM" : "AREA"));

async function submit() {
  errors.value = {};
  formError.value = null;
  requestId.value = null;
  submitting.value = true;
  try {
    const place = await createPlace(props.projectId, {
      title: title.value.trim(),
      slug: slug.value,
      type: type.value,
      setting: setting.value,
      parentPlaceId: sub.value ? parentPlaceId.value || null : null,
    });
    emit("created", place);
  } catch (e) {
    if (!(e instanceof ApiError)) throw e;
    requestId.value = e.requestId;
    if (e.code === "DUPLICATE_VALUE") {
      errors.value = { slug: "Another place already uses this slug. Choose a different one." };
    } else if (e.status === 422 || e.status === 400) {
      const byField = e.fieldMessages();
      errors.value = byField;
      formError.value = Object.keys(byField).length ? null : createFailure(e, "place");
    } else {
      formError.value = createFailure(e, "place");
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
    heading="New place"
    intro="The place starts as a draft. Visitors see it once it is complete and you activate it. Link its map or floor plan afterwards, in the editor."
    noun="place"
    :default-language="defaultLanguage"
    :busy="submitting"
    :form-error="formError"
    :request-id="requestId"
    :labels="{ parentPlaceId: 'Parent place' }"
    :validate="validate"
    :dirty="dirty"
    @close="emit('close')"
    @submit="submit"
  >
    <template #default="{ id }">
      <fieldset :id="id('level')" class="min-w-0">
        <legend class="mb-1.5 text-sm font-semibold text-ink-2">Level</legend>
        <div class="grid grid-cols-1 gap-2 min-[480px]:grid-cols-2">
          <label
            v-for="level in LEVELS"
            :key="String(level.sub)"
            class="relative flex flex-col gap-0.5 rounded-lg border px-3.5 py-3 has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-primary"
            :class="[
              sub === level.sub ? 'border-primary bg-accent' : 'border-input bg-card',
              level.sub && noParents ? 'cursor-not-allowed text-disabled-ink' : 'cursor-pointer hover:bg-surface-hover',
            ]"
          >
            <input
              v-model="sub"
              type="radio"
              :name="levelName"
              :value="level.sub"
              :disabled="level.sub && noParents"
              :aria-describedby="level.sub && noParents ? subReasonId : undefined"
              class="sr-only"
            />
            <span class="flex items-center gap-1.5 text-sm font-semibold">
              <Check v-if="sub === level.sub" class="size-4 text-primary" aria-hidden="true" :stroke-width="3" />{{ level.label }}
            </span>
            <span class="text-xs" :class="level.sub && noParents ? '' : 'text-muted-foreground'">{{ level.hint }}</span>
          </label>
        </div>
        <p v-if="noParents" :id="subReasonId" class="mt-1.5 text-xs text-muted-foreground">
          Sub-place is off because this Project has no place yet. Create a top-level place first.
        </p>
      </fieldset>
      <FormField v-if="sub" label="Parent place" required :error="errors.parentPlaceId" :id="id('parentPlaceId')" v-slot="f">
        <Select v-model="parentPlaceId" :id="f.id" :aria-describedby="f.describedBy" :invalid="f.invalid">
          <option value="">Choose a parent</option>
          <option v-for="o in parentOptions" :key="o.id" :value="o.id">{{ o.label }}</option>
        </Select>
      </FormField>
    </template>
  </FormDialog>
</template>
