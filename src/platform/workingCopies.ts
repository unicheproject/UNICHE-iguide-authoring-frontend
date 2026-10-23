import { apiRequest } from "./api";

/**
 * Working copies of ACTIVE Resources (iGuide spec 03 section 1, 07 section 14, 12 section 4; backend D-027): the
 * pending edit an author saves, applies, or discards. Visitors see nothing until apply. The types are
 * hand-written until the generated client exists (GAPS.md G-001).
 */

export type WorkingCopyKind = "places" | "pois" | "routes" | "guides" | "events" | "categories" | "maps" | "floor-plans";

export interface WorkingCopyError {
  path: string;
  code: string;
  message: string;
}

/** A working copy as the backend returns it. `resource` is the kind's read DTO as it would read after apply. */
export interface WorkingCopyResponse {
  id: string;
  resourceId: string;
  /** The live version the edit started from; apply is refused once the live row moved past it. */
  baseVersion: number;
  /** The live row's version now, which status changes need. */
  liveVersion: number;
  /** The copy's own version, sent back on the next save. */
  version: number;
  createdAt: string;
  updatedAt: string;
  updatedBySubject: string;
  payload: Record<string, unknown>;
  /** Null when the payload no longer passes the rules, for example a referenced item was archived meanwhile. */
  resource: unknown | null;
  errors: WorkingCopyError[];
}

const path = (projectId: string, kind: WorkingCopyKind, resourceId: string) =>
  `/projects/${encodeURIComponent(projectId)}/${kind}/${encodeURIComponent(resourceId)}/working-copy`;

export function fetchWorkingCopy(projectId: string, kind: WorkingCopyKind, resourceId: string): Promise<WorkingCopyResponse> {
  return apiRequest<WorkingCopyResponse>(path(projectId, kind, resourceId));
}

/**
 * Creates or replaces the copy with the full state. `baseVersion` is the live version the edit started from (the
 * live row's own version for a first save, or after an apply conflict); `workingCopyVersion` is the loaded copy's.
 */
export function saveWorkingCopy(
  projectId: string,
  kind: WorkingCopyKind,
  resourceId: string,
  body: { baseVersion: number; workingCopyVersion: number | null; payload: Record<string, unknown> },
): Promise<WorkingCopyResponse> {
  return apiRequest<WorkingCopyResponse>(path(projectId, kind, resourceId), { method: "PUT", body });
}

/** Makes the copy live and deletes it; returns the kind's read DTO as it now reads. */
export function applyWorkingCopy(projectId: string, kind: WorkingCopyKind, resourceId: string): Promise<unknown> {
  return apiRequest<unknown>(`${path(projectId, kind, resourceId)}:apply`, { method: "POST" });
}

export function discardWorkingCopy(projectId: string, kind: WorkingCopyKind, resourceId: string): Promise<void> {
  return apiRequest<void>(path(projectId, kind, resourceId), { method: "DELETE" });
}
