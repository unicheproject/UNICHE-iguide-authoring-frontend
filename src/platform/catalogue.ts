import { apiRequest } from "./api";

/**
 * Organisations and Projects as the authoring API relays them from the UNICHE Catalogue, which owns
 * both. The backend checks access with the Catalogue on every call; nothing here is authoritative.
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
  toolSlug: string;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface CreateProjectInput {
  name: string;
  slug: string;
}

export function fetchOrganisation(orgId: string, signal?: AbortSignal): Promise<Organisation> {
  return apiRequest<Organisation>(`/organisations/${encodeURIComponent(orgId)}`, { signal });
}

export function listOrganisationProjects(orgId: string, signal?: AbortSignal): Promise<Project[]> {
  return apiRequest<Project[]>(`/organisations/${encodeURIComponent(orgId)}/projects`, { signal });
}

/** Creates the Project in the Catalogue (step 1 of Project creation); the backend adds the tool slug. */
export function createProject(orgId: string, input: CreateProjectInput): Promise<Project> {
  return apiRequest<Project>(`/organisations/${encodeURIComponent(orgId)}/projects`, {
    method: "POST",
    body: input,
  });
}

/** Reads one Project; the backend asks the Catalogue whether the caller may access it. */
export function fetchProject(projectId: string, signal?: AbortSignal): Promise<Project> {
  return apiRequest<Project>(`/projects/${encodeURIComponent(projectId)}`, { signal });
}
