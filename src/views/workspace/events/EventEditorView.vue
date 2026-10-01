<script setup lang="ts">
import { computed, nextTick, reactive, ref } from "vue";
import EditorShell from "@/components/editor/EditorShell.vue";
import TranslationsPanel, { type TextFieldGroup, type TextFieldMeta } from "@/components/editor/TranslationsPanel.vue";
import MediaSlots, { type MediaSlot } from "@/components/media/MediaSlots.vue";
import { SLUG_PATTERN } from "@/lib/format";
import { listAssets, type Asset, type MediaBinding } from "@/platform/assets";
import {
  changeEventStatus,
  displayTimeZone,
  eventTitle,
  fetchEvent,
  fetchEventReferences,
  fromLocalInput,
  OCCURRENCE_STATUSES,
  toLocalInput,
  updateEvent,
  type CmsEvent,
  type EventTranslation,
  type OccurrenceStatus,
} from "@/platform/events";
import { listPlaces, placeTitle, type Place } from "@/platform/places";
import { listPois, poiTitle, type Poi } from "@/platform/pois";
import type { ResourceReference } from "@/platform/references";
import { listRoutes, routeTitle, type Route } from "@/platform/routes";
import { useCurrentProject } from "@/workspace/currentProject";
import { describeTranslationPath, ensureTextRows, optionalText, textsForApi, textsFrom, type Texts } from "@/workspace/formFields";
import { referenceLink } from "@/workspace/referenceLinks";
import { useProjectLanguages } from "@/workspace/useProjectLanguages";
import { useResourceEditor } from "@/workspace/useResourceEditor";
import { parentOptions } from "../places/placeTree";

const props = defineProps<{ eventId: string }>();
const project = useCurrentProject();
const projectId = computed(() => project.value.id);
const { languages, defaultLanguage, loading: languagesLoading } = useProjectLanguages(projectId);
const languageCodes = () => languages.value.map((l) => l.languageCode);

type TextKey = keyof EventTranslation;
const TEXT_KEYS: TextKey[] = ["title", "summary", "description", "locationText"];

const TEXT_META: Record<TextKey, TextFieldMeta> = {
  title: { label: "Title", multiline: false },
  summary: { label: "Summary", multiline: true, helper: "Short text shown in lists: what happens and for whom." },
  description: { label: "Description", multiline: true },
  locationText: { label: "Location text", multiline: false, helper: "Where to meet, such as “Main entrance, by the ticket desk”." },
};
const GROUPS: TextFieldGroup[] = [
  { id: "main", label: null, keys: ["title", "summary", "description"] },
  { id: "where", label: "Where", keys: ["locationText"], open: true },
];
const MEDIA_SLOTS: MediaSlot[] = [
  { usage: "HERO_IMAGE", label: "Primary image", accept: ["IMAGE"], recommended: true },
  { usage: "GALLERY_IMAGE", label: "Gallery", accept: ["IMAGE"], multiple: true },
];

const FIELD_NAMES: Record<string, string> = {
  slug: "Slug",
  internalName: "Internal name",
  bookingUrl: "Booking URL",
  placeId: "Place",
  poiId: "Point of interest",
  routeId: "Route",
  occurrences: "Occurrences",
};

const places = ref<Place[]>([]);
const pois = ref<Poi[]>([]);
const routes = ref<Route[]>([]);
const assets = ref<Asset[]>([]);

interface OccurrenceForm {
  key: string;
  id: string | null;
  startsAt: string;
  endsAt: string;
  status: OccurrenceStatus;
}

let keyCounter = 0;
const form = reactive({
  slug: "",
  placeId: "",
  poiId: "",
  routeId: "",
  bookingUrl: "",
  internalName: "",
  featured: false,
  translations: {} as Record<string, Texts<TextKey>>,
  occurrences: [] as OccurrenceForm[],
  media: [] as MediaBinding[],
});

const editor = useResourceEditor<CmsEvent>({
  kind: "event",
  source: () => props.eventId,
  languages,
  defaultLanguage,
  async load() {
    const [event, allPlaces, allPois, allRoutes, library] = await Promise.all([
      fetchEvent(projectId.value, props.eventId),
      listPlaces(projectId.value),
      listPois(projectId.value),
      listRoutes(projectId.value),
      listAssets(projectId.value),
    ]);
    places.value = allPlaces;
    pois.value = allPois;
    routes.value = allRoutes;
    assets.value = library;
    return event;
  },
  save: (event, version) =>
    updateEvent(projectId.value, event.id, {
      version,
      slug: form.slug,
      placeId: form.placeId || null,
      poiId: form.poiId || null,
      routeId: form.routeId || null,
      bookingUrl: optionalText(form.bookingUrl),
      internalName: optionalText(form.internalName),
      featured: form.featured,
      translations: textsForApi(TEXT_KEYS, languageCodes(), form.translations),
      occurrences: form.occurrences.map((o) => ({
        id: o.id,
        startsAt: fromLocalInput(o.startsAt)!,
        endsAt: fromLocalInput(o.endsAt)!,
        status: o.status,
      })),
      media: form.media.map((m) => ({ ...m })),
    }),
  changeStatus: (event, target, version) => changeEventStatus(projectId.value, event.id, target, version),
  loadReferences: (event) => fetchEventReferences(projectId.value, event.id),
  resetForm(event) {
    form.slug = event.slug;
    form.placeId = event.placeId ?? "";
    form.poiId = event.poiId ?? "";
    form.routeId = event.routeId ?? "";
    form.bookingUrl = event.bookingUrl ?? "";
    form.internalName = event.internalName ?? "";
    form.featured = event.featured;
    form.translations = Object.fromEntries(Object.entries(event.translations).map(([code, t]) => [code, textsFrom(TEXT_KEYS, t)]));
    form.occurrences = event.occurrences.map((o) => ({
      key: `o-${++keyCounter}`,
      id: o.id,
      startsAt: toLocalInput(o.startsAt),
      endsAt: toLocalInput(o.endsAt),
      status: o.status,
    }));
    form.media = event.media.map((m) => ({ ...m }));
  },
  ensureLanguageRows: () => ensureTextRows(TEXT_KEYS, languageCodes(), form.translations),
  formState: () => form,
  validate() {
    const found: Record<string, string> = {};
    if (!SLUG_PATTERN.test(form.slug)) found.slug = "Use lowercase Latin letters, digits, and single hyphens.";
    const url = form.bookingUrl.trim();
    if (url && !/^https?:\/\/[^\s/]+/i.test(url)) found.bookingUrl = "An address starting with https:// or http://.";
    form.occurrences.forEach((o, i) => {
      const start = fromLocalInput(o.startsAt);
      const end = fromLocalInput(o.endsAt);
      if (!start) found[`occurrences[${i}].startsAt`] = "Set when it starts.";
      if (!end) found[`occurrences[${i}].endsAt`] = "Set when it ends.";
      if (start && end && Date.parse(end) <= Date.parse(start)) found[`occurrences[${i}].endsAt`] = "It must end after it starts.";
    });
    return found;
  },
  describePath(path) {
    const occurrence = /^occurrences\[(\d+)\]/.exec(path);
    if (occurrence) return `Occurrence ${Number(occurrence[1]) + 1}`;
    if (/^media\[/.test(path)) return "Media";
    return describeTranslationPath(path, languages.value, TEXT_META) ?? FIELD_NAMES[path] ?? path;
  },
});

const toReference = (r: ResourceReference) => referenceLink(projectId.value, r);

const heading = computed(() => (editor.resource ? eventTitle(editor.resource, defaultLanguage.value) : "Event"));
const subtitle = computed(() => (editor.resource ? `Event · ${editor.resource.slug}` : ""));

// Where ------------------------------------------------------------------------------------------------

/** Archived resources cannot be chosen, but the current choice stays listed so it is not lost silently. */
function choices<T extends { id: string; status: string }>(list: T[], current: string, title: (item: T) => string) {
  return list
    .filter((item) => item.status !== "ARCHIVED" || item.id === current)
    .map((item) => ({ id: item.id, label: item.status === "ACTIVE" ? title(item) : `${title(item)} (${item.status.toLowerCase()})` }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

const placeChoices = computed(() => {
  const options = parentOptions(places.value, defaultLanguage.value);
  const current = places.value.find((p) => p.id === form.placeId);
  if (current && !options.some((o) => o.id === current.id)) {
    options.push({ id: current.id, label: `${placeTitle(current, null, defaultLanguage.value)} (archived)` });
  }
  return options;
});
const poiChoices = computed(() => choices(pois.value, form.poiId, (p) => poiTitle(p, defaultLanguage.value)));
const routeChoices = computed(() => choices(routes.value, form.routeId, (r) => routeTitle(r, defaultLanguage.value)));

// Occurrences --------------------------------------------------------------------------------------------

const now = Date.now();

function ended(o: OccurrenceForm): boolean {
  const end = fromLocalInput(o.endsAt);
  return !!end && Date.parse(end) < now;
}

function occurrenceError(index: number): string | undefined {
  const prefix = `occurrences[${index}]`;
  const messages = Object.entries(editor.errors).filter(([p]) => p.startsWith(prefix)).map(([, m]) => m);
  return messages.length ? [...new Set(messages)].join(" ") : undefined;
}

function shift(local: string, days: number): string {
  const d = new Date(local);
  d.setDate(d.getDate() + days);
  return toLocalInput(d.toISOString());
}

async function addOccurrence(repeatWeekly = false) {
  const last = form.occurrences[form.occurrences.length - 1];
  let startsAt: string;
  let endsAt: string;
  if (last && last.startsAt && last.endsAt) {
    const days = repeatWeekly ? 7 : 1;
    startsAt = shift(last.startsAt, days);
    endsAt = shift(last.endsAt, days);
  } else {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);
    startsAt = toLocalInput(tomorrow.toISOString());
    tomorrow.setHours(11);
    endsAt = toLocalInput(tomorrow.toISOString());
  }
  const key = `o-${++keyCounter}`;
  form.occurrences.push({ key, id: null, startsAt, endsAt, status: "SCHEDULED" });
  await nextTick();
  document.getElementById(`occ-start-${key}`)?.focus();
}

/** Keeps the list in time order after an edit, the order visitors see. */
function sortOccurrences() {
  form.occurrences.sort((a, b) => (a.startsAt < b.startsAt ? -1 : a.startsAt > b.startsAt ? 1 : 0));
}

const upcomingCount = computed(() => form.occurrences.filter((o) => !ended(o) && o.status === "SCHEDULED").length);

function chipClass(selected: boolean) {
  return selected ? "border-primary bg-primary text-white" : "border-gray-200 bg-white text-gray-700 hover:border-primary";
}
</script>

<template>
  <EditorShell
    :editor="editor"
    back-label="Events"
    :back-to="{ name: 'events', params: { projectId } }"
    :title="heading"
    :subtitle="subtitle"
    activation-hint="Activate it once the default-language title is set."
    :reference-link="toReference"
    :pending="languagesLoading"
  >
    <TranslationsPanel
      v-model:active-language="editor.activeLanguage"
      :project-id="projectId"
      :languages="languages"
      :texts="form.translations"
      :groups="GROUPS"
      :meta="TEXT_META"
      :readonly="!editor.editable"
      :error-languages="editor.languagesWithErrors"
      :field-error="editor.fieldError"
      title-required-hint="Required in the default language before the event can be activated."
    />

    <section class="overflow-hidden rounded-lg border bg-card">
      <div class="flex flex-wrap items-center gap-2.5 border-b px-5 py-3.5">
        <h2 class="flex-1 text-[11px] font-extrabold uppercase tracking-[0.09em] text-muted-foreground">
          Occurrences ({{ form.occurrences.length }})
        </h2>
        <span class="rounded-full border bg-muted px-2.5 py-0.5 font-mono text-[10px] text-muted-foreground" title="Times are entered and shown in this timezone">
          {{ displayTimeZone }}
        </span>
      </div>
      <p v-if="form.occurrences.length && !upcomingCount" class="border-b border-gray-100 px-5 py-3 text-xs font-semibold text-[#9a6200]">
        ⚠ No upcoming scheduled date: visitors will not see this event in the calendar.
      </p>
      <p v-if="editor.fieldError('occurrences')" class="border-b border-gray-100 px-5 py-3 text-xs font-semibold text-destructive">
        ⚠ {{ editor.fieldError("occurrences") }}
      </p>

      <div v-if="form.occurrences.length" class="overflow-x-auto">
        <table class="w-full min-w-[620px] border-collapse">
          <thead>
            <tr>
              <th class="th px-5">Starts</th>
              <th class="th px-3">Ends</th>
              <th class="th px-3">Status</th>
              <th class="th px-5"><span class="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            <template v-for="(o, index) in form.occurrences" :key="o.key">
              <tr :class="{ 'opacity-60': ended(o) }">
                <td class="td px-5">
                  <input
                    :id="`occ-start-${o.key}`"
                    v-model="o.startsAt"
                    type="datetime-local"
                    :readonly="!editor.editable"
                    :aria-label="`Occurrence ${index + 1} starts`"
                    class="field-input occ-input"
                    :class="{ invalid: editor.fieldError(`occurrences[${index}].startsAt`) }"
                    @change="sortOccurrences"
                  />
                </td>
                <td class="td px-3">
                  <input
                    v-model="o.endsAt"
                    type="datetime-local"
                    :readonly="!editor.editable"
                    :aria-label="`Occurrence ${index + 1} ends`"
                    class="field-input occ-input"
                    :class="{ invalid: editor.fieldError(`occurrences[${index}].endsAt`) }"
                  />
                </td>
                <td class="td px-3">
                  <span v-if="ended(o)" class="tag bg-muted text-muted-foreground">Ended</span>
                  <div v-else class="flex gap-1" role="group" :aria-label="`Status of occurrence ${index + 1}`">
                    <button
                      v-for="s in OCCURRENCE_STATUSES"
                      :key="s"
                      type="button"
                      :disabled="!editor.editable"
                      :aria-pressed="o.status === s"
                      class="rounded-full border-[1.5px] px-2.5 py-1 text-[10px] font-bold disabled:cursor-default"
                      :class="o.status === s ? (s === 'CANCELLED' ? 'border-destructive bg-destructive text-white' : 'border-primary bg-primary text-white') : chipClass(false)"
                      @click="o.status = s"
                    >
                      {{ s === "SCHEDULED" ? "Scheduled" : "Cancelled" }}
                    </button>
                  </div>
                </td>
                <td class="td px-5 text-right">
                  <button
                    v-if="editor.editable"
                    type="button"
                    class="px-1 text-[13px] text-destructive"
                    :aria-label="`Remove occurrence ${index + 1}`"
                    @click="form.occurrences.splice(index, 1)"
                  >
                    ✕
                  </button>
                </td>
              </tr>
              <tr v-if="occurrenceError(index)">
                <td colspan="4" class="px-5 pb-2.5 text-xs font-semibold text-destructive">⚠ {{ occurrenceError(index) }}</td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>
      <p v-else class="px-5 py-4 text-[13px] text-muted-foreground">No dates yet. Add the first occurrence of the event.</p>

      <div class="flex flex-wrap items-center gap-3 border-t border-gray-100 px-5 py-3.5">
        <button
          type="button"
          class="rounded-full border bg-muted px-4 py-2 text-[10px] font-bold uppercase tracking-[0.06em] text-gray-700 disabled:opacity-50"
          :disabled="!editor.editable"
          @click="addOccurrence()"
        >
          Add occurrence
        </button>
        <button
          v-if="editor.editable && form.occurrences.length"
          type="button"
          class="text-[11px] font-bold text-primary"
          @click="addOccurrence(true)"
        >
          Repeat weekly
        </button>
        <span class="ml-auto text-xs text-muted-foreground">Ended occurrences disappear from the visitor app automatically.</span>
      </div>
    </section>

    <MediaSlots
      :project-id="projectId"
      :slots="MEDIA_SLOTS"
      :media="form.media"
      :assets="assets"
      :languages="languages"
      :default-language="defaultLanguage"
      :readonly="!editor.editable"
      :field-error="editor.fieldError"
      @uploaded="assets.unshift($event)"
    />

    <section class="overflow-hidden rounded-lg border bg-card">
      <div class="border-b px-5 py-3.5">
        <h2 class="text-[11px] font-extrabold uppercase tracking-[0.09em] text-muted-foreground">Where and booking</h2>
      </div>
      <div class="flex flex-col gap-3.5 px-5 py-[18px]">
        <div class="grid grid-cols-[repeat(auto-fit,minmax(min(100%,220px),1fr))] gap-3.5">
          <div class="flex flex-col gap-1.5">
            <label for="f-place" class="small-label">Place</label>
            <select id="f-place" v-model="form.placeId" :disabled="!editor.editable" class="field-input" :class="{ invalid: editor.fieldError('placeId') }">
              <option value="">None</option>
              <option v-for="o in placeChoices" :key="o.id" :value="o.id">{{ o.label }}</option>
            </select>
            <span v-if="editor.fieldError('placeId')" class="text-xs font-semibold text-destructive">⚠ {{ editor.fieldError("placeId") }}</span>
          </div>
          <div class="flex flex-col gap-1.5">
            <label for="f-poi" class="small-label">Point of interest</label>
            <select id="f-poi" v-model="form.poiId" :disabled="!editor.editable" class="field-input" :class="{ invalid: editor.fieldError('poiId') }">
              <option value="">None</option>
              <option v-for="o in poiChoices" :key="o.id" :value="o.id">{{ o.label }}</option>
            </select>
            <span v-if="editor.fieldError('poiId')" class="text-xs font-semibold text-destructive">⚠ {{ editor.fieldError("poiId") }}</span>
          </div>
          <div class="flex flex-col gap-1.5">
            <label for="f-route" class="small-label">Route</label>
            <select id="f-route" v-model="form.routeId" :disabled="!editor.editable" class="field-input" :class="{ invalid: editor.fieldError('routeId') }">
              <option value="">None</option>
              <option v-for="o in routeChoices" :key="o.id" :value="o.id">{{ o.label }}</option>
            </select>
            <span v-if="editor.fieldError('routeId')" class="text-xs font-semibold text-destructive">⚠ {{ editor.fieldError("routeId") }}</span>
          </div>
        </div>
        <span class="text-xs text-muted-foreground">All optional. While the event uses them, they cannot be deactivated or archived.</span>
        <div class="flex flex-col gap-1.5">
          <label for="f-booking" class="small-label">Booking URL</label>
          <input
            id="f-booking"
            v-model="form.bookingUrl"
            :readonly="!editor.editable"
            type="url"
            inputmode="url"
            spellcheck="false"
            placeholder="https://"
            class="field-input"
            :class="{ invalid: editor.fieldError('bookingUrl') }"
          />
          <span v-if="editor.fieldError('bookingUrl')" class="text-xs font-semibold text-destructive">⚠ {{ editor.fieldError("bookingUrl") }}</span>
          <span v-else class="text-xs text-muted-foreground">Where visitors book or buy tickets. Leave empty when no booking is needed.</span>
        </div>
      </div>
    </section>

    <section class="overflow-hidden rounded-lg border bg-card">
      <div class="border-b px-5 py-3.5">
        <h2 class="text-[11px] font-extrabold uppercase tracking-[0.09em] text-muted-foreground">Details</h2>
      </div>
      <div class="flex flex-col gap-3.5 px-5 py-[18px]">
        <div class="flex flex-col gap-1.5">
          <label for="f-slug" class="small-label">Slug</label>
          <input
            id="f-slug"
            v-model="form.slug"
            :readonly="!editor.editable"
            spellcheck="false"
            class="field-input font-mono text-[13px]"
            :class="{ invalid: editor.fieldError('slug') }"
          />
          <span v-if="editor.fieldError('slug')" class="text-xs font-semibold text-destructive">⚠ {{ editor.fieldError("slug") }}</span>
          <span v-else class="text-xs text-muted-foreground">Used in URLs and QR targets. Changing it breaks printed QR codes.</span>
        </div>
        <div class="flex flex-col gap-1.5">
          <label for="f-internal" class="small-label">Internal name</label>
          <input id="f-internal" v-model="form.internalName" :readonly="!editor.editable" class="field-input" />
        </div>
        <label class="flex items-center gap-2.5 text-[13px] font-semibold">
          <input v-model="form.featured" type="checkbox" :disabled="!editor.editable" class="h-4 w-4 accent-primary" />
          Featured: highlighted in the visitor app's lists
        </label>
      </div>
    </section>

  </EditorShell>
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
.td {
  border-bottom: 1px solid #f3f4f6;
  padding-top: 9px;
  padding-bottom: 9px;
  vertical-align: middle;
}
.occ-input {
  padding: 7px 9px;
  font-size: 13px;
}
.tag {
  display: inline-block;
  border-radius: 9999px;
  padding: 3px 9px;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.07em;
}
</style>
