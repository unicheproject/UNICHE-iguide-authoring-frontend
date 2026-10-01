import { apiRequest } from "./api";
import type { PlaceableType } from "./maps";
import type { ResourceStatus } from "./places";
import type { ResourceReference } from "./references";

export interface FloorPlanPosition {
  resourceType: PlaceableType;
  resourceId: string;
  /** Normalized from 0 (left, top) to 1 (right, bottom). */
  x: number;
  y: number;
  rotation: number | null;
}

export const CONNECTION_TYPES = ["STAIRS", "ELEVATOR", "RAMP", "ESCALATOR", "DOOR", "OTHER"] as const;
export type ConnectionType = (typeof CONNECTION_TYPES)[number];
const CONNECTION_LABELS: Record<ConnectionType, string> = {
  STAIRS: "Stairs",
  ELEVATOR: "Lift",
  RAMP: "Ramp",
  ESCALATOR: "Escalator",
  DOOR: "Door",
  OTHER: "Other",
};
export const connectionTypeLabel = (t: ConnectionType) => CONNECTION_LABELS[t];

export interface FloorPlanConnection {
  id: string | null;
  toFloorPlanId: string;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  connectionType: ConnectionType;
  bidirectional: boolean;
  label: string | null;
}

/** A Floor Plan (iGuide spec 03, section 8). */
export interface FloorPlan {
  id: string;
  projectId: string;
  status: ResourceStatus;
  internalName: string;
  /** The indoor Place whose page shows the plan. */
  placeId: string | null;
  assetId: string;
  width: number | null;
  height: number | null;
  coordinateSystem: "NORMALIZED";
  sortOrder: number;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
  version: number;
  positions: FloorPlanPosition[];
  connections: FloorPlanConnection[];
}

const base = (projectId: string) => `/projects/${encodeURIComponent(projectId)}/floor-plans`;

export const listFloorPlans = (projectId: string, signal?: AbortSignal) => apiRequest<FloorPlan[]>(base(projectId), { signal });
export const fetchFloorPlan = (projectId: string, planId: string) => apiRequest<FloorPlan>(`${base(projectId)}/${encodeURIComponent(planId)}`);
export const createFloorPlan = (projectId: string, input: { internalName: string; assetId: string; placeId: string | null }) =>
  apiRequest<FloorPlan>(base(projectId), { method: "POST", body: input });
export const updateFloorPlan = (
  projectId: string,
  planId: string,
  input: {
    version: number;
    internalName: string;
    assetId: string;
    placeId: string | null;
    positions: FloorPlanPosition[];
    connections: FloorPlanConnection[];
  },
) => apiRequest<FloorPlan>(`${base(projectId)}/${encodeURIComponent(planId)}`, { method: "PUT", body: input });
export const changeFloorPlanStatus = (projectId: string, planId: string, targetStatus: ResourceStatus, version: number) =>
  apiRequest<FloorPlan>(`${base(projectId)}/${encodeURIComponent(planId)}/status`, { method: "POST", body: { targetStatus, version } });
export const fetchFloorPlanReferences = (projectId: string, planId: string) =>
  apiRequest<ResourceReference[]>(`${base(projectId)}/${encodeURIComponent(planId)}/references`);
