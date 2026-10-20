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
  /** Not served by the backend yet; always `null` until it is. */
  createdAt: string | null;
  updatedAt: string | null;
}

/** A Project as the backend returns it (`ProjectResponse`). */
interface ProjectResponse {
  id: string;
  organizationId: string;
  name: string;
  slug: string;
  status: string;
  localDescription: string | null;
  initialized: boolean;
}

function toProject(response: ProjectResponse): Project {
  return {
    id: response.id,
    orgId: response.organizationId,
    name: response.name,
    slug: response.slug,
    status: response.status,
    createdAt: null,
    updatedAt: null,
  };
}

export interface CreateProjectInput {
  name: string;
  slug: string;
}

export async function listOrganisationProjects(orgId: string, signal?: AbortSignal): Promise<Project[]> {
  const projects = await apiRequest<ProjectResponse[]>(`/organizations/${encodeURIComponent(orgId)}/projects`, {
    signal,
  });
  return projects.map(toProject);
}

/** Creates the Project in the Catalogue (step 1 of Project creation); the backend adds the tool slug. */
export async function createProject(orgId: string, input: CreateProjectInput): Promise<Project> {
  const project = await apiRequest<ProjectResponse>(`/organizations/${encodeURIComponent(orgId)}/projects`, {
    method: "POST",
    body: input,
  });
  return toProject(project);
}

/** Reads one Project; the backend asks the Catalogue whether the caller may access it. */
export async function fetchProject(projectId: string, signal?: AbortSignal): Promise<Project> {
  return toProject(await apiRequest<ProjectResponse>(`/projects/${encodeURIComponent(projectId)}`, { signal }));
}
