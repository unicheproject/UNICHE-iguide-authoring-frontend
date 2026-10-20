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

/*
 * Stopgap until the generated client (PLAN.md C0b, C3). The iGuide backend (D-018) pages its lists,
 * serves positions as a child collection (`.../floor-plans/{id}/positions`), and has no connections
 * between floor plans (removed by spec `03` section 8; floors switch by `sortOrder`). The functions below
 * keep `FloorPlan`, with `connections` always empty.
 */

type FloorPlanResponse = Omit<FloorPlan, "positions" | "connections">;

interface PositionResponse extends FloorPlanPosition {
  id: string;
}

interface Page<T> {
  content: T[];
  totalPages: number;
}

const positionsPath = (projectId: string, planId: string) => `${base(projectId)}/${encodeURIComponent(planId)}/positions`;

async function toFloorPlan(projectId: string, plan: FloorPlanResponse, signal?: AbortSignal): Promise<FloorPlan> {
  const positions = await apiRequest<PositionResponse[]>(positionsPath(projectId, plan.id), { signal });
  return {
    ...plan,
    positions: positions.map(({ resourceType, resourceId, x, y, rotation }) => ({ resourceType, resourceId, x, y, rotation })),
    connections: [],
  };
}

export async function listFloorPlans(projectId: string, signal?: AbortSignal): Promise<FloorPlan[]> {
  const plans: FloorPlanResponse[] = [];
  for (let page = 0; ; page++) {
    const result = await apiRequest<Page<FloorPlanResponse>>(`${base(projectId)}?size=200&page=${page}`, { signal });
    plans.push(...result.content);
    if (page + 1 >= result.totalPages) break;
  }
  return Promise.all(plans.map((plan) => toFloorPlan(projectId, plan, signal)));
}

export async function fetchFloorPlan(projectId: string, planId: string): Promise<FloorPlan> {
  return toFloorPlan(projectId, await apiRequest<FloorPlanResponse>(`${base(projectId)}/${encodeURIComponent(planId)}`));
}

export async function createFloorPlan(
  projectId: string,
  input: { internalName: string; assetId: string; placeId: string | null },
): Promise<FloorPlan> {
  return toFloorPlan(projectId, await apiRequest<FloorPlanResponse>(base(projectId), { method: "POST", body: input }));
}

/**
 * Saves the plan, then brings its positions in line with `input.positions`. `connections` are not sent:
 * the backend has none.
 */
export async function updateFloorPlan(
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
): Promise<FloorPlan> {
  const { positions, connections: _connections, ...rest } = input;
  const plan = await apiRequest<FloorPlanResponse>(`${base(projectId)}/${encodeURIComponent(planId)}`, { method: "PUT", body: rest });
  const path = positionsPath(projectId, planId);
  const current = await apiRequest<PositionResponse[]>(path);
  const key = (p: { resourceType: string; resourceId: string }) => `${p.resourceType}:${p.resourceId}`;
  const wanted = new Map(positions.map((p) => [key(p), p]));
  const existing = new Map(current.map((p) => [key(p), p]));
  for (const p of current.filter((p) => !wanted.has(key(p)))) {
    await apiRequest(`${path}/${encodeURIComponent(p.id)}`, { method: "DELETE" });
  }
  for (const p of positions) {
    const before = existing.get(key(p));
    if (!before) {
      await apiRequest(path, { method: "POST", body: p });
    } else if (before.x !== p.x || before.y !== p.y || before.rotation !== p.rotation) {
      await apiRequest(`${path}/${encodeURIComponent(before.id)}`, { method: "PUT", body: { x: p.x, y: p.y, rotation: p.rotation } });
    }
  }
  return toFloorPlan(projectId, plan);
}

export async function changeFloorPlanStatus(
  projectId: string,
  planId: string,
  targetStatus: ResourceStatus,
  version: number,
): Promise<FloorPlan> {
  return toFloorPlan(
    projectId,
    await apiRequest<FloorPlanResponse>(`${base(projectId)}/${encodeURIComponent(planId)}/status`, {
      method: "POST",
      body: { targetStatus, version },
    }),
  );
}

export const fetchFloorPlanReferences = (projectId: string, planId: string) =>
  apiRequest<ResourceReference[]>(`${base(projectId)}/${encodeURIComponent(planId)}/references`);
