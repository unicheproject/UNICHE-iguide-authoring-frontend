<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from "vue";
import { useRouter } from "vue-router";
import CategoryFilterSelect from "@/components/CategoryFilterSelect.vue";
import PageHead from "@/components/PageHead.vue";
import StatusChangeDialog from "@/components/StatusChangeDialog.vue";
import { Button } from "@/components/ui/button";
import { formatDate, statusChipStyle } from "@/lib/format";
import { ApiError } from "@/platform/api";
import type { ResourceStatus } from "@/platform/places";
import { changeRouteStatus, fetchRouteReferences, listRoutes, routeCompleteness, routeModeLabel, routeTitle, routeTypeLabel, type Route } from "@/platform/routes";
import { showToast } from "@/stores/toast";
import { useCurrentProject } from "@/workspace/currentProject";
import type { ResourceReference } from "@/platform/references";
import { referenceLink } from "@/workspace/referenceLinks";
import { findSection } from "@/workspace/sections";
import { useCategoryFilter } from "@/workspace/useCategoryFilter";
import { useProjectLanguages } from "@/workspace/useProjectLanguages";
import CreateRouteDialog from "./CreateRouteDialog.vue";

const section = findSection("routes")!;
const project = useCurrentProject();
const router = useRouter();
const projectId = computed(() => project.value.id);
const { languages, defaultLanguage, error: languagesError, loading: languagesLoading } = useProjectLanguages(projectId);

const routes = ref<Route[]>([]);
const loading = ref(true);
const loadError = ref<ApiError | null>(null);
let controller: AbortController | null = null;

async function load() {
  controller?.abort();
  controller = new AbortController();
  loading.value = true;
  loadError.value = null;
  try {
    routes.value = await listRoutes(projectId.value, controller.signal);
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

type StatusFilter = "ALL" | ResourceStatus;
const statusFilter = ref<StatusFilter>("ALL");
const categoryFilter = useCategoryFilter(projectId, "ROUTE", defaultLanguage);
const categorySelected = categoryFilter.selected;
const query = ref("");

function normalize(text: string): string {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

const rows = computed(() => {
  const q = normalize(query.value.trim());
  return [...routes.value]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .filter((route) => {
      if (statusFilter.value !== "ALL" && route.status !== statusFilter.value) return false;
      if (!categoryFilter.matches(route.categoryId)) return false;
      if (!q) return true;
      const haystack = [route.slug, ...Object.values(route.translations).map((t) => t.title ?? "")];
      return haystack.some((text) => normalize(text).includes(q));
    });
});

const defaultLanguageInfo = computed(() => languages.value.find((l) => l.isDefault) ?? null);
const noLanguages = computed(() => !languagesLoading.value && !languagesError.value && !languages.value.length);

const countText = computed(() => {
  const total = routes.value.length;
  const noun = total === 1 ? "route" : "routes";
  return rows.value.length === total ? `${total} ${noun}` : `${rows.value.length} of ${total} ${noun}`;
});

function facts(route: Route): string {
  const parts = [route.stops.length === 1 ? "1 stop" : `${route.stops.length} stops`];
  if (route.mode) parts.unshift(routeModeLabel(route.mode));
  if (route.estimatedDurationMinutes) parts.push(`${route.estimatedDurationMinutes} min`);
  if (route.distanceMeters) parts.push(route.distanceMeters >= 1000 ? `${(route.distanceMeters / 1000).toFixed(1)} km` : `${route.distanceMeters} m`);
  if (route.loop) parts.push("loop");
  return parts.join(" · ");
}

const dotStyles = {
  complete: { background: "#0f7a6e", borderColor: "#0f7a6e" },
  partial: { background: "rgba(154,98,0,0.35)", borderColor: "#9a6200" },
  missing: { background: "#ffffff", borderColor: "#d1d5db" },
} as const;
const dotLabels = { complete: "complete", partial: "partly translated", missing: "not translated" } as const;

function dots(route: Route) {
  return languages.value.map((l) => {
    const state = routeCompleteness(route, l.languageCode);
    return { code: l.languageCode, style: dotStyles[state], label: `${l.displayName}: ${dotLabels[state]}` };
  });
}

// Lifecycle actions -----------------------------------------------------------------------------------

const creating = ref(false);
const pendingId = ref<string | null>(null);
const confirm = ref<{ route: Route; target: ResourceStatus; blockedBy?: ResourceReference[] } | null>(null);

const title = (route: Route) => routeTitle(route, defaultLanguage.value);

function toggleLabel(route: Route): string {
  return route.status === "DRAFT" ? "Activate" : route.status === "ACTIVE" ? "Deactivate" : "Restore";
}

function onToggle(route: Route) {
  if (route.status === "DRAFT") void transition(route, "ACTIVE");
  else if (route.status === "ACTIVE") confirm.value = { route, target: "DRAFT" };
  else void transition(route, "DRAFT");
}

async function transition(route: Route, target: ResourceStatus) {
  pendingId.value = route.id;
  try {
    const updated = await changeRouteStatus(projectId.value, route.id, target, route.version);
    routes.value = routes.value.map((r) => (r.id === updated.id ? updated : r));
    confirm.value = null;
    const messages: Record<ResourceStatus, [string, string]> = {
      ACTIVE: ["Activated", `${title(updated)} is complete and visible to visitors.`],
      DRAFT: route.status === "ARCHIVED"
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
      showToast("Cannot activate yet", e.details.map((d) => d.slice(d.indexOf(": ") + 2)).join(" "), "error");
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

const toReference = (r: ResourceReference) => referenceLink(projectId.value, r);

function onCreated(route: Route) {
  creating.value = false;
  showToast("Route created", "It is a draft. Add its stops, then activate it.");
  void router.push({ name: "route-editor", params: { projectId: projectId.value, routeId: route.id } });
}

const confirmCopy = computed(() => {
  const c = confirm.value;
  if (!c) return null;
  return c.target === "ARCHIVED"
    ? { heading: `Archive ${title(c.route)}?`, body: "An archived route leaves the visitor app and the default lists. Restoring it makes it a draft again.", action: "Archive" }
    : { heading: `Deactivate ${title(c.route)}?`, body: "Visitors stop seeing it on their next refresh. It becomes a draft you can edit.", action: "Deactivate" };
});
</script>

<template>
  <main class="relative min-w-0 flex-1 overflow-y-auto px-7 pb-16 pt-6">
    <PageHead :title="section.title" :subtitle="section.subtitle">
      <template #actions>
        <Button variant="brand" :disabled="!defaultLanguageInfo" @click="creating = true">New route</Button>
      </template>
    </PageHead>

    <div
      v-if="noLanguages"
      class="mb-5 flex flex-wrap items-center gap-3.5 rounded-lg border-l-[3px] border-l-[#9a6200] bg-[rgba(154,98,0,0.07)] px-[18px] py-3.5 text-[13px]"
    >
      <div class="min-w-[min(100%,260px)] flex-1">
        <strong class="mb-0.5 block text-[13px] font-bold">Add a language first</strong>
        <span class="text-gray-700">Every route has its title and texts per language, starting with the default language.</span>
      </div>
      <RouterLink :to="{ name: 'project-languages', params: { projectId } }" class="whitespace-nowrap text-[11px] font-bold uppercase tracking-[0.06em] text-primary">
        Set up languages
      </RouterLink>
    </div>

    <div v-if="loadError" role="alert" class="max-w-[640px] rounded-lg border border-l-[3px] border-l-destructive bg-card px-[18px] py-4">
      <strong class="block text-[13px] font-bold text-destructive">
        {{ loadError.platformUnavailable ? "The UNICHE platform is not reachable" : "The routes could not be loaded" }}
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
          aria-label="Search titles in all languages"
          placeholder="Search titles in all languages"
          class="min-w-[240px] flex-1 rounded-lg border-[1.5px] px-3 py-[9px] text-[13px] focus:border-primary focus:outline-none"
        />
        <CategoryFilterSelect v-model="categorySelected" :options="categoryFilter.options.value" />
        <div class="flex flex-wrap gap-1.5" role="group" aria-label="Filter by status">
          <button
            v-for="chip in (['ALL', 'DRAFT', 'ACTIVE', 'ARCHIVED'] as const)"
            :key="chip"
            type="button"
            class="rounded-full border px-[13px] py-1.5 text-[11px]"
            :class="statusFilter === chip ? 'border-primary bg-primary font-bold text-white' : 'bg-card font-semibold text-gray-700'"
            :aria-pressed="statusFilter === chip"
            @click="statusFilter = chip"
          >
            {{ chip === "ALL" ? "All" : chip }}
          </button>
        </div>
        <span class="ml-auto text-[11px] text-muted-foreground">Sorted by order</span>
      </div>

      <div v-if="loading" class="animate-skeleton" aria-busy="true" aria-label="Loading routes">
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
              <th class="th w-[41%] px-[18px]">Title</th>
              <th class="th w-[15%] px-3">Status</th>
              <th class="th w-[14%] px-3">Translations</th>
              <th class="th w-[30%] px-[18px] text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="route in rows" :key="route.id" class="hover:bg-muted">
              <td class="td px-[18px]">
                <div class="flex flex-wrap items-center gap-2">
                  <RouterLink
                    :to="{ name: 'route-editor', params: { projectId, routeId: route.id } }"
                    class="text-left text-[13px] font-semibold no-underline hover:underline"
                    :class="route.status === 'ARCHIVED' ? 'text-muted-foreground' : 'text-foreground'"
                  >
                    {{ title(route) }}
                  </RouterLink>
                  <span class="rounded-full border bg-muted px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-[0.08em] text-muted-foreground">
                    {{ routeTypeLabel(route.type) }}
                  </span>
                </div>
                <div class="mt-[3px] break-words text-[11px] text-gray-400">
                  <span class="font-mono">{{ route.slug }}</span> · {{ facts(route) }} · {{ formatDate(route.updatedAt) }}
                </div>
              </td>
              <td class="td px-3">
                <span
                  class="inline-flex items-center gap-[5px] rounded-full px-[9px] py-[3px] text-[10px] font-bold uppercase tracking-[0.07em]"
                  :style="statusChipStyle(route.status)"
                >
                  <span class="inline-block h-1.5 w-1.5 rounded-full bg-current"></span>{{ route.status }}
                </span>
              </td>
              <td class="td px-3">
                <div class="flex flex-wrap gap-2">
                  <span v-for="d in dots(route)" :key="d.code" :title="d.label" class="inline-flex items-center gap-1 text-[10px] font-bold text-muted-foreground">
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
                    :disabled="pendingId === route.id"
                    @click="onToggle(route)"
                  >
                    {{ toggleLabel(route) }}
                  </button>
                  <button
                    v-if="route.status !== 'ARCHIVED'"
                    type="button"
                    class="whitespace-nowrap text-[10px] font-bold uppercase tracking-[0.06em] text-destructive disabled:opacity-50"
                    :disabled="pendingId === route.id"
                    @click="confirm = { route, target: 'ARCHIVED' }"
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
            routes.length
              ? "No route matches the search or the filters."
              : "Routes are ordered journeys through your points of interest, such as a one-hour highlights tour."
          }}
        </p>
        <Button v-if="!routes.length" variant="brand" :disabled="!defaultLanguageInfo" @click="creating = true">New route</Button>
      </div>

      <div class="border-t border-gray-100 px-[18px] py-3 text-[11px] text-muted-foreground">{{ countText }}</div>
    </div>

    <CreateRouteDialog
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
      :busy="pendingId === confirm.route.id"
      :load-references="() => fetchRouteReferences(projectId, confirm!.route.id)"
      :blocked-by="confirm.blockedBy ?? null"
      :link-for="toReference"
      @close="confirm = null"
      @confirm="transition(confirm.route, confirm.target)"
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
