import { computed, ref, watch, type Ref } from "vue";
import { ApiError } from "@/platform/api";
import { fetchProjectLanguages, type ProjectLanguages } from "@/platform/languages";

/** Loads the Project's languages for a page, with loading and error state. */
export function useProjectLanguages(projectId: Ref<string>) {
  const data = ref<ProjectLanguages | null>(null);
  const error = ref<ApiError | null>(null);
  const loading = ref(true);

  async function reload() {
    loading.value = true;
    error.value = null;
    try {
      data.value = await fetchProjectLanguages(projectId.value);
    } catch (e) {
      if (!(e instanceof ApiError)) throw e;
      error.value = e;
    } finally {
      loading.value = false;
    }
  }

  watch(projectId, reload, { immediate: true });

  const languages = computed(() => data.value?.languages ?? []);
  const defaultLanguage = computed(() => languages.value.find((l) => l.isDefault)?.languageCode ?? null);

  return { data, languages, defaultLanguage, error, loading, reload, set: (value: ProjectLanguages) => (data.value = value) };
}
