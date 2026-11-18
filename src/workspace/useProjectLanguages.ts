import { computed, ref, watch, type Ref } from "vue";
import { ApiError } from "@/platform/api";
import { fetchProjectLanguages, type ProjectLanguages } from "@/platform/languages";

/**
 * Loads the Project's languages for a page, with loading and error state. `languages` is the array pages iterate
 * (empty until read); `languagesOrNull` is `null` until a read succeeded and stays `null` when it fails, so a page can
 * tell "not known" from "the Project has no languages" and show an error with `reload` ("Try again") instead of a
 * wrong empty state (C2-94). `reload()` clears `error` and reads again.
 */
export function useProjectLanguages(projectId: Ref<string>) {
  const data = ref<ProjectLanguages | null>(null);
  const error = ref<ApiError | null>(null);
  const loading = ref(true);

  let latest = 0;
  async function reload() {
    const mine = ++latest;
    loading.value = true;
    error.value = null;
    try {
      const result = await fetchProjectLanguages(projectId.value);
      if (mine === latest) data.value = result;
    } catch (e) {
      if (!(e instanceof ApiError)) throw e;
      if (mine === latest) error.value = e;
    } finally {
      if (mine === latest) loading.value = false;
    }
  }

  // Another Project's languages never stand in for this one's while it loads or when its read fails.
  watch(
    projectId,
    () => {
      data.value = null;
      void reload();
    },
    { immediate: true },
  );

  const languages = computed(() => data.value?.languages ?? []);
  const languagesOrNull = computed(() => data.value?.languages ?? null);
  const defaultLanguage = computed(() => languages.value.find((l) => l.isDefault)?.languageCode ?? null);

  return { data, languages, languagesOrNull, defaultLanguage, error, loading, reload, set: (value: ProjectLanguages) => (data.value = value) };
}
