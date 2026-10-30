<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from "vue";
import ReorderControls from "@/components/ReorderControls.vue";
import TriggerChips from "@/components/TriggerChips.vue";
import { groupTriggersByTarget, listProjectTriggers, type Trigger } from "@/platform/triggers";
import { saveOrder } from "@/platform/ordering";
import { dropLineClass, useReorder } from "@/workspace/useReorder";
import { useRouter } from "vue-router";
import PageHead from "@/components/PageHead.vue";
import StatusChangeDialog from "@/components/StatusChangeDialog.vue";
import { Button } from "@/components/ui/button";
import { formatDate, statusChipStyle } from "@/lib/format";
import { ApiError } from "@/platform/api";
import type { ResourceStatus } from "@/platform/places";
import {
  changeEventStatus,
  eventCompleteness,
  eventTitle,
  fetchEventReferences,
  formatOccurrence,
  listEvents,
  nextOccurrence,
  type CmsEvent,
} from "@/platform/events";
import { showToast } from "@/stores/toast";
import { handOffActivationErrors } from "@/workspace/activationHandoff";
import { useCurrentProject } from "@/workspace/currentProject";
import type { ResourceReference } from "@/platform/references";
import { referenceLink } from "@/workspace/referenceLinks";
import { findSection } from "@/workspace/sections";
import { useListFilters } from "@/workspace/listFilters";
import SearchLanguageSelect from "@/components/SearchLanguageSelect.vue";
import FeaturedFilterChip from "@/components/FeaturedFilterChip.vue";
import { useProjectLanguages } from "@/workspace/useProjectLanguages";
import CreateEventDialog from "./CreateEventDialog.vue";

const section = findSection("events")!;
const project = useCurrentProject();
const router = useRouter();
const projectId = computed(() => project.value.id);
const { languages, defaultLanguage, error: languagesError, loading: languagesLoading } = useProjectLanguages(projectId);

const events = ref<CmsEvent[]>([]);
const loading = ref(true);
const loadError = ref<ApiError | null>(null);
/** Non-archived triggers by Resource; null when they could not be read, so no chips show. */
const triggersByTarget = ref<Map<string, Trigger[]> | null>(null);
let controller: AbortController | null = null;

async function load() {
  controller?.abort();
  controller = new AbortController();
  loading.value = true;
  loadError.value = null;
  try {
    const signal = controller.signal;
    // The chips are a hint: a failure to read them must not hide the list.
    const triggers = listProjectTriggers(projectId.value, signal).catch(() => null);
    events.value = await listEvents(projectId.value, signal);
    triggersByTarget.value = groupTriggersByTarget(await triggers, "EVENT");
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

type StatusFilter = "ALL" | ResourceStatus | "PENDING";
const statusFilter = ref<StatusFilter>("ALL");
const query = ref("");
const filters = useListFilters();
const { featuredOnly, searchLanguage } = filters;

function normalize(text: string): string {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

const rows = computed(() => {
  const q = normalize(query.value.trim());
  return [...events.value]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .filter((event) => {
      if (statusFilter.value === "PENDING" ? !event.hasWorkingCopy : statusFilter.value !== "ALL" && event.status !== statusFilter.value) return false;
      if (featuredOnly.value && !event.featured) return false;
      if (!q) return true;
      const haystack = [event.slug, ...filters.texts(event.translations, "title")];
      return haystack.some((text) => normalize(text).includes(q));
    });
});

const defaultLanguageInfo = computed(() => languages.value.find((l) => l.isDefault) ?? null);
const noLanguages = computed(() => !languagesLoading.value && !languagesError.value && !languages.value.length);

const countText = computed(() => {
  const total = events.value.length;
  const noun = total === 1 ? "event" : "events";
  return rows.value.length === total ? `${total} ${noun}` : `${rows.value.length} of ${total} ${noun}`;
});

function facts(event: CmsEvent): string {
  const count = event.occurrences.length;
  const next = nextOccurrence(event);
  const parts = [count === 1 ? "1 date" : `${count} dates`];
  parts.push(next ? `next ${formatOccurrence(next.startsAt, next.endsAt)}` : count ? "no upcoming date" : "no dates yet");
  return parts.join(" · ");
}

const dotStyles = {
  complete: { background: "#0f7a6e", borderColor: "#0f7a6e" },
  partial: { background: "rgba(154,98,0,0.35)", borderColor: "#9a6200" },
  missing: { background: "#ffffff", borderColor: "#d1d5db" },
} as const;
const dotLabels = { complete: "complete", partial: "partly translated", missing: "not translated" } as const;

function dots(event: CmsEvent) {
  return languages.value.map((l) => {
    const state = eventCompleteness(event, l.languageCode);
    return { code: l.languageCode, style: dotStyles[state], label: `${l.displayName}: ${dotLabels[state]}` };
  });
}

// Lifecycle actions -----------------------------------------------------------------------------------

const creating = ref(false);
const pendingId = ref<string | null>(null);
const confirm = ref<{ event: CmsEvent; target: ResourceStatus; blockedBy?: ResourceReference[] } | null>(null);

const title = (event: CmsEvent) => eventTitle(event, defaultLanguage.value);

function toggleLabel(event: CmsEvent): string {
  return event.status === "DRAFT" ? "Activate" : event.status === "ACTIVE" ? "Deactivate" : "Restore";
}

function onToggle(event: CmsEvent) {
  if (event.status === "DRAFT") void transition(event, "ACTIVE");
  else if (event.status === "ACTIVE") confirm.value = { event, target: "DRAFT" };
  else void transition(event, "DRAFT");
}

async function transition(event: CmsEvent, target: ResourceStatus) {
  pendingId.value = event.id;
  try {
    const updated = await changeEventStatus(projectId.value, event.id, target, event.version);
    events.value = events.value.map((r) => (r.id === updated.id ? updated : r));
    confirm.value = null;
    const messages: Record<ResourceStatus, [string, string]> = {
      ACTIVE: ["Activated", `${title(updated)} is complete and visible to visitors.`],
      DRAFT: event.status === "ARCHIVED"
        ? ["Restored", `${title(updated)} is a draft again.`]
        : ["Deactivated", `${title(updated)} is a draft again and no longer visible to visitors.`],
      ARCHIVED: ["Archived", `${title(updated)} is archived.`],
    };
    const [heading, body] = messages[target];
    showToast(heading, body, target === "ACTIVE" ? "success" : "warning");
  } catch (e) {
    if (!(e instanceof ApiError)) throw e;
    if (e.code === "RESOURCE_IN_USE" && confirm.value) {
      confirm.value = { ...confirm.value, blockedBy: (e.body.references as ResourceReference[]) ?? [] };
      return;
    }
    confirm.value = null;
    if (e.code === "MISSING_REQUIRED_FIELDS") {
      // The editor shows every missing field and focuses the first (`12` §3, DECISIONS.md D-036).
      handOffActivationErrors(event.id, e);
      showToast("Cannot activate yet", `${title(event)} opens at the first missing field.`, "error");
      void router.push({ name: "event-editor", params: { projectId: projectId.value, eventId: event.id } });
    } else if (e.code === "VERSION_CONFLICT") {
      showToast("It changed meanwhile", "The list was reloaded; check it and try again.", "warning");
      void load();
    } else {
      showToast("The change was not saved", e.platformUnavailable ? "The UNICHE platform is not reachable." : e.message, "error");
    }
  } finally {
    pendingId.value = null;
  }
}

// A trigger that opens the event being changed links to its editor's "How visitors reach it" card.
const toReference = (r: ResourceReference) =>
  referenceLink(projectId.value, r, confirm.value && { resourceType: "EVENT", resourceId: confirm.value.event.id });

function onCreated(event: CmsEvent) {
  creating.value = false;
  showToast("Event created", "It is a draft. Add its dates, then activate it.");
  void router.push({ name: "event-editor", params: { projectId: projectId.value, eventId: event.id } });
}

const confirmCopy = computed(() => {
  const c = confirm.value;
  if (!c) return null;
  return c.target === "ARCHIVED"
    ? { heading: `Archive ${title(c.event)}?`, body: "An archived event leaves the visitor app and the default lists. Restoring it makes it a draft again.", action: "Archive" }
    : { heading: `Deactivate ${title(c.event)}?`, body: "Visitors stop seeing it on their next refresh. It becomes a draft you can edit.", action: "Deactivate" };
});
// Manual order (spec 12 section 3); off while a search or filter hides rows (DECISIONS.md D-017).
const reorder = useReorder<CmsEvent>({
  items: events,
  save: (ids) => saveOrder(projectId.value, "events", ids),
  title: (event) => title(event),
  canReorder: computed(() => !query.value.trim() && !featuredOnly.value && statusFilter.value === "ALL"),
  reload: load,
});
</script>

<template>
  <main class="relative min-w-0 flex-1 overflow-y-auto px-7 pb-16 pt-6">
    <PageHead :title="section.title" :subtitle="section.subtitle">
      <template #actions>
        <Button variant="brand" :disabled="!defaultLanguageInfo" @click="creating = true">New event</Button>
      </template>
    </PageHead>

    <div
      v-if="noLanguages"
      class="mb-5 flex flex-wrap items-center gap-3.5 rounded-lg border-l-[3px] border-l-[#9a6200] bg-[rgba(154,98,0,0.07)] px-[18px] py-3.5 text-[13px]"
    >
      <div class="min-w-[min(100%,260px)] flex-1">
        <strong class="mb-0.5 block text-[13px] font-bold">Add a language first</strong>
        <span class="text-gray-700">Every event has its title and texts per language, starting with the default language.</span>
      </div>
      <RouterLink :to="{ name: 'project-languages', params: { projectId } }" class="whitespace-nowrap text-[11px] font-bold uppercase tracking-[0.06em] text-primary">
        Set up languages
      </RouterLink>
    </div>

    <div v-if="loadError" role="alert" class="max-w-[640px] rounded-lg border border-l-[3px] border-l-destructive bg-card px-[18px] py-4">
      <strong class="block text-[13px] font-bold text-destructive">
        {{ loadError.platformUnavailable ? "The UNICHE platform is not reachable" : "The events could not be loaded" }}
      </strong>
      <p class="mt-1 text-[13px] text-gray-700">{{ loadError.message }}</p>
      <p v-if="loadError.requestId" class="mt-1 font-mono text-[11px] text-muted-foreground">Request id {{ loadError.requestId }}</p>
      <Button variant="outline" size="sm" class="mt-3" @click="load">Try again</Button>
    </div>

    <div v-else class="overflow-hidden rounded-lg border bg-card shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
      <div class="flex flex-wrap items-center gap-2.5 border-b px-[18px] py-3.5">
        <input
          v-model="query"
          type="search"
          aria-label="Search titles"
          placeholder="Search titles"
          class="min-w-[240px] flex-1 rounded-lg border-[1.5px] px-3 py-[9px] text-[13px] focus:border-primary focus:outline-none"
        />
        <SearchLanguageSelect v-model="searchLanguage" :languages="languages" />
        <FeaturedFilterChip v-model="featuredOnly" />
        <div class="flex flex-wrap gap-1.5" role="group" aria-label="Filter by status">
          <button
            v-for="chip in (['ALL', 'DRAFT', 'ACTIVE', 'ARCHIVED', 'PENDING'] as const)"
            :key="chip"
            type="button"
            class="rounded-full border px-[13px] py-1.5 text-[11px]"
            :class="statusFilter === chip ? 'border-primary bg-primary font-bold text-white' : 'bg-card font-semibold text-gray-700'"
            :aria-pressed="statusFilter === chip"
            @click="statusFilter = chip"
          >
            {{ chip === "ALL" ? "All" : chip === "PENDING" ? "Pending changes" : chip }}
          </button>
        </div>
        <span class="ml-auto text-[11px] text-muted-foreground">
          {{ reorder.enabled || reorder.saving ? "Sorted by order · drag or use the arrows to reorder" : "Clear the search and filters to reorder" }}
        </span>
        <p class="sr-only" aria-live="polite">{{ reorder.announcement }}</p>
      </div>

      <div v-if="loading" class="animate-skeleton" aria-busy="true" aria-label="Loading events">
        <div v-for="n in 3" :key="n" class="flex items-center gap-3.5 border-b border-gray-100 px-[18px] py-4">
          <div class="h-[13px] w-1/3 rounded bg-[#e2e3e7]"></div>
          <div class="flex-1"></div>
          <div class="h-2.5 w-[90px] rounded bg-[#eceef1]"></div>
        </div>
      </div>

      <div v-else-if="rows.length" class="overflow-x-auto">
        <table class="w-full min-w-[560px] table-fixed border-collapse">
          <thead>
            <tr>
              <th class="th w-[56px] px-2"><span class="sr-only">Order</span></th>
              <th class="th w-[41%] px-[18px]">Title</th>
              <th class="th w-[15%] px-3">Status</th>
              <th class="th w-[14%] px-3">Translations</th>
              <th class="th w-[30%] px-[18px] text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="event in rows" :key="event.id"
              class="hover:bg-muted"
              :class="dropLineClass(reorder.dropLine(event))"
              @dragover="reorder.dragOver(event, $event)"
              @drop="reorder.drop(event, $event)"
            >
              <td class="td px-2"><ReorderControls :reorder="reorder" :item="event" :title="title(event)" /></td>
              <td class="td px-[18px]">
                <div class="flex flex-wrap items-center gap-2">
                  <RouterLink
                    :to="{ name: 'event-editor', params: { projectId, eventId: event.id } }"
                    class="text-left text-[13px] font-semibold no-underline hover:underline"
                    :class="event.status === 'ARCHIVED' ? 'text-muted-foreground' : 'text-foreground'"
                  >
                    {{ title(event) }}
                  </RouterLink>
                  <span
                    v-if="event.featured"
                    class="rounded-full border bg-muted px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-[0.08em] text-muted-foreground"
                  >
                    Featured
                  </span>
                </div>
                <div class="mt-[3px] break-words text-[11px] text-gray-400">
                  <span class="font-mono">{{ event.slug }}</span> · {{ facts(event) }} · {{ formatDate(event.updatedAt) }}
                </div>
                <TriggerChips v-if="triggersByTarget" :triggers="triggersByTarget.get(event.id) ?? []" />
              </td>
              <td class="td px-3">
                <span
                  class="inline-flex items-center gap-[5px] rounded-full px-[9px] py-[3px] text-[10px] font-bold uppercase tracking-[0.07em]"
                  :style="statusChipStyle(event.status)"
                >
                  <span class="inline-block h-1.5 w-1.5 rounded-full bg-current"></span>{{ event.status }}
                </span>
                <span
                  v-if="event.hasWorkingCopy"
                  class="ml-1 inline-flex items-center rounded-full px-[9px] py-[3px] text-[10px] font-bold uppercase tracking-[0.07em]"
                  :style="statusChipStyle('PENDING')"
                  title="Has pending changes that visitors do not see yet"
                >
                  Pending changes
                </span>
              </td>
              <td class="td px-3">
                <div class="flex flex-wrap gap-2">
                  <span v-for="d in dots(event)" :key="d.code" :title="d.label" class="inline-flex items-center gap-1 text-[10px] font-bold text-muted-foreground">
                    <span class="inline-block h-[9px] w-[9px] rounded-full border-[1.5px]" :style="d.style"></span>
                    {{ d.code }}
                    <span class="sr-only">{{ d.label }}</span>
                  </span>
                </div>
              </td>
              <td class="td px-[18px]">
                <div class="flex flex-wrap items-center justify-end gap-2.5">
                  <button
                    type="button"
                    class="whitespace-nowrap rounded-full border bg-muted px-[13px] py-1.5 text-[10px] font-bold uppercase tracking-[0.06em] text-gray-700 disabled:opacity-50"
                    :disabled="pendingId === event.id"
                    @click="onToggle(event)"
                  >
                    {{ toggleLabel(event) }}
                  </button>
                  <button
                    v-if="event.status !== 'ARCHIVED'"
                    type="button"
                    class="whitespace-nowrap text-[10px] font-bold uppercase tracking-[0.06em] text-destructive disabled:opacity-50"
                    :disabled="pendingId === event.id"
                    @click="confirm = { event, target: 'ARCHIVED' }"
                  >
                    Archive
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-else class="px-6 py-12 text-center">
        <p class="mx-auto mb-[18px] max-w-[420px] text-[13px] text-muted-foreground">
          {{
            events.length
              ? "No event matches the search or the filters."
              : "Events are dated happenings visitors can plan around, such as a Saturday tour or a workshop."
          }}
        </p>
        <Button v-if="!events.length" variant="brand" :disabled="!defaultLanguageInfo" @click="creating = true">New event</Button>
      </div>

      <div class="border-t border-gray-100 px-[18px] py-3 text-[11px] text-muted-foreground">{{ countText }}</div>
    </div>

    <CreateEventDialog
      v-if="creating && defaultLanguageInfo"
      :project-id="projectId"
      :default-language="defaultLanguageInfo"
      @close="creating = false"
      @created="onCreated"
    />

    <StatusChangeDialog
      v-if="confirm && confirmCopy"
      :heading="confirmCopy.heading"
      :body="confirmCopy.body"
      :action-label="confirmCopy.action"
      :danger="confirm.target === 'ARCHIVED'"
      :busy="pendingId === confirm.event.id"
      :load-references="() => fetchEventReferences(projectId, confirm!.event.id)"
      :blocked-by="confirm.blockedBy ?? null"
      :link-for="toReference"
      @close="confirm = null"
      @confirm="transition(confirm.event, confirm.target)"
    />
  </main>
</template>

<style scoped>
.th {
  border-bottom: 1px solid #e5e7eb;
  padding-top: 10px;
  padding-bottom: 10px;
  text-align: left;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  color: #6b7280;
}
.th.text-right {
  text-align: right;
}
.td {
  border-bottom: 1px solid #f3f4f6;
  padding-top: 11px;
  padding-bottom: 11px;
  vertical-align: top;
}
</style>
