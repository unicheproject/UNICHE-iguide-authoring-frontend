import { apiRequest } from "./api";

/**
 * Project settings (iGuide spec 03 section 2; backend D-040, D-042): which capabilities the visitor app offers, the
 * Project timezone, and the content revision. The types are hand-written until the generated client exists
 * (GAPS.md G-001). A Project that is not initialized has none (`409 PROJECT_NOT_INITIALIZED`).
 */

export type Capability =
  | "PAGES"
  | "POI_EXPLORATION"
  | "ROUTES"
  | "GUIDES"
  | "MAPS"
  | "FLOOR_PLANS"
  | "EVENTS"
  | "SEARCH"
  | "OFFLINE_CONTENT"
  | "LOCATION_TRIGGERS"
  | "QR_TRIGGERS"
  | "FEEDBACK"
  | "CHATBOT";

export interface ProjectSettings {
  applicationStatus: "DRAFT" | "LIVE" | "SUSPENDED";
  /** Raised by every change visitors could see (`11` §4). */
  contentRevision: number;
  /** An IANA zone such as Europe/Athens; null when the Project has none. */
  timezone: string | null;
  featureConfiguration: Partial<Record<Capability, boolean>>;
  /** The applied Template's capabilities: the only ones that can be on. */
  capabilities: Capability[];
  version: number;
  updatedAt: string;
}

export function fetchSettings(projectId: string, signal?: AbortSignal): Promise<ProjectSettings> {
  return apiRequest<ProjectSettings>(`/projects/${encodeURIComponent(projectId)}/settings`, { signal });
}
