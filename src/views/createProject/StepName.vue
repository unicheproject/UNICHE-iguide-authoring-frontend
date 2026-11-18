<script setup lang="ts">
/** Step 1: organisation, name and slug. Errors sit at the field and in the summary above (the view renders it). */
import { Check } from "lucide-vue-next";
import { FormField } from "@/components/ui/field";
import { HelpHint } from "@/components/ui/help-hint";
import { Input } from "@/components/ui/input";
import { manageableOrganisations } from "@/stores/projects";
import { computed } from "vue";
import { FIELD_IDS, SLUG_MAX, type CreateProjectWizard } from "./useCreateProject";

const props = defineProps<{ w: CreateProjectWizard }>();

/** The hint under the slug: where it comes from, its limit, and what to do when the name leaves nothing to make it from. */
const slugHint = computed(() => {
  if (!props.w.slug && props.w.name.trim() && !props.w.slugEdited) return `This name has no Latin letters or digits to make a slug from. Type one in Latin letters, up to ${SLUG_MAX} characters.`;
  const limit = `Up to ${SLUG_MAX} characters, unique within the organisation.`;
  return props.w.slugEdited ? limit : `Made from the name until you edit it. ${limit}`;
});
</script>

<template>
  <div v-if="w.created" class="flex flex-col gap-3">
    <p class="flex items-center gap-2 text-sm font-semibold text-success"><Check class="size-5" aria-hidden="true" />The Project is created in the UNICHE Catalogue.</p>
    <dl class="grid max-w-xl grid-cols-[max-content_1fr] gap-x-6 gap-y-2 text-sm">
      <dt class="font-semibold text-ink-2">Name</dt>
      <dd class="min-w-0 break-words">{{ w.created.name }}</dd>
      <dt class="font-semibold text-ink-2">Slug</dt>
      <dd class="mono min-w-0 break-all">{{ w.created.slug }}</dd>
    </dl>
    <p class="max-w-prose text-sm text-muted-foreground">Name and slug are fixed once the Project exists. Continue with the Template and style.</p>
  </div>

  <div v-else class="flex max-w-xl flex-col gap-5">
    <FormField v-if="manageableOrganisations.length > 1" label="Organisation" v-slot="f" id="project-org">
      <!-- The shared Select puts `id` on its wrapper, so the label would not reach the control: the same field class on a native select. -->
      <select :id="f.id" v-model="w.orgId" class="ui-field" :aria-describedby="f.describedBy">
        <option v-for="org in manageableOrganisations" :key="org.id" :value="org.id">{{ org.name }}</option>
      </select>
    </FormField>
    <p v-else class="text-sm"><span class="font-semibold text-ink-2">Organisation:</span> {{ w.selectedOrgName }}</p>

    <FormField label="Project name" required :error="w.nameError" hint="Shown in the picker and in the Catalogue. For example, the name of the museum or the trail." :id="FIELD_IDS.name" v-slot="f">
      <Input
        :id="f.id"
        v-model="w.name"
        type="text"
        autocomplete="off"
        :aria-describedby="f.describedBy"
        :invalid="f.invalid"
        placeholder="e.g. Cycladic Gallery Guide"
      />
    </FormField>

    <div class="flex flex-col gap-1.5">
      <FormField label="Slug" required :error="w.slugError" :hint="slugHint" :id="FIELD_IDS.slug" v-slot="f">
        <div class="flex items-center gap-1">
          <Input
            :id="f.id"
            :model-value="w.slug"
            type="text"
            autocomplete="off"
            spellcheck="false"
            class="mono"
            dir="ltr"
            :aria-describedby="f.describedBy"
            :invalid="f.invalid"
            placeholder="e.g. cycladic-gallery-guide"
            @update:model-value="(v) => w.editSlug(String(v ?? ''))"
          />
          <HelpHint label="What is a slug?">
            The slug is the short address-friendly name of the Project: lowercase Latin letters, digits and single hyphens. It is
            part of the Project's web address and must be unique inside the organisation.
          </HelpHint>
        </div>
      </FormField>
    </div>
    <p class="rounded-md border border-border bg-sunken px-3 py-2 text-sm text-ink-2">
      Creating the Project adds a real record to the UNICHE Catalogue. Its name and slug cannot be changed afterwards.
    </p>
  </div>
</template>
