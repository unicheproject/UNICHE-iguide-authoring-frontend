<script setup lang="ts">
/**
 * Guides list (plan 2.2, D-076): the shared list scaffold with this kind's columns (title with slug and trigger chips;
 * story size: text blocks, references, reading time; status; translations), a Featured filter in the toolbar, manual order
 * with "Move to position...", and activation through the shared confirm. Filters, sort and search live in the URL.
 */
import { Star } from "lucide-vue-next";
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
import { formatDateTime, NBSP } from "@/lib/format";
import { ApiError } from "@/platform/api";
import { changeGuideStatus, fetchGuideReferences, guideCompleteness, guideTitle, listGuides, type Guide } from "@/platform/guides";
import { saveOrder } from "@/platform/ordering";
import { groupTriggersByTarget, listProjectTriggers, triggerLabel, type Trigger } from "@/platform/triggers";
import { showToast } from "@/stores/toast";
import { useCurrentProject } from "@/workspace/currentProject";
import { findSection } from "@/workspace/sections";
import { useProjectLanguages } from "@/workspace/useProjectLanguages";
import { useReorder } from "@/workspace/useReorder";
import LifecycleDialogs from "../LifecycleDialogs.vue";
import { matchedInOtherLanguage, searchTitles, sortByQuery, translationScore } from "../listRows";
import { fold } from "@/lib/utils";
import { useListLifecycle } from "../useListLifecycle";
import CreateGuideDialog from "./CreateGuideDialog.vue";

const section = findSection("guides")!;
const project = useCurrentProject();
const router = useRouter();
const projectId = computed(() => project.value.id);
const { languages, defaultLanguage, error: languagesError, loading: languagesLoading, reload: reloadLanguages } = useProjectLanguages(projectId);

const query = useListQuery();

const guides = ref<Guide[]>([]);
/** Non-archived triggers by Guide; null when they could not be read (each row then says "Triggers not loaded"). */
const triggersByGuide = ref<Map<string, Trigger[]> | null>(null);
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
    const [found, triggerRows] = await Promise.all([listGuides(projectId.value, signal), triggers]);
    guides.value = found;
    triggersByGuide.value = triggerRows ? groupTriggersByTarget(triggerRows, "GUIDE") : null;
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

const title = (guide: Guide) => guideTitle(guide, defaultLanguage.value);

/** What a Guide's story is made of: text blocks, references to other items, and the author's reading time. */
function story(guide: Guide) {
  const references = guide.blocks.filter((b) => b.blockType === "REFERENCE").length;
  return { texts: guide.blocks.length - references, references, minutes: guide.estimatedReadingMinutes };
}
const count = (n: number, one: string, many: string) => `${n}${NBSP}${n === 1 ? one : many}`;

/** Rows that pass every filter except the status segment: the segment counts are taken from these (no false zeros). */
const filteredAnyStatus = computed(() => {
  const q = fold(query.q.value.trim());
  return guides.value.filter((guide) => {
    if (query.pending.value && !guide.hasWorkingCopy) return false;
    if (query.missing.value && guideCompleteness(guide, query.missing.value) === "complete") return false;
    if (query.featured.value && !guide.featured) return false;
    if (!q) return true;
    const triggerTexts = (triggersByGuide.value?.get(guide.id) ?? []).map(triggerLabel);
    return [guide.slug, ...searchTitles(guide.translations, query.lang.value), ...triggerTexts].some((t) => fold(t).includes(q));
  });
});
const counts = computed(() => statusCounts(filteredAnyStatus.value));

const rows = computed(() => {
  const found = filteredAnyStatus.value.filter((guide) => matchesStatus(guide, query.status.value));
  return sortByQuery(found, query, (guide) => ({
    title: title(guide),
    status: guide.status,
    updated: guide.updatedAt,
    translations: translationScore(languages.value, (code) => guideCompleteness(guide, code)),
    sortOrder: guide.sortOrder,
  }));
});
const segmentCount = computed(() => segmentTotal(guides.value, query.status.value));

/** The language that explains a row the search found through a title other than the one shown. */
function matchOf(guide: Guide) {
  const match = matchedInOtherLanguage(guide.translations, query.q.value, defaultLanguage.value ?? "", [title(guide), guide.slug]);
  return match ? { match, languageName: languages.value.find((l) => l.languageCode === match.languageCode)?.displayName ?? match.languageCode } : null;
}

const defaultLanguageInfo = computed(() => languages.value.find((l) => l.isDefault) ?? null);
const noLanguages = computed(() => !languagesLoading.value && !languagesError.value && !languages.value.length);
const editorRoute = (guide: Guide) => ({ name: "guide-editor", params: { projectId: projectId.value, guideId: guide.id } });

const lifecycle = useListLifecycle<Guide>({
  items: guides,
  projectId,
  noun: "guide",
  referenceType: "GUIDE",
  title,
  changeStatus: changeGuideStatus,
  fetchReferences: fetchGuideReferences,
  editorRoute,
  reload: load,
  completeness: guideCompleteness,
  languages,
});

// Manual order (spec 12 section 3); off while a search or filter hides rows (D-017); a move steps over hidden ARCHIVED rows.
const reorder = useReorder<Guide>({
  items: guides,
  title,
  canReorder: query.canReorder,
  visible: (guide) => matchesStatus(guide, query.status.value),
  save: (ids) => saveOrder(projectId.value, "guides", ids),
  reload: load,
});

const ready = computed(() => !loading.value);
const { rowKeyFocus } = useScrollRestore(ready);

/** The optional read to run again from the notice's "Try again". */
function retrySource() {
  void load();
}

// Width budget (D-110, plan 9.7): Story 160 + Status 128 + Updated 152 + Translations 192 leave the Title 254 px at 1280.
const columns: ListColumn[] = [
  { key: "title", label: "Title", tree: true, sortKey: "title" },
  { key: "story", label: "Story", class: "w-40" },
  { key: "status", label: "Status", sortKey: "status", class: "w-32" },
  { key: "updated", label: "Updated", sortKey: "updated", class: "w-[9.5rem]" },
  { key: "translations", label: "Translations", sortKey: "translations" },
];
const SORTS = [
  { value: "manual", label: "Manual order" },
  { value: "title", label: "Title" },
  { value: "status", label: "Status" },
  { value: "updated", label: "Updated" },
  { value: "translations", label: "Translations" },
];
const creating = ref(false);
useResultAnnouncer(computed(() => rows.value.length), segmentCount, ready, "guides", { query, options: SORTS });
/** `?create=1` (Dashboard guide) opens the dialog once the default language is known. */
useCreateParam(creating, computed(() => !!defaultLanguageInfo.value));
/** Why "New guide" is off, or undefined. */
const createReason = computed(() => (defaultLanguageInfo.value ? undefined : languagesError.value ? "The languages could not be loaded" : languagesLoading.value ? "Loading languages" : "Add a language first"));

function onSelect(guide: Guide, key: string) {
  if (key === "restore-order") query.restoreManualOrder();
  else lifecycle.onSelect(guide, key);
}

function onCreated(guide: Guide) {
  creating.value = false;
  showToast("Guide created", "It is a draft. Write its story, then activate it.");
  void router.push(editorRoute(guide));
}
</script>

<template>
  <PageFrame>
    <PageHead :title="section.title" :subtitle="section.subtitle" section="guides">
      <template #actions>
        <Button :disabled-reason="createReason" @click="creating = true">New guide</Button>
      </template>
    </PageHead>

    <Alert v-if="noLanguages" tone="warning" title="Add a language first" class="mb-5">
      Every guide has its title and texts per language, starting with the default language.
      <template #actions>
        <Button as-child variant="secondary" size="sm">
          <RouterLink :to="{ name: 'project-languages', params: { projectId } }">Set up languages</RouterLink>
        </Button>
      </template>
    </Alert>

    <ListLoadError v-if="languagesError" :error="languagesError" what="the project's languages" @retry="reloadLanguages" />
    <ListLoadError v-else-if="loadError" :error="loadError" what="the guides" @retry="load" />

    <template v-else>
    <ListSourceNotice :errors="query.errors" @retry="retrySource" />
    <div class="rounded-lg border border-border bg-card shadow-1">
      <template v-if="loading || guides.length">
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
          label="Guides"
          openable
          @open="(guide) => router.push(editorRoute(guide))"
        >
          <template #cell-title="{ row }">
            <div class="flex flex-wrap items-center gap-x-2 gap-y-0.5">
              <ListRowTitle :to="editorRoute(row)" :muted="row.status === 'ARCHIVED'" :missing="query.missing.value">{{ title(row) }}</ListRowTitle>
              <Chip v-if="row.featured" tone="brand" :icon="Star">Featured</Chip>
            </div>
            <p class="mono truncate text-compact text-muted-foreground" :title="row.slug">{{ row.slug }}</p>
            <MatchHint v-if="matchOf(row)" v-bind="matchOf(row)!" />
            <TriggerChips :triggers="triggersByGuide?.get(row.id) ?? []" :unavailable="triggersByGuide === null" />
          </template>
          <template #cell-story="{ row }">
            <p class="text-sm font-medium">{{ count(story(row).texts, "text block", "text blocks") }}</p>
            <p class="text-compact text-muted-foreground">
              {{ count(story(row).references, "reference", "references") }}
            </p>
            <p v-if="story(row).minutes" class="whitespace-nowrap text-compact text-muted-foreground">{{ story(row).minutes }}{{ NBSP }}min{{ NBSP }}read</p>
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
            <TranslationDots names :route="editorRoute(row)" :languages="languages" :completeness="(code) => guideCompleteness(row, code)" />
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
        noun="guides"
        empty-title="No guides yet"
        :filtered="guides.length > 0"
        :filters="query.chips([], languages)"
        :counts="counts"
        :status="query.status.value"
        header-action
      >
        Guides are article-like reading pieces, such as the story of a collection, with references to points of interest and routes inside the story.
      </ListEmpty>
      <ListFooter v-if="loading || guides.length" :loading="loading" :shown="rows.length" :total="segmentCount" noun="guides" paged legend />
    </div>
    </template>

    <CreateGuideDialog
      v-if="creating && defaultLanguageInfo"
      :project-id="projectId"
      :default-language="defaultLanguageInfo"
      @close="creating = false"
      @created="onCreated"
    />
    <LifecycleDialogs :lifecycle="lifecycle" />
  </PageFrame>
</template>
