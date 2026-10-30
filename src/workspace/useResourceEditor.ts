import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch, type Ref } from "vue";
import { askConfirm } from "@/stores/confirm";
import { onBeforeRouteLeave, useRoute } from "vue-router";
import { ApiError } from "@/platform/api";
import { session } from "@/platform/auth";
import {
  applyWorkingCopy,
  discardWorkingCopy,
  fetchWorkingCopy,
  saveWorkingCopy,
  type WorkingCopyKind,
  type WorkingCopyResponse,
} from "@/platform/workingCopies";
import type { ProjectLanguage } from "@/platform/languages";
import { fetchReadiness, type ReadinessIssue } from "@/platform/readiness";
import type { ResourceStatus } from "@/platform/places";
import type { ResourceReference } from "@/platform/references";
import { showToast } from "@/stores/toast";
import { takeActivationErrors } from "@/workspace/activationHandoff";

/**
 * Behaviour every authored-Resource editor shares (iGuide spec 12, sections 4 to 6): loading, unsaved-change
 * tracking, language tabs, field errors with a summary, explicit save with `version` and the 409
 * reload-or-overwrite choice, the working copy of an ACTIVE Resource (save draft, apply, discard, and the
 * field-by-field choice after an apply conflict), lifecycle transitions with the where-used block, and the
 * leave guard. An editor supplies only its API calls, how to fill and snapshot its form, and how to name its
 * fields.
 */

/** Asks the panel holding a field to show it, e.g. by opening its collapsed group, before focus moves there. */
export const REVEAL_FIELD_EVENT = "iguide:reveal-field";

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
  "hasWorkingCopy", "workingCopyUpdatedAt", "sortOrder"]);

/** A readiness item of the open Resource, marked blocking or warning (DECISIONS.md D-022). */
export type ReadinessItem = ReadinessIssue & { blocking: boolean };

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
    let handedOver: ReturnType<typeof takeActivationErrors> = null;
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
      offerDraft();
      handedOver = takeActivationErrors(loaded.id);
    } catch (e) {
      if (!(e instanceof ApiError)) throw e;
      loadError.value = e;
    } finally {
      loading.value = false;
    }
    // An activation refused from a list opens here at the first missing field (DECISIONS.md D-036).
    if (handedOver) {
      if (options.defaultLanguage.value) activeLanguage.value = options.defaultLanguage.value;
      showErrors("Cannot activate yet", handedOver.fields, handedOver.requestId);
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
    const first = Object.keys(found).find((path) => path);
    void focusField(first ?? "");
  }

  /**
   * Moves focus to the field of a path, such as `slug`, `translations.en.summary`, or `title` with a language,
   * opening that language's tab first; falls back to the error summary (spec 12 section 5, DECISIONS.md D-022).
   */
  async function focusField(path: string, language?: string | null) {
    const match = /^translations\.([^.]+)\.(.+)$/.exec(path);
    // A child's texts, such as a Guide block's `blocks[2].translations.en.text`, open their language too.
    const nested = /\.translations\.([^.]+)(?:\.|$)/.exec(path);
    const lang = match ? match[1] : nested?.[1] ?? language ?? null;
    if (lang && options.languages.value.some((l) => l.languageCode === lang)) activeLanguage.value = lang;
    await nextTick();
    // A field inside a collapsed group is not rendered; its panel opens the group first.
    const fullPath = match || nested ? path : lang ? `translations.${lang}.${path}` : path;
    window.dispatchEvent(new CustomEvent(REVEAL_FIELD_EVENT, { detail: { path: fullPath } }));
    await nextTick();
    const field = match ? match[2] : path;
    const plain = field.replace(/\[\d+\]/g, "").split(".");
    const selectors = path
      ? [`[data-path="${CSS.escape(path)}"]`, `#f-${CSS.escape(plain[0])}`, `#f-${CSS.escape(plain[plain.length - 1])}`]
      : [];
    for (const selector of selectors) {
      const element = document.querySelector<HTMLElement>(selector);
      if (element && element.getClientRects().length) {
        element.scrollIntoView({ block: "center" });
        element.focus();
        return;
      }
    }
    document.querySelector<HTMLElement>("[data-error-summary]")?.focus();
  }

  // Readiness ----------------------------------------------------------------------------------------

  const route = useRoute();
  const readiness = ref<ReadinessItem[]>([]);

  /** What readiness reports for this Resource; only ACTIVE Resources are evaluated (spec 07 section 14). */
  async function loadReadiness() {
    const current = resource.value;
    const projectId = typeof route.params.projectId === "string" ? route.params.projectId : "";
    if (!current || current.status !== "ACTIVE" || !projectId) {
      readiness.value = [];
      return;
    }
    try {
      const result = await fetchReadiness(projectId);
      readiness.value = [
        ...result.blocking.map((issue) => ({ ...issue, blocking: true })),
        ...result.warnings.map((issue) => ({ ...issue, blocking: false })),
        // The pending-changes banner already says so.
      ].filter((issue) => issue.resourceId === current.id && issue.code !== "PENDING_WORKING_COPY");
    } catch (e) {
      if (!(e instanceof ApiError)) throw e;
      readiness.value = [];
    }
  }
  watch(
    () => [resource.value?.id, resource.value?.status, resource.value?.version, resource.value?.workingCopyUpdatedAt],
    () => void loadReadiness(),
  );

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

  function handleSaveError(e: ApiError, failed = `The ${kind} was not saved`) {
    if (e.code === "VERSION_CONFLICT") {
      const current = e.body.currentVersion;
      conflict.value = { currentVersion: typeof current === "number" ? current : null };
      if (!usesWorkingCopy.value) void openSaveConflict();
    } else if (e.code === "DUPLICATE_VALUE") {
      const field = Object.keys(e.fieldMessages())[0] || "slug";
      const name = options.describePath(field).toLowerCase();
      showErrors("Check the highlighted fields", { [field]: `Another ${kind} in this Project already uses this ${name}.` }, e.requestId);
    } else if (e.status === 422 || e.status === 400) {
      const title = e.code === "RESOURCE_NOT_EDITABLE" ? `This ${kind} can no longer be edited` : failed;
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
      // A refused apply (backend D-037): the pending changes are kept, and the summary names what blocks them.
      else handleSaveError(e, "The changes were not applied: visitors would meet a problem");
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
      clearDraft();
      if (live.value) apply(live.value);
      return;
    }
    applying.value = true;
    try {
      await discardWorkingCopy(support.projectId(), support.kind, current.id);
      clearDraft();
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

  // DRAFT save conflict (spec 07 section 15, 12 section 5; DECISIONS.md D-025) ------------------------------------
  // Someone saved the DRAFT first: the current row is read, its form state compared with the author's field by
  // field (lists and rich text whole), and the author keeps "mine" or takes "current" per field before saving
  // again on the current version. The backend sends no `conflictingFields` yet, so the CMS computes them.

  const saveConflict = ref<{ current: T; fields: ConflictField[] } | null>(null) as Ref<{
    current: T;
    fields: ConflictField[];
  } | null>;

  async function openSaveConflict() {
    saveConflict.value = null;
    let current: T;
    try {
      current = await options.load();
    } catch (e) {
      if (!(e instanceof ApiError)) throw e;
      return; // The plain choice, reload or keep mine, stays available.
    }
    const mineJson = serialize();
    options.resetForm(current);
    options.ensureLanguageRows();
    const theirs = JSON.parse(serialize()) as object;
    Object.assign(options.formState() as object, JSON.parse(mineJson));
    options.ensureLanguageRows();
    const mine = JSON.parse(mineJson) as object;
    saveConflict.value = {
      current,
      fields: differingFields(mine, theirs).map((path) => ({
        path,
        mine: valueAt(mine, path),
        current: valueAt(theirs, path),
        choice: "mine" as const,
      })),
    };
  }

  /** Saves the author's choices on top of the version someone else saved. */
  async function resolveSaveConflict() {
    const pending = saveConflict.value;
    if (!pending) return;
    const merged = JSON.parse(serialize()) as object;
    for (const field of pending.fields) {
      if (field.choice === "current") setValueAt(merged, field.path, field.current);
    }
    Object.assign(options.formState() as object, merged);
    options.ensureLanguageRows();
    saveConflict.value = null;
    conflict.value = null;
    resource.value = pending.current;
    await save(pending.current.version);
  }

  function closeConflict() {
    conflict.value = null;
    saveConflict.value = null;
  }

  async function reloadDiscardingChanges() {
    conflict.value = null;
    saveConflict.value = null;
    clearDraft();
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

  // Unsaved form state in browser storage ----------------------------------------------------------------
  // Spec 12 section 5 and section 6 (session expired), AGENTS.md section 4 rule 11, DECISIONS.md D-024: while the
  // form has unsaved changes it is kept in this browser, per author and per editor page, never sent anywhere before
  // the author saves, and offered back when the same author opens the same editor again, e.g. after a lost session.

  interface StoredDraft {
    savedAt: string;
    /** The Resource's version the changes started from; a newer one means it changed meanwhile. */
    version: number;
    state: unknown;
  }

  const draftRoute = useRoute();
  /** Unsaved changes found in storage when the editor opened, waiting for Restore or Discard. */
  const pendingDraft = ref<StoredDraft | null>(null);
  let draftTimer: ReturnType<typeof setTimeout> | null = null;
  /** Set once the author chose to leave without saving: nothing is kept after that. */
  let abandoned = false;

  function draftKey(): string | null {
    const subject = session.user?.subject;
    return subject ? `iguide:draft:${subject}:${draftRoute.path}` : null;
  }

  function readDraft(): StoredDraft | null {
    try {
      const key = draftKey();
      const raw = key ? window.localStorage.getItem(key) : null;
      return raw ? (JSON.parse(raw) as StoredDraft) : null;
    } catch {
      return null;
    }
  }

  function writeDraft() {
    if (draftTimer) clearTimeout(draftTimer);
    draftTimer = null;
    const key = draftKey();
    if (!key || abandoned || !resource.value || !dirty.value || pendingDraft.value) return;
    const draft: StoredDraft = { savedAt: new Date().toISOString(), version: resource.value.version, state: options.formState() };
    try {
      window.localStorage.setItem(key, JSON.stringify(draft));
    } catch {
      // Storage full or blocked: the leave guard still protects the form.
    }
  }

  function clearDraft() {
    if (draftTimer) clearTimeout(draftTimer);
    draftTimer = null;
    try {
      const key = draftKey();
      if (key) window.localStorage.removeItem(key);
    } catch {
      // Nothing to clear when storage is blocked.
    }
  }

  /** After a load: offers stored changes that differ from what was loaded. */
  function offerDraft() {
    const stored = readDraft();
    pendingDraft.value = stored && JSON.stringify(stored.state) !== snapshot.value ? stored : null;
    if (stored && !pendingDraft.value) clearDraft();
  }

  /** Puts the stored changes back into the form; they stay unsaved until the author saves. */
  function restoreDraft() {
    const stored = pendingDraft.value;
    if (!stored) return;
    pendingDraft.value = null;
    Object.assign(options.formState() as object, JSON.parse(JSON.stringify(stored.state)));
    options.ensureLanguageRows();
    writeDraft();
  }

  function discardDraft() {
    pendingDraft.value = null;
    clearDraft();
  }

  /** Whether the stored changes started from an older version than the one loaded. */
  const draftOutdated = computed(() =>
    !!pendingDraft.value && !!resource.value && pendingDraft.value.version !== resource.value.version,
  );

  // Every change of the form: kept a moment after typing stops; a form back to its saved state drops it.
  watch(serialize, () => {
    if (loading.value || !resource.value || pendingDraft.value) return;
    if (!dirty.value) {
      clearDraft();
      return;
    }
    if (draftTimer) clearTimeout(draftTimer);
    draftTimer = setTimeout(writeDraft, 600);
  });

  // Leave guard --------------------------------------------------------------------------------------

  onBeforeRouteLeave(async () => {
    if (!dirty.value) return true;
    const leave = await askConfirm({
      title: "Leave without saving?",
      body: `You have unsaved changes to this ${options.kind}. If you leave now, they are lost.`,
      confirmLabel: "Leave without saving",
      cancelLabel: "Keep editing",
      danger: true,
    });
    if (leave) {
      abandoned = true;
      clearDraft();
    }
    return leave;
  });
  // Closing or reloading the tab can only use the browser's own prompt; browsers allow no custom dialog there.
  // The changes are written to storage first, so a reload or a login redirect does not lose them.
  function onBeforeUnload(event: BeforeUnloadEvent) {
    if (!dirty.value) return;
    writeDraft();
    event.preventDefault();
  }
  function onPageHide() {
    if (dirty.value) writeDraft();
  }
  onMounted(() => {
    window.addEventListener("beforeunload", onBeforeUnload);
    window.addEventListener("pagehide", onPageHide);
  });
  onBeforeUnmount(() => {
    window.removeEventListener("beforeunload", onBeforeUnload);
    window.removeEventListener("pagehide", onPageHide);
    if (dirty.value) writeDraft();
  });

  return reactive({
    kind,
    resource,
    live,
    pendingDraft,
    draftOutdated,
    restoreDraft,
    discardDraft,
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
    focusField,
    readiness,
    loadReadiness,
    showErrors,
    saving,
    conflict,
    saveConflict,
    resolveSaveConflict,
    closeConflict,
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
