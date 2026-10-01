import type { ResourceStatus } from "./places";

/** One Resource that points at another, as the where-used list shows it. */
export interface ResourceReference {
  resourceType: "ROUTE" | string;
  resourceId: string;
  title: string;
  status: ResourceStatus;
}
