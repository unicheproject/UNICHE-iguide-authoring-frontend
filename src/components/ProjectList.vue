<script setup lang="ts">
/**
 * The one searchable Project list behind Home and the header switcher (D-084, C1-53). A labelled search; "Current" and
 * "Recent" first (ids kept in browser storage, `workspace/lastProject.ts`), then the organisations the Catalogue lists
 * with their Projects, then "Needs setup (n)" collapsed with a Resume button. The status word is the Application's
 * ("Visitor app: Draft"), never a bare "Active" (C1-54). Arrow keys, Home and End move between rows (one Tab stop in the list),
 * Enter opens, and in the popover the search takes focus when it opens. Only the rows shown are read for their setup state.
 * The list appears once, after those reads settled (3 s at most), so rows never move between groups and counts never
 * change under the reader's eyes; a row that was not read says nothing about setup (C3-90, G-029).
 */
import { ChevronDown, ChevronRight, Search } from "lucide-vue-next";
import { computed, nextTick, onMounted, ref, watch, type DeepReadonly } from "vue";
import StatusChip from "@/components/StatusChip.vue";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { say } from "@/lib/announcer";
import { describeError } from "@/lib/errors";
import { formatDate } from "@/lib/format";
import { fold } from "@/lib/utils";
import { statusWord } from "@/lib/glossary";
import type { Organisation, Project } from "@/platform/catalogue";
import { ensureDetailed, loadProjects, needsSetup, projectsState, projectTarget } from "@/stores/projects";
import { recentProjectIds } from "@/workspace/lastProject";

const props = withDefaults(
  defineProps<{
    /** `popover` is the compact header list (current Project marked, search focused on open); `page` is Home. */
    variant?: "page" | "popover";
    /** The open Project, if any. */
    currentId?: string | null;
    /** A Project the page already offers elsewhere (Home's "Continue"), left out of "Recent" so it does not repeat. */
    omitRecentId?: string | null;
  }>(),
  { variant: "page", currentId: null, omitRecentId: null },
);
const emit = defineEmits<{ navigate: [] }>();

interface Entry {
  project: DeepReadonly<Project>;
  organisation: DeepReadonly<Organisation>;
}
interface Section {
  key: string;
  title: string;
  entries: Entry[];
}

const query = ref("");
const root = ref<HTMLElement | null>(null);
const setupOpen = ref(false);
const activeId = ref<string | null>(null);

const entries = computed<Entry[]>(() =>
  projectsState.groups.flatMap((g) => g.projects.map((project) => ({ project, organisation: g.organisation }))),
);

const term = computed(() => fold(query.value.trim()));
const searching = computed(() => term.value.length > 0);

const matches = computed(() =>
  searching.value
    ? entries.value.filter((e) => fold(`${e.project.name} ${e.project.slug} ${e.organisation.name}`).includes(term.value))
    : entries.value,
);

/** Current and Recent rows, which stay where the author last worked even when they still need setup. */
const leadSections = computed<Section[]>(() => {
  const result: Section[] = [];
  if (searching.value) return result;
  const list = matches.value;
  const used = new Set<string>();
  const current = list.find((e) => e.project.id === props.currentId);
  if (current && props.variant === "popover") {
    result.push({ key: "current", title: "Current project", entries: [current] });
    used.add(current.project.id);
  }
  const recents = recentProjectIds()
    .map((id) => list.find((e) => e.project.id === id))
    .filter((e): e is Entry => !!e && !used.has(e.project.id) && e.project.id !== props.omitRecentId);
  if (recents.length) result.push({ key: "recent", title: "Recent", entries: recents });
  return result;
});
const leadIds = computed(() => new Set(leadSections.value.flatMap((s) => s.entries.map((e) => e.project.id))));
/** Projects read and found not initialized, offered for resuming. Never in an organisation group, never twice. */
const setupEntries = computed(() => matches.value.filter((e) => needsSetup(e.project) && !leadIds.value.has(e.project.id)));

/** Organisation groups: Projects whose setup state is known to be fine, or not read yet (those say so on their row). */
const organisationSections = computed<Section[]>(() => {
  const byOrganisation = new Map<string, Section>();
  for (const e of matches.value) {
    if (leadIds.value.has(e.project.id) || needsSetup(e.project)) continue;
    const section = byOrganisation.get(e.organisation.id) ?? { key: `org-${e.organisation.id}`, title: e.organisation.name, entries: [] };
    section.entries.push(e);
    byOrganisation.set(e.organisation.id, section);
  }
  return [...byOrganisation.values()];
});

/** Rows not read for their setup state (G-029: the listing carries none, so only the first rows are read). */
const unchecked = computed(() => entries.value.filter((e) => !e.project.detailed).length);

/** False until the first batch of setup reads has landed (or 3 s passed): the list is drawn once, in its final order. */
const settled = ref(false);
const SETTLE_MS = 3000;
let settling = false;

/** Display order: Current, Recent, "Needs setup" (resuming first), then the organisations. */
const sections = computed<Section[]>(() => [
  ...leadSections.value,
  ...(setupEntries.value.length ? [{ key: "setup", title: "Needs setup", entries: setupEntries.value }] : []),
  ...organisationSections.value,
]);
/** While searching, a match inside "Needs setup" opens the group so it is not hidden. */
const setupShown = computed(() => setupOpen.value || (searching.value && setupEntries.value.length > 0));

const orderedIds = computed(() => sections.value.filter((s) => s.key !== "setup" || setupShown.value).flatMap((s) => s.entries.map((e) => e.project.id)));
const tabbableId = computed(() => (activeId.value && orderedIds.value.includes(activeId.value) ? activeId.value : orderedIds.value[0] ?? null));

const total = computed(() => entries.value.length);
const hasRows = computed(() => orderedIds.value.length > 0 || setupEntries.value.length > 0);

/** How many Projects the picker reads for their setup state at once; the rest open their Dashboard unchecked (G-029). */
const READ_LIMIT = 12;
// Reads the open Project, the Recent ones and the first rows of the current result, in a fixed order that does not depend
// on what the reads find (a Project that turns out to need setup moves groups, and must not pull the next one in).
watch(
  [matches, () => props.currentId, () => projectsState.status],
  ([list, current, status]) => {
    // Nothing to read, or to settle, while the listing is loading or failed.
    if (status !== "ready") return;
    const recent = recentProjectIds();
    const ids = [...new Set([...(current ? [current] : []), ...recent, ...list.map((e) => e.project.id)])];
    const reads = ensureDetailed(ids.slice(0, READ_LIMIT));
    if (settled.value || settling) return;
    settling = true;
    const limit = new Promise<void>((resolve) => setTimeout(resolve, SETTLE_MS));
    void Promise.race([reads, limit]).then(() => {
      settled.value = true;
    });
  },
  { immediate: true },
);

let announceTimer: ReturnType<typeof setTimeout> | undefined;
watch(term, () => {
  clearTimeout(announceTimer);
  announceTimer = setTimeout(() => {
    if (!searching.value) return;
    const n = matches.value.length;
    say(n === 0 ? "No projects match" : `${n} of ${total.value} projects shown`);
  }, 400);
});

/** The rows in page order, for the arrow-key model. */
function rows(): HTMLElement[] {
  return root.value ? [...root.value.querySelectorAll<HTMLElement>("[data-project-row]")] : [];
}

function focusRow(el: HTMLElement | undefined) {
  if (!el) return;
  activeId.value = el.dataset.projectRow ?? null;
  void nextTick(() => {
    el.focus();
    el.scrollIntoView({ block: "nearest" });
  });
}

function inputEl(): HTMLInputElement | null {
  return root.value?.querySelector<HTMLInputElement>("[data-project-search]") ?? null;
}

function onKeydown(event: KeyboardEvent) {
  if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
  const all = rows();
  if (!all.length) return;
  const target = event.target as HTMLElement;
  const onSearch = target === inputEl();
  const index = all.indexOf(target.closest<HTMLElement>("[data-project-row]") as HTMLElement);
  if (onSearch) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      focusRow(all[0]);
    }
    return;
  }
  if (index < 0) return;
  event.preventDefault();
  if (event.key === "ArrowDown") focusRow(all[Math.min(index + 1, all.length - 1)]);
  else if (event.key === "ArrowUp") {
    if (index === 0) inputEl()?.focus();
    else focusRow(all[index - 1]);
  } else if (event.key === "Home") focusRow(all[0]);
  else focusRow(all[all.length - 1]);
}

onMounted(async () => {
  if (projectsState.status === "idle") void loadProjects();
  await nextTick();
  if (props.variant === "popover") {
    // The popover opens on the search, with the current Project in view in the list below it.
    inputEl()?.focus();
    root.value?.querySelector<HTMLElement>('[aria-current="page"]')?.scrollIntoView({ block: "nearest" });
  }
});

/** The one sentence for a failed listing (503 is "busy or down for maintenance", D-105). */
const loadError = computed(() => describeError(projectsState.error, "load your projects"));

const appStatus = (p: DeepReadonly<Project>): string | null => (p.detailed && p.initialized && p.applicationStatus ? p.applicationStatus : null);
</script>

<template>
  <div ref="root" class="flex min-h-0 flex-col" :class="variant === 'popover' ? 'flex-1' : ''" @keydown="onKeydown">
    <div :class="variant === 'popover' ? 'border-b border-border p-3' : 'mb-4'">
      <label for="project-search" class="sr-only">Search projects by name, address or organisation</label>
      <div class="relative">
        <Search class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <Input
          id="project-search"
          v-model="query"
          data-project-search
          type="search"
          autocomplete="off"
          spellcheck="false"
          class="pl-9"
          placeholder="Search projects"
          :aria-describedby="variant === 'page' ? 'project-search-hint' : undefined"
        />
      </div>
      <p v-if="variant === 'page'" id="project-search-hint" class="mt-1.5 text-xs text-muted-foreground">
        Searches name, address (slug) and organisation. Use the arrow keys to move through the list.
      </p>
    </div>

    <div :class="variant === 'popover' ? 'min-h-0 flex-1 overflow-y-auto overscroll-contain' : ''">
      <div v-if="projectsState.status === 'loading' || projectsState.status === 'idle' || (projectsState.status === 'ready' && !settled)" class="space-y-3 p-3" role="status" aria-busy="true">
        <Skeleton class="h-4 w-2/5" />
        <Skeleton v-for="n in 3" :key="n" class="h-16 w-full" />
        <p class="text-xs text-muted-foreground">{{ projectsState.status === "ready" ? "Checking setup..." : "Loading projects" }}</p>
      </div>

      <div v-else-if="projectsState.status === 'error'" :class="variant === 'popover' ? 'p-3' : ''">
        <Alert tone="danger" :title="loadError.title" :request-id="loadError.requestId">
          {{ loadError.body }}
          <template #actions><Button size="sm" variant="secondary" @click="loadProjects()">Try again</Button></template>
        </Alert>
      </div>

      <p v-else-if="!total" class="px-3 py-4 text-sm text-muted-foreground">
        The UNICHE Catalogue lists no Projects for you yet. A manager of your organisation can create one or add you to one.
      </p>

      <template v-else>
        <p v-if="!hasRows" class="px-3 py-4 text-sm text-muted-foreground" role="status">
          No project matches this search. Try part of the name, or the organisation.
        </p>

        <template v-for="section in sections" :key="section.key">
          <section v-if="section.key !== 'setup'" :aria-labelledby="`pl-${variant}-${section.key}`" class="mb-3 last:mb-0">
            <h2 :id="`pl-${variant}-${section.key}`" class="px-3 pb-1 pt-2 text-xs font-semibold text-muted-foreground">
              {{ section.title }}<span v-if="section.key.startsWith('org-')" class="tabular font-medium"> ({{ section.entries.length }})</span>
            </h2>
            <ul :class="variant === 'page' ? 'overflow-hidden rounded-lg border border-border bg-card shadow-1' : ''">
              <li v-for="e in section.entries" :key="e.project.id" :class="variant === 'page' ? 'border-b border-border last:border-b-0' : ''">
                <RouterLink
                  :to="projectTarget(e.project)"
                  :data-project-row="e.project.id"
                  :tabindex="e.project.id === tabbableId ? 0 : -1"
                  :aria-current="e.project.id === currentId ? 'page' : undefined"
                  class="block min-h-row px-3 py-2.5 text-foreground no-underline hover:bg-surface-hover hover:text-foreground"
                  :class="e.project.id === currentId ? 'bg-accent' : ''"
                  @focus="activeId = e.project.id"
                  @click="emit('navigate')"
                >
                  <span class="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span class="min-w-0 flex-1 break-words text-sm font-semibold">{{ e.project.name }}</span>
                    <StatusChip v-if="appStatus(e.project)" :status="appStatus(e.project) as string" :label="`Visitor app: ${statusWord(appStatus(e.project) as string)}`" />
                    <Chip v-else-if="needsSetup(e.project)" tone="warning">Not initialized</Chip>
                  </span>
                  <span class="mt-0.5 flex flex-wrap items-baseline gap-x-2 text-xs text-muted-foreground">
                    <span class="mono break-all">{{ e.project.slug }}</span>
                    <template v-if="needsSetup(e.project)"><span>Initialize it to open it.</span></template>
                    <template v-else>
                      <span v-if="e.project.template">{{ e.project.template.name }}</span>
                      <span v-if="e.project.updatedAt">Updated {{ formatDate(e.project.updatedAt) }}</span>
                    </template>
                  </span>
                </RouterLink>
              </li>
            </ul>
          </section>

          <section v-else aria-labelledby="needs-setup-heading" class="mb-3 last:mb-0">
            <h2 id="needs-setup-heading" class="px-3 pb-1 pt-2 text-xs font-semibold text-muted-foreground">
              <button
                type="button"
                class="inline-flex min-h-8 items-center gap-1.5 rounded-sm text-xs font-semibold [@media(pointer:coarse)]:min-h-11"
                :aria-expanded="setupShown"
                aria-controls="needs-setup-list"
                @click="setupOpen = !setupOpen"
              >
                <component :is="setupShown ? ChevronDown : ChevronRight" class="size-4" aria-hidden="true" />
                Needs setup ({{ setupEntries.length }}{{ unchecked ? "+" : "" }})
              </button>
            </h2>
            <p v-if="!setupShown" class="px-3 pb-1 text-xs text-muted-foreground">
              Created but not initialized. Open the group to resume initialization.
              <template v-if="unchecked">{{ unchecked }} {{ unchecked === 1 ? "project has" : "projects have" }} not been checked for setup yet.</template>
            </p>
            <ul v-if="setupShown" id="needs-setup-list" :class="variant === 'page' ? 'overflow-hidden rounded-lg border border-border bg-card shadow-1' : ''">
              <li v-for="e in setupEntries" :key="e.project.id" :class="variant === 'page' ? 'border-b border-border last:border-b-0' : ''">
                <RouterLink
                  :to="projectTarget(e.project)"
                  :data-project-row="e.project.id"
                  :tabindex="e.project.id === tabbableId ? 0 : -1"
                  class="flex min-h-row items-center gap-3 px-3 py-2.5 text-foreground no-underline hover:bg-surface-hover hover:text-foreground"
                  @focus="activeId = e.project.id"
                  @click="emit('navigate')"
                >
                  <span class="min-w-0 flex-1">
                    <span class="block break-words text-sm font-semibold">{{ e.project.name }}</span>
                    <span class="mono block break-all text-muted-foreground">{{ e.project.slug }}</span>
                    <span class="block text-xs text-muted-foreground">{{ e.organisation.name }}</span>
                  </span>
                  <span class="inline-flex min-h-8 flex-none items-center rounded-md border border-input px-3 text-sm font-semibold text-primary">Resume initialization</span>
                </RouterLink>
              </li>
            </ul>
          </section>
        </template>
      </template>
    </div>
  </div>
</template>
