import { computed, reactive, readonly } from "vue";
import { ApiError } from "@/platform/api";
import { fetchMyAuthorization, type MyAuthorization } from "@/platform/authorization";
import {
  fetchProject,
  listOrganisationProjects,
  listOrganisations,
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

/**
 * Projects read on their own (the Dashboard layout, the picker), by id. The listing relays the Catalogue and carries no
 * initialization state, so a listing that lands after such a read must not replace it, and a read that lands before the
 * listing (a deep link, a reload) must survive until the listing arrives (C2-07). Cleared by `forgetProject`.
 */
const detailsById = reactive(new Map<string, Project>());
/** Reads that failed, so the chip can stop waiting: a Project absent from here and not yet `detailed` is still loading. */
const failedDetails = reactive(new Set<string>());

/** "loading" until a read of the Project lands, "failed" when it could not be read, "ready" once it is detailed. */
export function detailState(projectId: string): "ready" | "loading" | "failed" {
  if (findProject(projectId)?.detailed) return "ready";
  return failedDetails.has(projectId) ? "failed" : "loading";
}

/** Records that reading a Project failed (an error page is showing), so no chip waits for it. */
export function markDetailFailed(projectId: string): void {
  failedDetails.add(projectId);
}

/** The listed Project with whatever a direct read already told us about it. */
function mergeDetails(listed: Project): Project {
  const known = detailsById.get(listed.id);
  if (!known || listed.detailed) return listed;
  return { ...known, name: listed.name, status: listed.status, orgId: listed.orgId };
}

export const manageableOrganisations = computed(() =>
  state.groups.filter((g) => g.managed).map((g) => g.organisation),
);

export const canCreateProjects = computed(() => manageableOrganisations.value.length > 0);

export function findProject(projectId: string): Project | undefined {
  for (const group of state.groups) {
    const project = group.projects.find((p) => p.id === projectId);
    if (project) return project;
  }
  // Opened by a deep link before (or without) a listing that names it: the direct read still gives its name and status.
  return detailsById.get(projectId);
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
    const [authorization, named] = await Promise.all([fetchMyAuthorization(), loadOrganisationNames()]);
    const groups = await Promise.all(
      organisationIdsOf(authorization).map((id) => loadGroup(id, authorization, named.get(id))),
    );
    // Merge, never replace: reads of single Projects made while the listing was in flight survive it.
    state.groups = groups
      .map((g) => ({ ...g, projects: sortByName(g.projects.map(mergeDetails)) }))
      .sort((a, b) => collator.compare(a.organisation.name, b.organisation.name));
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

async function loadGroup(orgId: string, authorization: MyAuthorization, organisation?: Organisation): Promise<OrganisationGroup> {
  const managed = authorization.managedOrganisations.includes(orgId);
  const projects = await listOrganisationProjects(orgId).catch((e) => {
    if (isDenied(e)) return membershipProjects(orgId, authorization);
    throw e;
  });
  return { organisation: organisation ?? placeholderOrganisation(orgId), managed, projects: sortByName(projects) };
}

/** Projects being read for their initialization state, so two lists asking for the same one send a single request. */
const detailing = new Set<string>();
/** How many Project reads run at once when the picker fills in the rows it shows (G-029 is the real fix). */
const DETAIL_CONCURRENCY = 4;

/**
 * Reads the given Projects on their own, for their initialization state and Application status: the listing relays the
 * Catalogue and carries none (backend D-040, Q-020). Only the rows the picker shows (and the open Project) are read, a
 * few at a time, instead of one request per Project on every load (C1-53). A Project that cannot be read keeps its
 * listed values.
 */
export async function ensureDetailed(projectIds: readonly string[]): Promise<void> {
  const queue = projectIds.filter((id) => {
    const p = findProject(id);
    return p && !p.detailed && !detailing.has(id);
  });
  queue.forEach((id) => {
    detailing.add(id);
    failedDetails.delete(id);
  });
  async function worker(): Promise<void> {
    for (let id = queue.shift(); id !== undefined; id = queue.shift()) {
      try {
        upsertProject(await fetchProject(id));
      } catch (e) {
        if (!(e instanceof ApiError)) throw e;
        failedDetails.add(id);
      } finally {
        detailing.delete(id);
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(DETAIL_CONCURRENCY, queue.length) }, worker));
}

/** The Catalogue's names of the organisations; none when it cannot be read, so the picker still opens. */
async function loadOrganisationNames(): Promise<Map<string, Organisation>> {
  try {
    return new Map((await listOrganisations()).map((o) => [o.id, o]));
  } catch (e) {
    if (!(e instanceof ApiError)) throw e;
    return new Map();
  }
}

/** For an organisation the Catalogue did not name: a placeholder that still tells several apart. */
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

type Listed = Pick<Project, "id" | "detailed" | "initialized">;

/** A Project created but not initialized offers "resume initialization" instead of opening (`12` §3). */
export const needsSetup = (p: Listed) => p.detailed && !p.initialized;

/** Where the picker leads for a Project: its Dashboard, or Create a Project at step 2 to resume initialization. */
export const projectTarget = (p: Listed) =>
  needsSetup(p) ? { name: "project-create", query: { resume: p.id } } : { name: "project", params: { projectId: p.id } };

/** Adds or refreshes one Project, e.g. after creating or opening it. */
export function upsertProject(project: Project): void {
  if (project.detailed) {
    detailsById.set(project.id, project);
    failedDetails.delete(project.id);
  }
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
  detailsById.delete(projectId);
  failedDetails.delete(projectId);
  for (const group of state.groups) {
    group.projects = group.projects.filter((p) => p.id !== projectId);
  }
}

/** Names sort the way the author reads them: accents and case ignored, digits by value, Greek after Latin as the platform's locale orders it. */
const collator = new Intl.Collator(undefined, { sensitivity: "base", numeric: true });

function sortByName(projects: Project[]): Project[] {
  return [...projects].sort((a, b) => collator.compare(a.name, b.name));
}
