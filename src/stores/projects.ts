import { computed, reactive, readonly } from "vue";
import { ApiError } from "@/platform/api";
import { fetchMyAuthorization, type MyAuthorization } from "@/platform/authorization";
import {
  fetchProject,
  listOrganisationProjects,
  type Organisation,
  type Project,
} from "@/platform/catalogue";

/**
 * The organisations and Projects the signed-in user can see, grouped for the Project switcher and
 * the picker. It is a display cache of Catalogue data: opening a Project still goes through the
 * backend's access check, and a Project the Catalogue no longer admits is dropped from here.
 */

export interface OrganisationGroup {
  organisation: Organisation;
  /** Whether the user manages the organisation, and may therefore create Projects in it. */
  managed: boolean;
  projects: Project[];
}

type LoadStatus = "idle" | "loading" | "ready" | "error";

interface ProjectsState {
  status: LoadStatus;
  error: ApiError | null;
  groups: OrganisationGroup[];
}

const state = reactive<ProjectsState>({
  status: "idle",
  error: null,
  groups: [],
});

export const projectsState = readonly(state);

export const manageableOrganisations = computed(() =>
  state.groups.filter((g) => g.managed).map((g) => g.organisation),
);

export const canCreateProjects = computed(() => manageableOrganisations.value.length > 0);

export function findProject(projectId: string): Project | undefined {
  for (const group of state.groups) {
    const project = group.projects.find((p) => p.id === projectId);
    if (project) return project;
  }
  return undefined;
}

export function findOrganisation(orgId: string): Organisation | undefined {
  return state.groups.find((g) => g.organisation.id === orgId)?.organisation;
}

let inFlight: Promise<void> | null = null;

export function loadProjects(): Promise<void> {
  if (!inFlight) {
    inFlight = doLoad().finally(() => {
      inFlight = null;
    });
  }
  return inFlight;
}

async function doLoad(): Promise<void> {
  state.status = "loading";
  state.error = null;
  try {
    const authorization = await fetchMyAuthorization();
    const groups = await Promise.all(organisationIdsOf(authorization).map((id) => loadGroup(id, authorization)));
    state.groups = groups.sort((a, b) => a.organisation.name.localeCompare(b.organisation.name));
    state.status = "ready";
  } catch (e) {
    if (!(e instanceof ApiError)) throw e;
    state.error = e;
    state.status = "error";
  }
}

function organisationIdsOf(authorization: MyAuthorization): string[] {
  return [
    ...new Set([
      ...authorization.managedOrganisations,
      ...authorization.projectMemberships.map((m) => m.orgId),
    ]),
  ];
}

async function loadGroup(orgId: string, authorization: MyAuthorization): Promise<OrganisationGroup> {
  const managed = authorization.managedOrganisations.includes(orgId);
  const projects = await listOrganisationProjects(orgId).catch((e) => {
    if (isDenied(e)) return membershipProjects(orgId, authorization);
    throw e;
  });
  return { organisation: placeholderOrganisation(orgId), managed, projects: sortByName(projects) };
}

/**
 * The backend has no organization read yet (backend G-021, M1c), so the name is a placeholder that
 * still tells several organisations apart.
 */
function placeholderOrganisation(orgId: string): Organisation {
  return { id: orgId, name: `Organisation ${orgId.slice(0, 8)}`, slug: null, status: null };
}

/** Falls back to reading each membership Project on its own when the organisation list is denied. */
async function membershipProjects(orgId: string, authorization: MyAuthorization): Promise<Project[]> {
  const ids = authorization.projectMemberships.filter((m) => m.orgId === orgId).map((m) => m.projectId);
  const results = await Promise.all(
    ids.map((id) =>
      fetchProject(id).catch((e) => {
        if (isDenied(e)) return null;
        throw e;
      }),
    ),
  );
  return results.filter((p): p is Project => p !== null);
}

function isDenied(e: unknown): boolean {
  return e instanceof ApiError && (e.status === 403 || e.status === 404);
}

/** Adds or refreshes one Project, e.g. after creating or opening it. */
export function upsertProject(project: Project): void {
  const group = state.groups.find((g) => g.organisation.id === project.orgId);
  if (!group) return;
  const index = group.projects.findIndex((p) => p.id === project.id);
  if (index >= 0) {
    group.projects[index] = project;
  } else {
    group.projects.push(project);
  }
  group.projects = sortByName(group.projects);
}

/** Drops a Project the Catalogue no longer admits the user to. */
export function forgetProject(projectId: string): void {
  for (const group of state.groups) {
    group.projects = group.projects.filter((p) => p.id !== projectId);
  }
}

function sortByName(projects: Project[]): Project[] {
  return [...projects].sort((a, b) => a.name.localeCompare(b.name));
}
