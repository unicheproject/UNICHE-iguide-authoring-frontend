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
    case "PROJECT":
      return issue.path === "surfaces" || issue.code === "PUBLIC_BASE_URL_MISSING" || issue.code === "NO_SURFACE_ENABLED"
        ? { name: "project-surfaces", params }
        : null;
    default:
      return null;
  }
}
