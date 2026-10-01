import type { RouteLocationRaw } from "vue-router";
import type { ResourceReference } from "@/platform/references";

/** Where the editor of a referencing Resource lives, for the "Used in" lists. */
export function referenceLink(projectId: string, reference: ResourceReference): RouteLocationRaw | null {
  const params = { projectId };
  switch (reference.resourceType) {
    case "POI":
      return { name: "poi-editor", params: { ...params, poiId: reference.resourceId } };
    case "ROUTE":
      return { name: "route-editor", params: { ...params, routeId: reference.resourceId } };
    case "GUIDE":
      return { name: "guide-editor", params: { ...params, guideId: reference.resourceId } };
    case "EVENT":
      return { name: "event-editor", params: { ...params, eventId: reference.resourceId } };
    case "MAP":
      return { name: "map-editor", params: { ...params, mapId: reference.resourceId } };
    case "FLOOR_PLAN":
      return { name: "floor-plan-editor", params: { ...params, planId: reference.resourceId } };
    case "CATEGORY":
      return { name: "category-editor", params: { ...params, categoryId: reference.resourceId } };
    case "PLACE":
      return { name: "place-editor", params: { ...params, placeId: reference.resourceId } };
    default:
      return null;
  }
}
