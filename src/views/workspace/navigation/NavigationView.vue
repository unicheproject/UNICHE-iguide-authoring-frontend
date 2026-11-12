<script setup lang="ts">
/*
 * Visitor app → Navigation (`12` §3 Navigation editor, `03` §13; DECISIONS.md D-055, backend D-046): the main menu
 * (PRIMARY, a tree) and the footer links (FOOTER, flat), both shared by every surface. Every action saves at once:
 * menus have no lifecycle and no pending changes. Items open a Place, Point of Interest, Route, Guide, or Event; a
 * heading of the main menu opens nothing and groups the items under it. Labels are per language; without one the
 * visitor app shows the target's title. Reordering works by keyboard (move up and down, set the position, indent and
 * outdent), with drag and drop as an addition (`14` §4). A preview on the right draws the menu in the Project's theme.
 */
import { computed, nextTick, onBeforeUnmount, reactive, ref, watch } from "vue";
import AppDialog from "@/components/AppDialog.vue";
import PageHead from "@/components/PageHead.vue";
import ResourcePickerDialog from "@/components/ResourcePickerDialog.vue";
import StatusChip from "@/components/StatusChip.vue";
import DeviceFrame from "@/components/preview/DeviceFrame.vue";
import PreviewApp from "@/components/preview/PreviewApp.vue";
import type { Surface } from "@/components/preview/surfaces";
import type { Pickable, PickerKind } from "@/components/resourcePicker";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/platform/api";
import {
  addNavigationItem,
  createNavigation,
  listNavigations,
  removeNavigationItem,
  reorderNavigation,
  saveNavigationLabel,
  subtree,
  updateNavigationItem,
  type Navigation,
  type NavigationContext,
  type NavigationItem,
  type NavigationItemInput,
  type NavigationTargetType,
} from "@/platform/navigation";
import { askConfirm } from "@/stores/confirm";
import { connection } from "@/stores/connection";
import { showToast } from "@/stores/toast";
import { useCurrentProject } from "@/workspace/currentProject";
import { itemLabel, itemTarget, previewMenu } from "@/workspace/navigationMenu";
import { loadPreviewData, type PreviewData } from "@/workspace/previewData";
import { titleOf, type PreviewContext } from "@/workspace/previewModels";
import { sectionOff, useProjectSettings } from "@/workspace/projectSettings";
import { themeStyle, useProjectTheme } from "@/workspace/projectTheme";
import { findSection, sectionLocation } from "@/workspace/sections";

const section = findSection("navigation")!;
const project = useCurrentProject();
const projectId = computed(() => project.value.id);
const settings = useProjectSettings(projectId);
const theme = useProjectTheme(projectId);

const KINDS: { type: NavigationTargetType; label: string; plural: string; section: string }[] = [
  { type: "PLACE", label: "Place", plural: "Places", section: "places" },
  { type: "POI", label: "Point of interest", plural: "Points of interest", section: "pois" },
  { type: "ROUTE", label: "Route", plural: "Routes", section: "routes" },
  { type: "GUIDE", label: "Guide", plural: "Guides", section: "guides" },
  { type: "EVENT", label: "Event", plural: "Events", section: "events" },
];
const kindOf = (type: NavigationTargetType) => KINDS.find((k) => k.type === type)!;
/** Why a kind's items do not reach visitors, when its capability is off (`03` §2, D-049). */
const kindOff = (type: NavigationTargetType) => sectionOff(settings.value, kindOf(type).section);

// --- Loading ------------------------------------------------------------------------------------

const menus = ref<Navigation[]>([]);
const data = ref<PreviewData | null>(null);
const loading = ref(true);
const loadError = ref<ApiError | null>(null);
let controller: AbortController | null = null;

async function load() {
  controller?.abort();
  controller = new AbortController();
  const signal = controller.signal;
  loading.value = true;
  loadError.value = null;
  try {
    [menus.value, data.value] = await Promise.all([listNavigations(projectId.value, signal), loadPreviewData(projectId.value, signal)]);
    if (!language.value || !languages.value.some((l) => l.languageCode === language.value)) language.value = defaultLanguage.value;
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") return;
    if (!(e instanceof ApiError)) throw e;
    loadError.value = e;
  } finally {
    if (!signal.aborted) loading.value = false;
  }
}
watch(projectId, load, { immediate: true });
onBeforeUnmount(() => controller?.abort());

const languages = computed(() => data.value?.languages ?? []);
const defaultLanguage = computed(() => languages.value.find((l) => l.isDefault)?.languageCode ?? null);
/** The language whose labels the rows show and edit. */
const language = ref<string | null>(null);
const languageName = (code: string | null) => languages.value.find((l) => l.languageCode === code)?.displayName ?? code ?? "";

const context = ref<NavigationContext>("PRIMARY");
const menu = computed(() => menus.value.find((m) => m.context === context.value) ?? null);
const count = (c: NavigationContext) => menus.value.find((m) => m.context === c)?.items.length ?? 0;
const ctx = computed<PreviewContext | null>(() =>
  data.value ? { data: data.value, language: language.value, defaultLanguage: defaultLanguage.value } : null,
);

// --- Saving -------------------------------------------------------------------------------------

const saving = ref(false);
/** Read by screen readers after each change (`14` §4). */
const announcement = ref("");

/** Runs one live write and takes the menu the backend answers; a stale view is reloaded. */
async function write(change: () => Promise<Navigation>, success: string, failure: string): Promise<boolean> {
  saving.value = true;
  try {
    const next = await change();
    menus.value = [...menus.value.filter((m) => m.id !== next.id), next];
    announcement.value = success;
    return true;
  } catch (e) {
    if (!(e instanceof ApiError)) throw e;
    if (e.code === "VERSION_CONFLICT") {
      showToast("The menu changed meanwhile", "It was reloaded: check it and try again.", "warning");
      await load();
    } else {
      const fields = Object.values(e.fieldMessages()).join(" ");
      showToast(failure, e.platformUnavailable ? "The UNICHE platform is not reachable." : fields || e.message, "error");
    }
    return false;
  } finally {
    saving.value = false;
  }
}

/** The open menu, created on the first item added to it. */
async function ensureMenu(): Promise<Navigation | null> {
  if (menu.value) return menu.value;
  let created: Navigation | null = null;
  const ok = await write(async () => (created = await createNavigation(projectId.value, context.value)), "", "The menu was not created");
  return ok ? created : null;
}

// --- Rows ---------------------------------------------------------------------------------------

interface Row {
  item: NavigationItem;
  /** The label in the chosen language, empty when it uses the target's title. */
  own: string;
  /** What visitors read in the chosen language. */
  shown: string;
  kind: string;
  targetTitle: string | null;
  targetStatus: string | null;
  warning: string | null;
  siblings: NavigationItem[];
  position: number;
  childCount: number;
}

const rows = computed<Row[]>(() => {
  const m = menu.value;
  const c = ctx.value;
  if (!m || !c) return [];
  return m.items.map((item) => {
    const siblings = m.items.filter((i) => i.parentItemId === item.parentItemId);
    const target = itemTarget(item);
    const record = target ? findTarget(target.type, target.id) : null;
    const own = (language.value && item.labels[language.value]) || "";
    let warning: string | null = null;
    if (item.itemType === "GROUP" && defaultLanguage.value && !item.labels[defaultLanguage.value]) {
      warning = `No label in ${languageName(defaultLanguage.value)}: a heading needs one.`;
    } else if (target && !record) {
      warning = "What it opened no longer exists.";
    } else if (target && kindOff(target.type)) {
      warning = `${kindOf(target.type).plural}: ${kindOff(target.type)}. Visitors do not see this item.`;
    } else if (record && record.status !== "ACTIVE") {
      warning = "Visitors see this item once what it opens is active.";
    }
    return {
      item,
      own,
      shown: itemLabel(item, c),
      kind: target ? kindOf(target.type).label : "Heading",
      targetTitle: target ? titleOf({ ...c, language: defaultLanguage.value }, target) : null,
      targetStatus: record?.status ?? null,
      warning,
      siblings,
      position: siblings.indexOf(item),
      childCount: subtree(m, item.id).length - 1,
    };
  });
});

function findTarget(type: NavigationTargetType, id: string): { status: string } | null {
  const d = data.value;
  if (!d) return null;
  const list: { id: string; status: string }[] =
    type === "PLACE" ? d.places : type === "POI" ? d.pois : type === "ROUTE" ? d.routes : type === "GUIDE" ? d.guides : d.events;
  return list.find((r) => r.id === id) ?? null;
}

const rowName = (row: Row) => row.shown || row.kind;

// --- Adding -------------------------------------------------------------------------------------

/** The picker: a new link, or another target for an existing one. */
const picking = ref<{ replace: NavigationItem | null } | null>(null);
const pickerKinds = computed<PickerKind<NavigationTargetType>[]>(() =>
  KINDS.map((k) => ({ type: k.type, plural: k.plural, off: kindOff(k.type) })),
);
const pickerCandidates = computed(() => {
  const d = data.value;
  const c = ctx.value;
  const out = {} as Record<NavigationTargetType, Pickable[]>;
  for (const k of KINDS) {
    const list: { id: string; status: Pickable["status"] }[] = !d ? [] : k.type === "PLACE" ? d.places : k.type === "POI" ? d.pois
      : k.type === "ROUTE" ? d.routes : k.type === "GUIDE" ? d.guides : d.events;
    out[k.type] = list.map((r) => ({
      id: r.id,
      status: r.status,
      title: c ? titleOf({ ...c, language: defaultLanguage.value }, { type: k.type, id: r.id }) : r.id,
    }));
  }
  return out;
});

async function pick(type: NavigationTargetType, resource: Pickable) {
  const replace = picking.value?.replace ?? null;
  picking.value = null;
  if (replace) {
    const m = menu.value!;
    await write(
      () => updateNavigationItem(projectId.value, m.id, replace, {
        itemType: "RESOURCE",
        targetResourceType: type,
        targetResourceId: resource.id,
        parentItemId: replace.parentItemId,
      }),
      `Now opens ${resource.title}.`,
      "The item was not changed",
    );
    return;
  }
  const m = await ensureMenu();
  if (!m) return;
  const ok = await write(
    () => addNavigationItem(projectId.value, m.id, { itemType: "RESOURCE", targetResourceType: type, targetResourceId: resource.id }),
    `Added ${resource.title} at the end of the ${context.value === "PRIMARY" ? "main menu" : "footer links"}.`,
    "The item was not added",
  );
  if (ok) await focusRow(menu.value?.items.at(-1)?.id);
}

/** A new heading needs its default-language label before it is saved. */
const heading = reactive({ open: false, label: "", error: "" });
async function addHeading() {
  if (!heading.label.trim()) {
    heading.error = `Give the heading a label in ${languageName(defaultLanguage.value)}.`;
    return;
  }
  const m = await ensureMenu();
  if (!m || !defaultLanguage.value) return;
  const ok = await write(
    () => addNavigationItem(projectId.value, m.id, { itemType: "GROUP", labels: { [defaultLanguage.value!]: heading.label.trim() } }),
    `Added the heading ${heading.label.trim()}.`,
    "The heading was not added",
  );
  if (ok) {
    Object.assign(heading, { open: false, label: "", error: "" });
    await focusRow(menu.value?.items.at(-1)?.id);
  }
}

// --- Moving -------------------------------------------------------------------------------------

/** Puts the item at `position` among its siblings; the whole menu's order goes in one request. */
async function moveTo(row: Row, position: number) {
  const m = menu.value!;
  if (position < 0 || position >= row.siblings.length || position === row.position) return;
  // Build the new tree order: the item's subtree travels with it.
  const siblingIds = row.siblings.map((s) => s.id).filter((id) => id !== row.item.id);
  siblingIds.splice(position, 0, row.item.id);
  const order: string[] = [];
  const visit = (parent: string | null) => {
    const kids = m.items.filter((i) => i.parentItemId === parent).map((i) => i.id);
    const ordered = parent === row.item.parentItemId ? siblingIds : kids;
    for (const id of ordered) {
      order.push(id);
      visit(id);
    }
  };
  visit(null);
  const ok = await write(
    () => reorderNavigation(projectId.value, m.id, order),
    `Moved ${rowName(row)} to position ${position + 1} of ${row.siblings.length}.`,
    "The order was not saved",
  );
  if (ok) await focusRow(row.item.id, "move");
}

/** Makes the item a child of the item above it among its siblings (main menu only). */
async function indent(row: Row) {
  const above = row.siblings[row.position - 1];
  if (!above) return;
  await reparent(row, above.id, `${rowName(row)} is now under ${rows.value.find((r) => r.item.id === above.id)?.shown ?? "the item above"}.`);
}

/** Makes the item a sibling of its parent, placed after it. */
async function outdent(row: Row) {
  const parent = menu.value!.items.find((i) => i.id === row.item.parentItemId);
  if (!parent) return;
  const ok = await reparent(row, parent.parentItemId, `${rowName(row)} moved out one level.`);
  if (!ok) return;
  // The backend puts it last among its new siblings; bring it right after its former parent.
  const moved = rows.value.find((r) => r.item.id === row.item.id);
  const after = moved?.siblings.findIndex((s) => s.id === parent.id) ?? -1;
  if (moved && after >= 0 && after + 1 !== moved.position) await moveTo(moved, after + 1);
}

async function reparent(row: Row, parentItemId: string | null, success: string): Promise<boolean> {
  const m = menu.value!;
  const input: NavigationItemInput = {
    itemType: row.item.itemType,
    targetResourceType: row.item.targetResourceType,
    targetResourceId: row.item.targetResourceId,
    parentItemId,
  };
  const ok = await write(() => updateNavigationItem(projectId.value, m.id, row.item, input), success, "The item was not moved");
  if (ok) await focusRow(row.item.id, "level");
  return ok;
}

// Drag and drop among siblings, in addition to the buttons.
const dragging = ref<string | null>(null);
function dragStart(row: Row, event: DragEvent) {
  dragging.value = row.item.id;
  event.dataTransfer?.setData("text/plain", row.item.id);
}
function drop(row: Row) {
  const source = rows.value.find((r) => r.item.id === dragging.value);
  dragging.value = null;
  if (source && source.item.parentItemId === row.item.parentItemId) void moveTo(source, row.position);
}

// --- Labels and removal -------------------------------------------------------------------------

/** The row whose labels are open, and the labels as typed. */
const editing = ref<string | null>(null);
const drafts = reactive<Record<string, string>>({});

function openLabels(row: Row) {
  if (editing.value === row.item.id) {
    editing.value = null;
    return;
  }
  editing.value = row.item.id;
  for (const l of languages.value) drafts[l.languageCode] = row.item.labels[l.languageCode] ?? "";
}

async function saveLabels(row: Row) {
  const m = menu.value!;
  for (const l of languages.value) {
    const code = l.languageCode;
    const before = row.item.labels[code] ?? "";
    if ((drafts[code] ?? "").trim() === before.trim()) continue;
    const current = menu.value?.items.find((i) => i.id === row.item.id) ?? row.item;
    const ok = await write(
      () => saveNavigationLabel(projectId.value, m.id, current, code, drafts[code] ?? ""),
      `Saved the ${l.displayName} label.`,
      `The ${l.displayName} label was not saved`,
    );
    if (!ok) return;
  }
  editing.value = null;
  showToast("Labels saved", "Visitors see them on their next refresh.");
  await focusRow(row.item.id, "labels");
}

async function remove(row: Row) {
  if (row.childCount) {
    const yes = await askConfirm({
      title: `Remove ${rowName(row)}?`,
      body: `The ${row.childCount} item${row.childCount === 1 ? "" : "s"} under it go too. Visitors stop seeing them on their next refresh.`,
      confirmLabel: "Remove",
      danger: true,
    });
    if (!yes) return;
  }
  const m = menu.value!;
  await write(() => removeNavigationItem(projectId.value, m.id, row.item), `Removed ${rowName(row)}.`, "The item was not removed");
}

/** Keeps the keyboard where the author was after the list redraws. */
async function focusRow(id: string | undefined, part: "move" | "level" | "labels" | "row" = "row") {
  if (!id) return;
  await nextTick();
  const el =
    (part === "move" && document.getElementById(`nav-up-${id}`)) ||
    (part === "level" && document.getElementById(`nav-in-${id}`)) ||
    (part === "labels" && document.getElementById(`nav-labels-${id}`)) ||
    document.getElementById(`nav-row-${id}`);
  (el as HTMLElement | null)?.focus();
}

// --- Preview ------------------------------------------------------------------------------------

// Mobile fits the side panel; the web frame is there for a wider screen.
const surface = ref<Surface>("MOBILE");
const primary = computed(() => (ctx.value ? previewMenu(menus.value.find((m) => m.context === "PRIMARY"), ctx.value) : []));
const footer = computed(() => (ctx.value ? previewMenu(menus.value.find((m) => m.context === "FOOTER"), ctx.value) : []));
const activeLanguage = computed(() => languages.value.find((l) => l.languageCode === language.value) ?? null);
</script>

<template>
  <main class="relative min-w-0 flex-1 overflow-y-auto px-4 pb-16 pt-6 md:px-7">
    <PageHead :title="section.title" :subtitle="section.subtitle" />

    <div v-if="loading && !data" class="animate-skeleton" role="status" aria-busy="true" aria-label="Loading the menus">
      <div class="h-[260px] rounded-lg border bg-card"></div>
    </div>

    <div v-else-if="loadError" role="alert" class="max-w-[640px] rounded-lg border border-l-[3px] border-l-destructive bg-card px-[18px] py-4">
      <strong class="block text-[13px] font-bold text-destructive">
        {{ loadError.platformUnavailable ? "The UNICHE platform is not reachable" : "The menus could not be loaded" }}
      </strong>
      <p class="mt-1 text-[13px] text-gray-700">{{ loadError.message }}</p>
      <Button variant="outline" size="sm" class="mt-3" @click="load">Try again</Button>
    </div>

    <div v-else-if="data" class="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
      <section class="min-w-0 overflow-hidden rounded-lg border bg-card" aria-labelledby="menus-heading">
        <h2 id="menus-heading" class="sr-only">Menus</h2>
        <div class="flex flex-wrap items-end gap-x-4 gap-y-2 border-b px-4 pt-3">
          <div role="tablist" aria-label="Menus" class="flex gap-1">
            <button
              v-for="c in (['PRIMARY', 'FOOTER'] as const)"
              :id="`tab-${c}`"
              :key="c"
              type="button"
              role="tab"
              :aria-selected="context === c"
              :aria-controls="`panel-${c}`"
              class="border-b-2 px-3 pb-2.5 pt-1 text-[12px] font-extrabold uppercase tracking-[0.08em]"
              :class="context === c ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'"
              @click="context = c; editing = null"
            >
              {{ c === "PRIMARY" ? "Main menu" : "Footer links" }} <span class="font-semibold">({{ count(c) }})</span>
            </button>
          </div>
          <label class="mb-2 ml-auto flex items-center gap-2 text-[12px] font-semibold text-gray-700">
            Labels in
            <select v-model="language" class="field-input w-auto py-1 text-[12px]">
              <option v-for="l in languages" :key="l.languageCode" :value="l.languageCode">
                {{ l.displayName }}{{ l.isDefault ? " (default)" : "" }}
              </option>
            </select>
          </label>
        </div>

        <div :id="`panel-${context}`" role="tabpanel" :aria-labelledby="`tab-${context}`" class="px-4 py-4">
          <p class="mb-3 text-[12px] text-muted-foreground">
            {{
              context === "PRIMARY"
                ? "Shared by every surface; the Template places it as a header menu, a bottom bar, a burger, or kiosk tiles. Headings group the items under them."
                : "Auxiliary links at the bottom of every screen, one level only."
            }}
            Changes reach visitors on their next refresh.
          </p>

          <p v-if="!rows.length" class="mb-3 rounded-lg border border-dashed px-4 py-5 text-center text-[13px] text-muted-foreground">
            {{ context === "PRIMARY" ? "The main menu is empty: the visitor app shows its default menu." : "No footer links yet." }}
          </p>

          <ol v-else class="mb-3 flex flex-col gap-1.5" :aria-label="context === 'PRIMARY' ? 'Main menu items' : 'Footer links'">
            <li
              v-for="row in rows"
              :id="`nav-row-${row.item.id}`"
              :key="row.item.id"
              tabindex="-1"
              class="rounded-lg border bg-background focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
              :style="{ marginLeft: `${row.item.depth * 28}px` }"
              :class="{ 'opacity-60': dragging === row.item.id }"
              draggable="true"
              @dragstart="dragStart(row, $event)"
              @dragover.prevent
              @drop.prevent="drop(row)"
              @dragend="dragging = null"
            >
              <div class="flex flex-wrap items-center gap-x-3 gap-y-1.5 px-3 py-2.5">
                <span class="cursor-grab select-none text-muted-foreground" aria-hidden="true">⠿</span>
                <div class="min-w-0 flex-1 basis-[240px]">
                  <span class="sr-only">{{ row.item.depth ? `Level ${row.item.depth + 1}, ` : "" }}</span>
                  <strong class="block text-[13px]" :class="{ 'text-[#855400]': !row.shown }">{{ row.shown || "No label" }}</strong>
                  <span class="block text-[11px] text-muted-foreground">
                    {{ row.kind }}<template v-if="row.targetTitle"> · {{ row.targetTitle }}</template>
                    <template v-if="!row.own && row.targetTitle"> · uses the title in {{ languageName(language) }}</template>
                    <template v-if="row.childCount"> · {{ row.childCount }} under it</template>
                  </span>
                  <span v-if="row.warning" class="mt-0.5 block text-[11px] font-semibold text-[#855400]">⚠ {{ row.warning }}</span>
                </div>
                <StatusChip v-if="row.targetStatus && row.targetStatus !== 'ACTIVE'" :status="row.targetStatus" />
                <div class="flex flex-wrap items-center gap-1">
                  <button
                    :id="`nav-up-${row.item.id}`"
                    type="button"
                    class="row-btn"
                    :disabled="saving || connection.offline || row.position === 0"
                    :aria-label="`Move ${rowName(row)} up`"
                    @click="moveTo(row, row.position - 1)"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    class="row-btn"
                    :disabled="saving || connection.offline || row.position === row.siblings.length - 1"
                    :aria-label="`Move ${rowName(row)} down`"
                    @click="moveTo(row, row.position + 1)"
                  >
                    ↓
                  </button>
                  <label class="sr-only" :for="`nav-position-${row.item.id}`">Position of {{ rowName(row) }}</label>
                  <select
                    :id="`nav-position-${row.item.id}`"
                    class="field-input w-auto px-1.5 py-0.5 text-[11px]"
                    :value="row.position"
                    :disabled="saving || connection.offline || row.siblings.length < 2"
                    @change="moveTo(row, Number(($event.target as HTMLSelectElement).value))"
                  >
                    <option v-for="(_, i) in row.siblings" :key="i" :value="i">{{ i + 1 }} of {{ row.siblings.length }}</option>
                  </select>
                  <template v-if="context === 'PRIMARY'">
                    <button
                      :id="`nav-in-${row.item.id}`"
                      type="button"
                      class="row-btn"
                      :disabled="saving || connection.offline || row.position === 0"
                      :aria-label="`Move ${rowName(row)} under the item above`"
                      title="Under the item above"
                      @click="indent(row)"
                    >
                      →
                    </button>
                    <button
                      type="button"
                      class="row-btn"
                      :disabled="saving || connection.offline || !row.item.parentItemId"
                      :aria-label="`Move ${rowName(row)} out one level`"
                      title="Out one level"
                      @click="outdent(row)"
                    >
                      ←
                    </button>
                  </template>
                  <button
                    :id="`nav-labels-${row.item.id}`"
                    type="button"
                    class="row-link"
                    :aria-expanded="editing === row.item.id"
                    :aria-controls="`nav-labels-panel-${row.item.id}`"
                    @click="openLabels(row)"
                  >
                    Labels
                  </button>
                  <button
                    v-if="row.item.itemType === 'RESOURCE'"
                    type="button"
                    class="row-link"
                    :disabled="saving || connection.offline"
                    @click="picking = { replace: row.item }"
                  >
                    Change target
                  </button>
                  <button
                    type="button"
                    class="row-link text-destructive"
                    :disabled="saving || connection.offline"
                    :aria-label="`Remove ${rowName(row)}`"
                    @click="remove(row)"
                  >
                    Remove
                  </button>
                </div>
              </div>

              <div v-if="editing === row.item.id" :id="`nav-labels-panel-${row.item.id}`" class="border-t px-3 py-3">
                <div class="grid gap-2.5 sm:grid-cols-2">
                  <div v-for="l in languages" :key="l.languageCode" class="flex flex-col gap-1">
                    <label :for="`nav-label-${row.item.id}-${l.languageCode}`" class="field-label">
                      {{ l.displayName }}{{ l.isDefault ? " · default" : "" }}
                    </label>
                    <input
                      :id="`nav-label-${row.item.id}-${l.languageCode}`"
                      v-model="drafts[l.languageCode]"
                      :lang="l.languageCode"
                      :dir="l.direction.toLowerCase()"
                      maxlength="255"
                      class="field-input"
                      :aria-describedby="`nav-label-note-${row.item.id}-${l.languageCode}`"
                    />
                    <span :id="`nav-label-note-${row.item.id}-${l.languageCode}`" class="text-[11px] text-muted-foreground">
                      <template v-if="row.item.itemType === 'GROUP' && l.isDefault">Required: a heading has no title to fall back on.</template>
                      <template v-else-if="row.item.itemType === 'GROUP'">Empty shows the {{ languageName(defaultLanguage) }} label.</template>
                      <template v-else>
                        Empty uses the title:
                        {{ ctx && itemTarget(row.item) ? titleOf({ ...ctx, language: l.languageCode }, itemTarget(row.item)!) : "" }}
                      </template>
                    </span>
                  </div>
                </div>
                <div class="mt-3 flex gap-2">
                  <Button size="sm" :disabled="saving || connection.offline" @click="saveLabels(row)">Save labels</Button>
                  <Button size="sm" variant="outline" @click="editing = null">Cancel</Button>
                </div>
              </div>
            </li>
          </ol>

          <div class="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" :disabled="saving || connection.offline" @click="picking = { replace: null }">
              + Link
            </Button>
            <Button
              v-if="context === 'PRIMARY'"
              size="sm"
              variant="outline"
              :disabled="saving || connection.offline || !defaultLanguage"
              @click="Object.assign(heading, { open: true, label: '', error: '' })"
            >
              + Heading
            </Button>
          </div>
          <p class="mt-3 text-[11px] text-muted-foreground">
            Items open Places, Points of Interest, Routes, Guides, and Events; Pages can be added once they exist in iGuide.
          </p>
        </div>
        <p class="sr-only" aria-live="polite">{{ announcement }}</p>
      </section>

      <aside class="min-w-0 xl:sticky xl:top-4" aria-labelledby="nav-preview-heading">
        <div class="mb-2 flex items-center gap-2">
          <h2 id="nav-preview-heading" class="text-[11px] font-extrabold uppercase tracking-[0.1em] text-muted-foreground">Preview</h2>
          <div role="group" aria-label="Surface" class="ml-auto flex gap-1">
            <button
              v-for="s in (['MOBILE', 'WEB'] as const)"
              :key="s"
              type="button"
              class="rounded-full border px-2.5 py-1 text-[11px] font-semibold"
              :class="surface === s ? 'border-primary bg-primary text-white' : 'bg-card text-gray-700'"
              :aria-pressed="surface === s"
              @click="surface = s"
            >
              {{ s === "MOBILE" ? "Mobile" : "Web" }}
            </button>
          </div>
        </div>
        <div :class="surface === 'MOBILE' ? 'mx-auto max-w-[300px]' : ''">
          <DeviceFrame
            :surface="surface"
            :dir="activeLanguage?.direction === 'RTL' ? 'rtl' : 'ltr'"
            :lang="language ?? undefined"
            :style="themeStyle(theme)"
          >
            <PreviewApp
              :data="data"
              :language="language"
              :default-language="defaultLanguage"
              :surface="surface"
              :app-name="project.name"
              :theme="theme"
              :menu="primary"
              :footer="footer"
            />
          </DeviceFrame>
        </div>
        <p class="mt-2 text-[11px] text-muted-foreground">
          The menu in {{ languageName(language) }}, drafts included, {{ surface === "MOBILE" ? `as a ${theme.shell.mobileMenu === "BURGER" ? "burger menu" : "bottom bar"} (App settings)` : "in the header" }}.
          <RouterLink :to="sectionLocation(projectId, 'preview')" class="font-semibold text-primary">Open the full preview</RouterLink>
        </p>
      </aside>

    </div>


    <ResourcePickerDialog
      v-if="picking"
      :title="picking.replace ? 'Change what the item opens' : 'Add a link'"
      :kinds="pickerKinds"
      :candidates="pickerCandidates"
      :initial-kind="picking.replace?.targetResourceType ?? undefined"
      note="Pages can be added once they exist in iGuide."
      @pick="pick"
      @close="picking = null"
    />

    <AppDialog v-if="heading.open" title="Add a heading" :busy="saving" @close="heading.open = false">
      <label for="nav-heading-label" class="field-label mb-1.5 block">Label in {{ languageName(defaultLanguage) }}</label>
      <input
        id="nav-heading-label"
        v-model="heading.label"
        maxlength="255"
        class="field-input"
        :aria-invalid="!!heading.error"
        :aria-describedby="heading.error ? 'nav-heading-error' : 'nav-heading-help'"
        @keydown.enter.prevent="addHeading"
      />
      <span v-if="heading.error" id="nav-heading-error" class="mt-1 block text-xs font-semibold text-destructive">⚠ {{ heading.error }}</span>
      <span v-else id="nav-heading-help" class="mt-1 block text-[11px] text-muted-foreground">
        A heading opens nothing; the items under it form a submenu. Other languages are added under Labels.
      </span>
      <template #actions>
        <button type="button" class="dialog-secondary" @click="heading.open = false">Cancel</button>
        <button type="button" class="dialog-primary bg-primary" :disabled="saving" @click="addHeading">Add heading</button>
      </template>
    </AppDialog>
  </main>
</template>

<style scoped>
.row-btn {
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 1px 7px;
  font-size: 12px;
  color: #374151;
  background: #fff;
}
.row-btn:disabled {
  opacity: 0.4;
}
.row-link {
  padding: 2px 4px;
  font-size: 11px;
  font-weight: 700;
  color: hsl(var(--primary));
}
.row-link:disabled {
  opacity: 0.4;
}
</style>
