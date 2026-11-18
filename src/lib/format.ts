import { Archive, CircleAlert, CircleCheck, CircleDashed, CirclePause, Pencil, type LucideIcon } from "lucide-vue-next";
import { statusWord } from "@/lib/glossary";

/** How one status is drawn: a lucide icon, a sentence-case word and a chip tone (D-070). */
export interface StatusInfo {
  icon: LucideIcon;
  label: string;
  tone: "success" | "warning" | "danger" | "info" | "brand" | "neutral" | "outline";
}

/**
 * One status vocabulary (D-070): ACTIVE (check, success), DRAFT (dashed circle, sunken), ARCHIVED (archive box,
 * outline only, so it differs from Draft without colour), PENDING (pencil, brand tint: amber means warning),
 * SUSPENDED (pause, warning), FAILED and DENIED (alert, danger). The word always comes with the icon.
 */
export function statusInfo(status: string): StatusInfo {
  const key = status.toUpperCase();
  switch (key) {
    case "ACTIVE":
    case "READY":
    case "LIVE":
    case "SUCCESS":
      return { icon: CircleCheck, label: statusWord(key), tone: "success" };
    case "DRAFT":
      return { icon: CircleDashed, label: statusWord(key), tone: "neutral" };
    case "ARCHIVED":
      return { icon: Archive, label: statusWord(key), tone: "outline" };
    case "PENDING":
      return { icon: Pencil, label: "Pending changes", tone: "brand" };
    case "SUSPENDED":
      return { icon: CirclePause, label: statusWord(key), tone: "warning" };
    case "FAILED":
    case "DENIED":
      return { icon: CircleAlert, label: statusWord(key), tone: "danger" };
    default:
      return { icon: CircleDashed, label: statusWord(status), tone: "neutral" };
  }
}

/**
 * Inline colours of a status for markup not yet moved to `Chip` (token values, so they follow the palette).
 * @deprecated use `StatusChip`.
 */
export function statusChipStyle(status: string): { background: string; color: string } {
  switch (statusInfo(status).tone) {
    case "success":
      return { background: "hsl(var(--success-tint))", color: "hsl(var(--success))" };
    case "brand":
      return { background: "hsl(var(--accent))", color: "hsl(var(--primary))" };
    case "warning":
      return { background: "hsl(var(--warning-tint))", color: "hsl(var(--warning))" };
    case "danger":
      return { background: "hsl(var(--destructive-tint))", color: "hsl(var(--destructive))" };
    default:
      return { background: "hsl(var(--muted))", color: "hsl(var(--ink-2))" };
  }
}

/** The CMS interface language today; dates and numbers follow it (the Project's languages are content, not chrome). */
export const UI_LOCALE = "en-GB";

/**
 * Where and in which language a date is written. `timeZone` is the Project's (or an Event's) time zone where one
 * exists, otherwise the author's own; `locale` is a BCP 47 tag, the interface language by default. A bare string is
 * read as the locale, which is how earlier callers passed it.
 */
export interface DateFormatOptions {
  timeZone?: string;
  locale?: string;
}

function resolveOptions(options: DateFormatOptions | string | undefined): Required<Pick<DateFormatOptions, "locale">> & { timeZone: string | undefined } {
  const given = typeof options === "string" ? { locale: options } : (options ?? {});
  return { locale: given.locale ?? UI_LOCALE, timeZone: given.timeZone };
}

/** The instant of an ISO string, or `null` when it is empty or not a date. */
function instant(iso: string | null | undefined): Date | null {
  if (!iso) return null;
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Short month names write "Sep", not "Sept" (newer ICU data), so one date reads the same everywhere. */
const shortMonth = (month: string) => month.replace(/^Sept$/, "Sep");

/** "4 Sep 2026" or, with `weekday`, "Fri 4 Sep 2026": day, month name, year, in this order whatever the locale. */
function dayText(date: Date, { locale, timeZone }: ReturnType<typeof resolveOptions>, weekday = false): string {
  const parts = new Intl.DateTimeFormat(locale, { timeZone, ...(weekday ? { weekday: "short" } : {}), day: "numeric", month: "short", year: "numeric" }).formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? "";
  const core = `${get("day")} ${shortMonth(get("month"))} ${get("year")}`;
  return weekday ? `${get("weekday").replace(/\.$/, "")} ${core}` : core;
}

/** "14:05": 24-hour clock, never AM/PM, whatever the browser's region. */
function timeText(date: Date, { locale, timeZone }: ReturnType<typeof resolveOptions>): string {
  return new Intl.DateTimeFormat(locale, { timeZone, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(date);
}

/** "4 Sep 2026" (D-088): the only way the CMS writes a date. Empty or invalid input is "—". */
export function formatDate(iso: string | null | undefined, options?: DateFormatOptions | string): string {
  const date = instant(iso);
  return date ? dayText(date, resolveOptions(options)) : "—";
}

/** "14:05": the time of day, 24-hour (D-088). Empty or invalid input is "—". */
export function formatTime(iso: string | null | undefined, options?: DateFormatOptions | string): string {
  const date = instant(iso);
  return date ? timeText(date, resolveOptions(options)) : "—";
}

/** "4 Sep 2026, 14:05": the full date and time, for places that must be exact (D-088). */
export function formatDateTime(iso: string | null | undefined, options?: DateFormatOptions | string): string {
  const date = instant(iso);
  if (!date) return "—";
  const resolved = resolveOptions(options);
  return `${dayText(date, resolved)}, ${timeText(date, resolved)}`;
}

/**
 * "4 Sep 2026, 14:00–16:00" for a span within one day, "4 Sep 2026, 22:00 – 5 Sep 2026, 02:00" across days; one locale
 * and zone for the whole string (D-088). `weekday` prefixes each day ("Fri 4 Sep 2026").
 */
export function formatDateTimeRange(
  startIso: string | null | undefined,
  endIso: string | null | undefined,
  options?: DateFormatOptions | string,
  weekday = false,
): string {
  const start = instant(startIso);
  const end = instant(endIso);
  if (!start) return "—";
  const resolved = resolveOptions(options);
  const startDay = dayText(start, resolved, weekday);
  if (!end) return `${startDay}, ${timeText(start, resolved)}`;
  const endDay = dayText(end, resolved, weekday);
  return startDay === endDay
    ? `${startDay}, ${timeText(start, resolved)}–${timeText(end, resolved)}`
    : `${startDay}, ${timeText(start, resolved)} – ${endDay}, ${timeText(end, resolved)}`;
}

/** "Sat 4 Sep 2026" in the given timezone. Kept for callers that name the zone positionally; same as `formatDate` with a weekday. */
export function formatDayInZone(iso: string, timeZone: string, locale: string = UI_LOCALE): string {
  const date = instant(iso);
  return date ? dayText(date, { locale, timeZone }, true) : "—";
}

/** "14:00" in the given timezone (24-hour). */
export function formatTimeInZone(iso: string, timeZone: string, locale: string = UI_LOCALE): string {
  return formatTime(iso, { locale, timeZone });
}

/** "Sat 4 Sep 2026, 14:00–16:00", or "... 14:00 – Sun 5 Sep 2026, 02:00" across days; one locale for the whole string. */
export function formatOccurrenceSpan(startsAt: string, endsAt: string, timeZone: string, locale: string = UI_LOCALE): string {
  return formatDateTimeRange(startsAt, endsAt, { locale, timeZone }, true);
}

/** "5 minutes ago", "yesterday", "in 2 days"; falls back to the date beyond a month. */
export function formatRelative(iso: string | null, now: Date = new Date(), locale: string = UI_LOCALE): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  const seconds = Math.round((date.getTime() - now.getTime()) / 1000);
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  const steps: [Intl.RelativeTimeFormatUnit, number][] = [
    ["minute", 60],
    ["hour", 3600],
    ["day", 86400],
  ];
  const abs = Math.abs(seconds);
  if (abs < 60) return rtf.format(0, "second");
  if (abs >= 30 * 86400) return formatDate(iso, locale);
  let chosen = steps[0];
  for (const step of steps) if (abs >= step[1]) chosen = step;
  return rtf.format(Math.round(seconds / chosen[1]), chosen[0]);
}

/** A no-break space: keeps a number and its unit on one line ("163 KB", "100 %"). */
export const NBSP = "\u00A0";

/** `value` and `unit` joined by a no-break space ("12 km"). */
export function withUnit(value: string | number, unit: string): string {
  return `${value}${NBSP}${unit}`;
}

/** A file size: "512 B", "163 KB", "1.2 MB", "20 MB" (no ".0" on whole megabytes), always with a no-break space before the unit (D-106). */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return withUnit(bytes, "B");
  if (bytes < 1024 * 1024) return withUnit(Math.round(bytes / 1024), "KB");
  const megabytes = bytes / (1024 * 1024);
  return withUnit(Number.isInteger(megabytes) ? megabytes : megabytes.toFixed(1), "MB");
}

/** A length in metres: "420 m" under a kilometre, "1.4 km" above (no-break space). */
export function formatDistance(metres: number): string {
  return metres < 1000 ? withUnit(Math.round(metres), "m") : withUnit((metres / 1000).toFixed(1), "km");
}

/** A percentage with a no-break space ("100 %"). */
export function formatPercent(value: number): string {
  return withUnit(Math.round(value), "%");
}

/** A number in the interface language ("1,284"). */
export function formatNumber(value: number, locale: string = UI_LOCALE): string {
  return new Intl.NumberFormat(locale).format(value);
}

const GREEK_TO_LATIN: Record<string, string> = {
  α: "a", β: "v", γ: "g", δ: "d", ε: "e", ζ: "z", η: "i", θ: "th", ι: "i", κ: "k", λ: "l", μ: "m",
  ν: "n", ξ: "x", ο: "o", π: "p", ρ: "r", σ: "s", ς: "s", τ: "t", υ: "y", φ: "f", χ: "ch", ψ: "ps",
  ω: "o",
};

/**
 * Derives a Catalogue slug (lowercase letters, digits, and hyphens) from a name. Accents are removed
 * and Greek letters transliterated, so "Κάστρο Ναυπλίου" becomes "kastro-nayplioy".
 */
export function slugify(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[α-ω]/g, (c) => GREEK_TO_LATIN[c] ?? "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;
