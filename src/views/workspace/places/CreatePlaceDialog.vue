<script setup lang="ts">
import { computed, ref, watch } from "vue";
import AppDialog from "@/components/AppDialog.vue";
import { SLUG_PATTERN, slugify } from "@/lib/format";
import { ApiError } from "@/platform/api";
import type { ProjectLanguage } from "@/platform/languages";
import { createPlace, PLACE_SETTING_LABELS, PLACE_SETTINGS, type Place, type PlaceSetting, type PlaceType } from "@/platform/places";
import type { PlaceOption } from "./placeTree";

const props = defineProps<{
  projectId: string;
  defaultLanguage: ProjectLanguage;
  parentOptions: PlaceOption[];
}>();
const emit = defineEmits<{ close: []; created: [place: Place] }>();

const title = ref("");
// The mockup's three steps: where it is, whether it sits inside another place, and its title.
const setting = ref<PlaceSetting | null>(null);
const sub = ref<boolean | null>(null);
const parentPlaceId = ref("");
const step2 = computed(() => !!setting.value);
const step3 = computed(() => step2.value && (sub.value === false || (sub.value === true && !!parentPlaceId.value)));

function chooseLevel(subPlace: boolean) {
  sub.value = subPlace;
  parentPlaceId.value = subPlace ? parentPlaceId.value || props.parentOptions[0]?.id || "" : "";
}

/** The type the setting suggests; the editor offers the others. */
const type = computed<PlaceType>(() => (setting.value === "INDOOR" ? (sub.value ? "ROOM" : "BUILDING") : "AREA"));
const slug = ref("");
const slugEdited = ref(false);
const submitting = ref(false);
const errors = ref<Record<string, string>>({});
const formError = ref<string | null>(null);

watch(title, (value) => {
  if (!slugEdited.value) slug.value = slugify(value);
});

function onSlugInput(event: Event) {
  slugEdited.value = true;
  slug.value = (event.target as HTMLInputElement).value;
}

const titleLabel = computed(() => `Title · ${props.defaultLanguage.displayName}`);

async function submit() {
  errors.value = {};
  formError.value = null;
  if (!step3.value) {
    formError.value = "Choose the setting and whether the place sits inside another one.";
    return;
  }
  if (!title.value.trim()) errors.value.title = "Enter a title in the default language.";
  if (!SLUG_PATTERN.test(slug.value)) {
    errors.value.slug = "Use lowercase Latin letters, digits, and single hyphens.";
  }
  if (Object.keys(errors.value).length) return;

  submitting.value = true;
  try {
    const place = await createPlace(props.projectId, {
      title: title.value.trim(),
      slug: slug.value,
      type: type.value,
      setting: setting.value!,
      parentPlaceId: sub.value ? parentPlaceId.value || null : null,
    });
    emit("created", place);
  } catch (e) {
    if (!(e instanceof ApiError)) throw e;
    if (e.code === "DUPLICATE_VALUE") {
      errors.value = { slug: "Another place already uses this slug. Choose a different one." };
    } else if (e.status === 422 || e.status === 400) {
      const byField = e.fieldMessages();
      errors.value = byField;
      formError.value = byField[""] ?? (Object.keys(byField).length ? null : e.message);
    } else {
      formError.value = e.platformUnavailable
        ? "The UNICHE platform is not reachable. Nothing was created."
        : e.message;
    }
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <AppDialog title="New place" :busy="submitting" @close="emit('close')">
    <p class="mb-4 text-[13px] text-gray-700">
      The place starts as a draft. Visitors see it once it is complete and you activate it.
    </p>
    <form id="create-place-form" novalidate class="flex flex-col gap-4" @submit.prevent="submit">
      <p v-if="formError" role="alert" class="text-[13px] font-semibold text-destructive">{{ formError }}</p>

      <div class="flex flex-col gap-2" role="group" aria-labelledby="place-setting-label">
        <span id="place-setting-label" class="field-label">1 · Setting</span>
        <div class="grid grid-cols-2 gap-2.5">
          <button
            v-for="s in PLACE_SETTINGS"
            :key="s"
            type="button"
            :aria-pressed="setting === s"
            class="flex flex-col gap-1 rounded-lg border-[1.5px] px-3.5 py-3 text-left"
            :class="setting === s ? 'border-primary bg-[#f5f0fb]' : 'border-gray-200 bg-white hover:border-primary'"
            @click="setting = s"
          >
            <span class="text-[13px] font-bold">{{ PLACE_SETTING_LABELS[s].label }}</span>
            <span class="text-xs text-muted-foreground">{{ PLACE_SETTING_LABELS[s].hint }}</span>
          </button>
        </div>
      </div>

      <div v-if="step2" class="flex flex-col gap-2" role="group" aria-labelledby="place-level-label">
        <span id="place-level-label" class="field-label">2 · Level</span>
        <div class="grid grid-cols-2 gap-2.5">
          <button
            v-for="level in ([[false, 'Top-level place', 'Stands on its own'], [true, 'Sub-place', 'Sits inside another place']] as const)"
            :key="String(level[0])"
            type="button"
            :disabled="level[0] && !parentOptions.length"
            :aria-pressed="sub === level[0]"
            class="flex flex-col gap-1 rounded-lg border-[1.5px] px-3.5 py-3 text-left disabled:opacity-50"
            :class="sub === level[0] ? 'border-primary bg-[#f5f0fb]' : 'border-gray-200 bg-white hover:border-primary'"
            @click="chooseLevel(level[0])"
          >
            <span class="text-[13px] font-bold">{{ level[1] }}</span>
            <span class="text-xs text-muted-foreground">{{ level[2] }}</span>
          </button>
        </div>
        <select v-if="sub" id="place-parent" v-model="parentPlaceId" aria-label="Parent place" class="field-input" :class="{ 'border-destructive': errors.parentPlaceId }">
          <option value="" disabled>Choose the parent place…</option>
          <option v-for="o in parentOptions" :key="o.id" :value="o.id">{{ o.label }}</option>
        </select>
        <span v-if="errors.parentPlaceId" class="text-xs font-semibold text-destructive">⚠ {{ errors.parentPlaceId }}</span>
      </div>

      <template v-if="step3">
        <p class="text-xs text-muted-foreground">
          {{
            setting === "INDOOR"
              ? "Indoor places position their Points of Interest on a floor plan."
              : "Outdoor places position their Points of Interest on a geographic map."
          }}
          Link one in the editor once Maps & Floor Plans are available.
        </p>
      <div class="flex flex-col gap-1.5">
        <label for="place-title" class="field-label">3 · {{ titleLabel }}</label>
        <input
          id="place-title"
          v-model="title"
          type="text"
          autocomplete="off"
          :dir="defaultLanguage.direction.toLowerCase()"
          :lang="defaultLanguage.languageCode"
          class="field-input"
          :class="{ 'border-destructive': errors.title }"
          :aria-invalid="!!errors.title"
          aria-describedby="place-title-error"
        />
        <span v-if="errors.title" id="place-title-error" class="text-xs font-semibold text-destructive">⚠ {{ errors.title }}</span>
      </div>

      <div class="flex flex-col gap-1.5">
        <label for="place-slug" class="field-label">Slug</label>
        <input
          id="place-slug"
          :value="slug"
          type="text"
          autocomplete="off"
          spellcheck="false"
          class="field-input font-mono text-[13px]"
          :class="{ 'border-destructive': errors.slug }"
          :aria-invalid="!!errors.slug"
          aria-describedby="place-slug-help"
          @input="onSlugInput"
        />
        <span v-if="errors.slug" id="place-slug-help" class="text-xs font-semibold text-destructive">⚠ {{ errors.slug }}</span>
        <span v-else id="place-slug-help" class="text-xs text-muted-foreground">
          Part of the place's address in the app and of its QR code. Unique in the Project.
        </span>
      </div>
      </template>
    </form>

    <template #actions>
      <button
        type="button"
        class="rounded-full border bg-muted px-5 py-2.5 text-[11px] font-bold uppercase tracking-[0.06em] text-gray-700"
        :disabled="submitting"
        @click="emit('close')"
      >
        Cancel
      </button>
      <button
        type="submit"
        form="create-place-form"
        class="rounded-full bg-primary px-5 py-2.5 text-[11px] font-bold uppercase tracking-[0.06em] text-white disabled:opacity-60"
        :disabled="submitting"
      >
        {{ submitting ? "Creating…" : "Create place" }}
      </button>
    </template>
  </AppDialog>
</template>

<style scoped>
.field-label {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #374151;
}
.field-input {
  width: 100%;
  border: 1.5px solid #e5e7eb;
  border-radius: 8px;
  background: #fff;
  padding: 10px 12px;
  font-size: 14px;
}
.field-input:focus {
  border-color: #4c1d8b;
  outline: none;
}
.border-destructive {
  border-color: #c0185e;
}
</style>
