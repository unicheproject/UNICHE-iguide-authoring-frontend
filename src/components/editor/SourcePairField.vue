<script setup lang="ts">
/**
 * One translatable text of a row in an editor list (a Route stop's text, a Guide paragraph or heading, a reference
 * caption). In the default language it is just the field. In another language the default-language text sits
 * read-only beside it (stacked when the card is narrow) with a "Copy source" button, the same pair view as
 * `TranslationsPanel` (D-079), so a translator never needs the structural controls or another tab to read the source.
 */
import { Copy } from "lucide-vue-next";
import { computed, useId } from "vue";
import { Button } from "@/components/ui/button";
import FormField from "@/components/ui/field/FormField.vue";
import Input from "@/components/ui/input/Input.vue";
import Textarea from "@/components/ui/textarea/Textarea.vue";
import type { ProjectLanguage } from "@/platform/languages";

const props = withDefaults(
  defineProps<{
    /** Control id; generated when not given. */
    id?: string;
    label: string;
    multiline?: boolean;
    readonly?: boolean;
    /** The language being edited. */
    language: ProjectLanguage;
    /** The default language, and its text; omit in the default language itself. */
    sourceLanguage?: ProjectLanguage | null;
    sourceText?: string | null;
    placeholder?: string;
    hint?: string;
    error?: string | null;
    minRows?: number;
    /** Extra classes for the control (a heading's weight). */
    controlClass?: string;
    dataPath?: string;
    /** Marks the control as where focus goes when its row is the next one after a removal or is restored. */
    focusTarget?: boolean;
  }>(),
  { id: undefined, multiline: false, readonly: false, sourceLanguage: null, sourceText: null, placeholder: undefined, hint: undefined, error: undefined, minRows: 2, controlClass: undefined, dataPath: undefined, focusTarget: false },
);
const model = defineModel<string>({ required: true });
const generated = useId();
const controlId = computed(() => props.id ?? `sp-${generated}`);
const sourceId = computed(() => `${controlId.value}-source`);
const pair = computed(() => !!props.sourceLanguage && !props.language.isDefault);

function copySource() {
  if (props.readonly || !props.sourceText) return;
  model.value = props.sourceText;
  document.getElementById(controlId.value)?.focus();
}
</script>

<template>
  <div class="source-wrap">
   <div :class="pair ? 'source-pair' : ''">
    <div v-if="pair" class="flex flex-col gap-1.5">
      <span class="text-sm font-semibold text-ink-2">{{ label }} in <bdi :lang="sourceLanguage!.languageCode">{{ sourceLanguage!.displayName }}</bdi></span>
      <div
        :id="sourceId"
        class="min-h-control whitespace-pre-wrap break-words rounded-md border border-border bg-muted px-3 py-2 text-sm text-ink-2"
        :lang="sourceLanguage!.languageCode"
        :dir="sourceLanguage!.direction.toLowerCase()"
      >
        <template v-if="sourceText?.trim()">{{ sourceText }}</template>
        <span v-else class="text-muted-foreground">No text in {{ sourceLanguage!.displayName }} yet.</span>
      </div>
      <div>
        <Button variant="ghost" size="sm" :disabled-reason="readonly ? 'This item cannot be edited' : !sourceText?.trim() ? 'There is no source text to copy' : undefined" @click="copySource">
          <Copy aria-hidden="true" />Copy source<span class="sr-only"> for {{ label }}</span>
        </Button>
      </div>
    </div>
    <FormField :id="controlId" :label="pair ? `${label} in ${language.displayName}` : label" :hint="hint" :error="error" v-slot="f">
      <Textarea
        v-if="multiline"
        :id="f.id"
        v-model="model"
        autogrow
        :min-rows="minRows"
        :readonly="readonly"
        :lang="language.languageCode"
        :dir="language.direction.toLowerCase()"
        :placeholder="placeholder"
        :aria-describedby="[pair ? sourceId : null, f.describedBy].filter(Boolean).join(' ') || undefined"
        :invalid="f.invalid"
        :class="controlClass"
        :data-path="dataPath"
        :data-focus-target="focusTarget ? true : undefined"
      />
      <Input
        v-else
        :id="f.id"
        v-model="model"
        type="text"
        :readonly="readonly"
        :lang="language.languageCode"
        :dir="language.direction.toLowerCase()"
        :placeholder="placeholder"
        :aria-describedby="[pair ? sourceId : null, f.describedBy].filter(Boolean).join(' ') || undefined"
        :invalid="f.invalid"
        :class="controlClass"
        :data-path="dataPath"
        :data-focus-target="focusTarget ? true : undefined"
      />
    </FormField>
   </div>
  </div>
</template>

<style scoped>
.source-wrap {
  container-type: inline-size;
}
.source-pair {
  display: grid;
  gap: 1rem;
}
@container (min-width: 34rem) {
  .source-pair {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    align-items: start;
  }
}
</style>
