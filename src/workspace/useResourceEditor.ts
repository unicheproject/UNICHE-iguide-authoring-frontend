import { computed, onBeforeUnmount, onMounted, reactive, ref, watch, type Ref } from "vue";
import { onBeforeRouteLeave } from "vue-router";
import { ApiError } from "@/platform/api";
import type { ProjectLanguage } from "@/platform/languages";
import type { ResourceStatus } from "@/platform/places";
import type { ResourceReference } from "@/platform/references";
import { showToast } from "@/stores/toast";

/**
 * Behaviour every authored-Resource editor shares (iGuide spec 12, sections 4 to 6): loading, unsaved-change
 * tracking, language tabs, field errors with a summary, explicit save with `version` and the 409
 * reload-or-overwrite choice, lifecycle transitions with the where-used block, and the leave guard. An
 * editor supplies only its API calls, how to fill and snapshot its form, and how to name its fields.
 */

export interface EditableResource {
  id: string;
  status: ResourceStatus;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface ErrorSummary {
  title: string;
  items: string[];
  requestId: string | null;
}

export interface ResourceEditorOptions<T extends EditableResource> {
  /** Singular, lowercase, as used in sentences: "place", "point of interest", "route". */
  kind: string;
  /** Changes when a different Resource is opened, which reloads the editor. */
  source: () => unknown;
  load: () => Promise<T>;
  save: (resource: T, version: number) => Promise<T>;
  changeStatus: (resource: T, target: ResourceStatus, version: number) => Promise<T>;
  /** Copies the Resource into the form. */
  resetForm: (resource: T) => void;
  /** Adds empty rows for newly enabled languages, without touching existing text. */
  ensureLanguageRows: () => void;
  /** The form state compared against the last saved snapshot. */
  formState: () => unknown;
  /** Checks that need no request; returns messages keyed by field path. */
  validate?: () => Record<string, string>;
  /** Human name of a field path from an error, such as "Title (English)". */
  describePath: (path: string) => string;
  languages: Ref<ProjectLanguage[]>;
  defaultLanguage: Ref<string | null>;
  /** Whether the form can be changed; by default only a DRAFT can, the rest waits for working copies. */
  isEditable?: (resource: T) => boolean;
  /** Where-used list loaded before deactivating or archiving; absent when nothing can reference the kind. */
  loadReferences?: (resource: T) => Promise<ResourceReference[]>;
}

export function useResourceEditor<T extends EditableResource>(options: ResourceEditorOptions<T>) {
  const { kind } = options;

  // Loading ------------------------------------------------------------------------------------------

  const resource = ref<T | null>(null) as Ref<T | null>;
  const loading = ref(true);
  const loadError = ref<ApiError | null>(null);

  async function load() {
    loading.value = true;
    loadError.value = null;
    try {
      apply(await options.load());
    } catch (e) {
      if (!(e instanceof ApiError)) throw e;
      loadError.value = e;
    } finally {
      loading.value = false;
    }
  }
  watch(options.source, load, { immediate: true });

  // Dirty tracking -----------------------------------------------------------------------------------

  const snapshot = ref("");
  const serialize = () => JSON.stringify(options.formState());
  const dirty = computed(() => snapshot.value !== "" && serialize() !== snapshot.value);
  const editable = computed(() => {
    const current = resource.value;
    if (!current) return false;
    return options.isEditable ? options.isEditable(current) : current.status === "DRAFT";
  });

  function apply(updated: T) {
    resource.value = updated;
    options.resetForm(updated);
    options.ensureLanguageRows();
    snapshot.value = serialize();
    clearErrors();
  }

  watch(options.languages, () => {
    const wasClean = !dirty.value;
    options.ensureLanguageRows();
    if (wasClean && snapshot.value) snapshot.value = serialize();
  });

  // Language tabs ------------------------------------------------------------------------------------

  const activeLanguage = ref<string | null>(null);
  watch(
    [options.languages, options.defaultLanguage],
    () => {
      const codes = options.languages.value.map((l) => l.languageCode);
      if (!activeLanguage.value || !codes.includes(activeLanguage.value)) {
        activeLanguage.value = options.defaultLanguage.value ?? codes[0] ?? null;
      }
    },
    { immediate: true },
  );
  const activeLanguageInfo = computed(
    () => options.languages.value.find((l) => l.languageCode === activeLanguage.value) ?? null,
  );

  // Errors -------------------------------------------------------------------------------------------

  const errors = ref<Record<string, string>>({});
  const summary = ref<ErrorSummary | null>(null);

  const languagesWithErrors = computed(() => {
    const codes = new Set<string>();
    for (const path of Object.keys(errors.value)) {
      const match = /translations\.([^.]+)/.exec(path);
      if (match) codes.add(match[1]);
    }
    return codes;
  });

  function fieldError(path: string): string | undefined {
    return errors.value[path];
  }

  function clearErrors() {
    errors.value = {};
    summary.value = null;
  }

  /** Shows the messages at their fields and in the summary, and opens a language tab that has errors. */
  function showErrors(title: string, found: Record<string, string>, requestId: string | null) {
    errors.value = found;
    summary.value = {
      title,
      items: Object.entries(found).map(([path, message]) => (path ? `${options.describePath(path)}: ${message}` : message)),
      requestId,
    };
    const withErrors = languagesWithErrors.value;
    if (withErrors.size && activeLanguage.value && !withErrors.has(activeLanguage.value)) {
      activeLanguage.value = [...withErrors][0];
    }
  }

  // Save ---------------------------------------------------------------------------------------------

  const saving = ref(false);
  const conflict = ref<{ currentVersion: number | null } | null>(null);

  async function save(version = resource.value?.version) {
    if (!resource.value || version === undefined) return;
    const found = options.validate?.() ?? {};
    if (Object.keys(found).length) {
      showErrors("Check the highlighted fields", found, null);
      return;
    }
    clearErrors();
    saving.value = true;
    try {
      const saved = await options.save(resource.value, version);
      apply(saved);
      conflict.value = null;
      showToast(
        "Saved",
        saved.status === "ACTIVE" ? "Visitors see the change on their next refresh." : "Draft saved. Visitors do not see it until you activate it.",
      );
    } catch (e) {
      if (!(e instanceof ApiError)) throw e;
      handleSaveError(e);
    } finally {
      saving.value = false;
    }
  }

  function handleSaveError(e: ApiError) {
    if (e.code === "VERSION_CONFLICT") {
      const current = e.body.currentVersion;
      conflict.value = { currentVersion: typeof current === "number" ? current : null };
    } else if (e.code === "DUPLICATE_VALUE") {
      const field = Object.keys(e.fieldMessages())[0] || "slug";
      const name = options.describePath(field).toLowerCase();
      showErrors("Check the highlighted fields", { [field]: `Another ${kind} in this Project already uses this ${name}.` }, e.requestId);
    } else if (e.status === 422 || e.status === 400) {
      const title = e.code === "RESOURCE_NOT_EDITABLE" ? `This ${kind} can no longer be edited` : `The ${kind} was not saved`;
      showErrors(title, e.fieldMessages(), e.requestId);
    } else {
      summary.value = {
        title: e.platformUnavailable ? "The UNICHE platform is not reachable" : `The ${kind} was not saved`,
        items: [e.platformUnavailable ? "Your changes are still in the form. Try again in a moment." : e.message],
        requestId: e.requestId,
      };
    }
  }

  async function reloadDiscardingChanges() {
    conflict.value = null;
    snapshot.value = "";
    await load();
  }

  /** Resends the author's values on top of the version someone else saved. */
  function overwrite() {
    const current = conflict.value?.currentVersion;
    if (current === null || current === undefined) void reloadDiscardingChanges();
    else void save(current);
  }

  // Lifecycle ----------------------------------------------------------------------------------------

  const transitioning = ref(false);
  const confirmTarget = ref<ResourceStatus | null>(null);
  const blockedBy = ref<ResourceReference[] | null>(null);

  const TRANSITION_TOASTS: Record<ResourceStatus, [string, string]> = {
    ACTIVE: ["Activated", `The ${kind} is complete and visible to visitors.`],
    DRAFT: ["Back to draft", "Visitors no longer see it. You can edit it now."],
    ARCHIVED: ["Archived", `The ${kind} left the visitor app and the default lists.`],
  };

  async function transition(target: ResourceStatus) {
    if (!resource.value) return;
    transitioning.value = true;
    try {
      apply(await options.changeStatus(resource.value, target, resource.value.version));
      confirmTarget.value = null;
      const [title, body] = TRANSITION_TOASTS[target];
      showToast(title, body, target === "ACTIVE" ? "success" : "warning");
    } catch (e) {
      if (!(e instanceof ApiError)) throw e;
      if (e.code === "RESOURCE_IN_USE" && confirmTarget.value) {
        blockedBy.value = (e.body.references as ResourceReference[] | undefined) ?? [];
        return;
      }
      confirmTarget.value = null;
      if (e.code === "MISSING_REQUIRED_FIELDS") {
        if (options.defaultLanguage.value) activeLanguage.value = options.defaultLanguage.value;
        showErrors("Cannot activate yet", e.fieldMessages(), e.requestId);
      } else if (e.code === "VERSION_CONFLICT") {
        conflict.value = { currentVersion: null };
      } else {
        showToast("The change was not saved", e.platformUnavailable ? "The UNICHE platform is not reachable." : e.message, "error");
      }
    } finally {
      transitioning.value = false;
    }
  }

  /** Activation and restore run at once; deactivation and archival ask first. */
  function requestTransition(target: ResourceStatus) {
    if (dirty.value) {
      showToast("Save first", `Save or undo your changes before changing the ${kind}'s status.`, "warning");
      return;
    }
    if (target === "ACTIVE" || (target === "DRAFT" && resource.value?.status === "ARCHIVED")) {
      void transition(target);
    } else {
      blockedBy.value = null;
      confirmTarget.value = target;
    }
  }

  const loadReferences = computed(() => {
    const loader = options.loadReferences;
    const current = resource.value;
    return loader && current ? () => loader(current) : undefined;
  });

  // Leave guard --------------------------------------------------------------------------------------

  onBeforeRouteLeave(() => !dirty.value || window.confirm("You have unsaved changes. Leave without saving?"));
  function onBeforeUnload(event: BeforeUnloadEvent) {
    if (dirty.value) event.preventDefault();
  }
  onMounted(() => window.addEventListener("beforeunload", onBeforeUnload));
  onBeforeUnmount(() => window.removeEventListener("beforeunload", onBeforeUnload));

  return reactive({
    kind,
    resource,
    loading,
    loadError,
    load,
    dirty,
    editable,
    activeLanguage,
    activeLanguageInfo,
    errors,
    summary,
    languagesWithErrors,
    fieldError,
    showErrors,
    saving,
    conflict,
    save,
    reloadDiscardingChanges,
    overwrite,
    transitioning,
    confirmTarget,
    blockedBy,
    transition,
    requestTransition,
    loadReferences,
  });
}

export type ResourceEditor<T extends EditableResource> = ReturnType<typeof useResourceEditor<T>>;
