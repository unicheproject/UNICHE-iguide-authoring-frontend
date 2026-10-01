<script setup lang="ts">
import { computed, ref } from "vue";
import AppDialog from "@/components/AppDialog.vue";
import PageHead from "@/components/PageHead.vue";
import { Button } from "@/components/ui/button";
import { KNOWN_LANGUAGES, type KnownLanguage } from "@/lib/languageCatalogue";
import { ApiError } from "@/platform/api";
import { updateProjectLanguages, type LanguageInput, type ProjectLanguage } from "@/platform/languages";
import { showToast } from "@/stores/toast";
import { useCurrentProject } from "@/workspace/currentProject";
import SectionTabs from "@/components/SectionTabs.vue";
import { findSection } from "@/workspace/sections";
import { useProjectLanguages } from "@/workspace/useProjectLanguages";

const section = findSection("languages")!;
const project = useCurrentProject();
const { data, languages, error: loadError, loading, reload, set } = useProjectLanguages(
  computed(() => project.value.id),
);

const saving = ref(false);
const saveError = ref<ApiError | null>(null);
const confirmRemove = ref<ProjectLanguage | null>(null);

const addable = computed(() =>
  KNOWN_LANGUAGES.filter((k) => !languages.value.some((l) => l.languageCode === k.code)),
);

function completion(language: ProjectLanguage): string {
  const total = data.value?.resourceCount ?? 0;
  if (total === 0) return "no content yet";
  return `${language.titledResourceCount} of ${total} places and points of interest titled`;
}

function asInput(language: ProjectLanguage): LanguageInput {
  const { languageCode, displayName, direction, isDefault } = language;
  return { languageCode, displayName, direction, isDefault };
}

async function save(next: LanguageInput[], success: string) {
  saving.value = true;
  saveError.value = null;
  try {
    set(await updateProjectLanguages(project.value.id, next));
    showToast(success);
    return true;
  } catch (e) {
    if (!(e instanceof ApiError)) throw e;
    saveError.value = e;
    return false;
  } finally {
    saving.value = false;
  }
}

function add(language: KnownLanguage) {
  const first = languages.value.length === 0;
  const next = [
    ...languages.value.map(asInput),
    { languageCode: language.code, displayName: language.displayName, direction: language.direction, isDefault: first },
  ];
  void save(
    next,
    first ? `${language.displayName} is the default language` : `${language.displayName} added`,
  );
}

function makeDefault(language: ProjectLanguage) {
  const next = languages.value.map((l) => ({ ...asInput(l), isDefault: l.languageCode === language.languageCode }));
  void save(next, `${language.displayName} is now the default language`);
}

async function remove() {
  const language = confirmRemove.value;
  if (!language) return;
  const next = languages.value.filter((l) => l.languageCode !== language.languageCode).map(asInput);
  if (await save(next, `${language.displayName} removed`)) confirmRemove.value = null;
}

const saveErrorText = computed(() => {
  const e = saveError.value;
  if (!e) return null;
  if (e.code === "DEFAULT_LANGUAGE_INCOMPLETE") {
    return {
      title: "The default language needs complete titles",
      detail: `${Object.values(e.fieldMessages())[0] ?? e.message}. Translate them first; the default language is what visitors see when a translation is missing.`,
    };
  }
  if (e.platformUnavailable) return { title: "The UNICHE platform is not reachable", detail: "Nothing was changed." };
  return { title: "The languages could not be saved", detail: e.details.join(" ") || e.message };
});
</script>

<template>
  <main class="relative min-w-0 flex-1 overflow-y-auto px-7 pb-16 pt-6">
    <PageHead title="App settings" :subtitle="section.subtitle" />
    <SectionTabs :project-id="project.id" section="languages" />

    <div v-if="loading && !data" class="max-w-[760px] animate-skeleton rounded-lg border bg-card" aria-busy="true">
      <div v-for="n in 2" :key="n" class="flex items-center gap-3 border-b border-gray-100 px-[18px] py-3.5">
        <div class="flex-1">
          <div class="mb-1.5 h-3 w-24 rounded bg-[#dcdde2]"></div>
          <div class="h-2.5 w-40 rounded bg-[#e6e7eb]"></div>
        </div>
      </div>
    </div>

    <div
      v-else-if="loadError"
      role="alert"
      class="max-w-[640px] rounded-lg border border-l-[3px] border-l-destructive bg-card px-[18px] py-4"
    >
      <strong class="block text-[13px] font-bold text-destructive">
        {{ loadError.platformUnavailable ? "The UNICHE platform is not reachable" : "The languages could not be loaded" }}
      </strong>
      <p v-if="loadError.requestId" class="mt-1 font-mono text-[11px] text-muted-foreground">Request id {{ loadError.requestId }}</p>
      <Button variant="outline" size="sm" class="mt-3" @click="reload">Try again</Button>
    </div>

    <template v-else>
      <div
        v-if="saveErrorText"
        role="alert"
        class="mb-5 max-w-[760px] rounded-lg border border-l-[3px] border-l-destructive bg-card px-[18px] py-3.5"
      >
        <strong class="block text-[13px] font-bold text-destructive">{{ saveErrorText.title }}</strong>
        <p class="mt-0.5 text-[13px] text-gray-700">{{ saveErrorText.detail }}</p>
      </div>

      <div class="max-w-[760px] overflow-hidden rounded-lg border bg-card" :aria-busy="saving">
        <p v-if="!languages.length" class="border-b border-gray-100 px-[18px] py-4 text-[13px] text-muted-foreground">
          This Project has no languages yet. The first language you add becomes the default: every Place, Point of
          Interest and Page needs its text in it, and visitors see it when a translation is missing.
        </p>
        <ul>
          <li
            v-for="language in languages"
            :key="language.languageCode"
            class="flex flex-wrap items-center gap-3 border-b border-gray-100 px-[18px] py-3.5"
          >
            <div class="min-w-[180px] flex-1">
              <div class="text-[13px] font-bold" :dir="language.direction.toLowerCase()">{{ language.displayName }}</div>
              <div class="font-mono text-[11px] text-muted-foreground">
                {{ language.languageCode }} · {{ language.direction === "RTL" ? "right to left · " : "" }}{{ completion(language) }}
              </div>
            </div>
            <span
              v-if="language.isDefault"
              class="rounded-full bg-primary px-[9px] py-[3px] text-[10px] font-extrabold uppercase tracking-[0.07em] text-primary-foreground"
            >
              default
            </span>
            <template v-else>
              <button
                type="button"
                :disabled="saving"
                class="rounded-full border bg-muted px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.06em] text-gray-700 disabled:opacity-50"
                @click="makeDefault(language)"
              >
                Make default
              </button>
              <button
                type="button"
                :disabled="saving"
                class="rounded-full border-[1.5px] border-destructive px-[13px] py-[5px] text-[10px] font-bold uppercase tracking-[0.06em] text-destructive disabled:opacity-50"
                @click="confirmRemove = language"
              >
                Remove
              </button>
            </template>
          </li>
        </ul>
        <div class="flex flex-wrap items-center gap-2.5 px-[18px] py-4">
          <span v-if="!languages.length" class="w-full text-[11px] font-extrabold uppercase tracking-[0.08em] text-gray-700">
            Choose the default language
          </span>
          <button
            v-for="language in addable"
            :key="language.code"
            type="button"
            :disabled="saving"
            :title="language.englishName"
            class="rounded-full border bg-muted px-4 py-2 text-[11px] font-bold uppercase tracking-[0.06em] text-gray-700 disabled:opacity-50"
            @click="add(language)"
          >
            + {{ language.displayName }}
          </button>
        </div>
      </div>
    </template>

    <AppDialog v-if="confirmRemove" :title="`Remove ${confirmRemove.displayName}?`" :busy="saving" @close="confirmRemove = null">
      <p class="text-[13px] text-gray-700">
        {{
          confirmRemove.titledResourceCount
            ? `${confirmRemove.titledResourceCount} titles and their texts in ${confirmRemove.displayName} will become invisible.`
            : `Nothing has text in ${confirmRemove.displayName} yet.`
        }}
        The texts are kept, and come back if you add the language again.
      </p>
      <template #actions>
        <button
          type="button"
          class="rounded-full border bg-muted px-5 py-2.5 text-[11px] font-bold uppercase tracking-[0.06em] text-gray-700"
          :disabled="saving"
          @click="confirmRemove = null"
        >
          Cancel
        </button>
        <button
          type="button"
          class="rounded-full bg-destructive px-5 py-2.5 text-[11px] font-bold uppercase tracking-[0.06em] text-white disabled:opacity-60"
          :disabled="saving"
          @click="remove"
        >
          {{ saving ? "Removing…" : "Remove language" }}
        </button>
      </template>
    </AppDialog>
  </main>
</template>
