import { Archive, Check, PowerOff, RotateCcw } from "lucide-vue-next";
import { computed, nextTick, reactive, ref, shallowRef, type Ref } from "vue";
import { useRouter, type RouteLocationRaw } from "vue-router";
import type { RowAction } from "@/components/list/RowMenu.vue";
import type { ReadinessLine } from "@/components/editor/ReadinessList.vue";
import type { ProjectLanguage } from "@/platform/languages";
import { ApiError } from "@/platform/api";
import type { ResourceStatus } from "@/platform/places";
import type { ResourceReference } from "@/platform/references";
import { focusSuccessor, restoreFocus } from "@/lib/focus";
import { showErrorToast, showToast } from "@/stores/toast";
import { handOffActivationErrors, isMissingFieldsError } from "@/workspace/activationHandoff";
import { referenceLink } from "@/workspace/referenceLinks";

/** What a row needs for a lifecycle change. */
export interface LifecycleRow {
  id: string;
  status: ResourceStatus;
  version: number;
}

export interface LifecycleOptions<T extends LifecycleRow> {
  /** The loaded rows; a changed row replaces its old self. */
  items: Ref<T[]>;
  projectId: Ref<string>;
  /** Lower case, for sentences: "point of interest". */
  noun: string;
  /** The `ResourceReference` type of the kind, for "Used in" links that open this row's own editor. */
  referenceType: string;
  title: (row: T) => string;
  changeStatus: (projectId: string, id: string, target: ResourceStatus, version: number) => Promise<T>;
  fetchReferences: (projectId: string, id: string) => Promise<ResourceReference[]>;
  /** Where the row's editor lives. */
  editorRoute: (row: T) => RouteLocationRaw;
  /** Reloads the list after a version conflict. */
  reload: () => unknown;
  /** Translation completeness of a row, for the client-known lines of the activation confirm. */
  completeness?: (row: T, languageCode: string) => "complete" | "partial" | "missing";
  languages?: Ref<ProjectLanguage[]>;
}

/** The platform's refusal of an activation, shown inside the confirm. */
export interface ActivationRefusal {
  fields: Record<string, string>;
  requestId: string | null;
}

/** "translations.el.title" to "Title (el)", "slug" to "Slug": a readable name for a field path. */
export function describeFieldPath(path: string): string {
  const parts = path.split(".");
  const last = parts[parts.length - 1] ?? path;
  const words = last.replace(/\[\d+\]/g, "").replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase();
  const label = words.charAt(0).toUpperCase() + words.slice(1);
  const lang = parts[0] === "translations" && parts[1] ? parts[1] : null;
  return lang ? `${label} (${lang})` : label;
}

/** A title cut for a heading or a sentence ("Archive Sculpture?"), so a 160-character name never repeats in full. */
export function shortTitle(title: string, max = 60): string {
  return title.length > max ? `${title.slice(0, max - 1).trimEnd()}…` : title;
}

/**
 * The lifecycle actions of a Content list row (plan 2.2): the kebab's Activate / Deactivate / Archive / Restore, the
 * shared activation confirm (`ActivateDialog`: what the list knows, then the platform's refusal inside the dialog with
 * every missing field a link to the editor, never navigating away on its own), the where-used confirm for Deactivate and
 * Archive (`StatusChangeDialog`), toasts, version conflicts and focus back to the row's kebab. Render the dialogs with
 * `LifecycleDialogs`. One instance per list view.
 *
 * Round 2 (D-091): an activation the list already knows will be refused (no text in the default language) opens the
 * "Can't activate X" dialog with a "Review in editor" link instead of the confirm; a warning toast persists until
 * dismissed; Archive leaves an "Archived X. Undo" bar (`undo`, `undoArchive`) and, when the archived row leaves the
 * list, focus goes to the neighbouring row's kebab instead of the page.
 */
export function useListLifecycle<T extends LifecycleRow>(options: LifecycleOptions<T>) {
  const router = useRouter();
  const pendingId = ref<string | null>(null);
  const activating = shallowRef<{ row: T; refusal: ActivationRefusal | null; error: ApiError | null } | null>(null);
  const confirm = shallowRef<{ row: T; target: ResourceStatus; blockedBy?: ResourceReference[] } | null>(null);
  /** The last Archive, while it can still be undone from the bar. */
  const undo = shallowRef<{ id: string; title: string } | null>(null);
  /** Accessible name of the kebab next to the row being changed, taken before it may disappear. */
  let neighbourKebab: string | null = null;

  const actionsFor = (row: T): RowAction[] => {
    const busy = pendingId.value === row.id;
    if (row.status === "ARCHIVED") return [{ key: "restore", label: "Restore", icon: RotateCcw, disabled: busy }];
    return [
      row.status === "DRAFT"
        ? { key: "activate", label: "Activate", icon: Check, disabled: busy }
        : { key: "deactivate", label: "Deactivate", icon: PowerOff, disabled: busy },
      { key: "archive", label: "Archive", icon: Archive, danger: true, disabled: busy },
    ];
  };

  /** Handles a row-menu choice other than the reorder ones (`restore-order` is the view's). */
  function onSelect(row: T, key: string) {
    if (key === "activate") activating.value = { row, refusal: null, error: null };
    else if (key === "deactivate") confirm.value = { row, target: "DRAFT" };
    else if (key === "archive") confirm.value = { row, target: "ARCHIVED" };
    else if (key === "restore") void transition(row, "DRAFT");
  }

  const kebabNamed = (name: string) => [...document.querySelectorAll<HTMLElement>("button[aria-label]")].find((b) => b.getAttribute("aria-label") === name);

  /** The kebab of the row after (else before) this one, for when this row leaves the list. */
  function kebabNextTo(row: T): string | null {
    const own = kebabNamed(`Actions for ${options.title(row)}`);
    const item = own?.closest("[data-row-id]");
    const other = item?.nextElementSibling ?? item?.previousElementSibling;
    return other?.querySelector<HTMLElement>("button[aria-label^='Actions for ']")?.getAttribute("aria-label") ?? null;
  }

  /**
   * The row's kebab takes focus back once its dialog has gone (the menu item that opened it is no longer there). When
   * the row has left the list (Archive from the default segment) the neighbour's kebab takes it; the page frame is the
   * last resort.
   */
  function focusKebab(row: T) {
    void nextTick(() => {
      const button = kebabNamed(`Actions for ${options.title(row)}`) ?? (neighbourKebab ? kebabNamed(neighbourKebab) : undefined);
      neighbourKebab = null;
      restoreFocus(button, "#main");
    });
  }

  function close() {
    const row = activating.value?.row ?? confirm.value?.row;
    activating.value = null;
    confirm.value = null;
    if (row) focusKebab(row);
  }

  async function transition(row: T, target: ResourceStatus) {
    pendingId.value = row.id;
    // Archive and Restore take the row out of the segment in view: the neighbour's kebab is where focus goes (D-103).
    if (target === "ARCHIVED" || row.status === "ARCHIVED") neighbourKebab = kebabNextTo(row);
    const hadDialog = !!(activating.value || confirm.value);
    const title = options.title(row);
    try {
      const updated = await options.changeStatus(options.projectId.value, row.id, target, row.version);
      options.items.value = options.items.value.map((r) => (r.id === updated.id ? updated : r));
      const messages: Record<ResourceStatus, [string, string]> = {
        ACTIVE: ["Activated", `${title} is active. Visitors see it on their next refresh.`],
        DRAFT:
          row.status === "ARCHIVED"
            ? ["Restored", `${title} is a draft again.`]
            : ["Deactivated", `${title} is a draft again and no longer visible to visitors.`],
        ARCHIVED: ["Archived", `${title} is archived. It is hidden from the default list; choose Archived to see it.`],
      };
      const [heading, body] = messages[target];
      showToast(heading, body, target === "ACTIVE" ? "success" : "info");
      undo.value = target === "ARCHIVED" ? { id: row.id, title } : null;
      close();
      // Restore, Deactivate from the menu and Undo have no dialog to hand focus back: the kebab still takes it.
      if (!hadDialog) focusKebab(row);
    } catch (e) {
      if (!(e instanceof ApiError)) throw e;
      if (e.code === "RESOURCE_IN_USE" && confirm.value) {
        confirm.value = { ...confirm.value, blockedBy: (e.body.references as ResourceReference[]) ?? [] };
        return;
      }
      if (isMissingFieldsError(e) && activating.value) {
        // The refusal stays on the list, inside the confirm; every missing field links to the editor (`12` §3, D-036).
        activating.value = { ...activating.value, error: e, refusal: { fields: e.fieldMessages(), requestId: e.requestId } };
        return;
      }
      close();
      if (e.code === "VERSION_CONFLICT") {
        showToast("It changed meanwhile", "The list was reloaded; check it and try again.", "warning", { persist: true });
        void options.reload();
      } else {
        showErrorToast(e, `change the ${options.noun}`, "The change was not saved");
      }
    } finally {
      pendingId.value = null;
    }
  }

  /** Puts the row archived last back to draft (the "Undo" of the bar). */
  async function undoArchive() {
    const pending = undo.value;
    const row = pending && options.items.value.find((r) => r.id === pending.id);
    undo.value = null;
    if (row) await transition(row, "DRAFT");
  }

  /** Closes the Undo bar (its x, or its timer); focus goes to the kebab of the archived row's neighbour, never to the page. */
  function dismissUndo(bar?: HTMLElement | null) {
    const pending = undo.value;
    const neighbour = pending ? kebabNamed(`Actions for ${pending.title}`) : null;
    focusSuccessor(bar, [neighbour, "[data-row-id] button[aria-label^='Actions for ']", "#main"]);
    undo.value = null;
  }

  /** A missing field of the refusal was chosen: the editor opens with every missing field shown and the first focused. */
  function gotoField() {
    const a = activating.value;
    if (!a) return;
    if (a.error) handOffActivationErrors(a.row.id, a.error);
    activating.value = null;
    void router.push(options.editorRoute(a.row));
  }

  /** What the list already knows is missing before the platform is asked: translation completeness per language. */
  const activationLines = computed<ReadinessLine[]>(() => {
    const row = activating.value?.row;
    const completeness = options.completeness;
    if (!row || !completeness) return [];
    return (options.languages?.value ?? []).flatMap((l) => {
      const state = completeness(row, l.languageCode);
      if (state === "complete") return [];
      return [
        {
          key: `translation-${l.languageCode}`,
          blocking: l.isDefault && state === "missing",
          group: "Texts",
          text: `${l.displayName}: ${state === "missing" ? "not translated" : "partly translated"}`,
          path: "",
          languageCode: l.languageCode,
        },
      ];
    });
  });

  /**
   * Set when the list already knows the platform will refuse to activate the row (no text in the default language):
   * the dialog then says so and links to the editor instead of offering a confirm that cannot succeed (C2-35).
   */
  const activationBlock = computed<{ reason: string; to: RouteLocationRaw } | null>(() => {
    const row = activating.value?.row;
    const blocking = activationLines.value.filter((l) => l.blocking);
    if (!row || !blocking.length) return null;
    return {
      reason: `The platform needs texts in the default language first (${blocking.map((l) => l.text).join("; ")}). Open the editor to add them.`,
      to: options.editorRoute(row),
    };
  });

  /** A trigger that opens the row being changed links to its editor's "How visitors reach it" card. */
  const linkFor = (r: ResourceReference): RouteLocationRaw | null =>
    referenceLink(options.projectId.value, r, confirm.value && { resourceType: options.referenceType, resourceId: confirm.value.row.id });

  // Reactive, so a template reads `lifecycle.activating` without `.value`.
  return reactive({
    noun: options.noun,
    name: (row: T) => options.title(row),
    loadReferences: (id: string) => options.fetchReferences(options.projectId.value, id),
    pendingId,
    activating,
    confirm,
    actionsFor,
    onSelect,
    transition,
    close,
    gotoField,
    activationLines,
    activationBlock,
    linkFor,
    undo,
    undoArchive,
    dismissUndo,
  }) as unknown as ListLifecycle<T>;
}

/** What {@link useListLifecycle} returns (refs unwrapped): the state and actions `LifecycleDialogs` and the row menu use. */
export interface ListLifecycle<T extends LifecycleRow> {
  noun: string;
  name: (row: T) => string;
  loadReferences: (id: string) => Promise<ResourceReference[]>;
  pendingId: string | null;
  activating: { row: T; refusal: ActivationRefusal | null; error: ApiError | null } | null;
  confirm: { row: T; target: ResourceStatus; blockedBy?: ResourceReference[] } | null;
  /** The kebab entries of a row: Activate or Deactivate, Archive, or Restore. */
  actionsFor: (row: T) => RowAction[];
  /** Call for every kebab choice except `restore-order`. */
  onSelect: (row: T, key: string) => void;
  transition: (row: T, target: ResourceStatus) => Promise<void>;
  close: () => void;
  gotoField: () => void;
  activationLines: ReadinessLine[];
  /** Why activation cannot work yet, with the editor link; null when the platform should be asked. */
  activationBlock: { reason: string; to: RouteLocationRaw } | null;
  /** The last Archive that can still be undone, for the bar `LifecycleDialogs` shows. */
  undo: { id: string; title: string } | null;
  undoArchive: () => Promise<void>;
  /** Closes the Undo bar, moving focus on when it was inside the bar. */
  dismissUndo: (bar?: HTMLElement | null) => void;
  linkFor: (reference: ResourceReference) => RouteLocationRaw | null;
}
