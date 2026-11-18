<script setup lang="ts">
import { CircleAlert, Plus, Repeat, Trash2 } from "lucide-vue-next";
import { computed, nextTick, reactive, ref, watch } from "vue";
import EditorSection from "@/components/editor/EditorSection.vue";
import EditorShell from "@/components/editor/EditorShell.vue";
import RemovedBar from "@/components/editor/RemovedBar.vue";
import { useUndoRemove } from "@/components/editor/undoRemove";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Chip } from "@/components/ui/chip";
import { DateTimeFields, FormField } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import Switch from "@/components/ui/switch/Switch.vue";
import { say } from "@/lib/announcer";
import EntityCombobox, { type ComboOption } from "./EntityCombobox.vue";
import { formatEventDay, formatEventPreview, formatEventSpan, formatEventWhen, localeForLanguage } from "./eventDates";
import TranslationsPanel, { type TextFieldGroup, type TextFieldMeta } from "@/components/editor/TranslationsPanel.vue";
import MediaSlots, { type MediaSlot } from "@/components/media/MediaSlots.vue";
import TriggersCard from "@/components/editor/TriggersCard.vue";
import { listTargetTriggers, saveWithTriggers, triggerToForm, type Trigger, type TriggerForm } from "@/platform/triggers";
import { SLUG_PATTERN } from "@/lib/format";
import { completenessOf, eventGaps } from "@/platform/completeness";
import { listAssets, type Asset, type MediaBinding } from "@/platform/assets";
import {
  changeEventStatus,
  browserTimeZone,
  eventFromResponse,
  eventTitle,
  eventWorkingCopyPayload,
  fetchEvent,
  fetchEventReferences,
  fromLocalInput,
  shiftLocal,
  toLocalInput,
  updateEvent,
  type CmsEvent,
  type EventTranslation,
  type OccurrenceStatus,
  type UpdateEventInput,
} from "@/platform/events";
import { listPlaces, placeTitle, type Place } from "@/platform/places";
import { listPois, poiTitle, type Poi } from "@/platform/pois";
import type { ResourceReference } from "@/platform/references";
import { listRoutes, routeTitle, type Route } from "@/platform/routes";
import { useCurrentProject } from "@/workspace/currentProject";
import { loadProjectSettings } from "@/workspace/projectSettings";
import { describeTranslationPath, ensureTextRows, optionalText, textsForApi, textsFrom, type Texts } from "@/workspace/formFields";
import { referenceLink } from "@/workspace/referenceLinks";
import { heroBlock, mediaBlocks, previewLanguages, textBlocks, textIn, type PreviewBlock, type PreviewModel } from "@/workspace/preview";
import { filledFields, translationStatus } from "@/workspace/translationStatus";
import { useProjectLanguages } from "@/workspace/useProjectLanguages";
import { useResourceEditor } from "@/workspace/useResourceEditor";
import { parentOptions } from "../places/placeTree";

const props = defineProps<{ eventId: string }>();
const project = useCurrentProject();
const projectId = computed(() => project.value.id);
const { languages, defaultLanguage, loading: languagesLoading } = useProjectLanguages(projectId);
const languageCodes = () => languages.value.map((l) => l.languageCode);

// Occurrence times are typed and shown in the Project timezone (`03` §15, CMS D-049); a Project without one uses
// this browser's. Read with the Event, before the form is filled.
const projectTimeZone = ref<string | null>(null);
const timeZone = computed(() => projectTimeZone.value ?? browserTimeZone);

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

// The Event as visitors would open it, from the live form (`12` §3, DECISIONS.md D-014).
const preview = computed<PreviewModel | null>(() => {
  if (!editor.resource) return null;
  const { language, fallbackName, codes } = previewLanguages(languages.value, editor.activeLanguage, defaultLanguage.value);
  const when = (o: OccurrenceForm) => {
    const start = fromLocalInput(o.startsAt, timeZone.value);
    const end = fromLocalInput(o.endsAt, timeZone.value);
    // One formatter, 24 h, in the previewed language (D-088).
    return start ? formatEventPreview(start, end, timeZone.value, language?.languageCode) : "Date not set";
  };
  const blocks: PreviewBlock[] = [
    ...heroBlock(form.media, assets.value, codes),
    ...textBlocks(form.translations, [
      { key: "summary", label: "Summary" },
      { key: "locationText", label: "Location text", heading: "Where" },
      { key: "description", label: "Description" },
    ], codes),
    {
      type: "list",
      heading: "Dates",
      items: [...form.occurrences]
        .sort((a, b) => a.startsAt.localeCompare(b.startsAt))
        .map((o) => ({ title: when(o), subtitle: o.status === "CANCELLED" ? "Cancelled" : undefined, muted: o.status === "CANCELLED" })),
    },
    ...(form.bookingUrl.trim() ? [{ type: "link" as const, label: "Book", url: form.bookingUrl.trim() }] : []),
    ...mediaBlocks(form.media, assets.value, codes),
  ];
  return { kindLabel: "Event", language, fallbackName, title: textIn(form.translations, "title", codes), blocks };
});

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
  triggers: [] as TriggerForm[],
});
// The triggers as last loaded or saved; the form is reset from them with the Event.
const savedTriggers = ref<Trigger[]>([]);

/** The editable state from the form, for a DRAFT save and a working copy alike. */
function input(): Omit<UpdateEventInput, "version"> {
  return {
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
      startsAt: fromLocalInput(o.startsAt, timeZone.value)!,
      endsAt: fromLocalInput(o.endsAt, timeZone.value)!,
      status: o.status,
    })),
    media: form.media.map((m) => ({ ...m })),
  };
}

const editor = useResourceEditor<CmsEvent>({
  kind: "event",
  source: () => props.eventId,
  languages,
  defaultLanguage,
  async load() {
    const [event, allPlaces, allPois, allRoutes, library, triggers, settings] = await Promise.all([
      fetchEvent(projectId.value, props.eventId),
      listPlaces(projectId.value),
      listPois(projectId.value),
      listRoutes(projectId.value),
      listAssets(projectId.value),
      listTargetTriggers(projectId.value, "EVENT", props.eventId),
      loadProjectSettings(projectId.value),
    ]);
    projectTimeZone.value = settings?.timezone ?? null;
    savedTriggers.value = triggers;
    places.value = allPlaces;
    pois.value = allPois;
    routes.value = allRoutes;
    assets.value = library;
    return event;
  },
  async save(event, version) {
    // Triggers are rows of their own and do not move the Event's version: saved first, put back when it is refused.
    const { saved, triggers } = await saveWithTriggers(projectId.value, "EVENT", event.id, form.triggers, () =>
      updateEvent(projectId.value, event.id, { version, ...input() }),
    );
    savedTriggers.value = triggers;
    return saved;
  },
  workingCopy: {
    kind: "events",
    projectId: () => projectId.value,
    payload: () => eventWorkingCopyPayload(input()),
    // Triggers are not in the working copy (backend D-026): "Save draft" saves them live around it.
    async around(event, save) {
      const { saved, triggers } = await saveWithTriggers(projectId.value, "EVENT", event.id, form.triggers, save);
      savedTriggers.value = triggers;
      return saved;
    },
    fromResponse: eventFromResponse,
  },
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
      startsAt: toLocalInput(o.startsAt, timeZone.value),
      endsAt: toLocalInput(o.endsAt, timeZone.value),
      status: o.status,
    }));
    form.media = event.media.map((m) => ({ ...m }));
    form.triggers = savedTriggers.value.map(triggerToForm);
  },
  ensureLanguageRows: () => ensureTextRows(TEXT_KEYS, languageCodes(), form.translations),
  formState: () => form,
  validate() {
    const found: Record<string, string> = {};
    if (!SLUG_PATTERN.test(form.slug)) found.slug = "Use lowercase Latin letters, digits, and single hyphens.";
    const url = form.bookingUrl.trim();
    if (url && !/^https?:\/\/[^\s/]+/i.test(url)) found.bookingUrl = "An address starting with https:// or http://.";
    form.occurrences.forEach((o, i) => {
      const start = fromLocalInput(o.startsAt, timeZone.value);
      const end = fromLocalInput(o.endsAt, timeZone.value);
      if (!start) found[`occurrences[${i}].startsAt`] = isWrong(o.key, "start") ? WRONG_PART : "Set when it starts.";
      if (!end) found[`occurrences[${i}].endsAt`] = isWrong(o.key, "end") ? WRONG_PART : "Set when it ends.";
      if (start && end && Date.parse(end) <= Date.parse(start)) found[`occurrences[${i}].endsAt`] = "It must end after it starts.";
    });
    return found;
  },
  describePath(path) {
    const occurrence = /^occurrences\[(\d+)\]/.exec(path);
    if (occurrence) return `Occurrence ${Number(occurrence[1]) + 1}`;
    if (/^media\[/.test(path)) return "Media";
    if (/^triggers\[/.test(path)) return "How visitors reach it";
    return describeTranslationPath(path, languages.value, TEXT_META) ?? FIELD_NAMES[path] ?? path;
  },
});

// A trigger that opens this event links to its own "How visitors reach it" card.
const toReference = (r: ResourceReference) => referenceLink(projectId.value, r, { resourceType: "EVENT", resourceId: props.eventId });

const heading = computed(() => (editor.resource ? eventTitle(editor.resource, defaultLanguage.value) : "Event"));
const subtitle = computed(() => (editor.resource ? `Event · ${editor.resource.slug}` : ""));

// Where ------------------------------------------------------------------------------------------------

/** Active ones first, then drafts marked "Draft"; archived ones only while chosen, so the choice is never lost silently. */
function choices<T extends { id: string; status: string }>(list: T[], current: string, title: (item: T) => string): ComboOption[] {
  const note = (status: string) => (status === "DRAFT" ? "Draft" : status === "ARCHIVED" ? "Archived" : undefined);
  return list
    .filter((item) => item.status !== "ARCHIVED" || item.id === current)
    .map((item) => ({ id: item.id, label: title(item), note: note(item.status), draft: item.status !== "ACTIVE" }))
    .sort((a, b) => Number(a.draft) - Number(b.draft) || a.label.localeCompare(b.label))
    .map(({ id, label, note: n }) => ({ id, label, note: n }));
}

const placeChoices = computed<ComboOption[]>(() => {
  const byId = new Map(places.value.map((p) => [p.id, p]));
  const options: ComboOption[] = parentOptions(places.value, defaultLanguage.value).map((o) => {
    const status = byId.get(o.id)?.status;
    return { id: o.id, label: o.label, note: status === "DRAFT" ? "Draft" : undefined };
  });
  const current = places.value.find((p) => p.id === form.placeId);
  if (current && !options.some((o) => o.id === current.id)) {
    options.push({ id: current.id, label: placeTitle(current, null, defaultLanguage.value), note: "Archived" });
  }
  return options;
});
/** Where a new geo-proximity area starts: the chosen point of interest's position, else the chosen place's. */
const eventPosition = computed(() => {
  const poi = pois.value.find((p) => p.id === form.poiId);
  const place = places.value.find((p) => p.id === form.placeId);
  const at = poi && poi.latitude !== null && poi.longitude !== null ? poi
    : place && place.latitude !== null && place.longitude !== null ? place : null;
  return at ? { latitude: String(at.latitude), longitude: String(at.longitude) } : null;
});

const poiChoices = computed(() => choices(pois.value, form.poiId, (p) => poiTitle(p, defaultLanguage.value)));
const routeChoices = computed(() => choices(routes.value, form.routeId, (r) => routeTitle(r, defaultLanguage.value)));

// Occurrences --------------------------------------------------------------------------------------------

/** Dates are one list for every language: only the default-language tab edits it (plan 5 P5b). */
const structural = computed(() => !defaultLanguage.value || !editor.activeLanguage || editor.activeLanguage === defaultLanguage.value);
const defaultLanguageName = computed(() => languages.value.find((l) => l.isDefault)?.displayName ?? "default language");

const now = Date.now();

/** The date is over: only a valid Start and a valid End in the past count (an unreadable one is never "Ended", D-104). */
function ended(o: OccurrenceForm): boolean {
  const start = fromLocalInput(o.startsAt, timeZone.value);
  const end = fromLocalInput(o.endsAt, timeZone.value);
  return !!start && !!end && Date.parse(end) < now;
}

/** The groups (`"<key>:start"`, `"<key>:end"`) that hold a part that is wrong right now, as `DateTimeFields` reports it. */
const wrongGroups = reactive(new Set<string>());
const isWrong = (key: string, which: "start" | "end"): boolean => wrongGroups.has(`${key}:${which}`);
/** Records what a `DateTimeFields` group says about its parts (its `validity` event). */
function setValidity(key: string, which: "start" | "end", valid: boolean) {
  if (valid) wrongGroups.delete(`${key}:${which}`);
  else wrongGroups.add(`${key}:${which}`);
}
const WRONG_PART = "Correct the date and time above first.";

const END_BEFORE_START = "It must end after it starts.";

/** Whether the end is not after the start: judged as the author types, not only at Save. */
function endsBeforeStart(o: OccurrenceForm): boolean {
  const start = fromLocalInput(o.startsAt, timeZone.value);
  const end = fromLocalInput(o.endsAt, timeZone.value);
  return !!start && !!end && Date.parse(end) <= Date.parse(start);
}

/** Groups the author has left once (`"<key>:start"`, `"<key>:end"`): a blank part is only called missing from then on. */
const leftGroups = reactive(new Set<string>());
const MISSING_PART = "Enter every part: day, month, year, hour and minute.";
/** The sentence for a group left with a blank part (not wrong, just not entered); undefined while it is complete or still being typed. */
function missingSentence(o: OccurrenceForm, which: "start" | "end"): string | undefined {
  const value = which === "start" ? o.startsAt : o.endsAt;
  return leftGroups.has(`${o.key}:${which}`) && !value && !isWrong(o.key, which) ? MISSING_PART : undefined;
}

/** The message under the start fields; from a failed Save or the platform, or a blank part once the group was left. */
const startError = (o: OccurrenceForm, index: number) => editor.fieldError(`occurrences[${index}].startsAt`) ?? missingSentence(o, "start");
/** The date part of a `YYYY-MM-DDTHH:mm` value. */
const datePart = (value: string): string => value.split("T")[0] ?? "";

/** A local value as a wall-clock count of minutes, for working out how long an occurrence lasts. */
const wallMinutes = (value: string): number | null => {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return null;
  const ms = Date.parse(`${value}:00Z`);
  return Number.isNaN(ms) ? null : ms / 60000;
};
const fromWallMinutes = (minutes: number): string => new Date(minutes * 60000).toISOString().slice(0, 16);

/** How long each occurrence lasts in minutes, remembered while its start is half typed (an empty start has no length). */
const lengths = new Map<string, number>();
function rememberLength(o: OccurrenceForm) {
  const start = wallMinutes(o.startsAt);
  const end = wallMinutes(o.endsAt);
  if (start !== null && end !== null && end > start) lengths.set(o.key, end - start);
}

/** What a date looked like when its Start was first edited: the End follows the Start from here, once the group is left. */
const startAnchor = new Map<string, { start: number | null; length: number | undefined }>();

/**
 * Sets the start of an occurrence. It only stores the value: `DateTimeFields` hands over "" while a part is blank or
 * wrong, and that must never move the End (it used to become 1 Jan 2000, C3-38, D-104). The End follows the Start when
 * the author leaves the Start fields ({@link followStart}), so typing "25" on the way to "15" does not drag it about.
 */
function setStart(o: OccurrenceForm, next: string) {
  if (!startAnchor.has(o.key)) {
    const before = wallMinutes(o.startsAt);
    const end = wallMinutes(o.endsAt);
    startAnchor.set(o.key, {
      start: before,
      length: lengths.get(o.key) ?? (before !== null && end !== null && end > before ? end - before : undefined),
    });
  }
  o.startsAt = next;
}

/**
 * Moving the start moves the end with it (the length is kept), as a calendar does. Nothing happens while the Start is
 * not a real date, or while the End has a wrong part of its own (its typed parts are never overwritten); an empty End
 * with a valid Start gets one hour.
 */
function followStart(o: OccurrenceForm) {
  const anchor = startAnchor.get(o.key);
  const start = wallMinutes(o.startsAt);
  if (!anchor || start === null) return;
  startAnchor.delete(o.key);
  if (isWrong(o.key, "end")) return;
  if (anchor.length !== undefined) o.endsAt = fromWallMinutes(start + anchor.length);
  else if (!o.endsAt) o.endsAt = fromWallMinutes(start + 60);
}

/** Sets the end of an occurrence and remembers the new length. */
function setEnd(o: OccurrenceForm, next: string) {
  o.endsAt = next;
  rememberLength(o);
}

/** Dates whose end group was left once: the end-before-start message shows from then on (and is announced). */
const endTouched = reactive(new Set<string>());

/** The message under the end fields: after the author leaves them (or a failed Save), once it is wrong; gone when corrected. */
function endError(o: OccurrenceForm, index: number): string | undefined {
  if (endTouched.has(o.key) && endsBeforeStart(o)) return END_BEFORE_START;
  const saved = editor.fieldError(`occurrences[${index}].endsAt`);
  return (saved === END_BEFORE_START && !endsBeforeStart(o) ? undefined : saved) ?? missingSentence(o, "end");
}

/** Leaving a date's fields: puts the list in time order, and says politely when the end is not after the start. */
function leaveDate(o: OccurrenceForm, index: number, event: FocusEvent) {
  const card = event.currentTarget as HTMLElement;
  const target = event.target as HTMLElement;
  const group = target.closest("fieldset");
  const next = event.relatedTarget as Node | null;
  // Moving between the parts of the same group is still typing.
  if (group && next && group.contains(next)) return;
  for (const which of ["start", "end"] as const) {
    if (!target.id.startsWith(`occ-${which}-${o.key}`)) continue;
    leftGroups.add(`${o.key}:${which}`);
    if (missingSentence(o, which)) say(`Date ${index + 1}, ${which === "start" ? "starts" : "ends"}: ${MISSING_PART}`, "polite");
  }
  if (target.id.startsWith(`occ-start-${o.key}`)) followStart(o);
  if (target.id.startsWith(`occ-end-${o.key}`)) {
    endTouched.add(o.key);
    if (endsBeforeStart(o)) say(`Date ${index + 1}: ${END_BEFORE_START}`, "polite");
  }
  if (!next || !card.contains(next)) {
    if (target.id.startsWith(`occ-start-${o.key}`) || target.id.startsWith(`occ-end-${o.key}`)) sortOccurrences();
  }
}

/** "Sat 14 Nov 2026 · 14:00–16:00" in the Project timezone, or empty while the start is not set. `locale` is a tab's language. */
function whenText(o: OccurrenceForm, locale?: string): string {
  const start = fromLocalInput(o.startsAt, timeZone.value);
  if (!start) return "";
  return formatEventWhen(start, fromLocalInput(o.endsAt, timeZone.value), timeZone.value, locale);
}

/** Plain words for the time zone note: "Athens time (Europe/Athens)". */
const timeZoneNote = computed(() => {
  const zone = timeZone.value;
  const city = (zone.split("/").pop() ?? zone).replace(/_/g, " ");
  return projectTimeZone.value
    ? `Times are ${city} time (${zone}), the time zone of this Project.`
    : `This Project has no time zone set, so times are in this browser's: ${city} time (${zone}).`;
});

/** The language tab's locale: the dates under another language's tab are written in that language (D-088). */
const activeLocale = computed(() => localeForLanguage(editor.activeLanguage));

// Dates are one list for every language: a saved problem in a field that is not shown in this tab brings the author to the default tab.
const structuralPaths = ["slug", "internalName", "bookingUrl", "placeId", "poiId", "routeId", "occurrences"];
watch(
  () => structuralPaths.some((p) => editor.fieldError(p)) || form.occurrences.some((_, i) => editor.fieldError(`occurrences[${i}].startsAt`) || editor.fieldError(`occurrences[${i}].endsAt`)),
  (failed) => {
    if (failed && !structural.value && defaultLanguage.value) editor.activeLanguage = defaultLanguage.value;
  },
);

const editableDates = computed(() => editor.editable && structural.value);

async function addOccurrence() {
  const last = form.occurrences[form.occurrences.length - 1];
  let startsAt: string;
  let endsAt: string;
  if (last && last.startsAt && last.endsAt) {
    startsAt = shiftLocal(last.startsAt, 1);
    endsAt = shiftLocal(last.endsAt, 1);
  } else {
    // Tomorrow 10:00 to 11:00 in the Project timezone.
    const tomorrow = shiftLocal(toLocalInput(new Date().toISOString(), timeZone.value), 1).slice(0, 10);
    startsAt = `${tomorrow}T10:00`;
    endsAt = `${tomorrow}T11:00`;
  }
  const key = `o-${++keyCounter}`;
  form.occurrences.push({ key, id: null, startsAt, endsAt, status: "SCHEDULED" });
  rememberLength(form.occurrences[form.occurrences.length - 1]);
  say(`Date ${form.occurrences.length} added.`);
  await nextTick();
  focusStart(key);
}

/** Keeps the list in time order after an edit, the order visitors see. */
function sortOccurrences() {
  form.occurrences.sort((a, b) => (a.startsAt < b.startsAt ? -1 : a.startsAt > b.startsAt ? 1 : 0));
}

const upcomingCount = computed(() => form.occurrences.filter((o) => !ended(o) && o.status === "SCHEDULED").length);

// Removing a date is undoable: announced, focus to the next card, "Undo" under the list (plan 5 P5b, D-079).
const focusStart = (key: string) => document.getElementById(`occ-start-${key}-day`)?.focus();
const undo = useUndoRemove<OccurrenceForm>({
  list: () => form.occurrences,
  describe: (o, index) => `Date ${index + 1}${whenText(o) ? `, ${whenText(o)}` : ""}`,
  noun: "date",
  focusAt(index) {
    const next = form.occurrences[index] ?? form.occurrences[index - 1];
    if (next) focusStart(next.key);
    else document.getElementById("occ-add")?.focus();
  },
  focusRestored: (o) => focusStart(o.key),
});
// After a reload or an Apply the old positions mean nothing.
watch(() => editor.resource?.version, () => undo.clear());

// Repeat weekly -----------------------------------------------------------------------------------------

const MAX_REPEATS = 52;
const repeatOpen = ref(false);
const repeatMode = ref<"count" | "until">("count");
const repeatCount = ref(4);
const repeatUntil = ref("");
/** False while a part of the "Last day to repeat on" is wrong (31 November, hour out of range): `repeatUntil` is "" then. */
const untilValid = ref(true);
/** Said under the number when what was typed is over the limit: "99 weeks is more than the limit; 52 is used." */
const repeatClamped = ref("");

// A number over the limit is cut to it at once and says so, instead of silently becoming 52 later.
watch(repeatCount, (value) => {
  const typed = Number(value);
  if (Number.isFinite(typed) && typed > MAX_REPEATS) {
    repeatClamped.value = `${Math.trunc(typed)} is more than the limit of ${MAX_REPEATS} weeks at a time, so ${MAX_REPEATS} is used. Repeat again for more.`;
    repeatCount.value = MAX_REPEATS;
    say(repeatClamped.value);
  } else if (repeatClamped.value && typed !== MAX_REPEATS) {
    repeatClamped.value = "";
  }
});

/** The last occurrence in time, the one a repetition continues from. */
const repeatSource = computed(() => [...form.occurrences].sort((a, b) => (a.startsAt < b.startsAt ? -1 : 1)).pop() ?? null);

/** The weekly copies to add: `repeatCount` more weeks, or every week up to and including `repeatUntil`. */
const repeatDates = computed<{ startsAt: string; endsAt: string }[]>(() => {
  const source = repeatSource.value;
  if (!source || !source.startsAt || !source.endsAt) return [];
  const out: { startsAt: string; endsAt: string }[] = [];
  const limit = repeatMode.value === "count" ? Math.min(Math.max(Math.trunc(Number(repeatCount.value) || 0), 0), MAX_REPEATS) : MAX_REPEATS;
  for (let week = 1; week <= limit; week++) {
    const startsAt = shiftLocal(source.startsAt, 7 * week);
    if (repeatMode.value === "until" && (!repeatUntil.value || datePart(startsAt) > repeatUntil.value)) break;
    out.push({ startsAt, endsAt: shiftLocal(source.endsAt, 7 * week) });
  }
  return out;
});

/** Why the number of weeks adds nothing: empty, 0 or below, or not a whole number. */
function repeatCountMessage(): string {
  const text = String(repeatCount.value ?? "").trim();
  const typed = Number(text);
  if (!text) return `Enter the number of weeks, from 1 to ${MAX_REPEATS}.`;
  if (Number.isFinite(typed) && typed < 1) return `${text} weeks adds no dates. Enter a number from 1 to ${MAX_REPEATS}.`;
  return `Use a whole number of weeks, from 1 to ${MAX_REPEATS}.`;
}

const repeatPreview = computed(() => {
  const dates = repeatDates.value;
  if (!repeatSource.value?.startsAt || !repeatSource.value.endsAt) return "Set the start and end of the last date first.";
  if (repeatMode.value === "until" && !untilValid.value) return "Correct the last day to repeat on first.";
  if (repeatMode.value === "until" && !repeatUntil.value) return "Choose the last day to repeat on.";
  if (!dates.length) return repeatMode.value === "count" ? repeatCountMessage() : "No week falls on or before that day.";
  const day = (v: string) => formatEventDay(fromLocalInput(v, timeZone.value)!, timeZone.value);
  const first = day(dates[0].startsAt);
  const last = day(dates[dates.length - 1].startsAt);
  const time = formatEventSpan(fromLocalInput(dates[0].startsAt, timeZone.value)!, fromLocalInput(dates[0].endsAt, timeZone.value)!, timeZone.value);
  const capped = repeatMode.value === "until" && dates.length === MAX_REPEATS ? ` (at most ${MAX_REPEATS} weeks at a time)` : "";
  return dates.length === 1
    ? `Adds 1 date: ${first}, ${time}.`
    : `Adds ${dates.length} dates, every week from ${first} to ${last}, ${time}${capped}.`;
});

async function addRepeats() {
  const dates = repeatDates.value;
  if (!dates.length) return;
  const keys = dates.map(({ startsAt, endsAt }) => {
    const key = `o-${++keyCounter}`;
    form.occurrences.push({ key, id: null, startsAt, endsAt, status: "SCHEDULED" });
    return key;
  });
  repeatOpen.value = false;
  say(`${dates.length} weekly ${dates.length === 1 ? "date" : "dates"} added. ${form.occurrences.length} in all.`);
  await nextTick();
  focusStart(keys[0]);
}

// The Translations panel counts the fields the content list counts for its completion dots.
const translationRows = computed(() => translationStatus(languages.value, 3, (code) => filledFields(form.translations[code], ["title", "summary", "description"] as const)));

/** The live form's completeness (D-090, D-107): the texts plus the structural warning for no dates, which follows unsaved edits. */
const completeness = computed(() =>
  completenessOf({
    languages: languages.value,
    base: translationRows.value.map((r) => ({ languageCode: r.language.languageCode, filled: r.filled, total: r.total })),
    slots: [],
    gaps: eventGaps(form.occurrences.length),
  }),
);
</script>

<template>
  <EditorShell
    tabbed
    :editor="editor"
    back-label="Events"
    :back-to="{ name: 'events', params: { projectId } }"
    :title="heading"
    :subtitle="subtitle"
    activation-hint="Activate it once the default-language title is set."
    :reference-link="toReference"
    :pending="languagesLoading"
    :translations="translationRows"
    :completeness="completeness"
    :preview="preview"
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

    <EditorSection id="dates" title="Dates" :count="form.occurrences.length ? `${form.occurrences.length}` : 'None yet'">
      <p class="text-sm text-muted-foreground">{{ timeZoneNote }}</p>

      <Alert v-if="form.occurrences.length && !upcomingCount" tone="warning" role="status">
        No upcoming scheduled date: visitors will not see this event in the calendar.
      </Alert>
      <p v-if="editor.fieldError('occurrences')" class="flex items-start gap-1.5 text-sm font-medium text-destructive">
        <CircleAlert class="mt-0.5 size-4 shrink-0" aria-hidden="true" />{{ editor.fieldError("occurrences") }}
      </p>

      <!-- Another language tab: the dates are the same for everyone, so they are read here and edited in one place. -->
      <template v-if="!structural">
        <p class="text-sm">
          Dates are the same in every language. Change them in the {{ defaultLanguageName }} tab.
          <Button variant="link" @click="editor.activeLanguage = defaultLanguage">Go to {{ defaultLanguageName }}</Button>
        </p>
        <ul v-if="form.occurrences.length" class="flex flex-col gap-1 text-sm">
          <li v-for="(o, index) in form.occurrences" :key="o.key" class="tabular">
            Date {{ index + 1 }}: <span :lang="activeLocale">{{ whenText(o, activeLocale) || "not set" }}</span><template v-if="o.status === 'CANCELLED'"> (cancelled)</template>
          </li>
        </ul>
      </template>

      <template v-else>
        <ol v-if="form.occurrences.length" class="flex flex-col gap-3" aria-label="Dates of the event">
          <li
            v-for="(o, index) in form.occurrences"
            :key="o.key"
            class="rounded-lg border border-border p-4"
            :class="ended(o) ? 'bg-muted' : 'bg-background'"
          >
            <div role="group" :aria-labelledby="`occ-title-${o.key}`">
            <div class="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1">
              <h3 :id="`occ-title-${o.key}`" class="text-sm font-bold">Date {{ index + 1 }}</h3>
              <Chip v-if="ended(o)">Ended</Chip>
              <Chip v-if="o.status === 'CANCELLED'" tone="danger">Cancelled</Chip>
              <span v-if="whenText(o)" class="tabular text-sm text-muted-foreground">{{ whenText(o) }}</span>
            </div>

            <div class="grid grid-cols-[repeat(auto-fit,minmax(min(100%,22rem),1fr))] gap-x-6 gap-y-4" @focusout="leaveDate(o, index, $event)">
              <DateTimeFields
                :id="`occ-start-${o.key}`"
                legend="Starts"
                required
                :model-value="o.startsAt"
                :readonly="!editableDates"
                :error="startError(o, index)"
                :data-path="`occurrences[${index}].startsAt`"
                @update:model-value="(v: string) => setStart(o, v)"
                @validity="(v: boolean) => setValidity(o.key, 'start', v)"
              />
              <DateTimeFields
                :id="`occ-end-${o.key}`"
                legend="Ends"
                required
                :model-value="o.endsAt"
                :readonly="!editableDates"
                :error="endError(o, index)"
                :data-path="`occurrences[${index}].endsAt`"
                @update:model-value="(v: string) => setEnd(o, v)"
                @validity="(v: boolean) => setValidity(o.key, 'end', v)"
              />
            </div>

            <div v-if="editableDates" class="mt-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-t border-border pt-3">
              <Switch v-if="!ended(o)" :model-value="o.status === 'CANCELLED'" @update:model-value="(v: boolean) => (o.status = v ? 'CANCELLED' : 'SCHEDULED')">
                Cancelled
              </Switch>
              <span v-else class="text-sm text-muted-foreground">Ended dates leave the visitor app by themselves.</span>
              <Button variant="danger-outline" size="sm" @click="undo.remove(index)">
                <Trash2 aria-hidden="true" />Remove<span class="sr-only"> date {{ index + 1 }}</span>
              </Button>
            </div>
            </div>
          </li>
        </ol>
        <p v-else class="text-sm text-muted-foreground">No dates yet. Add the first date of the event.</p>

        <RemovedBar v-if="undo.last.value" :label="undo.last.value.label" noun="date" :count="undo.removed.value.length" @undo="undo.undo()" @dismiss="undo.clear()" />

        <div v-if="editor.editable" class="flex flex-wrap items-center gap-2">
          <Button id="occ-add" variant="secondary" @click="addOccurrence()"><Plus aria-hidden="true" />Add a date</Button>
          <Button
            v-if="form.occurrences.length"
            variant="ghost"
            :aria-expanded="repeatOpen"
            aria-controls="occ-repeat"
            @click="repeatOpen = !repeatOpen"
          >
            <Repeat aria-hidden="true" />Repeat weekly
          </Button>
        </div>

        <fieldset v-if="repeatOpen && editor.editable" id="occ-repeat" class="flex flex-col gap-3 rounded-lg border border-border bg-muted p-4">
          <legend class="px-1 text-sm font-bold">Repeat the last date every week</legend>
          <div class="flex flex-col gap-2">
            <label class="flex flex-wrap items-center gap-2 text-sm">
              <input v-model="repeatMode" type="radio" name="occ-repeat-mode" value="count" class="size-4 accent-primary" />
              For
              <Input v-model="repeatCount" type="number" min="1" :max="MAX_REPEATS" inputmode="numeric" aria-label="Number of weeks" aria-describedby="occ-repeat-limit" class="w-24" :disabled="repeatMode !== 'count'" />
              more weeks <span id="occ-repeat-limit" class="text-xs text-muted-foreground">(1 to {{ MAX_REPEATS }})</span>
            </label>
            <p v-if="repeatClamped" class="flex items-start gap-1.5 text-xs font-medium text-ink-2" role="status">
              <CircleAlert class="mt-px size-4 shrink-0" aria-hidden="true" />{{ repeatClamped }}
            </p>
            <label class="flex flex-wrap items-center gap-2 text-sm">
              <input v-model="repeatMode" type="radio" name="occ-repeat-mode" value="until" class="size-4 accent-primary" />
              Until a day
            </label>
            <DateTimeFields v-model="repeatUntil" mode="date" legend="Last day to repeat on" id="occ-repeat-until" class="pl-6" :disabled="repeatMode !== 'until'" @validity="(v: boolean) => (untilValid = v)" />
          </div>
          <p class="text-sm" role="status">{{ repeatPreview }}</p>
          <div class="flex flex-wrap gap-2">
            <Button :disabled-reason="repeatDates.length ? undefined : repeatPreview" @click="addRepeats">
              Add {{ repeatDates.length || "" }} {{ repeatDates.length === 1 ? "date" : "dates" }}
            </Button>
            <Button variant="secondary" @click="repeatOpen = false">Cancel</Button>
          </div>
        </fieldset>
      </template>
    </EditorSection>

    <EditorSection v-if="structural" id="where" title="Where and booking" description="All optional. While the event uses a place, point of interest or route, that item cannot be deactivated or archived.">
      <div class="grid grid-cols-[repeat(auto-fit,minmax(min(100%,15rem),1fr))] gap-4">
        <FormField label="Place" hint="Type to search or choose from the list." :error="editor.fieldError('placeId')" id="f-placeId" v-slot="f">
          <EntityCombobox :id="f.id" v-model="form.placeId" :options="placeChoices" noun="place" :disabled="!editor.editable" :invalid="f.invalid" :described-by="f.describedBy" />
        </FormField>
        <FormField label="Point of interest" hint="Type to search or choose from the list." :error="editor.fieldError('poiId')" id="f-poiId" v-slot="f">
          <EntityCombobox :id="f.id" v-model="form.poiId" :options="poiChoices" noun="point of interest" :disabled="!editor.editable" :invalid="f.invalid" :described-by="f.describedBy" />
        </FormField>
        <FormField label="Route" hint="Type to search or choose from the list." :error="editor.fieldError('routeId')" id="f-routeId" v-slot="f">
          <EntityCombobox :id="f.id" v-model="form.routeId" :options="routeChoices" noun="route" :disabled="!editor.editable" :invalid="f.invalid" :described-by="f.describedBy" />
        </FormField>
      </div>
      <p class="text-xs text-muted-foreground">Drafts are marked and listed last: visitors cannot open them until they are activated.</p>
      <FormField
        label="Booking URL"
        :error="editor.fieldError('bookingUrl')"
        hint="Where visitors book or buy tickets. Leave empty when no booking is needed."
        id="f-bookingUrl"
        v-slot="f"
      >
        <Input
          :id="f.id"
          v-model="form.bookingUrl"
          :readonly="!editor.editable"
          type="url"
          inputmode="url"
          spellcheck="false"
          placeholder="https://"
          :invalid="f.invalid"
          :aria-describedby="f.describedBy"
        />
      </FormField>
    </EditorSection>

    <MediaSlots
      v-if="structural"
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

    <TriggersCard
      v-if="structural"
      :triggers="form.triggers"
      :readonly="!editor.editable"
      :field-error="editor.fieldError"
      :position="eventPosition"
      :position-label="form.poiId ? 'Use the point of interest\'s position' : 'Use the place\'s position'"
    />

    <EditorSection v-if="structural" id="details" title="Details" collapsible :default-open="false" :count="form.internalName || form.featured ? 'Filled' : undefined">
      <FormField label="Slug" :error="editor.fieldError('slug')" hint="Used in URLs and QR targets. Changing it breaks printed QR codes." id="f-slug" v-slot="f">
        <Input :id="f.id" v-model="form.slug" :readonly="!editor.editable" spellcheck="false" class="font-mono" :invalid="f.invalid" :aria-describedby="f.describedBy" />
      </FormField>
      <FormField label="Internal name" :error="editor.fieldError('internalName')" hint="Only your team sees this." id="f-internalName" v-slot="f">
        <Input :id="f.id" v-model="form.internalName" :readonly="!editor.editable" :invalid="f.invalid" :aria-describedby="f.describedBy" />
      </FormField>
      <Checkbox v-model="form.featured" :disabled="!editor.editable">Featured: highlighted in the visitor app's lists</Checkbox>
    </EditorSection>
    <!-- Another language tab: only the texts and the (read-only) dates belong to it; everything else is the same for every language. -->
    <EditorSection v-else id="other-settings" title="Other settings (all languages)" collapsible :default-open="false">
      <p class="text-sm">
        Place, point of interest, route, booking address, media, how visitors reach it and details are the same in every language.
        Change them in the {{ defaultLanguageName }} tab.
        <Button variant="link" @click="editor.activeLanguage = defaultLanguage">Go to {{ defaultLanguageName }}</Button>
      </p>
    </EditorSection>
  </EditorShell>
</template>
