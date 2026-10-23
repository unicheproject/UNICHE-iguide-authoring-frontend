import { computed, onBeforeUnmount, onMounted, reactive, ref, watch, type Ref } from "vue";
import { askConfirm } from "@/stores/confirm";
import { onBeforeRouteLeave } from "vue-router";
import { ApiError } from "@/platform/api";
import {
  applyWorkingCopy,
  discardWorkingCopy,
  fetchWorkingCopy,
  saveWorkingCopy,
  type WorkingCopyKind,
  type WorkingCopyResponse,
} from "@/platform/workingCopies";
import type { ProjectLanguage } from "@/platform/languages";
import type { ResourceStatus } from "@/platform/places";
import type { ResourceReference } from "@/platform/references";
import { showToast } from "@/stores/toast";

/**
 * Behaviour every authored-Resource editor shares (iGuide spec 12, sections 4 to 6): loading, unsaved-change
 * tracking, language tabs, field errors with a summary, explicit save with `version` and the 409
 * reload-or-overwrite choice, the working copy of an ACTIVE Resource (save draft, apply, discard, and the
 * field-by-field choice after an apply conflict), lifecycle transitions with the where-used block, and the
 * leave guard. An editor supplies only its API calls, how to fill and snapshot its form, and how to name its
 * fields.
 */

export interface EditableResource {
  id: string;
  status: ResourceStatus;
  version: number;
  createdAt: string;
  updatedAt: string;
  hasWorkingCopy?: boolean;
  workingCopyUpdatedAt?: string | null;
}

/** How an ACTIVE Resource of the kind is edited through its working copy (spec 12 section 4, backend D-027). */
export interface WorkingCopySupport<T> {
  kind: WorkingCopyKind;
  projectId: () => string;
  /** The working-copy payload built from the current form: the kind's update body and its children. */
  payload: (resource: T) => Record<string, unknown> | Promise<Record<string, unknown>>;
  /** The kind's read DTO, as the backend renders a copy or an apply, mapped onto the editor's model. */
  fromResponse: (raw: unknown) => T | Promise<T>;
  /** Moves error paths of the payload to where the form shows them, as the kind's DRAFT save does. */
  mapError?: (error: ApiError) => ApiError;
}

/** One field that differs between the author's pending changes and the live version after an apply conflict. */
export interface ConflictField {
  path: string;
  mine: unknown;
  current: unknown;
  choice: "mine" | "current";
}

/** Fields that describe the row rather than its content; never offered as a conflict choice. */
const ROW_FIELDS = new Set(["id", "projectId", "status", "version", "createdAt", "updatedAt", "archivedAt",
  "hasWorkingCopy", "workingCopyUpdatedAt", "sortOrder", "blockIds"]);

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
  /** Whether the form can be changed; by default a DRAFT, and an ACTIVE Resource when `workingCopy` is given. */
  isEditable?: (resource: T) => boolean;
  /** Edits of an ACTIVE Resource go to its working copy; without this an ACTIVE Resource is read-only. */
  workingCopy?: WorkingCopySupport<T>;
  /** Where-used list loaded before deactivating or archiving; absent when nothing can reference the kind. */
  loadReferences?: (resource: T) => Promise<ResourceReference[]>;
}

export function useResourceEditor<T extends EditableResource>(options: ResourceEditorOptions<T>) {
  const { kind } = options;

  // Loading ------------------------------------------------------------------------------------------

  const resource = ref<T | null>(null) as Ref<T | null>;
  /** The live row as last read; while a working copy is open, `resource` holds the copy instead. */
  const live = ref<T | null>(null) as Ref<T | null>;
  const workingCopy = ref<WorkingCopyResponse | null>(null);
  const loading = ref(true);
  const loadError = ref<ApiError | null>(null);

  async function load() {
    loading.value = true;
    loadError.value = null;
    try {
      const loaded = await options.load();
      live.value = loaded;
      workingCopy.value = null;
      const copy = await readWorkingCopy(loaded);
      if (copy?.resource) {
        apply(await copied(copy, loaded));
      } else {
        apply(loaded);
        if (copy) {
          showErrors(
            "The pending changes can no longer be applied",
            Object.fromEntries(copy.errors.map((e) => [e.path, e.message])),
            null,
          );
        }
      }
    } catch (e) {
      if (!(e instanceof ApiError)) throw e;
      loadError.value = e;
    } finally {
      loading.value = false;
    }
  }
  watch(options.source, load, { immediate: true });

  /** The working copy of an ACTIVE Resource that has one; null when it has none or the kind has no copies. */
  async function readWorkingCopy(loaded: T): Promise<WorkingCopyResponse | null> {
    const support = options.workingCopy;
    if (!support || loaded.status !== "ACTIVE" || !loaded.hasWorkingCopy) return null;
    try {
      workingCopy.value = await fetchWorkingCopy(support.projectId(), support.kind, loaded.id);
      return workingCopy.value;
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) return null;
      throw e;
    }
  }

  /** The copy's rendering, carrying the live row's identity, so status changes send the live version. */
  async function copied(copy: WorkingCopyResponse, liveRow: T): Promise<T> {
    const rendered = await options.workingCopy!.fromResponse(copy.resource);
    return {
      ...rendered,
      status: liveRow.status,
      version: liveRow.version,
      createdAt: liveRow.createdAt,
      updatedAt: liveRow.updatedAt,
      hasWorkingCopy: true,
      workingCopyUpdatedAt: copy.updatedAt,
    };
  }

  // Dirty tracking -----------------------------------------------------------------------------------

  const snapshot = ref("");
  const serialize = () => JSON.stringify(options.formState());
  const dirty = computed(() => snapshot.value !== "" && serialize() !== snapshot.value);
  const editable = computed(() => {
    const current = resource.value;
    if (!current) return false;
    if (options.isEditable) return options.isEditable(current);
    return current.status === "DRAFT" || (current.status === "ACTIVE" && !!options.workingCopy);
  });
  /** Saves go to the working copy: the Resource is ACTIVE and its kind has copies. */
  const usesWorkingCopy = computed(() => resource.value?.status === "ACTIVE" && !!options.workingCopy);

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
    if (usesWorkingCopy.value) return saveCopy();
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

  /**
   * Saves the form into the working copy. `rebaseTo` moves the copy onto that live version, which the backend
   * allows only when it is the live version: the "reopen on the current version" after an apply conflict.
   */
  async function saveCopy(rebaseTo?: number) {
    const support = options.workingCopy;
    const current = resource.value;
    if (!support || !current) return;
    const found = options.validate?.() ?? {};
    if (Object.keys(found).length) {
      showErrors("Check the highlighted fields", found, null);
      return;
    }
    clearErrors();
    saving.value = true;
    try {
      const copy = workingCopy.value;
      const saved = await saveWorkingCopy(support.projectId(), support.kind, current.id, {
        baseVersion: rebaseTo ?? copy?.baseVersion ?? live.value?.version ?? current.version,
        workingCopyVersion: copy?.version ?? null,
        payload: await support.payload(current),
      });
      workingCopy.value = saved;
      apply(await copied(saved, live.value ?? current));
      conflict.value = null;
      showToast("Pending changes saved", "Visitors see the live version until you apply the changes.");
    } catch (e) {
      if (!(e instanceof ApiError)) throw e;
      handleSaveError(support.mapError ? support.mapError(e) : e);
    } finally {
      saving.value = false;
    }
  }

  /** After a copy-save conflict: read the copy and the live row again, keep the form, and save on top. */
  async function overwriteCopy() {
    const current = resource.value;
    if (!current) return;
    saving.value = true;
    try {
      const fresh = await options.load();
      live.value = fresh;
      workingCopy.value = null;
      await readWorkingCopy(fresh);
      resource.value = { ...current, version: fresh.version };
    } catch (e) {
      if (!(e instanceof ApiError)) throw e;
      handleSaveError(e);
      return;
    } finally {
      saving.value = false;
    }
    await saveCopy(workingCopy.value ? undefined : live.value?.version);
  }

  // Apply and discard ----------------------------------------------------------------------------------

  const applying = ref(false);
  const applyConflict = ref<{ current: T; fields: ConflictField[] } | null>(null);

  /** Makes the pending changes live after a confirmation naming the Resource (spec 12 section 4). */
  async function applyChanges(title: string) {
    const support = options.workingCopy;
    if (!support || !resource.value) return;
    const confirmed = await askConfirm({
      title: `Apply the changes to ${title}?`,
      body: `Visitors see the changed ${kind} on their next refresh of the app.`,
      confirmLabel: "Apply changes",
      cancelLabel: "Keep editing",
    });
    if (!confirmed) return;
    if (dirty.value || !workingCopy.value) {
      await saveCopy();
      if (!workingCopy.value || dirty.value || summary.value || conflict.value) return;
    }
    applying.value = true;
    try {
      const applied = await support.fromResponse(await applyWorkingCopy(support.projectId(), support.kind, resource.value.id));
      workingCopy.value = null;
      live.value = applied;
      apply(applied);
      showToast("Changes applied", "Visitors see them on their next refresh.", "success");
    } catch (e) {
      if (!(e instanceof ApiError)) throw e;
      if (e.code === "VERSION_CONFLICT") await openApplyConflict();
      else handleSaveError(e);
    } finally {
      applying.value = false;
    }
  }

  /** The live row changed since the copy was started: offer "mine" or "current" per differing field. */
  async function openApplyConflict() {
    const mine = resource.value;
    if (!mine) return;
    const current = await options.load();
    live.value = current;
    applyConflict.value = {
      current,
      fields: differingFields(mine, current).map((path) => ({
        path,
        mine: valueAt(mine, path),
        current: valueAt(current, path),
        choice: "mine" as const,
      })),
    };
  }

  /** Reopens the copy on the current version with the author's choices; apply can then be tried again. */
  async function resolveApplyConflict() {
    const pending = applyConflict.value;
    const mine = resource.value;
    if (!pending || !mine) return;
    const merged = JSON.parse(JSON.stringify(mine)) as T;
    for (const field of pending.fields) {
      if (field.choice === "current") setValueAt(merged, field.path, field.current);
    }
    applyConflict.value = null;
    resource.value = { ...merged, version: pending.current.version };
    options.resetForm(resource.value);
    options.ensureLanguageRows();
    await saveCopy(pending.current.version);
  }

  async function discardChanges(title: string) {
    const support = options.workingCopy;
    const current = resource.value;
    if (!support || !current) return;
    const confirmed = await askConfirm({
      title: `Discard the pending changes to ${title}?`,
      body: "Your changes are deleted and the live version stays as it is. This cannot be undone.",
      confirmLabel: "Discard changes",
      cancelLabel: "Keep editing",
      danger: true,
    });
    if (!confirmed) return;
    applyConflict.value = null;
    if (!workingCopy.value) {
      if (live.value) apply(live.value);
      return;
    }
    applying.value = true;
    try {
      await discardWorkingCopy(support.projectId(), support.kind, current.id);
      snapshot.value = "";
      await load();
      showToast("Changes discarded", `The ${kind} is as visitors see it.`, "warning");
    } catch (e) {
      if (!(e instanceof ApiError)) throw e;
      if (e.status === 404) await load();
      else handleSaveError(e);
    } finally {
      applying.value = false;
    }
  }

  async function reloadDiscardingChanges() {
    conflict.value = null;
    snapshot.value = "";
    await load();
  }

  /** Resends the author's values on top of the version someone else saved. */
  function overwrite() {
    if (usesWorkingCopy.value) {
      conflict.value = null;
      void overwriteCopy();
      return;
    }
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
      const changed = await options.changeStatus(resource.value, target, resource.value.version);
      // Leaving ACTIVE discards the working copy (spec 03 section 1).
      workingCopy.value = null;
      live.value = changed;
      apply(changed);
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

  onBeforeRouteLeave(
    () =>
      !dirty.value ||
      askConfirm({
        title: "Leave without saving?",
        body: `You have unsaved changes to this ${options.kind}. If you leave now, they are lost.`,
        confirmLabel: "Leave without saving",
        cancelLabel: "Keep editing",
        danger: true,
      }),
  );
  // Closing or reloading the tab can only use the browser's own prompt; browsers allow no custom dialog there.
  function onBeforeUnload(event: BeforeUnloadEvent) {
    if (dirty.value) event.preventDefault();
  }
  onMounted(() => window.addEventListener("beforeunload", onBeforeUnload));
  onBeforeUnmount(() => window.removeEventListener("beforeunload", onBeforeUnload));

  return reactive({
    kind,
    resource,
    live,
    workingCopy,
    usesWorkingCopy,
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
    describePath: options.describePath,
    showErrors,
    saving,
    conflict,
    save,
    reloadDiscardingChanges,
    overwrite,
    applying,
    applyConflict,
    applyChanges,
    resolveApplyConflict,
    discardChanges,
    transitioning,
    confirmTarget,
    blockedBy,
    transition,
    requestTransition,
    loadReferences,
  });
}

// Conflict fields ----------------------------------------------------------------------------------------

/**
 * Paths whose values differ: a scalar field by its own name, a translated field as `translations.<lang>.<field>`,
 * and any other object or list as a whole, because a rich text or a reordered collection is chosen whole and never
 * merged (spec 12 section 5).
 */
function differingFields(mine: object, current: object): string[] {
  const a = mine as Record<string, unknown>;
  const b = current as Record<string, unknown>;
  const paths: string[] = [];
  for (const key of new Set([...Object.keys(a), ...Object.keys(b)])) {
    if (ROW_FIELDS.has(key)) continue;
    if (key === "translations" && isRecord(a[key]) && isRecord(b[key])) {
      const ta = a[key] as Record<string, unknown>;
      const tb = b[key] as Record<string, unknown>;
      for (const lang of new Set([...Object.keys(ta), ...Object.keys(tb)])) {
        const fa = (ta[lang] ?? {}) as Record<string, unknown>;
        const fb = (tb[lang] ?? {}) as Record<string, unknown>;
        for (const field of new Set([...Object.keys(fa), ...Object.keys(fb)])) {
          if (!same(fa[field], fb[field])) paths.push(`translations.${lang}.${field}`);
        }
      }
    } else if (!same(a[key], b[key])) {
      paths.push(key);
    }
  }
  return paths;
}

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
/** Empty text and a missing value are the same to the author. */
const same = (x: unknown, y: unknown) => JSON.stringify(x ?? null) === JSON.stringify(y ?? null) || (!x && !y && x !== 0 && y !== 0);

function valueAt(target: object, path: string): unknown {
  return path.split(".").reduce<unknown>((v, key) => (isRecord(v) ? v[key] : undefined), target);
}

function setValueAt(target: object, path: string, value: unknown) {
  const keys = path.split(".");
  let cursor = target as Record<string, unknown>;
  for (const key of keys.slice(0, -1)) {
    if (!isRecord(cursor[key])) cursor[key] = {};
    cursor = cursor[key] as Record<string, unknown>;
  }
  cursor[keys[keys.length - 1]] = value === undefined ? null : JSON.parse(JSON.stringify(value));
}

export type ResourceEditor<T extends EditableResource> = ReturnType<typeof useResourceEditor<T>>;
