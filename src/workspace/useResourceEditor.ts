import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch, type Ref } from "vue";
import { askConfirm } from "@/stores/confirm";
import { say } from "@/lib/announcer";
import { describeError } from "@/lib/errors";
import { formatTime } from "@/lib/format";
import { firstVisibleField, focusHeading } from "@/lib/focus";
import { connection } from "@/stores/connection";
import { onBeforeRouteLeave, useRoute } from "vue-router";
import { ApiError, PartlySavedError } from "@/platform/api";
import { session } from "@/platform/auth";
import {
  applyWorkingCopy,
  discardWorkingCopy,
  fetchWorkingCopy,
  saveWorkingCopy,
  type WorkingCopyKind,
  type WorkingCopyResponse,
} from "@/platform/workingCopies";
import { countIssues, issueSentence, type IssueCounts } from "@/platform/completeness";
import type { ProjectLanguage } from "@/platform/languages";
import { fetchReadiness, type ReadinessIssue } from "@/platform/readiness";
import type { ResourceStatus } from "@/platform/places";
import type { ResourceReference } from "@/platform/references";
import { sessionNotice, setUnsavedEdits } from "@/stores/sessionNotice";
import { showErrorToast, showToast } from "@/stores/toast";
import { takeActivationErrors, isMissingFieldsError } from "@/workspace/activationHandoff";

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

/** Asks the Texts panel to focus the first empty field of a language, opening the group that holds it ("Next missing"). */
export const FOCUS_FIRST_EMPTY_EVENT = "iguide:focus-first-empty";

/** The detail of {@link FOCUS_FIRST_EMPTY_EVENT}; the panel sets `handled` when it found an empty field. */
export interface FocusFirstEmptyDetail {
  language: string;
  handled: boolean;
}

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
  /** Wraps the copy save for rows saved live beside it, such as triggers, which are put back when it is refused. */
  around?: <R>(resource: T, save: () => Promise<R>) => Promise<R>;
}

/** One field that differs between the author's pending changes and the live version after an apply conflict. */
export interface ConflictField {
  path: string;
  mine: unknown;
  current: unknown;
  /** One line saying how a list differs ("Mine: 1 added, 1 removed. Current: 2 added."), for fields that hold lists. */
  diff?: string;
  /** Null until the author picks one: nothing is preselected (plan 2.3). */
  choice: "mine" | "current" | null;
}

/** Fields that describe the row rather than its content; never offered as a conflict choice. */
const ROW_FIELDS = new Set(["id", "projectId", "status", "version", "createdAt", "updatedAt", "archivedAt",
  "hasWorkingCopy", "workingCopyUpdatedAt", "sortOrder"]);

/** A readiness item of the open Resource, marked blocking or warning (DECISIONS.md D-022). */
export type ReadinessItem = ReadinessIssue & { blocking: boolean };

/** One line of the error summary; with a `path`, the summary links it to its field (`14` §4, DECISIONS.md D-042). */
export interface ErrorSummaryItem {
  text: string;
  path: string | null;
}

export interface ErrorSummary {
  title: string;
  items: ErrorSummaryItem[];
  requestId: string | null;
  /**
   * What the author can do about a failure the form cannot fix: "leave" (403/404 on save: the one action is back to
   * the list). Absent for field errors.
   */
  recovery?: "leave";
}

/** A save that stored part of its work and failed at the rest (trigger and media rows beside the Resource). */
export interface PartialFailure {
  /** "The point of interest was saved. The QR code could not be saved." */
  sentence: string;
  requestId: string | null;
}

/** One write of a save that does not depend on another (a trigger, an asset link). */
export interface IndependentWrite {
  /** What it is called in the sentence: "the QR code", "the image". */
  label: string;
  run: () => Promise<unknown>;
}

/**
 * Runs writes that do not depend on each other at the same time (C2-73) and waits for all of them: a failure of one
 * never cancels the others. Resolves with the failed ones (empty when all worked), in the order given, so the caller
 * can name them in one sentence with {@link partialSentence} and keep the form dirty for a retry.
 */
export async function runIndependentWrites(writes: IndependentWrite[]): Promise<{ write: IndependentWrite; error: ApiError }[]> {
  const settled = await Promise.allSettled(writes.map((w) => w.run()));
  const failed: { write: IndependentWrite; error: ApiError }[] = [];
  settled.forEach((result, i) => {
    if (result.status === "fulfilled") return;
    if (!(result.reason instanceof ApiError)) throw result.reason;
    failed.push({ write: writes[i], error: result.reason });
  });
  return failed;
}

/** "The point of interest was saved. The QR code and the image could not be saved." */
export function partialSentence(kind: string, failed: string[]): string {
  const list = failed.length > 1 ? `${failed.slice(0, -1).join(", ")} and ${failed[failed.length - 1]}` : failed[0];
  return `The ${kind} was saved. ${list.charAt(0).toUpperCase()}${list.slice(1)} could not be saved: your changes to ${failed.length > 1 ? "them are" : "it are"} still in the form.`;
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
  /**
   * Called when a save stored the Resource but not every independent row beside it (triggers, media): the editor
   * replaces the rows it holds with the saved ones, marked saved, and keeps only the failed ones for the retry (C3-20).
   * The form stays dirty for the failed rows.
   */
  onPartialSave?: (saved: T) => void;
}

/** A readable name for a path the kind's `describePath` does not know: "Title (Greek)" for `translations.el.title`. */
function fallbackPathLabel(path: string, languages: ProjectLanguage[]): string {
  const match = /^translations\.([^.]+)\.(.+)$/.exec(path);
  const field = (match ? match[2] : path).replace(/\[(\d+)\]/g, " $1").split(".").filter(Boolean).pop() ?? path;
  const words = field.replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase();
  const label = words.charAt(0).toUpperCase() + words.slice(1);
  const language = match ? languages.find((l) => l.languageCode === match[1])?.displayName ?? match[1] : null;
  return language ? `${label} (${language})` : label;
}

/** "12:41", 24 h (D-088), for the "Saved 12:41" state line. */
const clock = (date: Date) => formatTime(date.toISOString());

/**
 * The editor state shared by every Resource editor; see the file comment. Stage 0.2 adds the state line ("Unsaved
 * changes", "Saved 12:41", "Saving…", "Still saving"), Ctrl/Cmd+S, focus after a save, error clearing on input, the
 * `describePath` label fallback, `requestActivate` (always a confirm, with "Save and activate" for a dirty DRAFT and the
 * platform's refusal kept inside the dialog), and a restore notice that is offered only when the editor first opens.
 */
export function useResourceEditor<T extends EditableResource>(options: ResourceEditorOptions<T>) {
  const { kind } = options;
  const describePath = (path: string) => options.describePath(path) || fallbackPathLabel(path, options.languages.value);

  const route = useRoute();

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
      if (draftOfferedFor !== draftRoute.path) {
        draftOfferedFor = draftRoute.path;
        offerDraft();
      }
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
      showErrors("Cannot activate yet", handedOver.fields, handedOver.requestId, "field");
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

  /** The server's Working Copy of a live row read now, without touching the editor's state; null when there is none. */
  async function readWorkingCopyOf(liveRow: T): Promise<WorkingCopyResponse | null> {
    const support = options.workingCopy;
    if (!support || liveRow.status !== "ACTIVE" || !liveRow.hasWorkingCopy) return null;
    try {
      return await fetchWorkingCopy(support.projectId(), support.kind, liveRow.id);
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
  /** `?lang=it` (from a language dot in a list) opens the editor on that language, once (C2-50). */
  let seededLanguage = false;
  watch(
    [options.languages, options.defaultLanguage],
    () => {
      const codes = options.languages.value.map((l) => l.languageCode);
      if (!seededLanguage && codes.length) {
        seededLanguage = true;
        const asked = typeof route.query.lang === "string" ? route.query.lang : "";
        if (codes.includes(asked)) activeLanguage.value = asked;
      }
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
    partialFailure.value = null;
  }

  /** Moves focus to the error summary (a failed save the author cannot fix in a field: 5xx, offline, no access). */
  function focusSummary() {
    void nextTick().then(() => {
      const box = document.querySelector<HTMLElement>("[data-error-summary]");
      if (!box) return;
      box.scrollIntoView({ block: "nearest" });
      box.focus({ preventScroll: true });
    });
  }

  /** Closes the summary without touching the field errors (they stay at their fields). */
  function dismissSummary() {
    summary.value = null;
  }

  /**
   * An error clears as soon as its field changes (`14` §4); the summary loses the line and goes when none is left.
   * Errors of paths the form does not hold (a server-side rule) stay until the next save.
   */
  function clearErrorsOnInput(before: string, after: string) {
    if (!before || !Object.keys(errors.value).length) return;
    let changed: string[];
    try {
      changed = differingFields(JSON.parse(before) as object, JSON.parse(after) as object);
    } catch {
      return;
    }
    const stale = Object.keys(errors.value).filter((path) => changed.some((c) => path === c || path.startsWith(`${c}.`) || path.startsWith(`${c}[`)));
    if (!stale.length) return;
    const rest = { ...errors.value };
    for (const path of stale) delete rest[path];
    errors.value = rest;
    if (summary.value) {
      const items = summary.value.items.filter((item) => !item.path || !stale.includes(item.path));
      summary.value = items.length ? { ...summary.value, items } : null;
    }
  }

  /** Shows the messages at their fields and in the summary, and opens a language tab that has errors. */
  function showErrors(title: string, found: Record<string, string>, requestId: string | null, focus: "summary" | "field" | false = "summary") {
    errors.value = found;
    summary.value = {
      title,
      items: Object.entries(found).map(([path, message]) =>
        path ? { text: `${describePath(path)}: ${message}`, path } : { text: message, path: null },
      ),
      requestId,
    };
    const withErrors = languagesWithErrors.value;
    if (withErrors.size && activeLanguage.value && !withErrors.has(activeLanguage.value)) {
      activeLanguage.value = [...withErrors][0];
    }
    if (!focus) return;
    if (focus === "summary") {
      // The summary takes focus on a failed save; each of its lines then links to its field (`14` §4, plan 2.3).
      void nextTick().then(() => {
        const box = document.querySelector<HTMLElement>("[data-error-summary]");
        if (!box) return void focusField(Object.keys(found).find((path) => path) ?? "");
        box.scrollIntoView({ block: "center" });
        box.focus({ preventScroll: true });
      });
      return;
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
    // Right after load the form may still wait for something else, such as the Project's languages: give it a moment.
    for (let attempt = 0; attempt < 20; attempt++) {
      for (const selector of selectors) {
        const element = document.querySelector<HTMLElement>(selector);
        if (element && element.getClientRects().length) {
          element.scrollIntoView({ block: "center" });
          element.focus();
          return;
        }
      }
      if (!selectors.length && document.querySelector("[data-error-summary]")) break;
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    const summaryBox = document.querySelector<HTMLElement>("[data-error-summary]");
    if (summaryBox) summaryBox.focus();
    // Nothing to land on: say so rather than leaving focus where it was (`14` §4, DECISIONS.md D-042).
    else if (path) showToast("No field to move to", `${describePath(path)} is not on this page.`, "info");
  }

  // Readiness ----------------------------------------------------------------------------------------

  const readiness = ref<ReadinessItem[]>([]);
  /** Counts of what is left to fix, from the shell's completeness model (D-090); the toast after Activate reads them. */
  const issueProvider = ref<(() => IssueCounts) | null>(null);
  /** The shell registers how to count the open issues right now; `null` unregisters. */
  function reportIssues(provider: (() => IssueCounts) | null) {
    issueProvider.value = provider;
  }

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
  const applying = ref(false);
  const conflict = ref<{ currentVersion: number | null; requestId: string | null } | null>(null);
  /** What a save stored and what it could not (trigger and media writes beside the Resource); null when all worked. */
  const partialFailure = ref<PartialFailure | null>(null);
  /** The summary on screen says "not saved, you are offline": "Back online" replaces it with a neutral line (C2-11). */
  let offlineSummary: ErrorSummary | null = null;
  watch(
    () => connection.offline,
    (offline) => {
      if (offline || !offlineSummary || summary.value !== offlineSummary) return;
      offlineSummary = null;
      summary.value = { title: "Back online", items: [{ text: "The connection is back. Your changes are still in the form; save again.", path: null }], requestId: null };
    },
  );
  /** Reports a save whose independent writes partly failed; the sentence stays in the summary slot until the next save. */
  function reportPartial(sentence: string, requestId: string | null = null) {
    partialFailure.value = { sentence, requestId };
    summary.value = { title: "Saved in part", items: [{ text: sentence, path: null }], requestId };
    focusSummary();
  }
  /** When the last save of this session finished, as "12:41"; empty before the first. */
  const lastSavedAt = ref("");
  /** "Saving…" shows after 300 ms and "Still saving" after 3 s, so quick saves do not flicker (plan 2.3). */
  const savePhase = ref<"idle" | "saving" | "slow">("idle");
  let phaseTimers: ReturnType<typeof setTimeout>[] = [];
  watch(
    () => saving.value || applying.value,
    (busy) => {
      phaseTimers.forEach(clearTimeout);
      phaseTimers = [];
      savePhase.value = "idle";
      if (!busy) return;
      phaseTimers = [setTimeout(() => (savePhase.value = "saving"), 300), setTimeout(() => (savePhase.value = "slow"), 3000)];
    },
  );
  onBeforeUnmount(() => phaseTimers.forEach(clearTimeout));
  /**
   * The session ended while a save, apply or status change was in flight (C3-83). `apiRequest` never settles after a
   * persistent 401 (the "Your session ended" dialog waits for the author), so the busy flags would stay on forever:
   * they are released here, the header says "Not saved: session ended. Sign in again", Save is live again and Ctrl+S
   * tries once more (which shows the dialog again if the session is still gone).
   */
  const sessionLost = ref(false);
  watch(
    () => sessionNotice.at,
    () => {
      if (!sessionNotice.ended) return;
      const inFlight = saving.value || applying.value || transitioning.value;
      if (!inFlight && !dirty.value) return;
      saving.value = false;
      applying.value = false;
      transitioning.value = false;
      sessionLost.value = true;
    },
  );
  watch(
    dirty,
    (now) => {
      if (!now) sessionLost.value = false;
      setUnsavedEdits(now);
    },
    { immediate: true },
  );
  onBeforeUnmount(() => setUnsavedEdits(false));
  /** One line of save state for the header, read out politely. */
  const stateLine = computed(() => {
    if (sessionLost.value) return "Not saved: session ended. Sign in again";
    if (savePhase.value === "slow") return "Still saving…";
    if (savePhase.value === "saving") return applying.value ? "Applying…" : "Saving…";
    if (dirty.value) return "Unsaved changes";
    return lastSavedAt.value ? `Saved ${lastSavedAt.value}` : "";
  });
  /** After a save the focus goes back to the primary action when it was lost with the busy state (`focusAfterSave`). */
  async function focusAfterSave() {
    await nextTick();
    if (summary.value) return;
    const active = document.activeElement;
    if (active && active !== document.body && !active.matches("[data-editor-primary]")) return;
    document.querySelector<HTMLElement>("[data-editor-primary]")?.focus();
  }

  async function save(version = resource.value?.version) {
    if (usesWorkingCopy.value) return saveCopy();
    if (!resource.value || version === undefined) return;
    const found = options.validate?.() ?? {};
    if (Object.keys(found).length) {
      showErrors("Check the highlighted fields", found, null);
      return;
    }
    clearErrors();
    sessionLost.value = false;
    saving.value = true;
    try {
      const saved = await options.save(resource.value, version);
      apply(saved);
      conflict.value = null;
      lastSavedAt.value = clock(new Date());
      // The saved copy supersedes anything kept in the browser: the restore notice goes with it (C2-63).
      discardDraft();
      // The header state line ("Saved 12:41") is the one Save announcement (C2-12); only a live ACTIVE item says more.
      if (saved.status === "ACTIVE") showToast("Saved", "Visitors see the change on their next refresh.");
    } catch (e) {
      if (e instanceof PartlySavedError) {
        // Its own fields are saved: take the new version, keep the form so saving again sends the rest.
        resource.value = e.saved as T;
        options.onPartialSave?.(e.saved as T);
        handleSaveError(e.reason, `The ${kind} was saved only in part`, true);
        return;
      }
      if (!(e instanceof ApiError)) throw e;
      handleSaveError(e);
    } finally {
      saving.value = false;
      void focusAfterSave();
    }
  }

  function handleSaveError(e: ApiError, failed = `The ${kind} was not saved`, partial = false) {
    if (e.code === "VERSION_CONFLICT") {
      const current = e.body.currentVersion;
      conflict.value = { currentVersion: typeof current === "number" ? current : null, requestId: e.requestId };
      // Working Copy saves meet the same three-way dialog as DRAFT saves (C3-32).
      void openSaveConflict();
    } else if (e.code === "DUPLICATE_VALUE") {
      const field = Object.keys(e.fieldMessages())[0] || "slug";
      const name = describePath(field).toLowerCase();
      showErrors("Check the highlighted fields", { [field]: `Another ${kind} in this Project already uses this ${name}.` }, e.requestId);
    } else if (e.status === 422 || e.status === 400) {
      const title = e.hasCode("RESOURCE_NOT_EDITABLE") ? `This ${kind} can no longer be edited` : failed;
      showErrors(title, e.fieldMessages(), e.requestId);
    } else if (e.status === 403 || e.status === 404) {
      // No cause the form can fix: say what happened and offer the one way on (C2-10).
      const gone = e.status === 404;
      summary.value = {
        title: gone ? `This ${kind} was removed` : `You no longer have access to this ${kind}`,
        items: [{ text: gone ? "It no longer exists in the Project. Your changes stay in this browser as a draft." : "Your changes stay in this browser as a draft. Ask a Project owner to give you access again.", path: null }],
        requestId: e.requestId,
        recovery: "leave",
      };
      focusSummary();
    } else {
      // A server failure or no connection: the summary names it and takes focus (the form does not move, C2-68).
      const described = describeError(e, `save the ${kind}`);
      // A save that stored part of its work never says "Nothing was changed" (C3-20): something was.
      const reason = partial ? described.body.replace(/\s*Nothing was changed\.?/g, "").trim() : described.body;
      summary.value = {
        title: failed,
        items: [{ text: connection.offline ? "You are offline. Your changes are still in the form and in this browser; save again when the connection is back." : `${reason} Your changes are still in the form.`, path: null }],
        requestId: e.requestId,
      };
      offlineSummary = connection.offline ? summary.value : null;
      focusSummary();
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
    sessionLost.value = false;
    saving.value = true;
    try {
      const copy = workingCopy.value;
      const send = async () =>
        saveWorkingCopy(support.projectId(), support.kind, current.id, {
          baseVersion: rebaseTo ?? copy?.baseVersion ?? live.value?.version ?? current.version,
          workingCopyVersion: copy?.version ?? null,
          payload: await support.payload(current),
        });
      const saved = support.around ? await support.around(current, send) : await send();
      workingCopy.value = saved;
      apply(await copied(saved, live.value ?? current));
      conflict.value = null;
      lastSavedAt.value = clock(new Date());
      discardDraft();
    } catch (e) {
      if (!(e instanceof ApiError)) throw e;
      handleSaveError(support.mapError ? support.mapError(e) : e);
    } finally {
      saving.value = false;
      void focusAfterSave();
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

  /**
   * Where focus goes once a dialog has closed and the control that opened it may be gone (C2-57): the Status card's
   * heading after Activate, Apply and Archive (it names the new state), the first field of the form after Restore.
   * Waits a moment so the dialog's own focus return has run first. The card is not rendered below 1180 px until the
   * summary opens, so the page heading takes over there.
   */
  async function focusAfter(target: "status" | "field") {
    await nextTick();
    await new Promise((resolve) => setTimeout(resolve, 80));
    if (target === "field") {
      const field = firstVisibleField(document.querySelector("main") ?? document);
      if (field) return void field.focus();
    }
    const heading = document.getElementById("status-card-heading");
    if (heading && heading.getClientRects().length) {
      heading.setAttribute("tabindex", "-1");
      heading.focus();
      return;
    }
    focusHeading();
  }

  // Apply and discard ----------------------------------------------------------------------------------

  const applyConflict = ref<{ current: T; fields: ConflictField[]; requestId: string | null } | null>(null);

  /**
   * What Apply would change, in words: the fields of the saved copy that differ from the live version (at most four
   * named, then "and N more"), "your unsaved edits" when the form is ahead of the copy, and how many warnings remain.
   */
  function describePendingChanges(): string {
    const parts: string[] = [];
    const liveRow = live.value;
    const copy = resource.value;
    if (liveRow && copy && workingCopy.value) {
      const names = [...new Set(differingFields(copy, liveRow).map((path) => describePath(path)))];
      if (names.length) parts.push(`${names.slice(0, 4).join(", ")}${names.length > 4 ? ` and ${names.length - 4} more` : ""}`);
    }
    if (dirty.value) {
      // The unsaved fields by name, measured against the last save (C3-15), not just "your unsaved edits".
      const base = baseState();
      const now = JSON.parse(serialize()) as object;
      const names = [...new Set(differingFields(base, now).map((path) => describePath(path)))];
      parts.push(names.length ? `${names.slice(0, 4).join(", ")}${names.length > 4 ? ` and ${names.length - 4} more` : ""} (unsaved)` : "your unsaved edits");
    }
    const counts = issueProvider.value?.();
    const open = counts ? counts.blockers + counts.warnings : 0;
    const what = parts.length ? `Changes: ${parts.join(", plus ")}. ` : "";
    const remain = counts && open ? ` Still open: ${issueSentence(counts, { active: true })}.` : "";
    return `${what}Visitors see the changed ${kind} on their next refresh of the app.${remain}`;
  }

  /** Makes the pending changes live after a confirmation naming what changes (spec 12 section 4). */
  async function applyChanges(title: string) {
    const support = options.workingCopy;
    if (!support || !resource.value) return;
    if (!dirty.value && !workingCopy.value) return;
    const confirmed = await askConfirm({
      title: dirty.value ? `Save and apply the changes to ${title}?` : `Apply the changes to ${title}?`,
      body: describePendingChanges(),
      confirmLabel: dirty.value ? "Save and apply" : "Apply changes",
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
      lastSavedAt.value = clock(new Date());
      showToast("Changes applied", "Visitors see them on their next refresh.", "success");
      void focusAfter("status");
    } catch (e) {
      if (!(e instanceof ApiError)) throw e;
      if (e.code === "VERSION_CONFLICT") await openApplyConflict(e.requestId);
      // A refused apply (backend D-037): the pending changes are kept, and the summary names what blocks them.
      else handleSaveError(e, "The changes were not applied: visitors would meet a problem");
    } finally {
      applying.value = false;
      void focusAfterSave();
    }
  }

  /** The live row changed since the copy was started: offer "mine" or "current" per differing field. */
  async function openApplyConflict(requestId: string | null = null) {
    const mine = resource.value;
    if (!mine) return;
    const current = await options.load();
    live.value = current;
    applyConflict.value = {
      current,
      requestId,
      fields: differingFields(mine, current).map((path) => ({
        path,
        mine: valueAt(mine, path),
        current: valueAt(current, path),
        choice: null as ConflictField["choice"],
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
      showToast("Changes discarded", `The ${kind} is as visitors see it.`, "neutral");
      void focusAfter("status");
      return;
    }
    applying.value = true;
    try {
      await discardWorkingCopy(support.projectId(), support.kind, current.id);
      clearDraft();
      snapshot.value = "";
      await load();
      // A neutral confirmation (check, not a warning); focus moves to the Status heading, as Activate does (C3-07).
      showToast("Changes discarded", `The ${kind} is as visitors see it.`, "neutral");
      void focusAfter("status");
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

  interface SaveConflict {
    current: T;
    fields: ConflictField[];
    myChanges: number;
    takeCurrent: string[];
    /** Fields only the author changed: they are kept whichever way the conflicting ones go ("Your other change (Title) is kept either way"). */
    kept: string[];
    /** A Working Copy save: the live row and the copy as read just now, so the choices are saved on top of them. */
    fresh?: { live: T; copy: WorkingCopyResponse | null };
  }
  const saveConflict = ref<SaveConflict | null>(null) as Ref<SaveConflict | null>;

  /** The form as it was when it was loaded or last saved: what "my changes" are measured against. */
  const baseState = () => (snapshot.value ? (JSON.parse(snapshot.value) as object) : {});

  /**
   * Three-way: only fields the author changed (against the saved snapshot) can conflict. A field they did not touch
   * takes the other person's value silently (`takeCurrent`), a field only they changed keeps theirs, and a field both
   * changed differently is a choice. `myChanges` counts the author's changed fields: what Reload would discard.
   */
  async function openSaveConflict() {
    saveConflict.value = null;
    let current: T;
    let fresh: SaveConflict["fresh"];
    try {
      current = await options.load();
      if (usesWorkingCopy.value && options.workingCopy) {
        // What "theirs" is for a Working Copy: the copy on the server now, or the live row when it has none.
        const liveRow = current;
        const copy = await readWorkingCopyOf(liveRow);
        fresh = { live: liveRow, copy };
        if (copy?.resource) current = await copied(copy, liveRow);
      }
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
    const base = baseState();
    const mineChanged = new Set(differingFields(base, mine));
    const takeCurrent = differingFields(mine, theirs).filter((path) => !mineChanged.has(path));
    const theirChanged = new Set(differingFields(base, theirs));
    const conflicting = differingFields(mine, theirs).filter((path) => mineChanged.has(path) && theirChanged.has(path));
    saveConflict.value = {
      current,
      fresh,
      myChanges: mineChanged.size,
      takeCurrent,
      kept: [...mineChanged].filter((path) => !conflicting.includes(path)),
      fields: differingFields(mine, theirs)
        .filter((path) => mineChanged.has(path) && theirChanged.has(path))
        .map((path) => ({
          path,
          mine: valueAt(mine, path),
          current: valueAt(theirs, path),
          diff: collectionDiff(valueAt(base, path), valueAt(mine, path), valueAt(theirs, path)),
          choice: null as ConflictField["choice"],
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
    // Fields the author did not change take the other person's value, so saving never reverts their work.
    options.resetForm(pending.current);
    options.ensureLanguageRows();
    const currentForm = JSON.parse(serialize()) as object;
    for (const path of pending.takeCurrent) setValueAt(merged, path, valueAt(currentForm, path));
    Object.assign(options.formState() as object, merged);
    options.ensureLanguageRows();
    saveConflict.value = null;
    conflict.value = null;
    resource.value = pending.current;
    if (pending.fresh) {
      // A Working Copy: save the merge on top of the copy and live row as they are now.
      live.value = pending.fresh.live;
      workingCopy.value = pending.fresh.copy;
      await saveCopy(pending.fresh.copy ? undefined : pending.fresh.live.version);
      return;
    }
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
    ACTIVE: ["Activated", "Visitors see it on their next refresh."],
    DRAFT: ["Back to draft", "Visitors no longer see it. You can edit it now."],
    ARCHIVED: ["Archived", `The ${kind} left the visitor app and the default lists.`],
  };

  async function transition(target: ResourceStatus) {
    if (!resource.value) return;
    transitioning.value = true;
    activationFailure.value = null;
    const previous = resource.value.status;
    try {
      const changed = await options.changeStatus(resource.value, target, resource.value.version);
      // Leaving ACTIVE discards the working copy (spec 03 section 1).
      workingCopy.value = null;
      live.value = changed;
      apply(changed);
      confirmTarget.value = null;
      activateOpen.value = false;
      activationRefusal.value = null;
      const restored = target === "DRAFT" && previous === "ARCHIVED";
      const [title, body] = TRANSITION_TOASTS[target];
      if (target === "ACTIVE") {
        // "Complete" is claimed only when the one completeness model has nothing left to say (D-090): the shell
        // reports its counts through `reportIssues`; without a shell, the platform's readiness is counted.
        await loadReadiness();
        await nextTick();
        const counts = issueProvider.value?.() ?? countIssues(readiness.value);
        const open = counts.blockers + counts.warnings;
        showToast(open ? `Activated. ${issueSentence(counts, { active: true })}` : title, body, open ? "warning" : "success");
        void focusAfter("status");
      } else {
        // Restoring an archived item is good news, not a warning (C2-64).
        showToast(title, body, restored ? "success" : "warning");
        void focusAfter(restored ? "field" : "status");
      }
    } catch (e) {
      if (!(e instanceof ApiError)) throw e;
      if (e.code === "RESOURCE_IN_USE" && confirmTarget.value) {
        blockedBy.value = (e.body.references as ResourceReference[] | undefined) ?? [];
        return;
      }
      confirmTarget.value = null;
      if (isMissingFieldsError(e)) {
        if (options.defaultLanguage.value) activeLanguage.value = options.defaultLanguage.value;
        const found = e.fieldMessages();
        if (activateOpen.value) {
          // The platform's refusal stays inside the confirm dialog, each missing field a link that closes it.
          activationRefusal.value = { fields: found, requestId: e.requestId };
          showErrors("Cannot activate yet", found, e.requestId, false);
        } else {
          showErrors("Cannot activate yet", found, e.requestId);
        }
      } else if (e.code === "VERSION_CONFLICT") {
        conflict.value = { currentVersion: null, requestId: e.requestId };
      } else if (activateOpen.value) {
        // The failure stays inside the dialog, which says "Not activated" and keeps its buttons (C2-10).
        activationFailure.value = e;
      } else {
        showErrorToast(e, `change the status of the ${kind}`, "The status was not changed");
      }
    } finally {
      transitioning.value = false;
    }
  }

  /** Whether the Activate confirm dialog is open, and the platform's refusal it shows when activation was refused. */
  const activateOpen = ref(false);
  const activationRefusal = ref<{ fields: Record<string, string>; requestId: string | null } | null>(null);
  /** A failure of Activate that is not a missing-field refusal (503, 403, offline): shown inside the dialog, not as a toast. */
  const activationFailure = ref<ApiError | null>(null);

  /** Activation always confirms: the dialog names the item, lists what is known, and offers "Save and activate". */
  function requestActivate() {
    if (resource.value?.status !== "DRAFT") return;
    activationRefusal.value = null;
    activationFailure.value = null;
    activateOpen.value = true;
  }

  function closeActivate() {
    activateOpen.value = false;
    activationRefusal.value = null;
    activationFailure.value = null;
  }

  /** Confirms the dialog; `saveFirst` saves a dirty DRAFT before the request, and stops when the save failed. */
  async function confirmActivate(saveFirst: boolean) {
    activationRefusal.value = null;
    if (dirty.value) {
      if (!saveFirst) return;
      await save();
      if (dirty.value || summary.value || conflict.value) {
        activateOpen.value = false;
        return;
      }
    }
    await transition("ACTIVE");
  }

  /** Activation opens its confirm; restore runs at once; deactivation and archival ask first. */
  function requestTransition(target: ResourceStatus) {
    if (target === "ACTIVE") {
      requestActivate();
      return;
    }
    if (dirty.value) {
      showToast("Save first", `Save or undo your changes before changing the ${kind}'s status.`, "warning");
      return;
    }
    if (target === "DRAFT" && resource.value?.status === "ARCHIVED") {
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
  /** The editor page the restore notice was last offered for: once per opening, never again after a save. */
  let draftOfferedFor = "";
  /** Unsaved changes found in storage when the editor opened, waiting for Restore or Discard. */
  const pendingDraft = ref<StoredDraft | null>(null);
  let draftTimer: ReturnType<typeof setTimeout> | null = null;

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
    if (!key || !resource.value || !dirty.value || pendingDraft.value) return;
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
    const first = differingFields(baseState(), stored.state as object)[0];
    pendingDraft.value = null;
    Object.assign(options.formState() as object, JSON.parse(JSON.stringify(stored.state)));
    options.ensureLanguageRows();
    writeDraft();
    // Focus follows the notice that held Restore: the first field that came back (C2-57).
    if (first) void focusField(first);
    else void focusAfter("field");
  }

  /** How many fields the stored changes would put back, for "Restore (2 fields)". */
  const pendingDraftFields = computed(() => {
    const stored = pendingDraft.value;
    if (!stored || !stored.state || typeof stored.state !== "object") return 0;
    return differingFields(baseState(), stored.state as object).length;
  });

  function discardDraft() {
    pendingDraft.value = null;
    clearDraft();
  }

  /** Whether the stored changes started from an older version than the one loaded. */
  const draftOutdated = computed(() =>
    !!pendingDraft.value && !!resource.value && pendingDraft.value.version !== resource.value.version,
  );

  // Every change of the form: kept a moment after typing stops; a form back to its saved state drops it.
  let previousState = "";
  watch(serialize, (now) => {
    clearErrorsOnInput(previousState, now);
    previousState = now;
    // The form already holds what the notice would restore: the notice has nothing left to offer (C3-89).
    if (pendingDraft.value && JSON.stringify(pendingDraft.value.state) === now) discardDraft();
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
      body: `You have unsaved changes to this ${options.kind}. They stay in this browser as a draft: you can restore them when you open it again, but nobody else sees them and visitors never do.`,
      confirmLabel: "Leave without saving",
      cancelLabel: "Keep editing",
    });
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
  /** Ctrl or Cmd+S saves the DRAFT, or the pending changes of an ACTIVE Resource (plan 2.3); the browser's own dialog never opens. */
  function onShortcut(event: KeyboardEvent) {
    if (!(event.ctrlKey || event.metaKey) || event.altKey || event.key.toLowerCase() !== "s") return;
    event.preventDefault();
    if (!editable.value || !dirty.value || saving.value || applying.value || confirmTarget.value || activateOpen.value) return;
    // The Save button is off while offline (it says why); the shortcut says the same instead of failing silently (C2-11).
    if (connection.offline) return void say("You are offline. Your changes are kept in this browser until you are back online.");
    void save();
  }
  onMounted(() => {
    window.addEventListener("beforeunload", onBeforeUnload);
    window.addEventListener("pagehide", onPageHide);
    window.addEventListener("keydown", onShortcut);
  });
  onBeforeUnmount(() => {
    window.removeEventListener("beforeunload", onBeforeUnload);
    window.removeEventListener("pagehide", onPageHide);
    window.removeEventListener("keydown", onShortcut);
    if (dirty.value) writeDraft();
  });

  return reactive({
    kind,
    resource,
    live,
    pendingDraft,
    pendingDraftFields,
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
    describePath,
    focusField,
    readiness,
    loadReadiness,
    reportIssues,
    languages: options.languages,
    defaultLanguage: options.defaultLanguage,
    showErrors,
    focusSummary,
    dismissSummary,
    partialFailure,
    reportPartial,
    describePendingChanges,
    saving,
    lastSavedAt,
    stateLine,
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
    activateOpen,
    activationRefusal,
    activationFailure,
    requestActivate,
    closeActivate,
    confirmActivate,
    loadReferences,
    sessionLost,
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

/** A list item's identity for comparing lists: its `id` when it has one, else its content. */
function itemKey(item: unknown): string {
  return isRecord(item) && typeof item.id === "string" ? `id:${item.id}` : JSON.stringify(item);
}

/** How `next` differs from `base`, as "2 added, 1 removed, 1 changed, reordered". */
function listChange(base: unknown[], next: unknown[]): string {
  const before = new Map(base.map((item) => [itemKey(item), JSON.stringify(item)]));
  const after = new Map(next.map((item) => [itemKey(item), JSON.stringify(item)]));
  const added = [...after.keys()].filter((key) => !before.has(key)).length;
  const removed = [...before.keys()].filter((key) => !after.has(key)).length;
  const changed = [...after].filter(([key, json]) => before.has(key) && before.get(key) !== json).length;
  const shared = [...after.keys()].filter((key) => before.has(key));
  const reordered = shared.join("|") !== [...before.keys()].filter((key) => after.has(key)).join("|");
  const parts = [added && `${added} added`, removed && `${removed} removed`, changed && `${changed} changed`, reordered && "reordered"].filter(Boolean);
  return parts.length ? parts.join(", ") : "no change";
}

/**
 * One line for a conflict on a list (stops, blocks, dates): what each side did to it since the author started, such as
 * "Mine: 1 added, 1 removed. Current: 2 changed." Undefined when the field is not a list on either side.
 */
export function collectionDiff(base: unknown, mine: unknown, current: unknown): string | undefined {
  if (!Array.isArray(mine) && !Array.isArray(current)) return undefined;
  const list = (value: unknown) => (Array.isArray(value) ? value : []);
  return `Mine: ${listChange(list(base), list(mine))}. Current: ${listChange(list(base), list(current))}.`;
}

export type ResourceEditor<T extends EditableResource> = ReturnType<typeof useResourceEditor<T>>;
