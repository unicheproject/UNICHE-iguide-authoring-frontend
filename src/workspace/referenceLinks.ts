import type { RouteLocationRaw } from "vue-router";
import type { ResourceReference } from "@/platform/references";
import { sectionLocation } from "@/workspace/sections";

/** The Resource whose where-used list is shown; its own triggers are edited in its editor. */
export interface ReferenceSubject {
  resourceType: string;
  resourceId: string;
}

/** The editor of a Resource kind, or null for a kind without one. */
function editorLink(projectId: string, resourceType: string, resourceId: string): RouteLocationRaw | null {
  const params = { projectId };
  switch (resourceType) {
    case "POI":
      return { name: "poi-editor", params: { ...params, poiId: resourceId } };
    case "ROUTE":
      return { name: "route-editor", params: { ...params, routeId: resourceId } };
    case "GUIDE":
      return { name: "guide-editor", params: { ...params, guideId: resourceId } };
    case "EVENT":
      return { name: "event-editor", params: { ...params, eventId: resourceId } };
    case "MAP":
      return { name: "map-editor", params: { ...params, mapId: resourceId } };
    case "FLOOR_PLAN":
      return { name: "floor-plan-editor", params: { ...params, planId: resourceId } };
    case "CATEGORY":
      return { name: "category-editor", params: { ...params, categoryId: resourceId } };
    case "PLACE":
      return { name: "place-editor", params: { ...params, placeId: resourceId } };
    case "ASSET":
      return { name: "asset-editor", params: { ...params, assetId: resourceId } };
    default:
      return null;
  }
}

/**
 * Where a referencing row is edited, for the "Used in" lists (`12` §3 Archive or deactivate, DECISIONS.md D-037):
 * a Resource's editor; a trigger's in the "How visitors reach it" card of the `subject` it opens; Navigation,
 * Pages, and the Theme in their sections, which have no per-row editor yet.
 */
export function referenceLink(
  projectId: string,
  reference: ResourceReference,
  subject?: ReferenceSubject | null,
): RouteLocationRaw | null {
  switch (reference.resourceType) {
    case "TRIGGER": {
      const editor = subject ? editorLink(projectId, subject.resourceType, subject.resourceId) : null;
      return editor && typeof editor === "object" ? { ...editor, hash: TRIGGERS_HASH } : null;
    }
    case "NAVIGATION":
      return sectionLocation(projectId, "navigation");
    case "PAGE":
      return sectionLocation(projectId, "pages");
    case "THEME":
      return sectionLocation(projectId, "app-settings");
    default:
      return editorLink(projectId, reference.resourceType, reference.resourceId);
  }
}

/** The anchor of an editor's "How visitors reach it" card. */
export const TRIGGERS_HASH = "#triggers";

const KIND_LABELS: Record<string, string> = {
  ROUTE: "Route",
  POI: "Point of interest",
  PLACE: "Place",
  GUIDE: "Guide",
  EVENT: "Event",
  CATEGORY: "Category",
  MAP: "Map",
  FLOOR_PLAN: "Floor plan",
  ASSET: "Media",
  TRIGGER: "Trigger",
  NAVIGATION: "Navigation",
  PAGE: "Page",
  THEME: "Theme",
};

/** The label of a referencing kind, such as "Point of interest". */
export function referenceKindLabel(resourceType: string): string {
  return KIND_LABELS[resourceType] ?? resourceType.charAt(0) + resourceType.slice(1).toLowerCase().replace(/_/g, " ");
}
