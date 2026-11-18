<script setup lang="ts">
/**
 * Events list (plan 2.2, D-076): the shared list scaffold with this kind's columns (title with slug and trigger chips;
 * next date: the next occurrence, how many there are, cancelled ones as text with an icon; status; translations), a Featured
 * filter, a "Next date" sort, manual order with "Move to position...", and activation through the shared confirm. Dates
 * are written by one formatter (`eventDates.ts`) in the Project timezone. Filters, sort and search live in the URL.
 */
import { Ban, Star } from "lucide-vue-next";
import { computed, onBeforeUnmount, ref, watch } from "vue";
import { useRouter } from "vue-router";
import ListEmpty from "@/components/list/ListEmpty.vue";
import ListFooter from "@/components/list/ListFooter.vue";
import ListLoadError from "@/components/list/ListLoadError.vue";
import ListRowTitle from "@/components/list/ListRowTitle.vue";
import ListSourceNotice from "@/components/list/ListSourceNotice.vue";
import MatchHint from "@/components/list/MatchHint.vue";
import ListTable, { type ListColumn } from "@/components/list/ListTable.vue";
import ListToolbar from "@/components/list/ListToolbar.vue";
import RowMenu from "@/components/list/RowMenu.vue";
import { useCreateParam } from "@/components/list/useCreateParam";
import { matchesStatus, segmentTotal, statusCounts, useListQuery, useResultAnnouncer, useScrollRestore } from "@/components/list/useListQuery";
import PageFrame from "@/components/PageFrame.vue";
import PageHead from "@/components/PageHead.vue";
import StatusChip from "@/components/StatusChip.vue";
import TranslationDots from "@/components/TranslationDots.vue";
import TriggerChips from "@/components/TriggerChips.vue";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Chip } from "@/components/ui/chip";
import { formatDate, formatDateTime, formatTime, NBSP } from "@/lib/format";
import { ApiError } from "@/platform/api";
import { changeEventStatus, eventCompleteness, eventTitle, fetchEventReferences, listEvents, type CmsEvent } from "@/platform/events";
import { saveOrder } from "@/platform/ordering";
import { groupTriggersByTarget, listProjectTriggers, triggerLabel, type Trigger } from "@/platform/triggers";
import { showToast } from "@/stores/toast";
import { useCurrentProject } from "@/workspace/currentProject";
import { useProjectSettings } from "@/workspace/projectSettings";
import { findSection } from "@/workspace/sections";
import { useProjectLanguages } from "@/workspace/useProjectLanguages";
import { useReorder } from "@/workspace/useReorder";
import LifecycleDialogs from "../LifecycleDialogs.vue";
import { matchedInOtherLanguage, searchTitles, sortByQuery, translationScore } from "../listRows";
import { fold } from "@/lib/utils";
import { useListLifecycle } from "../useListLifecycle";
import CreateEventDialog from "./CreateEventDialog.vue";
import { FALLBACK_TIME_ZONE, nextStart, summariseDates } from "./eventDates";

const section = findSection("events")!;
const project = useCurrentProject();
const router = useRouter();
const projectId = computed(() => project.value.id);
const { languages, defaultLanguage, error: languagesError, loading: languagesLoading, reload: reloadLanguages } = useProjectLanguages(projectId);

const query = useListQuery();

const events = ref<CmsEvent[]>([]);
/** Non-archived triggers by Event; null when they could not be read (each row then says "Triggers not loaded"). */
const triggersByEvent = ref<Map<string, Trigger[]> | null>(null);
const loading = ref(true);
const loadError = ref<ApiError | null>(null);
let controller: AbortController | null = null;

async function load() {
  controller?.abort();
  controller = new AbortController();
  loading.value = true;
  loadError.value = null;
  try {
    const signal = controller.signal;
    // The chips are a hint: a failure to read them must not hide the list (it is reported as a notice).
    const triggers = listProjectTriggers(projectId.value, signal).then(
      (found) => {
        query.reportError("triggers", null);
        return found;
      },
      (e: unknown) => {
        if (e instanceof DOMException && e.name === "AbortError") throw e;
        query.reportError("triggers", e);
        return null;
      },
    );
    // The rows are set only once the triggers read has settled, so the chips do not grow rows already on screen
    // (C3-91: the skeleton stays until then).
    const [found, triggerRows] = await Promise.all([listEvents(projectId.value, signal), triggers]);
    events.value = found;
    triggersByEvent.value = triggerRows ? groupTriggersByTarget(triggerRows, "EVENT") : null;
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") return;
    if (!(e instanceof ApiError)) throw e;
    loadError.value = e;
  } finally {
    loading.value = false;
  }
}
watch(projectId, load, { immediate: true });
onBeforeUnmount(() => controller?.abort());

const title = (event: CmsEvent) => eventTitle(event, defaultLanguage.value);

// Dates in the Project timezone (`03` §15), this browser's while the Project has none.
const settings = useProjectSettings(projectId);
const timeZone = computed(() => settings.value?.timezone ?? FALLBACK_TIME_ZONE);
const dates = (event: CmsEvent) => summariseDates(event, timeZone.value);

/** Rows that pass every filter except the status segment: the segment counts are taken from these (no false zeros). */
const filteredAnyStatus = computed(() => {
  const q = fold(query.q.value.trim());
  return events.value.filter((event) => {
    if (query.pending.value && !event.hasWorkingCopy) return false;
    if (query.missing.value && eventCompleteness(event, query.missing.value) === "complete") return false;
    if (query.featured.value && !event.featured) return false;
    if (!q) return true;
    const triggerTexts = (triggersByEvent.value?.get(event.id) ?? []).map(triggerLabel);
    return [event.slug, ...searchTitles(event.translations, query.lang.value), ...triggerTexts].some((t) => fold(t).includes(q));
  });
});
const counts = computed(() => statusCounts(filteredAnyStatus.value));
const segmentCount = computed(() => segmentTotal(events.value, query.status.value));

const rows = computed(() => {
  const found = filteredAnyStatus.value.filter((event) => matchesStatus(event, query.status.value));
  if (query.sort.value === "next") {
    const sign = query.dir.value === "desc" ? -1 : 1;
    return [...found].sort((a, b) => sign * nextStart(a).localeCompare(nextStart(b)) || a.sortOrder - b.sortOrder);
  }
  return sortByQuery(found, query, (event) => ({
    title: title(event),
    status: event.status,
    updated: event.updatedAt,
    translations: translationScore(languages.value, (code) => eventCompleteness(event, code)),
    sortOrder: event.sortOrder,
  }));
});

/** The next date written by the shared formatter in the Project timezone: "16 Nov 2026, 14:00" and its end. */
function nextLine(event: CmsEvent) {
  const next = dates(event).next;
  if (!next) return null;
  const { startsAt, endsAt } = next.occurrence;
  const zone = { timeZone: timeZone.value };
  const sameDay = formatDate(startsAt, zone) === formatDate(endsAt, zone);
  return { start: formatDateTime(startsAt, zone), end: sameDay ? `until${NBSP}${formatTime(endsAt, zone)}` : `until ${formatDateTime(endsAt, zone)}` };
}

/** The language that explains a row the search found through a title other than the one shown. */
function matchOf(event: CmsEvent) {
  const match = matchedInOtherLanguage(event.translations, query.q.value, defaultLanguage.value ?? "", [title(event), event.slug]);
  return match ? { match, languageName: languages.value.find((l) => l.languageCode === match.languageCode)?.displayName ?? match.languageCode } : null;
}

const defaultLanguageInfo = computed(() => languages.value.find((l) => l.isDefault) ?? null);
const noLanguages = computed(() => !languagesLoading.value && !languagesError.value && !languages.value.length);
const editorRoute = (event: CmsEvent) => ({ name: "event-editor", params: { projectId: projectId.value, eventId: event.id } });

const lifecycle = useListLifecycle<CmsEvent>({
  items: events,
  projectId,
  noun: "event",
  referenceType: "EVENT",
  title,
  changeStatus: changeEventStatus,
  fetchReferences: fetchEventReferences,
  editorRoute,
  reload: load,
  completeness: eventCompleteness,
  languages,
});

// Manual order (spec 12 section 3); off while a search or filter hides rows (D-017); a move steps over hidden ARCHIVED rows.
const reorder = useReorder<CmsEvent>({
  items: events,
  title,
  canReorder: query.canReorder,
  visible: (event) => matchesStatus(event, query.status.value),
  save: (ids) => saveOrder(projectId.value, "events", ids),
  reload: load,
});

const ready = computed(() => !loading.value);
const { rowKeyFocus } = useScrollRestore(ready);

/** The optional read to run again from the notice's "Try again". */
function retrySource() {
  void load();
}

// Width budget (D-110, plan 9.7): Next date 168 + Status 128 + Updated 152 + Translations 192 leave the Title 246 px at 1280.
const columns: ListColumn[] = [
  { key: "title", label: "Title", tree: true, sortKey: "title" },
  { key: "dates", label: "Next date", sortKey: "next", class: "w-[10.5rem]" },
  { key: "status", label: "Status", sortKey: "status", class: "w-32" },
  { key: "updated", label: "Updated", sortKey: "updated", class: "w-[9.5rem]" },
  { key: "translations", label: "Translations", sortKey: "translations" },
];
const SORTS = [
  { value: "manual", label: "Manual order" },
  { value: "title", label: "Title" },
  { value: "status", label: "Status" },
  { value: "next", label: "Next date" },
  { value: "updated", label: "Updated" },
  { value: "translations", label: "Translations" },
];
const creating = ref(false);
useResultAnnouncer(computed(() => rows.value.length), segmentCount, ready, "events", { query, options: SORTS });
/** `?create=1` (Dashboard guide) opens the dialog once the default language is known. */
useCreateParam(creating, computed(() => !!defaultLanguageInfo.value));
/** Why "New event" is off, or undefined. */
const createReason = computed(() => (defaultLanguageInfo.value ? undefined : languagesError.value ? "The languages could not be loaded" : languagesLoading.value ? "Loading languages" : "Add a language first"));

function onSelect(event: CmsEvent, key: string) {
  if (key === "restore-order") query.restoreManualOrder();
  else lifecycle.onSelect(event, key);
}

function onCreated(event: CmsEvent) {
  creating.value = false;
  showToast("Event created", "It is a draft. Add its dates, then activate it.");
  void router.push(editorRoute(event));
}
</script>

<template>
  <PageFrame>
    <PageHead :title="section.title" :subtitle="section.subtitle" section="events">
      <template #actions>
        <Button :disabled-reason="createReason" @click="creating = true">New event</Button>
      </template>
    </PageHead>

    <Alert v-if="noLanguages" tone="warning" title="Add a language first" class="mb-5">
      Every event has its title and texts per language, starting with the default language.
      <template #actions>
        <Button as-child variant="secondary" size="sm">
          <RouterLink :to="{ name: 'project-languages', params: { projectId } }">Set up languages</RouterLink>
        </Button>
      </template>
    </Alert>

    <ListLoadError v-if="languagesError" :error="languagesError" what="the project's languages" @retry="reloadLanguages" />
    <ListLoadError v-else-if="loadError" :error="loadError" what="the events" @retry="load" />

    <template v-else>
    <ListSourceNotice :errors="query.errors" @retry="retrySource" />
    <div class="rounded-lg border border-border bg-card shadow-1">
      <template v-if="loading || events.length">
        <ListToolbar
          :query="query"
          :counts="counts"
          :loading="loading"
          :languages="languages"
          search-placeholder="Search title, slug or trigger"
          :sort-options="SORTS"
        >
          <template #filters-extra>
            <Checkbox v-model="query.featured.value">
              <span class="inline-flex items-center gap-1.5">
                <Star class="size-4" :class="query.featured.value ? 'fill-current text-primary' : 'text-muted-foreground'" aria-hidden="true" />
                Featured only
              </span>
            </Checkbox>
          </template>
        </ListToolbar>
        <ListTable
          :columns="columns"
          :rows="rows"
          :loading="loading"
          :query="query"
          :reorder="reorder"
          :row-label="title"
          :row-key-focus="rowKeyFocus"
          label="Events"
          openable
          @open="(event) => router.push(editorRoute(event))"
        >
          <template #cell-title="{ row }">
            <div class="flex flex-wrap items-center gap-x-2 gap-y-0.5">
              <ListRowTitle :to="editorRoute(row)" :muted="row.status === 'ARCHIVED'" :missing="query.missing.value">{{ title(row) }}</ListRowTitle>
              <Chip v-if="row.featured" tone="brand" :icon="Star">Featured</Chip>
            </div>
            <p class="mono truncate text-compact text-muted-foreground" :title="row.slug">{{ row.slug }}</p>
            <MatchHint v-if="matchOf(row)" v-bind="matchOf(row)!" />
            <TriggerChips :triggers="triggersByEvent?.get(row.id) ?? []" :unavailable="triggersByEvent === null" />
          </template>
          <template #cell-dates="{ row }">
            <template v-if="nextLine(row)">
              <p class="whitespace-nowrap text-sm font-medium tabular">{{ nextLine(row)!.start.replaceAll(" ", NBSP) }}</p>
              <p class="text-compact tabular text-muted-foreground">{{ nextLine(row)!.end }}<template v-if="row.occurrences.length > 1"> · next{{ NBSP }}of{{ NBSP }}{{ dates(row).count }}</template></p>
            </template>
            <p v-else class="text-sm font-medium">{{ dates(row).noneUpcoming ? "No upcoming date" : dates(row).count }}</p>
            <p v-if="dates(row).noneUpcoming" class="text-compact text-muted-foreground">{{ dates(row).count }}</p>
            <Chip v-if="dates(row).cancelled" tone="warning" :icon="Ban" class="mt-1">
              {{ dates(row).noneUpcoming && dates(row).cancelled === row.occurrences.length ? "All dates cancelled" : `${dates(row).cancelled} cancelled` }}
            </Chip>
          </template>
          <template #cell-status="{ row }">
            <div class="flex flex-wrap gap-1">
              <StatusChip :status="row.status" />
              <StatusChip v-if="row.hasWorkingCopy" status="PENDING" label="Pending changes" title="Has pending changes that visitors do not see yet" wrap />
            </div>
          </template>
          <template #cell-updated="{ row }">
            <time :datetime="row.updatedAt" class="tabular whitespace-nowrap text-compact text-muted-foreground">{{ formatDateTime(row.updatedAt).replaceAll(" ", NBSP) }}</time>
          </template>
          <template #cell-translations="{ row }">
            <TranslationDots names :route="editorRoute(row)" :languages="languages" :completeness="(code) => eventCompleteness(row, code)" />
          </template>
          <template #menu="{ row }">
            <RowMenu
              :title="title(row)"
              :actions="lifecycle.actionsFor(row)"
              :reorder="reorder"
              :item="row"
              :reorder-reason="query.reorderReason.value"
              @select="(key) => onSelect(row, key)"
            />
          </template>
        </ListTable>
      </template>
      <ListEmpty
        v-if="!loading && !rows.length"
        noun="events"
        empty-title="No events yet"
        :filtered="events.length > 0"
        :filters="query.chips([], languages)"
        :counts="counts"
        :status="query.status.value"
        header-action
      >
        An event is something that happens at set times, such as a guided tour or an exhibition opening. Each date is an occurrence, and an occurrence can be cancelled without removing the event.
      </ListEmpty>
      <ListFooter v-if="loading || events.length" :loading="loading" :shown="rows.length" :total="segmentCount" noun="events" paged legend />
    </div>
    </template>

    <CreateEventDialog
      v-if="creating && defaultLanguageInfo"
      :project-id="projectId"
      :default-language="defaultLanguageInfo"
      @close="creating = false"
      @created="onCreated"
    />
    <LifecycleDialogs :lifecycle="lifecycle" />
  </PageFrame>
</template>
