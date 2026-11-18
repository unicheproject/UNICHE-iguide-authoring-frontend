<script setup lang="ts">
/**
 * "Describe now" (D-080): a stepper over freshly uploaded images that have no alternative text. One image at a time,
 * large enough to see, with the default-language alternative text field and the Decorative option beside it; "Save and
 * next" writes it (`PUT` of the Asset with its current version), Skip leaves it for the library's "No alt text"
 * filter. Each saved Asset is handed up so the library and the picker see it. A failure stays on the image with its
 * request id.
 */
import { computed, ref } from "vue";
import AppDialog from "@/components/AppDialog.vue";
import { ProblemAlert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import Checkbox from "@/components/ui/checkbox/Checkbox.vue";
import FormField from "@/components/ui/field/FormField.vue";
import Textarea from "@/components/ui/textarea/Textarea.vue";
import { say } from "@/lib/announcer";
import { ApiError } from "@/platform/api";
import { updateAsset, type Asset } from "@/platform/assets";

const props = defineProps<{ projectId: string; assets: Asset[]; languageCode: string; languageName: string }>();
const emit = defineEmits<{ close: []; saved: [asset: Asset] }>();

const index = ref(0);
const text = ref("");
const decorative = ref(false);
const saving = ref(false);
const error = ref<ApiError | null>(null);
/** The platform's own sentence for the alternative text when it refused it (422): shown at the field, with no retry. */
const fieldError = ref<string | null>(null);
const current = computed(() => props.assets[index.value]);
const last = computed(() => index.value >= props.assets.length - 1);
const canSave = computed(() => decorative.value || !!text.value.trim());

function next() {
  error.value = null;
  fieldError.value = null;
  text.value = "";
  decorative.value = false;
  if (last.value) {
    say("All images handled.");
    emit("close");
    return;
  }
  index.value++;
  say(`Image ${index.value + 1} of ${props.assets.length}: ${props.assets[index.value].internalName}`);
}

async function save() {
  const asset = current.value;
  if (!canSave.value || saving.value) return;
  saving.value = true;
  error.value = null;
  fieldError.value = null;
  try {
    const existing = asset.translations[props.languageCode];
    const translations = {
      ...asset.translations,
      [props.languageCode]: {
        title: existing?.title ?? null,
        caption: existing?.caption ?? null,
        credits: existing?.credits ?? null,
        transcript: existing?.transcript ?? null,
        alternativeText: decorative.value ? (existing?.alternativeText ?? null) : text.value.trim(),
      },
    };
    const saved = await updateAsset(props.projectId, asset.id, { version: asset.version, internalName: asset.internalName, decorative: decorative.value, translations });
    emit("saved", saved);
    say(`${asset.internalName} saved.`);
    next();
  } catch (e) {
    if (!(e instanceof ApiError)) throw e;
    // A refused text (422) is the author's to fix at the field, and a second try of the same text cannot help.
    const messages = e.status === 422 ? e.fieldMessages() : {};
    const own = Object.entries(messages).find(([path]) => /alternativeText/i.test(path))?.[1] ?? Object.values(messages)[0];
    if (own) fieldError.value = own;
    else error.value = e;
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <AppDialog :title="`Describe new images (${index + 1} of ${assets.length})`" size="lg" :busy="saving" @close="emit('close')">
    <div class="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div class="flex max-h-[40dvh] min-h-40 items-center justify-center rounded-md border border-border bg-muted p-2 md:max-h-[50dvh]">
        <img :src="current.url" alt="" class="min-h-16 min-w-16 max-h-[calc(40dvh-1rem)] max-w-full object-contain md:max-h-[calc(50dvh-1rem)]" />
      </div>
      <div class="flex flex-col gap-3">
        <p class="break-words text-sm font-semibold">{{ current.internalName }}</p>
        <FormField
          :label="`Alternative text (${languageName})`"
          hint="What the image shows and why it is here, in one or two sentences. Do not begin with “image of”."
          :error="fieldError"
          v-slot="f"
        >
          <Textarea v-model="text" :id="f.id" :aria-describedby="f.describedBy" :invalid="f.invalid" :disabled="decorative" :min-rows="3" autofocus @update:model-value="fieldError = null" />
        </FormField>
        <Checkbox v-model="decorative" description="No alternative text is needed. Screen readers skip it. Choose this only when removing the image would lose nothing.">
          Decorative image
        </Checkbox>
        <ProblemAlert v-if="error" :error="error" action="save the description" @retry="save" />
      </div>
    </div>
    <template #actions>
      <Button variant="ghost" class="mr-auto" :disabled-reason="saving ? 'Saving…' : undefined" @click="emit('close')">Close</Button>
      <Button variant="secondary" :disabled-reason="saving ? 'Saving…' : undefined" @click="next">{{ last ? "Skip and finish" : "Skip" }}</Button>
      <Button variant="primary" :loading="saving" :disabled-reason="canSave ? undefined : 'Write the text or mark the image decorative'" @click="save">
        {{ last ? "Save and finish" : "Save and next" }}
      </Button>
    </template>
  </AppDialog>
</template>
