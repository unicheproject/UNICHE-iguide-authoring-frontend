<script lang="ts">
import type { ComputedRef, InjectionKey, Ref } from "vue";

/**
 * Provided by `EditorShell`: whether structural controls (reorder, add, remove of blocks, stops, occurrences) may be
 * shown now. It is true in the default language, and in other languages only when the shell's `structuralInNonDefault`
 * is set. Editors read it with `inject(EDITOR_STRUCTURAL, ref(true))`.
 */
export const EDITOR_STRUCTURAL: InjectionKey<ComputedRef<boolean>> = Symbol("editor-structural");

/** What the shell offers `TranslationsPanel` for the "Next missing: Italiano" button beside the tabs (every width). */
export interface EditorNextMissing {
  label: string;
  go: () => void;
}
/** Provided by `EditorShell`; `null` while every language is complete. */
export const EDITOR_NEXT_MISSING: InjectionKey<ComputedRef<EditorNextMissing | null>> = Symbol("editor-next-missing");

/** Provided by `EditorShell`: whether the Resource is ACTIVE (its Title hint then says "Required in the default language."). */
export const EDITOR_ACTIVE: InjectionKey<ComputedRef<boolean>> = Symbol("editor-active");

/**
 * What the shell provides to the inline "Preview in app" panel (contract W0-B to P8, D-113): whether the panel is open
 * and expanded, and how to expand or close it. The shell no longer draws Expand or Close itself; `PreviewPanel` renders
 * them in its own header. `close` returns focus to the action that opened the panel.
 */
export interface EditorPreview {
  open: Ref<boolean>;
  expanded: Ref<boolean>;
  toggleExpand: () => void;
  close: () => void;
}
/** Injection key for {@link EditorPreview}; `inject(EDITOR_PREVIEW)` inside `PreviewPanel`. */
export const EDITOR_PREVIEW: InjectionKey<EditorPreview> = Symbol("editor-preview");
</script>

<script setup lang="ts" generic="T extends EditableResource">
/**
 * Page frame of every Resource editor (plan 2.3, D-074, D-075, D-089): breadcrumb; a sticky one-line header (56 px: title,
 * status, state line, readiness count, Save or Apply changes, More actions) with the Working Copy banner (one line, 40 px)
 * under it for ACTIVE Resources, sticky only when the viewport is at least 800 px tall (zoom shrinks the CSS height, so
 * it is not sticky at 150 % and more). The height of whatever is stuck is measured and published as `--sticky-stack-h`
 * on `<html>` (`useStickyStack`); the side column, the rail and `scroll-padding-top` of `<main>` read it. The readiness
 * count in the header, the side card, the Activate confirm, the toast and the language tab marks all come from
 * `platform/completeness.ts` (D-090); the form column (the default slot, sections wrapped in `EditorSection`) beside a sticky side
 * column from 1180 px (Status, "Preview in app", readiness, "On this page", Translations, Used in), or a single column
 * with a summary row below it; the inline Preview panel; and the Activate, status-change and conflict dialogs. Props and
 * slots keep the contract of plan 6.2: `editor`, `backLabel`, `backTo`, `title`, `subtitle`, `activationHint`,
 * `referenceLink`, `pending`, `tabbed`, `preview`, `translations`, plus `sections` and `structuralInNonDefault`; slots
 * `default`, `aside` (extra side cards) and `header-extra` (extra header controls).
 */
import { ChevronDown, Eye, EyeOff, MoreHorizontal, Archive, PowerOff, RotateCcw, ListChecks, Check, CircleDashed, CircleDot, TriangleAlert, CircleAlert, RotateCw, Save } from "lucide-vue-next";
import { computed, nextTick, onBeforeUnmount, onMounted, provide, reactive, ref, watch } from "vue";
import { useRoute, type RouteLocationRaw } from "vue-router";
import ActivateDialog from "@/components/editor/ActivateDialog.vue";
import ConflictDialog from "@/components/editor/ConflictDialog.vue";
import { EDITOR_SECTIONS, type EditorSectionInfo } from "@/components/editor/EditorSection.vue";
import EditorSectionNav from "@/components/editor/EditorSectionNav.vue";
import EditorStatusCard from "@/components/editor/EditorStatusCard.vue";
import PreviewPanel from "@/components/editor/PreviewPanel.vue";
import SideCard from "@/components/editor/SideCard.vue";
import ReadinessList, { readinessLines, type ReadinessLine } from "@/components/editor/ReadinessList.vue";
import WorkingCopyBanner from "@/components/editor/WorkingCopyBanner.vue";
import AppBreadcrumbs, { type Crumb } from "@/components/AppBreadcrumbs.vue";
import PageFrame from "@/components/PageFrame.vue";
import StatusChangeDialog from "@/components/StatusChangeDialog.vue";
import StatusChip from "@/components/StatusChip.vue";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import FormErrorSummary from "@/components/ui/field/FormErrorSummary.vue";
import { StateCard } from "@/components/ui/state-card";
import { Tooltip } from "@/components/ui/tooltip";
import { say } from "@/lib/announcer";
import { formatDateTime } from "@/lib/format";
import { problemText } from "@/lib/problemText";
import { login, session } from "@/platform/auth";
import { completenessOf, countIssues, coveredByModel, EDITOR_COMPLETENESS, issueSentence, structureOf, withGaps, type Completeness, type CompletenessLine } from "@/platform/completeness";
import type { ProjectLanguage } from "@/platform/languages";
import { connection } from "@/stores/connection";
import type { ResourceReference } from "@/platform/references";
import { referenceKindLabel } from "@/workspace/referenceLinks";
import { withListBack } from "@/workspace/listBack";
import type { PreviewModel } from "@/workspace/preview";
import { useStickyStack } from "@/workspace/useStickyStack";
import type { LanguageStatus } from "@/workspace/translationStatus";
import { FOCUS_FIRST_EMPTY_EVENT, type EditableResource, type FocusFirstEmptyDetail, type ResourceEditor } from "@/workspace/useResourceEditor";

const props = defineProps<{
  editor: ResourceEditor<T>;
  backLabel: string;
  backTo: RouteLocationRaw;
  title: string;
  /** "Point of interest · slug": the part before the first " · " names the kind in the Status card. */
  subtitle: string;
  /** What a draft still needs before it can be activated, shown in the Status card. */
  activationHint: string;
  referenceLink?: (reference: ResourceReference) => RouteLocationRaw | null;
  /** Something else the page needs is still loading, such as the Project's languages. */
  pending?: boolean;
  /** The form opens with the language tabs of `TranslationsPanel` (kept for the editors that pass it; the layout no longer needs it). */
  tabbed?: boolean;
  /** The Resource as visitors would see it, from the live form; offers "Preview in app" when given. */
  preview?: PreviewModel | null;
  /** Per enabled language, how many of the kind's translated fields hold text; shown in the Translations card. */
  translations?: LanguageStatus[];
  /**
   * The completeness of the live form (`completenessOf`), when the editor can count more than `translations` and the
   * saved Resource tell (Route stop texts typed but not saved yet). Without it the shell builds the model itself.
   */
  completeness?: Completeness;
  /** Sections for the "On this page" rail; sections wrapped in `EditorSection` register themselves as well. */
  sections?: EditorSectionInfo[];
  /** Structural controls stay available in every language tab (default: only in the default language). */
  structuralInNonDefault?: boolean;
  /** Replaces the sentence of the compact "Restore draft" row. */
  restoreNotice?: string;
  /** Replaces the "Next missing: Italiano" label. */
  nextMissingLabel?: string;
}>();

defineSlots<{
  default?: () => unknown;
  aside?: () => unknown;
  "header-extra"?: () => unknown;
}>();

const editor = computed(() => props.editor);
const kind = computed(() => props.editor.kind);
const kindLabel = computed(() => props.subtitle.split(" · ")[0] || kind.value);
const heading = computed(() => props.title || kind.value);

// Layout ------------------------------------------------------------------------------------------------------

const wideQuery = typeof window !== "undefined" ? window.matchMedia("(min-width: 1180px)") : null;
const wide = ref(wideQuery?.matches ?? true);
const onWide = (e: MediaQueryListEvent) => (wide.value = e.matches);
const summaryOpen = ref(false);

const header = ref<HTMLElement | null>(null);
const bannerBar = ref<HTMLElement | null>(null);
const sentinel = ref<HTMLElement | null>(null);
const isStuck = ref(false);
let stickObserver: IntersectionObserver | null = null;

// The bars that are stuck right now (the banner only on tall viewports) set `--sticky-stack-h` on <html> (D-089).
useStickyStack([header, bannerBar]);

watch(header, (el) => {
  stickObserver?.disconnect();
  if (!el || !sentinel.value) return;
  stickObserver = new IntersectionObserver(([entry]) => (isStuck.value = !entry.isIntersecting && entry.boundingClientRect.top < 0));
  stickObserver.observe(sentinel.value);
});
onMounted(() => wideQuery?.addEventListener("change", onWide));
onBeforeUnmount(() => {
  wideQuery?.removeEventListener("change", onWide);
  stickObserver?.disconnect();
});

// Sections ----------------------------------------------------------------------------------------------------

const registered = reactive(new Map<string, EditorSectionInfo>());
provide(EDITOR_SECTIONS, {
  set: (info) => registered.set(info.id, info),
  remove: (id) => registered.delete(id),
});
const railSections = computed(() => {
  const merged = new Map<string, EditorSectionInfo>();
  for (const s of props.sections ?? []) merged.set(s.id, s);
  for (const s of registered.values()) merged.set(s.id, { ...merged.get(s.id), ...s });
  return [...merged.values()].sort((a, b) => {
    const x = document.getElementById(a.id);
    const y = document.getElementById(b.id);
    return x && y ? (x.compareDocumentPosition(y) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1) : 0;
  });
});

const defaultLanguageCode = computed(() => props.translations?.find((s) => s.language.isDefault)?.language.languageCode ?? null);
provide(
  EDITOR_STRUCTURAL,
  computed(() => !!props.structuralInNonDefault || !defaultLanguageCode.value || editor.value.activeLanguage === defaultLanguageCode.value),
);

// Breadcrumb, status sentence, labels ---------------------------------------------------------------------------

const route = useRoute();
/** The list the author came from, with its worklist (`lang`, `missing`, search, sort, page) put back (C3-51). */
const listTo = computed(() => withListBack(props.backTo, route));
const crumbs = computed<Crumb[]>(() =>
  props.editor.resource ? [{ label: props.backLabel, to: listTo.value }, { label: props.title }] : [{ label: props.backLabel, to: listTo.value }],
);

const statusSentence = computed(() => {
  switch (editor.value.resource?.status) {
    case "DRAFT":
      return `Only authors see it. ${props.activationHint}`;
    case "ACTIVE":
      return editor.value.workingCopy
        ? "Visitors see the live version. Your pending changes reach them only when you apply them."
        : "Visible to visitors while the application is live.";
    default:
      return "Hidden from visitors and from the default lists.";
  }
});

const slug = computed(() => {
  const value = (editor.value.resource as { slug?: unknown } | null)?.slug;
  return typeof value === "string" && value ? value : null;
});

/** The last editor of the copy; a name needs the Audit Events of backend Milestone 7 (backend G-034). */
const copyAuthor = computed(() => {
  const copy = editor.value.workingCopy;
  if (!copy) return "";
  return copy.updatedBySubject === session.user?.subject ? "you" : "another author";
});

function languageName(code: string): string {
  return props.translations?.find((s) => s.language.languageCode === code)?.language.displayName ?? code;
}

// Used in -----------------------------------------------------------------------------------------------------

const usedIn = ref<ResourceReference[] | null>(null);
watch(
  () => [editor.value.resource?.id, editor.value.resource?.version, editor.value.resource?.status, editor.value.loadReferences] as const,
  async ([id], _old, onCleanup) => {
    let stale = false;
    onCleanup(() => (stale = true));
    const load = editor.value.loadReferences;
    if (!id || !load) {
      usedIn.value = null;
      return;
    }
    try {
      // The item's own triggers (QR code, geo fence, NFC tag) are ways in, not users: the Triggers card lists them (C3-19).
      const found = (await load()).filter((r) => r.resourceType !== "TRIGGER");
      if (!stale) usedIn.value = found;
    } catch {
      if (!stale) usedIn.value = null;
    }
  },
  { immediate: true },
);
/** The card lists this many rows, then "Show all N". */
const USED_IN_LIMIT = 5;
const usedInAll = ref(false);
const shownUsedIn = computed(() => (usedInAll.value ? (usedIn.value ?? []) : (usedIn.value ?? []).slice(0, USED_IN_LIMIT)));
const PLURAL: Record<string, string> = {
  ROUTE: "routes", POI: "points of interest", PLACE: "places", GUIDE: "guides", EVENT: "events", CATEGORY: "categories",
  MAP: "maps", FLOOR_PLAN: "floor plans", ASSET: "media items", NAVIGATION: "menu items", PAGE: "pages", THEME: "themes",
};
const SINGULAR: Record<string, string> = {
  ROUTE: "route", POI: "point of interest", PLACE: "place", GUIDE: "guide", EVENT: "event", CATEGORY: "category",
  MAP: "map", FLOOR_PLAN: "floor plan", ASSET: "media item", NAVIGATION: "menu item", PAGE: "page", THEME: "theme",
};
/**
 * Deactivate and Archive are refused while an ACTIVE item uses this one; the reason shows up front as a full sentence
 * (plan 2.3, D-090): "Used by 1 route. Choose another category in that route first." The Resource's own triggers are
 * never users (C2-59): the platform lists them as references, but they go with the item.
 */
const blockedReason = computed(() => {
  // The platform also refuses to deactivate or archive a Category that DRAFT items use, so a Category counts every live user.
  const counts = (r: ResourceReference) => (kind.value === "category" ? r.status !== "ARCHIVED" : r.status === "ACTIVE") && r.resourceType !== "TRIGGER";
  const users = (usedIn.value ?? []).filter(counts);
  if (!users.length) return undefined;
  const byKind = new Map<string, number>();
  for (const r of users) byKind.set(r.resourceType, (byKind.get(r.resourceType) ?? 0) + 1);
  const used = [...byKind].map(([type, n]) => `${n} ${n === 1 ? (SINGULAR[type] ?? referenceKindLabel(type).toLowerCase()) : (PLURAL[type] ?? `${referenceKindLabel(type).toLowerCase()} items`)}`);
  const list = used.length > 1 ? `${used.slice(0, -1).join(", ")} and ${used[used.length - 1]}` : used[0];
  const one = users.length === 1;
  const where = one && byKind.size === 1 ? `that ${SINGULAR[users[0].resourceType] ?? "item"}` : "each of them";
  const fix = kind.value === "category" ? `Choose another category in ${where} first.` : `Remove it from ${where} first.`;
  return `Used by ${list}. ${fix}`;
});
const noLink = () => null;

// Readiness ---------------------------------------------------------------------------------------------------

/** The languages the model counts: the Project's enabled languages, else those the editor's rows name. */
const modelLanguages = computed<ProjectLanguage[]>(() => (editor.value.languages?.length ? editor.value.languages : (props.translations ?? []).map((s) => s.language)));

/** The one completeness model (D-090): the editor's own, or built from its counted texts and the saved Resource. */
const completeness = computed<Completeness>(() => {
  const { slots, gaps } = structureOf(editor.value.resource);
  const model =
    props.completeness ??
    completenessOf({
      languages: modelLanguages.value,
      base: props.translations?.map((s) => ({ languageCode: s.language.languageCode, filled: s.filled, total: s.total })),
      slots,
      gaps,
    });
  // Gaps of the saved shape (a Route with no stops, an Event with no dates) the editor's own model may not carry (D-107).
  // An editor that passes its own live model already carries its gaps (they follow unsaved edits); the saved shape must not add them back.
  return props.completeness ? model : withGaps(model, gaps, defaultLanguageCode.value);
});
provide(EDITOR_COMPLETENESS, completeness);
provide(
  EDITOR_ACTIVE,
  computed(() => editor.value.resource?.status === "ACTIVE"),
);

/**
 * The one readiness list (D-107, C3-14): the completeness model's lines, with the platform's items merged in by code and
 * path once the Resource is ACTIVE. An item the model already counts (a translation, accessibility information, an
 * image's alternative text) is dropped, so one problem is one line before and after activation and the confirm, the
 * toast, the card and the header all say the same number.
 */
const lines = computed<ReadinessLine[]>(() => {
  const own = completeness.value.lines;
  if (editor.value.resource?.status !== "ACTIVE") return own;
  const items = editor.value.readiness.filter((i) => !coveredByModel(i, completeness.value));
  const serverDefault = items.some((i) => i.code === "MISSING_DEFAULT_LANGUAGE_VALUE");
  const serverStory = items.some((i) => i.path.startsWith("blocks"));
  const serverStop = items.some((i) => i.code === "ROUTE_WITHOUT_ACTIVE_STOP");
  const serverFewStops = items.some((i) => i.code === "ROUTE_FEW_STOPS");
  const kept: CompletenessLine[] = own.filter(
    (l) =>
      !(serverDefault && l.key.startsWith("base-")) &&
      !(serverStory && l.key === "gap-story") &&
      !(serverFewStops && l.key === "gap-stops") &&
      !(serverStop && l.key === "block-active-stop"),
  );
  return [...kept, ...readinessLines(items, languageName)];
});
const issueCounts = computed(() => countIssues(lines.value));
const isActive = computed(() => editor.value.resource?.status === "ACTIVE");
/** A DRAFT: the platform cannot answer readiness for it yet (G-044), so the card adds "plus checks run on activation" (D-107). */
const isDraft = computed(() => editor.value.resource?.status === "DRAFT");
/** The same sentence in the header, the side card, the confirm and the toast (D-090). */
const sentence = computed(() => issueSentence(issueCounts.value, { active: isActive.value }));
const clientLines = lines;
const readinessHeading = computed(() => (editor.value.resource?.status === "ACTIVE" ? "What needs attention" : "Before you activate"));
const readinessEmpty = computed(() =>
  editor.value.resource?.status === "ACTIVE"
    ? `Nothing: visitors see a complete ${kind.value}.`
    : "Nothing is known to be missing. The platform checks everything when you activate.",
);
const badge = computed(() => {
  if (editor.value.resource?.status === "ARCHIVED") return null;
  const { blockers, warnings } = issueCounts.value;
  if (blockers) return { text: sentence.value, tone: "text-destructive", icon: CircleAlert };
  if (warnings) return { text: sentence.value, tone: "text-warning", icon: TriangleAlert };
  return null;
});
// The toast stack measures `#editor-side-column` itself (`lib/toastOffset.ts`); the shell publishes nothing for it.
const sideColumn = ref<HTMLElement | null>(null);
/** The side column scrolls on its own (max-height = viewport minus the stuck bars); a fade at its foot says there is more below. */
const sideMore = ref(false);
/** The column is scrolled down: a fade at its top edge says there is more above (D-109). */
const sideLess = ref(false);
const sideClass = computed(() => (sideMore.value && sideLess.value ? "side-fade-both" : sideMore.value ? "side-fade-bottom" : sideLess.value ? "side-fade-top" : ""));
function updateSideMore() {
  const side = sideColumn.value;
  sideMore.value = !!side && side.scrollHeight - side.scrollTop - side.clientHeight > 4;
  sideLess.value = !!side && side.scrollTop > 4;
}
let sideObserver: ResizeObserver | null = null;
watch(sideColumn, (el) => {
  sideObserver?.disconnect();
  sideObserver = null;
  if (el && typeof ResizeObserver !== "undefined") {
    sideObserver = new ResizeObserver(() => updateSideMore());
    sideObserver.observe(el);
  }
});
onBeforeUnmount(() => sideObserver?.disconnect());
onMounted(() => editor.value.reportIssues(() => issueCounts.value));
onBeforeUnmount(() => editor.value.reportIssues(null));

/** Activate stays off while a Media blocker is open ("Add alt text in English first"), unless unsaved edits may fix it. */
const activateBlockedReason = computed(() => {
  if (editor.value.resource?.status !== "DRAFT" || editor.value.dirty) return undefined;
  const media = completeness.value.blockers.find((l) => l.group === "Media");
  return media ? `Add alt text in ${languageName(media.languageCode ?? "")} first` : undefined;
});

/** Moves to a readiness line: a field (or Resource) it names, or just the language tab for a translation line. */
function goToLine(line: ReadinessLine) {
  if (line.path) void editor.value.focusField(line.path, line.languageCode);
  else if (line.languageCode) {
    editor.value.activeLanguage = line.languageCode;
    void nextTick(() => document.getElementById(`tab-${line.languageCode}`)?.focus());
  }
}

/** "Show where it is used" (a blocked Deactivate or Archive): opens the summary on narrow layouts, then focuses the "Used in" card. */
async function focusUsedIn() {
  if (!wide.value) summaryOpen.value = true;
  await nextTick();
  const heading = document.getElementById("used-in-heading");
  heading?.scrollIntoView({ block: "center" });
  heading?.focus();
}

/** The header's readiness badge: opens the summary on narrow layouts, then focuses the readiness heading. */
async function focusReadiness() {
  if (!wide.value) summaryOpen.value = true;
  await nextTick();
  const heading = document.getElementById("readiness-heading");
  heading?.setAttribute("tabindex", "-1");
  heading?.scrollIntoView({ block: "center" });
  heading?.focus();
}

// Preview -----------------------------------------------------------------------------------------------------

const previewOpen = ref(false);
const previewExpanded = ref(false);
provide(EDITOR_PREVIEW, {
  open: previewOpen,
  expanded: previewExpanded,
  toggleExpand: () => (previewExpanded.value = !previewExpanded.value),
  close: () => closePreview(),
});
function closePreview() {
  const wasOpen = previewOpen.value;
  previewOpen.value = false;
  previewExpanded.value = false;
  if (wasOpen) void nextTick(() => document.querySelector<HTMLElement>("[data-preview-action]")?.focus());
}
watch(
  () => editor.value.resource?.id,
  () => closePreview(),
);

// Translations card -------------------------------------------------------------------------------------------

const MARKS = {
  complete: { icon: Check, tone: "text-success" },
  missing: { icon: CircleDashed, tone: "text-muted-foreground" },
  partial: { icon: CircleDot, tone: "text-ink-2" },
} as const;
function progress(s: LanguageStatus) {
  const row = completeness.value.perLanguage.find((l) => l.language.languageCode === s.language.languageCode);
  const state = row?.state ?? (s.filled >= s.total ? "complete" : s.filled === 0 ? "missing" : "partial");
  return { ...MARKS[state], text: row?.mark ?? (state === "complete" ? "Complete" : state === "missing" ? "Missing" : `${s.filled} of ${s.total}`) };
}
/** The language to go to next: the one being edited while it still has gaps, then the following ones. */
const nextMissing = computed(() => {
  const rows = completeness.value.perLanguage;
  if (!rows.length) return null;
  const at = rows.findIndex((s) => s.language.languageCode === editor.value.activeLanguage);
  for (let i = 0; i <= rows.length; i++) {
    const s = rows[(Math.max(at, 0) + i) % rows.length];
    if (s.state !== "complete") return s;
  }
  return null;
});
/** "Next missing: Italiano": names where the button goes (C2-50). */
const nextMissingText = computed(() => props.nextMissingLabel ?? (nextMissing.value ? `Next missing: ${nextMissing.value.language.displayName}` : ""));
provide(
  EDITOR_NEXT_MISSING,
  computed(() => (nextMissing.value ? { label: nextMissingText.value, go: () => void goToNextMissing() } : null)),
);
/**
 * "Next missing" (C3-17): finishes the language being edited first, then moves on. In each language it asks the Texts
 * panel for the first empty field (opening "Practical details" or "Other settings" when the field is inside), falls
 * back to the first readiness line of that language that names a field (a stop text, alternative text), and goes to
 * the next language when there is nothing to focus. A filled Title is never the target.
 */
async function goToNextMissing() {
  const rows = completeness.value.perLanguage;
  const first = nextMissing.value;
  if (!first) return;
  const start = rows.findIndex((r) => r.language.languageCode === first.language.languageCode);
  for (let i = 0; i < rows.length; i++) {
    const row = rows[(start + i) % rows.length];
    if (row.state === "complete") continue;
    const code = row.language.languageCode;
    say(`${row.language.displayName}: moving to the first missing text.`);
    if (editor.value.activeLanguage !== code) {
      editor.value.activeLanguage = code;
      await nextTick();
    }
    const detail: FocusFirstEmptyDetail = { language: code, handled: false };
    window.dispatchEvent(new CustomEvent(FOCUS_FIRST_EMPTY_EVENT, { detail }));
    if (detail.handled) return;
    const line = completeness.value.lines.find((l) => l.languageCode === code && l.path);
    if (line) return void editor.value.focusField(line.path, code);
  }
  say("Nothing is missing in any language.");
}

// Header action -----------------------------------------------------------------------------------------------

/**
 * The header's one primary action (D-095, D-108). A DRAFT: Save (primary while there is something to save). An ACTIVE
 * item with a Working Copy: the header carries Apply only: "Apply changes" (off with its reason while nothing is
 * pending), or "Save and apply" once the form is dirty, after a confirm that lists the changes. Save draft and
 * Discard live in the Working Copy banner (`12` §3); the header shows one compact Save draft (`headerSave`) only
 * while the banner is out of sight, so there is never a second one.
 */
const primary = computed(() => {
  const e = editor.value;
  const busy = e.saving || e.applying;
  const offline = connection.offline ? "You are offline" : undefined;
  if (e.usesWorkingCopy) {
    const reason = offline ?? (busy ? "Working…" : undefined);
    if (e.dirty) {
      return { label: e.applying ? "Applying…" : "Save and apply", variant: "primary" as const, reason, loading: e.applying, tip: "Save the changes and make them live (Ctrl+S saves a draft)", run: () => e.applyChanges(props.title) };
    }
    const none = !e.workingCopy ? "Nothing to apply: there are no pending changes" : undefined;
    return { label: e.applying ? "Applying…" : "Apply changes", variant: "primary" as const, reason: reason ?? none, loading: e.applying, tip: "Make the pending changes live", run: () => e.applyChanges(props.title) };
  }
  if (e.resource?.status === "DRAFT" && e.editable) {
    const reason = offline ?? (e.saving ? "Saving…" : !e.dirty ? "No unsaved changes to save" : undefined);
    return { label: e.saving ? "Saving…" : "Save", variant: e.dirty ? ("primary" as const) : ("secondary" as const), reason, loading: e.saving, tip: "Save (Ctrl+S)", run: () => e.save() };
  }
  return null;
});

/** Announces why a blocked primary action does nothing (the button is `aria-disabled`, so its click is swallowed; C3-86). */
function announceBlocked() {
  const reason = primary.value?.reason;
  if (reason) say(reason.endsWith("…") || reason.endsWith(".") ? reason : `${reason}.`);
}

// The Working Copy banner holds Save draft while it is in sight; the header takes over once it is not (D-108, C3-23, C3-24).
const bannerVisible = ref(true);
let scrollFrame = 0;
function measureBanner() {
  scrollFrame = 0;
  const bar = bannerBar.value;
  const head = header.value;
  if (!bar || !head) return void (bannerVisible.value = true);
  if (getComputedStyle(bar).position === "sticky") return void (bannerVisible.value = true);
  const covered = getComputedStyle(head).position === "sticky" ? head.getBoundingClientRect().bottom : 0;
  bannerVisible.value = bar.getBoundingClientRect().bottom > covered + 4;
}
function queueMeasureBanner() {
  if (!scrollFrame) scrollFrame = requestAnimationFrame(measureBanner);
}
let scroller: HTMLElement | null = null;
watch([bannerBar, header], () => {
  scroller?.removeEventListener("scroll", queueMeasureBanner);
  scroller = document.getElementById("main");
  scroller?.addEventListener("scroll", queueMeasureBanner, { passive: true });
  window.addEventListener("resize", queueMeasureBanner);
  queueMeasureBanner();
}, { flush: "post" });
onBeforeUnmount(() => {
  scroller?.removeEventListener("scroll", queueMeasureBanner);
  window.removeEventListener("resize", queueMeasureBanner);
  if (scrollFrame) cancelAnimationFrame(scrollFrame);
});

/** The compact Save draft of the header: only for a Working Copy whose banner is out of sight. */
const headerSave = computed(() => {
  const e = editor.value;
  if (!e.usesWorkingCopy || bannerVisible.value) return null;
  const reason = connection.offline ? "You are offline" : e.saving || e.applying ? "Working…" : !e.dirty ? "Nothing to save: no edits since the last save" : undefined;
  return { reason, loading: e.saving, run: () => e.save() };
});
/** The header's Save draft goes away when the banner comes back into view: focus moves to the banner's Save draft, not to the page. */
watch(
  headerSave,
  async (now, was) => {
    if (now || !was || !document.activeElement?.matches("[data-header-save]")) return;
    await nextTick();
    document.querySelector<HTMLElement>("[data-banner-save]")?.focus();
  },
  { flush: "sync" },
);

const confirmCopy = computed(() => {
  const discardNote = editor.value.workingCopy ? " Its pending changes are discarded." : "";
  return editor.value.confirmTarget === "ARCHIVED"
    ? {
        heading: `Archive ${props.title}?`,
        body: `An archived ${kind.value} leaves the visitor app and the default lists. Restoring it makes it a draft again.${discardNote}`,
        action: "Archive",
      }
    : {
        heading: `Deactivate ${props.title}?`,
        body: `Visitors stop seeing it on their next refresh. It becomes a draft you can edit.${discardNote}`,
        action: "Deactivate",
      };
});

const summaryItems = computed(() => {
  const found = editor.value.summary;
  if (!found) return null;
  const n = found.items.length;
  return found.title === "Check the highlighted fields" && n ? { ...found, title: `${n} ${n === 1 ? "thing" : "things"} to fix` } : found;
});

/** From the activation dialog: close it, then move to the field the platform named. */
/** "Review in editor": closes the confirm and goes to the first open line, blockers first. */
function reviewFromDialog() {
  const first = [...lines.value].sort((a, b) => Number(b.blocking) - Number(a.blocking))[0];
  editor.value.closeActivate();
  if (first) void afterDialog(() => goToLine(first));
}

function gotoFromDialog(path: string) {
  editor.value.closeActivate();
  void afterDialog(() => editor.value.focusField(path));
}

/** A readiness line of the Activate confirm: closes it, opens the line's section and focuses its field (C3-15). */
function goLineFromDialog(line: ReadinessLine) {
  editor.value.closeActivate();
  void afterDialog(() => goToLine(line));
}

/** Runs `then` once the dialog has closed and its own focus return has run, so the focus it sets stays. */
async function afterDialog(then: () => unknown) {
  await nextTick();
  await new Promise((resolve) => setTimeout(resolve, 80));
  await then();
}
</script>

<template>
  <PageFrame :busy="editor.loading || pending">
    <div class="editor-shell" style="--editor-sticky-h: var(--sticky-stack-h, 3.5rem)">
      <AppBreadcrumbs :items="crumbs" />

      <div v-if="editor.loading || pending" class="animate-skeleton mt-4" role="status" aria-busy="true" :aria-label="`Loading ${kind}`">
        <div class="mb-6 flex flex-col gap-3">
          <div class="h-6 w-1/2 max-w-sm rounded-md bg-muted"></div>
          <div class="h-4 w-2/3 max-w-lg rounded bg-muted"></div>
        </div>
        <div class="h-64 rounded-lg border bg-card"></div>
      </div>

      <StateCard
        v-else-if="editor.loadError || !editor.resource"
        class="mt-6"
        :title="
          editor.loadError?.status === 404
            ? `This ${kind} does not exist in the Project`
            : editor.loadError
              ? problemText(editor.loadError.status, editor.loadError.code, `load the ${kind}`).title
              : `The ${kind} could not be loaded`
        "
        :request-id="editor.loadError?.requestId"
      >
        <template v-if="editor.loadError && editor.loadError.status !== 404">{{ problemText(editor.loadError.status, editor.loadError.code, `load the ${kind}`).body }}</template>
        <template v-else>It may have been removed, or the link is out of date.</template>
        <template #actions>
          <Button v-if="editor.loadError?.status !== 404" variant="secondary" @click="editor.load()"><RotateCw aria-hidden="true" />Try again</Button>
          <Button as-child variant="secondary"><RouterLink :to="listTo">Back to {{ backLabel }}</RouterLink></Button>
        </template>
      </StateCard>

      <template v-else>
        <div ref="sentinel" aria-hidden="true" class="h-px"></div>
        <!-- Sticky one-line header (from 700 px of viewport height; below it nothing but the app header sticks, D-108), then the
             one-line Working Copy banner (sticky only on very tall viewports). Their measured height is `--sticky-stack-h`. -->
        <div
          ref="header"
          data-sticky-bar
          class="editor-header z-sticky -mx-[var(--gutter)] flex min-h-12 items-center gap-x-3 border-b border-border bg-card px-[var(--gutter)] py-1 transition-shadow"
          :class="isStuck ? 'shadow-2' : ''"
        >
          <div class="flex min-w-0 flex-1 items-center gap-x-3">
            <h1 tabindex="-1" class="min-w-0 break-words text-lg font-bold line-clamp-2 [@media(min-height:700px)]:line-clamp-1" :title="title" dir="auto">{{ heading }}</h1>
            <StatusChip class="max-sm:hidden" :status="editor.resource.status" />
            <StatusChip v-if="editor.workingCopy" class="max-md:hidden" status="PENDING" label="Pending changes" />
          </div>
          <div class="flex shrink-0 items-center gap-x-3">
            <span class="max-w-64 truncate text-sm" :class="editor.sessionLost ? 'font-semibold text-destructive' : 'text-muted-foreground'" :title="editor.stateLine" role="status" aria-live="polite" :data-session-lost="editor.sessionLost ? '' : undefined"><span :class="editor.sessionLost ? '' : 'max-xl:sr-only'">{{ editor.stateLine }}</span></span>
            <Button v-if="editor.sessionLost" variant="secondary" size="sm" data-sign-in-again @click="login()">Sign in again</Button>
            <button
              v-if="badge"
              type="button"
              class="inline-flex min-h-control items-center gap-1.5 whitespace-nowrap rounded-md px-2 text-sm font-semibold hover:bg-surface-hover max-xl:hidden"
              :class="badge.tone"
              data-issue-badge
              @click="focusReadiness"
            >
              <component :is="badge.icon" class="size-4" aria-hidden="true" />{{ badge.text }}<span class="sr-only"> in this {{ kind }}: show what needs attention</span>
            </button>
            <slot name="header-extra" />
            <Button v-if="headerSave" variant="secondary" size="sm" data-header-save :loading="headerSave.loading" :disabled-reason="headerSave.reason" @click="headerSave.run()"><Save aria-hidden="true" />Save draft</Button>
            <Tooltip v-if="primary" :text="primary.tip">
              <span class="inline-flex" @click.capture="announceBlocked">
                <Button data-editor-primary :variant="primary.variant" :disabled-reason="primary.reason" :loading="primary.loading" @click="primary.run()">
                  {{ primary.label }}
                </Button>
              </span>
            </Tooltip>
            <DropdownMenu v-if="editor.resource.status !== 'ARCHIVED' || !wide">
              <DropdownMenuTrigger as-child>
                <Button variant="ghost" size="icon" label="More actions"><MoreHorizontal aria-hidden="true" /></Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent class="w-64">
                <DropdownMenuItem v-if="!wide && editor.resource.status === 'ACTIVE'" :disabled="!!blockedReason || editor.transitioning || connection.offline" @select="editor.requestTransition('DRAFT')">
                  <PowerOff aria-hidden="true" />Deactivate<span v-if="blockedReason" class="text-xs text-muted-foreground"> (in use)</span>
                </DropdownMenuItem>
                <DropdownMenuItem v-if="!wide && editor.resource.status === 'ARCHIVED'" :disabled="editor.transitioning || connection.offline" @select="editor.requestTransition('DRAFT')">
                  <RotateCcw aria-hidden="true" />Restore as draft
                </DropdownMenuItem>
                <DropdownMenuItem v-if="editor.resource.status !== 'ARCHIVED'" danger :disabled="!!blockedReason || editor.transitioning || connection.offline" @select="editor.requestTransition('ARCHIVED')">
                  <Archive aria-hidden="true" />Archive<span v-if="blockedReason" class="text-xs text-muted-foreground"> (in use)</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <div
          v-if="editor.usesWorkingCopy"
          ref="bannerBar"
          data-sticky-bar
          class="editor-banner -mx-[var(--gutter)] px-[var(--gutter)] transition-shadow"
          :class="isStuck ? 'shadow-2' : ''"
        >
          <WorkingCopyBanner
            :has-copy="!!editor.workingCopy"
            :dirty="editor.dirty"
            :saved-at="editor.workingCopy ? formatDateTime(editor.workingCopy.updatedAt) : undefined"
            :author="copyAuthor"
            :busy="editor.saving || editor.applying"
            :offline="connection.offline"
            :kind="kind"
            :hide-save="!!headerSave"
            @save-draft="editor.save()"
            @discard="editor.discardChanges(title)"
          />
        </div>

        <!-- Below 1180 px: a summary row (not sticky) that opens the same cards inline. -->
        <div v-if="!wide" class="mt-4 rounded-lg border bg-card shadow-1">
          <div class="flex flex-wrap items-center gap-x-3 gap-y-2 p-2">
            <button
              type="button"
              class="flex min-h-control min-w-0 flex-1 items-center gap-2 rounded-md px-2 text-left text-sm font-semibold hover:bg-surface-hover"
              :aria-expanded="summaryOpen"
              aria-controls="editor-summary"
              @click="summaryOpen = !summaryOpen"
            >
              <ListChecks class="size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
              <span class="truncate">
                {{ editor.resource.status === "DRAFT" ? "Draft" : editor.resource.status === "ACTIVE" ? "Active" : "Archived" }}<template v-if="badge"> · {{ badge.text }}</template>
              </span>
              <ChevronDown class="ml-auto size-5 shrink-0 text-muted-foreground transition-transform" :class="summaryOpen ? 'rotate-180' : ''" aria-hidden="true" />
            </button>
            <Button
              v-if="editor.resource.status === 'DRAFT'"
              :variant="editor.dirty ? 'secondary' : 'primary'"
              :disabled-reason="connection.offline ? 'You are offline' : editor.transitioning ? 'Working…' : activateBlockedReason"
              @click="editor.requestActivate()"
            >
              {{ editor.dirty ? "Save and activate" : "Activate" }}
            </Button>
            <Button v-if="preview" variant="secondary" data-preview-action :aria-expanded="previewOpen" aria-controls="editor-preview" @click="previewOpen ? closePreview() : (previewOpen = true)">
              <component :is="previewOpen ? EyeOff : Eye" aria-hidden="true" />{{ previewOpen ? "Close preview" : "Preview in app" }}
            </Button>
          </div>
          <div v-if="summaryOpen" id="editor-summary" class="flex flex-col gap-4 border-t border-border p-4">
            <EditorStatusCard
              :status="editor.resource.status"
              :sentence="statusSentence"
              :kind-label="kindLabel"
              :version="editor.resource.version"
              :updated-at="editor.workingCopy?.updatedAt ?? editor.resource.updatedAt"
              :created-at="editor.resource.createdAt"
              :slug="slug"
              :busy="editor.transitioning"
              :offline="connection.offline"
              :blocked-reason="blockedReason"
              :activate-blocked-reason="activateBlockedReason"
              :dirty="editor.dirty"
              :editable="editor.editable"
              flat
              @activate="editor.requestActivate()"
              @deactivate="editor.requestTransition('DRAFT')"
              @restore="editor.requestTransition('DRAFT')"
              @show-used="focusUsedIn"
            />
            <ReadinessList v-if="editor.resource.status !== 'ARCHIVED'" flat interactive :active="isActive" :plus-checks="isDraft" :heading="readinessHeading" :lines="lines" :empty-text="readinessEmpty" @select="goToLine" />
          </div>
        </div>

        <!-- "Preview in app": the panel is as wide as the editor content area (form and side column), right below the
             header and the summary row that hold its action; Expand makes it as tall as the window allows (D-095). -->
        <div v-if="previewOpen && preview" id="editor-preview" class="mt-4">
          <PreviewPanel
            :model="preview"
            :dirty="editor.dirty"
            @close="closePreview"
          />
        </div>

        <div class="mt-4 flex max-w-[46rem] flex-col gap-4 empty:hidden">
          <!-- One compact row, gone after Restore, Discard or a successful save (C2-63). -->
          <div v-if="editor.pendingDraft" class="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-md border border-border bg-muted px-3 py-1.5 text-sm" data-restore-notice role="status">
            <span class="min-w-0 flex-1">
              {{ restoreNotice ?? `Unsaved changes from ${formatDateTime(editor.pendingDraft.savedAt)} are kept in this browser.` }}
              <span v-if="editor.draftOutdated" class="text-ink-2">The {{ kind }} has changed since: check before saving.</span>
            </span>
            <span class="flex shrink-0 items-center gap-2">
              <Button variant="primary" size="sm" class="whitespace-nowrap" :disabled-reason="editor.editable ? undefined : 'This item cannot be edited'" @click="editor.restoreDraft()">
                Restore<span v-if="editor.pendingDraftFields"> ({{ editor.pendingDraftFields }} {{ editor.pendingDraftFields === 1 ? "field" : "fields" }})</span>
              </Button>
              <Button variant="secondary" size="sm" @click="editor.discardDraft()">Discard</Button>
            </span>
          </div>

          <!-- Archived: the Status card holds the one Restore button; this says what archived means. -->
          <Alert v-if="editor.resource.status === 'ARCHIVED'" tone="info" :title="`This ${kind} is archived`">
            It is read-only and hidden from visitors. Use Restore as draft in the Status card to edit it again.
          </Alert>
          <Alert v-else-if="!editor.editable" tone="info" :title="`This ${kind} is active and visible to visitors`">
            Editing it through pending changes is not available yet. Deactivate it to edit it as a draft.
            <template #actions>
              <Button variant="secondary" size="sm" :disabled-reason="blockedReason ?? (connection.offline ? 'You are offline' : undefined)" @click="editor.requestTransition('DRAFT')">
                <PowerOff aria-hidden="true" />Deactivate
              </Button>
            </template>
          </Alert>
        </div>

        <!-- Save errors (D-108, C3-25): in the flow of the form column on short viewports (below 900 px of height), a card that
             floats under the sticky bars on tall ones. It is as wide as the form column, scrolls on its own above a cap, and
             closes from inside the card. -->
        <div v-if="summaryItems" class="summary-slot z-raised grid edit:grid-cols-[minmax(0,46rem)_21.5rem]" data-summary-slot>
          <div class="summary-card min-w-0 overflow-y-auto rounded-lg border border-border bg-card shadow-2">
            <FormErrorSummary :summary="summaryItems" @select="(path) => editor.focusField(path)" />
            <div class="flex flex-wrap justify-end gap-2 border-t border-border px-3 py-2">
              <Button v-if="summaryItems.recovery === 'leave'" as-child variant="primary" size="sm"><RouterLink :to="listTo">Back to {{ backLabel }}</RouterLink></Button>
              <Button variant="secondary" size="sm" @click="editor.dismissSummary()">Close</Button>
            </div>
          </div>
        </div>

        <div class="mt-4 grid items-start gap-6 edit:grid-cols-[minmax(0,46rem)_21.5rem]">
          <div class="flex min-w-0 flex-col gap-4">
            <slot />
          </div>

          <aside ref="sideColumn" id="editor-side-column" :class="sideClass" class="editor-side flex min-w-0 flex-col gap-4 edit:sticky edit:-mx-1 edit:overflow-y-auto edit:overscroll-contain edit:p-1" aria-label="About this item" @scroll.passive="updateSideMore">
            <template v-if="wide">
              <EditorStatusCard
                :status="editor.resource.status"
                :sentence="statusSentence"
                :kind-label="kindLabel"
                :version="editor.resource.version"
                :updated-at="editor.workingCopy?.updatedAt ?? editor.resource.updatedAt"
                :created-at="editor.resource.createdAt"
                :slug="slug"
                :busy="editor.transitioning"
                :offline="connection.offline"
                :blocked-reason="blockedReason"
                :activate-blocked-reason="activateBlockedReason"
                :dirty="editor.dirty"
                :editable="editor.editable"
                @activate="editor.requestActivate()"
                @deactivate="editor.requestTransition('DRAFT')"
                @restore="editor.requestTransition('DRAFT')"
                @show-used="focusUsedIn"
              />
              <Button v-if="preview" variant="secondary" class="w-full" data-preview-action :aria-expanded="previewOpen" aria-controls="editor-preview" @click="previewOpen ? closePreview() : (previewOpen = true)">
                <component :is="previewOpen ? EyeOff : Eye" aria-hidden="true" />{{ previewOpen ? "Close preview" : "Preview in app" }}
              </Button>
              <ReadinessList v-if="editor.resource.status !== 'ARCHIVED'" interactive :active="isActive" :plus-checks="isDraft" :heading="readinessHeading" :lines="lines" :empty-text="readinessEmpty" @select="goToLine" />
              <EditorSectionNav v-if="railSections.length > 1" :sections="railSections" />
            </template>

            <SideCard v-if="translations?.length" title="Translations" heading-id="translations-heading">
              <template #actions>
                <Button v-if="nextMissing" variant="ghost" size="sm" data-next-missing-card @click="goToNextMissing">{{ nextMissingText }}</Button>
              </template>
              <ul class="flex flex-col">
                <li v-for="s in translations" :key="s.language.languageCode">
                  <button
                    type="button"
                    class="flex min-h-control w-full flex-wrap items-center gap-x-2 gap-y-0.5 rounded-md px-2 py-1 text-left text-sm hover:bg-surface-hover"
                    :aria-current="editor.activeLanguage === s.language.languageCode ? 'true' : undefined"
                    @click="editor.activeLanguage = s.language.languageCode"
                  >
                    <bdi :lang="s.language.languageCode" :class="s.language.isDefault ? 'font-bold' : 'font-semibold'">{{ s.language.displayName }}</bdi>
                    <span v-if="s.language.isDefault" class="text-xs text-muted-foreground">default</span>
                    <span v-if="editor.activeLanguage === s.language.languageCode" class="text-xs font-semibold text-primary">editing</span>
                    <span class="ml-auto flex items-center gap-1 whitespace-nowrap text-xs font-medium" :class="progress(s).tone">
                      <component :is="progress(s).icon" class="size-4" aria-hidden="true" />{{ progress(s).text }}
                    </span>
                  </button>
                </li>
              </ul>
            </SideCard>

            <SideCard v-if="usedIn" :title="`Used in (${usedIn.length})`" heading-id="used-in-heading">
              <p v-if="!usedIn.length" class="text-sm text-muted-foreground">Not used anywhere yet.</p>
              <template v-else>
                <ul class="flex flex-col gap-1.5 text-sm">
                  <li v-for="r in shownUsedIn" :key="`${r.resourceType}-${r.resourceId}`">
                    <RouterLink v-if="referenceLink?.(r)" :to="referenceLink(r)!">{{ r.title }}</RouterLink>
                    <span v-else>{{ r.title }}</span>
                    <span class="text-muted-foreground"> · {{ referenceKindLabel(r.resourceType) }}</span>
                  </li>
                </ul>
                <Button v-if="usedIn.length > USED_IN_LIMIT" variant="ghost" size="sm" class="mt-2" :aria-expanded="usedInAll" @click="usedInAll = !usedInAll">
                  {{ usedInAll ? "Show fewer" : `Show all ${usedIn.length}` }}
                </Button>
              </template>
            </SideCard>
            <slot name="aside" />
          </aside>
        </div>
      </template>

      <StatusChangeDialog
        v-if="editor.confirmTarget && editor.resource"
        :heading="confirmCopy.heading"
        :body="confirmCopy.body"
        :action-label="confirmCopy.action"
        :danger="editor.confirmTarget === 'ARCHIVED'"
        :busy="editor.transitioning"
        :load-references="editor.loadReferences"
        :blocked-by="editor.blockedBy"
        :link-for="referenceLink ?? noLink"
        @close="editor.confirmTarget = null"
        @confirm="editor.transition(editor.confirmTarget!)"
      />

      <ActivateDialog
        v-if="editor.activateOpen && editor.resource"
        :title="title"
        :kind="kind"
        :lines="clientLines"
        :dirty="editor.dirty"
        :busy="editor.transitioning || editor.saving"
        :offline="connection.offline"
        :refusal="editor.activationRefusal"
        :describe-path="editor.describePath"
        :blocked-reason="activateBlockedReason"
        :failure="editor.activationFailure"
        @close="editor.closeActivate()"
        @confirm="(saveFirst) => editor.confirmActivate(saveFirst)"
        @goto="gotoFromDialog"
        @go="goLineFromDialog"
        @review="reviewFromDialog"
      />

      <ConflictDialog :editor="editor" :title="title" />
    </div>
  </PageFrame>
</template>

<style scoped>
/* The side column scrolls on its own below the sticky bars; a fade marks each edge that has more (D-109). `#000` in
   the mask gradients is an alpha mask, not a colour: only its opacity is read. */
.side-fade-bottom {
  mask-image: linear-gradient(to bottom, #000 calc(100% - 2rem), transparent);
}
.side-fade-top {
  mask-image: linear-gradient(to bottom, transparent, #000 2rem);
}
.side-fade-both {
  mask-image: linear-gradient(to bottom, transparent, #000 2rem, #000 calc(100% - 2rem), transparent);
}
@media (min-width: 1180px) {
  .editor-side {
    top: max(calc(var(--sticky-stack-h, 3.5rem) - 0.5rem), 0px);
    max-height: calc(100dvh - var(--header-h) - var(--sticky-stack-h, 3.5rem) - 1.5rem);
  }
}

/* The header sticks from 700 px of viewport height (15 % of it with the app header at 700); on shorter screens and at
   200 % zoom only the app header stays, and the header carries its own compact Save draft instead (D-108). */
.editor-header {
  position: static;
}
@media (min-height: 700px) {
  .editor-header {
    position: sticky;
    top: -1.5rem; /* the page frame pads 1.5rem above the sticky area */
  }
}
.editor-banner {
  background: hsl(var(--card));
  border-bottom: 1px solid hsl(var(--border));
}
/* The Working Copy banner sticks under the header only on tall viewports (from 960 px), where header, banner and app
   header together stay within 15 % of the height; below it the banner scrolls and the header takes over Save draft. */
@media (min-height: 960px) {
  .editor-banner {
    position: sticky;
    top: 1.5rem; /* header 3rem less the 1.5rem the page frame pads above */
  }
}

/* A save error summary: in the flow below 900 px of height, floating under the bars from 900 px. */
.summary-slot {
  margin-top: 1rem;
}
.summary-card {
  max-height: 40dvh;
}
@media (min-height: 900px) {
  .summary-slot {
    position: sticky;
    top: var(--sticky-stack-h, 3.5rem);
    height: 0;
    margin-top: 0;
    pointer-events: none;
  }
  .summary-card {
    position: absolute;
    top: 0.5rem;
    left: 0;
    right: 0;
    grid-column: 1;
    max-height: 30dvh;
    pointer-events: auto;
  }
}
</style>
