import { apiRequest } from "./api";
import { syncMedia, toMediaBindings, type MediaBinding, type MediaBindingResponse } from "./assets";
import type { ResourceStatus } from "./places";
import type { ResourceReference } from "./references";

export interface EventTranslation {
  title: string | null;
  summary: string | null;
  description: string | null;
  locationText: string | null;
}

export const OCCURRENCE_STATUSES = ["SCHEDULED", "CANCELLED"] as const;
export type OccurrenceStatus = (typeof OCCURRENCE_STATUSES)[number];

/** One time the Event takes place; the times are ISO-8601 instants. */
export interface EventOccurrence {
  id: string | null;
  eventId?: string;
  startsAt: string;
  endsAt: string;
  status: OccurrenceStatus;
}

export interface CmsEvent {
  id: string;
  projectId: string;
  slug: string;
  status: ResourceStatus;
  placeId: string | null;
  poiId: string | null;
  routeId: string | null;
  bookingUrl: string | null;
  internalName: string | null;
  featured: boolean;
  sortOrder: number;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
  version: number;
  hasWorkingCopy: boolean;
  workingCopyUpdatedAt: string | null;
  translations: Record<string, EventTranslation>;
  /** Sorted by start. */
  occurrences: EventOccurrence[];
  media: MediaBinding[];
}

export interface UpdateEventInput {
  version: number;
  slug: string;
  placeId: string | null;
  poiId: string | null;
  routeId: string | null;
  bookingUrl: string | null;
  internalName: string | null;
  featured: boolean;
  translations: Record<string, EventTranslation>;
  occurrences: EventOccurrence[];
  media: MediaBinding[];
}

const base = (projectId: string) => `/projects/${encodeURIComponent(projectId)}/events`;

/*
 * Stopgap until the generated client (PLAN.md C0b, C6). The iGuide backend (D-023) pages its lists and
 * serves occurrences as the child collection `.../events/{id}/occurrences` instead of part of the event
 * body. Media are bindings (backend D-025): read from `media`, saved through
 * `.../events/{id}/resource-assets` after the occurrences.
 */

type EventResponse = Omit<CmsEvent, "media"> & { media: MediaBindingResponse[] };

interface Page<T> {
  content: T[];
  totalPages: number;
}

const toEvent = (event: EventResponse): CmsEvent => ({ ...event, media: toMediaBindings(event.media) });

const occurrencesPath = (projectId: string, eventId: string) => `${base(projectId)}/${encodeURIComponent(eventId)}/occurrences`;

/** Every Event of the Project, in order: the backend serves at most 200 per page. */
export async function listEvents(projectId: string, signal?: AbortSignal): Promise<CmsEvent[]> {
  const events: CmsEvent[] = [];
  for (let page = 0; ; page++) {
    const result = await apiRequest<Page<EventResponse>>(`${base(projectId)}?size=200&page=${page}`, { signal });
    events.push(...result.content.map(toEvent));
    if (page + 1 >= result.totalPages) return events;
  }
}

export async function fetchEvent(projectId: string, eventId: string): Promise<CmsEvent> {
  return toEvent(await apiRequest<EventResponse>(`${base(projectId)}/${encodeURIComponent(eventId)}`));
}

export async function createEvent(projectId: string, input: { title: string; slug: string }): Promise<CmsEvent> {
  return toEvent(await apiRequest<EventResponse>(base(projectId), { method: "POST", body: input }));
}

/**
 * Saves the Event's own fields, then brings its occurrences in line with `input.occurrences`: removed
 * ones are deleted, changed ones updated, new ones added.
 */
export async function updateEvent(projectId: string, eventId: string, input: UpdateEventInput): Promise<CmsEvent> {
  const { occurrences, media, ...fields } = input;
  const saved = await apiRequest<EventResponse>(`${base(projectId)}/${encodeURIComponent(eventId)}`, { method: "PUT", body: fields });

  const path = occurrencesPath(projectId, eventId);
  const current = new Map(saved.occurrences.map((o) => [o.id, o]));
  const kept = new Set(occurrences.flatMap((o) => (o.id ? [o.id] : [])));
  for (const old of saved.occurrences.filter((o) => o.id && !kept.has(o.id))) {
    await apiRequest(`${path}/${encodeURIComponent(old.id!)}`, { method: "DELETE" });
  }
  for (const o of occurrences) {
    const body = { startsAt: o.startsAt, endsAt: o.endsAt, status: o.status };
    const before = o.id ? current.get(o.id) : undefined;
    if (!o.id) {
      await apiRequest(path, { method: "POST", body });
    } else if (!before || Date.parse(before.startsAt) !== Date.parse(o.startsAt)
      || Date.parse(before.endsAt) !== Date.parse(o.endsAt) || before.status !== o.status) {
      await apiRequest(`${path}/${encodeURIComponent(o.id)}`, { method: "PUT", body });
    }
  }
  await syncMedia(projectId, "events", eventId, media);
  return fetchEvent(projectId, eventId);
}

/**
 * The working-copy payload of an ACTIVE Event (backend D-027): the update body without `version`, with the
 * occurrences and media as whole lists. Kept occurrences carry their id.
 */
export function eventWorkingCopyPayload(input: Omit<UpdateEventInput, "version">): Record<string, unknown> {
  const { occurrences, media, ...fields } = input;
  return {
    ...fields,
    occurrences: occurrences.map((o) => ({ id: o.id, startsAt: o.startsAt, endsAt: o.endsAt, status: o.status })),
    media: media.filter((b) => b.usage !== "INLINE").map(({ assetId, usage, languageCode }) => ({ assetId, usage, languageCode })),
  };
}

/** An Event as the backend renders a working copy or an apply. */
export const eventFromResponse = (raw: unknown): CmsEvent => toEvent(raw as EventResponse);

export async function changeEventStatus(projectId: string, eventId: string, targetStatus: ResourceStatus, version: number): Promise<CmsEvent> {
  return toEvent(
    await apiRequest<EventResponse>(`${base(projectId)}/${encodeURIComponent(eventId)}/status`, {
      method: "POST",
      body: { targetStatus, version },
    }),
  );
}

/** Guides that list the Event; non-empty blocks deactivation and archival. */
export function fetchEventReferences(projectId: string, eventId: string): Promise<ResourceReference[]> {
  return apiRequest<ResourceReference[]>(`${base(projectId)}/${encodeURIComponent(eventId)}/references`);
}

export function eventTitle(event: CmsEvent, defaultLanguage: string | null): string {
  return (defaultLanguage ? event.translations[defaultLanguage]?.title?.trim() : undefined) || event.slug;
}

/** Title, summary, and description count towards completeness; the location text is optional. */
export function eventCompleteness(event: CmsEvent, languageCode: string): "complete" | "partial" | "missing" {
  const t = event.translations[languageCode];
  const filled = t ? [t.title, t.summary, t.description].filter((v) => v?.trim()).length : 0;
  if (filled === 0) return "missing";
  return filled === 3 ? "complete" : "partial";
}

/** The first scheduled occurrence that has not ended yet. */
export function nextOccurrence(event: CmsEvent, now = Date.now()): EventOccurrence | null {
  return event.occurrences.find((o) => o.status === "SCHEDULED" && Date.parse(o.endsAt) > now) ?? null;
}

// Times -----------------------------------------------------------------------------------------------
// Occurrences are instants rendered in the Project timezone. The backend does not store one yet, so the
// browser's timezone stands in for it and the editor names it next to the times.

export const displayTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

const pad = (n: number) => String(n).padStart(2, "0");

/** The value of a `datetime-local` input for an instant, in the display timezone. */
export function toLocalInput(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** The instant of a `datetime-local` value in the display timezone; null when empty or invalid. */
export function fromLocalInput(value: string): string | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

export function formatOccurrence(startsAt: string, endsAt: string): string {
  const start = new Date(startsAt);
  const end = new Date(endsAt);
  const day = new Intl.DateTimeFormat(undefined, { weekday: "short", day: "numeric", month: "short", year: "numeric" });
  const time = new Intl.DateTimeFormat(undefined, { hour: "2-digit", minute: "2-digit" });
  const sameDay = start.toDateString() === end.toDateString();
  return sameDay
    ? `${day.format(start)}, ${time.format(start)}–${time.format(end)}`
    : `${day.format(start)}, ${time.format(start)} – ${day.format(end)}, ${time.format(end)}`;
}
