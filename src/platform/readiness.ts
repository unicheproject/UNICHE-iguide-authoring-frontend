import type { RouteLocationRaw } from "vue-router";
import { apiRequest } from "./api";

/**
 * Readiness (iGuide spec 07 section 14, 12 section 5; backend D-033): what blocks the Application from going live
 * and what deserves attention, computed on request from the live rows of ACTIVE Resources. The same codes appear on
 * the Dashboard and on the Resource form (DECISIONS.md D-022). Types are hand-written until the generated client
 * exists (GAPS.md G-001).
 */

export type ReadinessResourceType =
  | "PLACE"
  | "POI"
  | "ROUTE"
  | "GUIDE"
  | "EVENT"
  | "CATEGORY"
  | "ASSET"
  | "MAP"
  | "FLOOR_PLAN"
  | "NAVIGATION"
  | "PROJECT";

export interface ReadinessIssue {
  resourceType: ReadinessResourceType;
  resourceId: string | null;
  title: string | null;
  languageCode: string | null;
  path: string;
  code: string;
}

export interface Readiness {
  activatable: boolean;
  blocking: ReadinessIssue[];
  warnings: ReadinessIssue[];
}

export function fetchReadiness(projectId: string, signal?: AbortSignal): Promise<Readiness> {
  return apiRequest<Readiness>(`/projects/${encodeURIComponent(projectId)}/readiness`, { signal });
}

/** A readable name for a field path, such as "Title" for `title` or `translations.en.summary`. */
function fieldName(path: string): string {
  const last = path.replace(/\[\d+\]/g, "").split(".").filter(Boolean).pop() ?? path;
  const words = last.replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

const SENTENCES: Record<string, (issue: ReadinessIssue) => string> = {
  MISSING_DEFAULT_LANGUAGE_VALUE: (i) =>
    i.path.startsWith("blocks") && !i.path.includes(".")
      ? "The guide has no story or blocks in the default language."
      : `${fieldName(i.path)} is missing in the default language.`,
  MISSING_ALTERNATIVE_TEXT: () => "The image has no alternative text, so screen-reader users get nothing.",
  NO_SURFACE_ENABLED: () => "No surface is enabled: visitors have no web, mobile, or kiosk app to open.",
  DANGLING_REFERENCE: (i) => `${fieldName(i.path)} points at something archived or deleted.`,
  ROUTE_WITHOUT_ACTIVE_STOP: () => "The route has no stop whose point of interest is active.",
  TEMPLATE_VALIDATION_FAILED: (i) => `${fieldName(i.path)} does not match what the template expects.`,
  THEME_CONTRAST_FAILED: (i) => `${fieldName(i.path)} has too little colour contrast to be readable.`,
  MISSING_TRANSLATION: (i) => `${fieldName(i.path)} is not translated.`,
  MISSING_TRANSCRIPT: () => "The audio or video has no transcript for visitors who cannot hear it.",
  MISSING_CAPTION_TRACK: () => "The video has no captions.",
  MISSING_ACCESSIBILITY_INFORMATION: () => "Accessibility information for visitors is empty.",
  MAP_WITHOUT_POI_LIST: () => "A map or floor plan has no list of points of interest as an alternative.",
  CAPABILITY_DISABLED: () => "It points at a feature that is switched off for this project.",
  PENDING_WORKING_COPY: () => "It has pending changes that visitors do not see until they are applied.",
  UNREACHABLE_PAGE: () => "No menu item or link leads to this page.",
  PUBLIC_BASE_URL_MISSING: () => "The web app has no public address, so QR codes and shared links cannot be made.",
  AI_OUTPUT_UNREVIEWED: () => "An AI translation has not been reviewed by a person yet.",
  ROUTE_FEW_STOPS: () => "The route has fewer than two stops.",
};

/** One plain-language sentence for an issue; an unknown code still reads sensibly. */
export function describeIssue(issue: ReadinessIssue): string {
  const sentence = SENTENCES[issue.code];
  return sentence ? sentence(issue) : `${fieldName(issue.path)} needs attention (${issue.code}).`;
}

const KIND_NAMES: Record<ReadinessResourceType, string> = {
  PLACE: "Place",
  POI: "Point of interest",
  ROUTE: "Route",
  GUIDE: "Guide",
  EVENT: "Event",
  CATEGORY: "Category",
  ASSET: "Media",
  MAP: "Map",
  FLOOR_PLAN: "Floor plan",
  NAVIGATION: "Navigation",
  PROJECT: "Project",
};

export function kindName(type: ReadinessResourceType): string {
  return KIND_NAMES[type] ?? type;
}

/** Where the author fixes the issue: the Resource's editor, or App settings for project-wide codes. */
export function issueLink(projectId: string, issue: ReadinessIssue): RouteLocationRaw | null {
  const params = { projectId };
  const id = issue.resourceId;
  switch (issue.resourceType) {
    case "PLACE":
      return id ? { name: "place-editor", params: { ...params, placeId: id } } : null;
    case "POI":
      return id ? { name: "poi-editor", params: { ...params, poiId: id } } : null;
    case "ROUTE":
      return id ? { name: "route-editor", params: { ...params, routeId: id } } : null;
    case "GUIDE":
      return id ? { name: "guide-editor", params: { ...params, guideId: id } } : null;
    case "EVENT":
      return id ? { name: "event-editor", params: { ...params, eventId: id } } : null;
    case "CATEGORY":
      return id ? { name: "category-editor", params: { ...params, categoryId: id } } : null;
    case "ASSET":
      return id ? { name: "asset-editor", params: { ...params, assetId: id } } : null;
    case "MAP":
      return id ? { name: "map-editor", params: { ...params, mapId: id } } : null;
    case "FLOOR_PLAN":
      return id ? { name: "floor-plan-editor", params: { ...params, planId: id } } : null;
    case "NAVIGATION":
      return { name: "navigation", params };
    case "PROJECT":
      return issue.path === "surfaces" || issue.code === "PUBLIC_BASE_URL_MISSING" || issue.code === "NO_SURFACE_ENABLED"
        ? { name: "project-surfaces", params }
        : null;
    default:
      return null;
  }
}

/** The English name of a language code ("el" becomes "Greek"); the code itself when the runtime does not know it. */
export function languageName(code: string): string {
  try {
    return new Intl.DisplayNames(["en"], { type: "language" }).of(code) ?? code;
  } catch {
    return code;
  }
}

/**
 * One row's worth of cause for an issue, in the words an author acts on (D-107, B12): "Title is missing in English",
 * "Accessibility information is missing in Italian", or the plain sentence for an issue that is not about one text
 * ("The route has no stop whose point of interest is active"). No kind prefix: the row or group already names the
 * Resource. Pair with {@link issueRowParts} to wrap the language name in `<bdi>`.
 */
export function issueRowText(issue: ReadinessIssue): string {
  const { before, language, after } = issueRowParts(issue);
  return language ? `${before}${language}${after}` : before;
}

/**
 * {@link issueRowText} split around the language name, so a template can wrap that name in `<bdi>` and a name in
 * another script cannot reorder the punctuation of the sentence (RTL-safe). `language` is null when the issue is
 * not about one language; `before` is then the whole sentence.
 */
export function issueRowParts(issue: ReadinessIssue): { before: string; language: string | null; after: string } {
  const field = fieldName(issue.path);
  const language = issue.languageCode ? languageName(issue.languageCode) : null;
  const textPath = /^translations\.[^.]+\.[^.]+$/.test(issue.path);
  if (language && textPath && (issue.code === "MISSING_DEFAULT_LANGUAGE_VALUE" || issue.code === "MISSING_TRANSLATION" || issue.code === "MISSING_ACCESSIBILITY_INFORMATION")) {
    return { before: `${field} is missing in `, language, after: "" };
  }
  const sentence = describeIssue(issue).replace(/\.$/, "");
  return language ? { before: "", language, after: `: ${sentence}` } : { before: sentence, language: null, after: "" };
}

/** One Resource in the warnings list: every problem on it in one row (C2-30). */
export interface IssueLine {
  key: string;
  /** The first issue of the Resource, for its link and subject. */
  issue: ReadinessIssue;
  /** Language names with the fields missing in each, "Italian: Description, Summary"; empty when none is language-specific. */
  languages: string[];
  /** What is wrong, field names first: "Italian: Description, Summary; Greek: Summary" or a plain sentence. */
  detail: string;
}

/** The rows of one kind of Resource. */
export interface KindGroup {
  kind: ReadinessResourceType;
  label: string;
  /** One per Resource. */
  count: number;
  lines: IssueLine[];
}

/**
 * The issues the Dashboard counts: pending changes are shown in their own list, not as warnings (C2-29), and the same
 * problem is listed once.
 */
export function dashboardIssues(issues: ReadinessIssue[]): ReadinessIssue[] {
  const seen = new Set<string>();
  return issues.filter((i) => {
    if (i.code === "PENDING_WORKING_COPY") return false;
    const key = `${i.resourceType}|${i.resourceId ?? "project"}|${i.path}|${i.code}|${i.languageCode ?? ""}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/** The field a language-specific issue is about ("Description"), or the plain sentence when no field applies. */
function issuePart(issue: ReadinessIssue): string {
  const words = issue.languageCode || issue.path.includes("translations") ? fieldName(issue.path) : describeIssue(issue).replace(/\.$/, "");
  return words;
}

/**
 * Issues grouped by kind, then one row per Resource with the fields named ("Italian: Description, Summary"), however
 * many fields and languages it affects (C2-30). Kinds keep the order in which they first occur; the Project's own come
 * first. Pass `dashboardIssues(...)` to drop pending-changes noise.
 */
export function groupIssues(issues: ReadinessIssue[]): KindGroup[] {
  const kinds = new Map<ReadinessResourceType, Map<string, ReadinessIssue[]>>();
  for (const issue of issues) {
    const byResource = kinds.get(issue.resourceType) ?? new Map<string, ReadinessIssue[]>();
    kinds.set(issue.resourceType, byResource);
    const key = issue.resourceId ?? "project";
    byResource.set(key, [...(byResource.get(key) ?? []), issue]);
  }
  const groups: KindGroup[] = [...kinds].map(([kind, byResource]) => {
    const lines: IssueLine[] = [...byResource].map(([id, list]) => {
      const byLanguage = new Map<string, string[]>();
      const general: string[] = [];
      for (const issue of list) {
        const part = issuePart(issue);
        if (issue.languageCode) {
          const name = languageName(issue.languageCode);
          const parts = byLanguage.get(name) ?? [];
          if (!parts.includes(part)) parts.push(part);
          byLanguage.set(name, parts);
        } else if (!general.includes(part)) {
          general.push(part);
        }
      }
      const languages = [...byLanguage].map(([name, parts]) => `${name}: ${parts.join(", ")}`);
      return { key: `${kind}|${id}`, issue: list[0], languages, detail: [...languages, ...general].join("; ") };
    });
    return { kind, label: kindName(kind), count: lines.length, lines };
  });
  return groups.sort((a, b) => Number(b.kind === "PROJECT") - Number(a.kind === "PROJECT"));
}

/** One row per Resource across all kinds, for counts that must agree with the list ("3 warnings"). */
export function issueRows(issues: ReadinessIssue[]): IssueLine[] {
  return groupIssues(issues).flatMap((g) => g.lines);
}

/** The Resource's own title ("Temple"), without its kind: the group heading already names it. */
export function issueTitle(issue: ReadinessIssue): string {
  return issue.resourceType === "PROJECT" ? "Project settings" : (issue.title ?? "Untitled");
}

/** "Point of interest “Temple”" or "Project": the Resource an issue is about. */
export function issueSubject(issue: ReadinessIssue): string {
  return issue.resourceType === "PROJECT" ? "Project" : `${kindName(issue.resourceType)}${issue.title ? ` “${issue.title}”` : ""}`;
}
