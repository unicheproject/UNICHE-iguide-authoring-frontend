import { apiRequest } from "./api";

/**
 * Organisations and Projects as the authoring API relays them from the UNICHE Catalogue, which owns
 * both. The backend checks access with the Catalogue on every call; nothing here is authoritative.
 *
 * Stopgap until the generated client (PLAN.md C0b, C0c): the paths use the backend's `organizations`
 * spelling and each response is mapped onto the shape the screens already use (GAPS.md G-004).
 */

export interface Organisation {
  id: string;
  name: string;
  slug: string | null;
  status: string | null;
}

export interface Project {
  id: string;
  orgId: string;
  name: string;
  slug: string;
  status: string;
  /** As the Catalogue dates the Project; null when it sends none. */
  createdAt: string | null;
  updatedAt: string | null;
  /**
   * Local initialization state (`12` §3 Project picker; backend D-040). Only a read of the Project itself fills
   * it: the organisation listings relay the Catalogue and leave `initialized` false and the rest empty, so
   * `detailed` tells whether these fields can be trusted.
   */
  detailed: boolean;
  initialized: boolean;
  initializedAt: string | null;
  template: { id: string; key: string; version: number; name: string } | null;
  stylePresetKey: string | null;
  applicationStatus: string | null;
  enabledSurfaces: string[];
}

/** A Project as the backend returns it (`ProjectResponse`). */
export interface ProjectResponse {
  id: string;
  organizationId: string;
  name: string;
  slug: string;
  status: string;
  localDescription: string | null;
  initialized: boolean;
  createdAt?: string | null;
  updatedAt?: string | null;
  initializedAt?: string | null;
  template?: Project["template"];
  stylePresetKey?: string | null;
  applicationStatus?: string | null;
  enabledSurfaces?: string[] | null;
}

export function toProject(response: ProjectResponse, detailed = true): Project {
  return {
    id: response.id,
    orgId: response.organizationId,
    name: response.name,
    slug: response.slug,
    status: response.status,
    createdAt: response.createdAt ?? null,
    updatedAt: response.updatedAt ?? null,
    detailed,
    initialized: response.initialized,
    initializedAt: response.initializedAt ?? null,
    template: response.template ?? null,
    stylePresetKey: response.stylePresetKey ?? null,
    applicationStatus: response.applicationStatus ?? null,
    enabledSurfaces: response.enabledSurfaces ?? [],
  };
}

/** The organisations the caller manages or belongs to, as the Catalogue names them (`02` §11). */
export async function listOrganisations(signal?: AbortSignal): Promise<Organisation[]> {
  const organisations = await apiRequest<Organisation[]>("/organizations", { signal });
  return organisations.map((o) => ({ id: o.id, name: o.name, slug: o.slug ?? null, status: o.status ?? null }));
}

export interface CreateProjectInput {
  name: string;
  slug: string;
}

export async function listOrganisationProjects(orgId: string, signal?: AbortSignal): Promise<Project[]> {
  const projects = await apiRequest<ProjectResponse[]>(`/organizations/${encodeURIComponent(orgId)}/projects`, {
    signal,
  });
  return projects.map((p) => toProject(p, false));
}

/** Creates the Project in the Catalogue (step 1 of Project creation); the backend adds the tool slug. */
export async function createProject(orgId: string, input: CreateProjectInput): Promise<Project> {
  const project = await apiRequest<ProjectResponse>(`/organizations/${encodeURIComponent(orgId)}/projects`, {
    method: "POST",
    body: input,
  });
  // A Project just created is not initialized, so its local state is known.
  return toProject(project);
}

/** Reads one Project; the backend asks the Catalogue whether the caller may access it. */
export async function fetchProject(projectId: string, signal?: AbortSignal): Promise<Project> {
  return toProject(await apiRequest<ProjectResponse>(`/projects/${encodeURIComponent(projectId)}`, { signal }));
}
