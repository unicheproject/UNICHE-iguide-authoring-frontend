/**
 * The Projects this author opened most recently, kept in browser storage as ids only (D-084). It never holds a token,
 * a name or any Project data: the picker looks the ids up in the list the Catalogue returned, and an id the author can
 * no longer open simply finds no match. Storage can be missing or blocked (private window, cleared site data), so
 * every access is guarded and the picker works without it.
 */
const KEY = "iguide.recentProjects";
const LIMIT = 5;
const ID_PATTERN = /^[0-9a-f-]{36}$/i;

function read(): string[] {
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === "string" && ID_PATTERN.test(v)).slice(0, LIMIT) : [];
  } catch {
    return [];
  }
}

/** The recently opened Project ids, newest first. */
export function recentProjectIds(): string[] {
  return read();
}

/** The Project opened last, or `null` when there is none (or storage is unavailable). */
export function lastProjectId(): string | null {
  return read()[0] ?? null;
}

/** Records that the author opened this Project. Ignores anything that is not a Project id. */
export function rememberProject(projectId: string): void {
  if (!ID_PATTERN.test(projectId)) return;
  try {
    const next = [projectId, ...read().filter((id) => id !== projectId)].slice(0, LIMIT);
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Storage blocked: the picker just has no Recent group.
  }
}

/** Drops an id the author can no longer open. */
export function forgetRecentProject(projectId: string): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(read().filter((id) => id !== projectId)));
  } catch {
    // Nothing to forget when storage is blocked.
  }
}
