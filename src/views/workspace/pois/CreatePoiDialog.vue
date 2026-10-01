<script setup lang="ts">
import { computed, ref, watch } from "vue";
import AppDialog from "@/components/AppDialog.vue";
import { SLUG_PATTERN, slugify } from "@/lib/format";
import { ApiError } from "@/platform/api";
import type { ProjectLanguage } from "@/platform/languages";
import { createPoi, POI_CODE_PATTERN, type Poi } from "@/platform/pois";
import type { PlaceOption } from "../places/placeTree";

const props = defineProps<{
  projectId: string;
  defaultLanguage: ProjectLanguage;
  placeOptions: PlaceOption[];
}>();
const emit = defineEmits<{ close: []; created: [poi: Poi] }>();

const title = ref("");
const placeId = ref("");
const code = ref("");
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
  const trimmedCode = code.value.trim();
  if (!title.value.trim()) errors.value.title = "Enter a title in the default language.";
  if (!SLUG_PATTERN.test(slug.value)) errors.value.slug = "Use lowercase Latin letters, digits, and single hyphens.";
  if (trimmedCode && (trimmedCode.length > 32 || !POI_CODE_PATTERN.test(trimmedCode))) {
    errors.value.code = "Letters, digits, and single hyphens, at most 32 characters, for example KN-001.";
  }
  if (Object.keys(errors.value).length) return;

  submitting.value = true;
  try {
    const poi = await createPoi(props.projectId, {
      title: title.value.trim(),
      slug: slug.value,
      placeId: placeId.value || null,
      code: trimmedCode || null,
    });
    emit("created", poi);
  } catch (e) {
    if (!(e instanceof ApiError)) throw e;
    if (e.code === "DUPLICATE_VALUE") {
      const field = Object.keys(e.fieldMessages())[0] ?? "slug";
      errors.value = {
        [field]: field === "code" ? "Another point of interest already uses this exhibit code." : "Another point of interest already uses this slug.",
      };
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
  <AppDialog title="New point of interest" :busy="submitting" @close="emit('close')">
    <p class="mb-4 text-[13px] text-gray-700">
      It starts as a draft. Visitors see it once it is complete and you activate it.
    </p>
    <form id="create-poi-form" novalidate class="flex flex-col gap-4" @submit.prevent="submit">
      <p v-if="formError" role="alert" class="text-[13px] font-semibold text-destructive">{{ formError }}</p>

      <div class="flex flex-col gap-1.5">
        <label for="poi-title" class="field-label">{{ titleLabel }}</label>
        <input
          id="poi-title"
          v-model="title"
          type="text"
          autocomplete="off"
          :dir="defaultLanguage.direction.toLowerCase()"
          :lang="defaultLanguage.languageCode"
          class="field-input"
          :class="{ invalid: errors.title }"
          :aria-invalid="!!errors.title"
        />
        <span v-if="errors.title" class="text-xs font-semibold text-destructive">⚠ {{ errors.title }}</span>
      </div>

      <div class="flex gap-3">
        <div class="flex flex-[2] flex-col gap-1.5">
          <label for="poi-place" class="field-label">Place</label>
          <select id="poi-place" v-model="placeId" class="field-input" :class="{ invalid: errors.placeId }">
            <option value="">Not inside a Place</option>
            <option v-for="o in placeOptions" :key="o.id" :value="o.id">{{ o.label }}</option>
          </select>
          <span v-if="errors.placeId" class="text-xs font-semibold text-destructive">⚠ {{ errors.placeId }}</span>
        </div>
        <div class="flex flex-1 flex-col gap-1.5">
          <label for="poi-code" class="field-label">Exhibit code</label>
          <input
            id="poi-code"
            v-model="code"
            type="text"
            autocomplete="off"
            spellcheck="false"
            placeholder="KN-001"
            class="field-input font-mono text-[13px]"
            :class="{ invalid: errors.code }"
          />
          <span v-if="errors.code" class="text-xs font-semibold text-destructive">⚠ {{ errors.code }}</span>
        </div>
      </div>

      <div class="flex flex-col gap-1.5">
        <label for="poi-slug" class="field-label">Slug</label>
        <input
          id="poi-slug"
          :value="slug"
          type="text"
          autocomplete="off"
          spellcheck="false"
          class="field-input font-mono text-[13px]"
          :class="{ invalid: errors.slug }"
          aria-describedby="poi-slug-help"
          @input="onSlugInput"
        />
        <span v-if="errors.slug" id="poi-slug-help" class="text-xs font-semibold text-destructive">⚠ {{ errors.slug }}</span>
        <span v-else id="poi-slug-help" class="text-xs text-muted-foreground">Used in URLs and QR targets. Unique in the Project.</span>
      </div>
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
        form="create-poi-form"
        class="rounded-full bg-primary px-5 py-2.5 text-[11px] font-bold uppercase tracking-[0.06em] text-white disabled:opacity-60"
        :disabled="submitting"
      >
        {{ submitting ? "Creating…" : "Create" }}
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
.field-input.invalid {
  border-color: #c0185e;
}
</style>
