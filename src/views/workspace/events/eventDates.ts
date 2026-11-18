import { browserTimeZone, type CmsEvent, type EventOccurrence, nextOccurrence } from "@/platform/events";

import { formatDayInZone, formatDateTimeRange, formatTimeInZone, UI_LOCALE } from "@/lib/format";

/**
 * The one locale of the Events list's dates: the CMS interface language (D-088). Every writer below delegates to
 * `@/lib/format`, so a date reads the same in the list, the editor and the preview ("Sat 4 Sep 2026", "14:00", 24 h).
 */
export const DATE_LOCALE = UI_LOCALE;

/** The timezone fallback when the Project has none (`03` §15). */
export const FALLBACK_TIME_ZONE = browserTimeZone;

/** "Sat 4 Sep 2026" in the Project timezone, in `locale` (the interface language by default). */
export function formatEventDay(iso: string, timeZone: string, locale: string = DATE_LOCALE): string {
  return formatDayInZone(iso, timeZone, locale);
}

/** "14:00" (24-hour) in the Project timezone. */
export function formatEventTime(iso: string, timeZone: string, locale: string = DATE_LOCALE): string {
  return formatTimeInZone(iso, timeZone, locale);
}

/** "14:00–16:00" on one day, "14:00 – Sun 5 Sep 2026, 02:00" across days (the day of the start is shown separately). */
export function formatEventSpan(startsAt: string, endsAt: string, timeZone: string, locale: string = DATE_LOCALE): string {
  const sameDay = formatEventDay(startsAt, timeZone, locale) === formatEventDay(endsAt, timeZone, locale);
  return sameDay
    ? `${formatEventTime(startsAt, timeZone, locale)}–${formatEventTime(endsAt, timeZone, locale)}`
    : `${formatEventTime(startsAt, timeZone, locale)} – ${formatEventDay(endsAt, timeZone, locale)}, ${formatEventTime(endsAt, timeZone, locale)}`;
}

/** "Sat 14 Nov 2026 · 14:00–16:00" (or just the start when there is no end): the summary line of one date. */
export function formatEventWhen(startsAt: string, endsAt: string | null, timeZone: string, locale: string = DATE_LOCALE): string {
  return endsAt && Date.parse(endsAt) > Date.parse(startsAt)
    ? `${formatEventDay(startsAt, timeZone, locale)} · ${formatEventSpan(startsAt, endsAt, timeZone, locale)}`
    : `${formatEventDay(startsAt, timeZone, locale)} · ${formatEventTime(startsAt, timeZone, locale)}`;
}

/**
 * A language code as a locale the browser can write dates in, so the Greek tab's dates read "14 Νοε 2026" and an
 * unknown or malformed code falls back to the interface language instead of throwing.
 */
export function localeForLanguage(code: string | null | undefined): string {
  if (!code) return DATE_LOCALE;
  try {
    return Intl.DateTimeFormat.supportedLocalesOf([code])[0] ?? DATE_LOCALE;
  } catch {
    return DATE_LOCALE;
  }
}

/** "14 Nov 2026, 14:00–16:00" in a language, for the visitor preview of the dates. */
export function formatEventPreview(startsAt: string, endsAt: string | null, timeZone: string, languageCode: string | null | undefined): string {
  return formatDateTimeRange(startsAt, endsAt, { timeZone, locale: localeForLanguage(languageCode) });
}

/** What the Dates column of the list says about an Event. */
export interface EventDates {
  /** "3 dates", "1 date", "No dates yet". */
  count: string;
  /** The next scheduled occurrence not yet over, split so the day can lead the line. */
  next: { day: string; span: string; occurrence: EventOccurrence } | null;
  /** Cancelled occurrences, counted separately; "All dates cancelled" is the case where nothing is scheduled. */
  cancelled: number;
  /** Dates exist but none is still to come. */
  noneUpcoming: boolean;
}

/** Summarises an Event's occurrences for the list. */
export function summariseDates(event: CmsEvent, timeZone: string, now = Date.now()): EventDates {
  const total = event.occurrences.length;
  const cancelled = event.occurrences.filter((o) => o.status === "CANCELLED").length;
  const occurrence = nextOccurrence(event, now);
  return {
    count: total === 0 ? "No dates yet" : total === 1 ? "1 date" : `${total} dates`,
    next: occurrence ? { day: formatEventDay(occurrence.startsAt, timeZone), span: formatEventSpan(occurrence.startsAt, occurrence.endsAt, timeZone), occurrence } : null,
    cancelled,
    noneUpcoming: total > 0 && !occurrence,
  };
}

/** The next occurrence's start as a sortable ISO string; Events without one sort last. */
export function nextStart(event: CmsEvent, now = Date.now()): string {
  return nextOccurrence(event, now)?.startsAt ?? "9999";
}
