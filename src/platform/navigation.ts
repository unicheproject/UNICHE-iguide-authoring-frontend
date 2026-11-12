import { apiRequest } from "./api";

/*
 * The visitor app's menus (iGuide spec 03 section 13, 07 section 14, 12 section 3 Navigation editor; backend D-046):
 * one PRIMARY tree and one flat list of FOOTER links per Project, shared by every surface. They have no lifecycle and
 * no working copy: every write is live. Every answer is the whole Navigation with its items in tree order, each with
 * its depth, so the editor redraws from it. The types are hand-written until the generated client exists (GAPS.md
 * G-001).
 */

export type NavigationContext = "PRIMARY" | "FOOTER";
/** A link to a Resource, a link to a Page (refused until Pages exist), or a heading of the main menu. */
export type NavigationItemType = "RESOURCE" | "PAGE" | "GROUP";
export type NavigationTargetType = "PLACE" | "POI" | "ROUTE" | "GUIDE" | "EVENT";

export interface NavigationItem {
  id: string;
  parentItemId: string | null;
  depth: number;
  sortOrder: number;
  itemType: NavigationItemType;
  targetResourceType: NavigationTargetType | null;
  targetResourceId: string | null;
  targetPageId: string | null;
  /** Language code to label; a language without one shows the target's title. */
  labels: Record<string, string>;
  version: number;
}

export interface Navigation {
  id: string;
  projectId: string;
  name: string;
  context: NavigationContext;
  configuration: Record<string, unknown>;
  updatedAt: string;
  updatedBySubject: string;
  version: number;
  /** In tree order: each item after its parent, siblings by `sortOrder`. */
  items: NavigationItem[];
}

export interface NavigationItemInput {
  itemType: NavigationItemType;
  targetResourceType?: NavigationTargetType | null;
  targetResourceId?: string | null;
  parentItemId?: string | null;
  /** Only the languages to change; a blank label removes that language's. */
  labels?: Record<string, string>;
}

/** The names a new Navigation gets; the visitor app never shows them. */
export const NAVIGATION_NAMES: Record<NavigationContext, string> = { PRIMARY: "Main menu", FOOTER: "Footer links" };

const base = (projectId: string) => `/projects/${encodeURIComponent(projectId)}/navigations`;
const items = (projectId: string, navigationId: string) => `${base(projectId)}/${encodeURIComponent(navigationId)}/items`;

export function listNavigations(projectId: string, signal?: AbortSignal): Promise<Navigation[]> {
  return apiRequest<Navigation[]>(base(projectId), { signal });
}

export function createNavigation(projectId: string, context: NavigationContext): Promise<Navigation> {
  return apiRequest<Navigation>(base(projectId), { method: "POST", body: { context, name: NAVIGATION_NAMES[context] } });
}

export function addNavigationItem(projectId: string, navigationId: string, input: NavigationItemInput): Promise<Navigation> {
  return apiRequest<Navigation>(items(projectId, navigationId), { method: "POST", body: input });
}

/** Changes an item; a new `parentItemId` puts it last among that parent's items. */
export function updateNavigationItem(
  projectId: string,
  navigationId: string,
  item: NavigationItem,
  input: NavigationItemInput,
): Promise<Navigation> {
  return apiRequest<Navigation>(`${items(projectId, navigationId)}/${encodeURIComponent(item.id)}`, {
    method: "PUT",
    body: { version: item.version, ...input },
  });
}

/** Removes the item and every item under it. */
export function removeNavigationItem(projectId: string, navigationId: string, item: NavigationItem): Promise<Navigation> {
  return apiRequest<Navigation>(`${items(projectId, navigationId)}/${encodeURIComponent(item.id)}?version=${item.version}`, {
    method: "DELETE",
  });
}

/** One language's label; an empty one removes it. */
export function saveNavigationLabel(
  projectId: string,
  navigationId: string,
  item: NavigationItem,
  language: string,
  label: string,
): Promise<Navigation> {
  const path = `${items(projectId, navigationId)}/${encodeURIComponent(item.id)}/translations/${encodeURIComponent(language)}`;
  return label.trim()
    ? apiRequest<Navigation>(path, { method: "PUT", body: { version: item.version, label: label.trim() } })
    : apiRequest<Navigation>(`${path}?version=${item.version}`, { method: "DELETE" });
}

/** Every item id once, in tree order; each item takes the next place among its siblings. */
export function reorderNavigation(projectId: string, navigationId: string, ids: string[]): Promise<Navigation> {
  return apiRequest<Navigation>(`${items(projectId, navigationId)}:order`, { method: "PUT", body: { ids } });
}

/** The ids of the item and every item under it, in tree order. */
export function subtree(navigation: Navigation, itemId: string): string[] {
  const start = navigation.items.findIndex((i) => i.id === itemId);
  if (start < 0) return [];
  const depth = navigation.items[start].depth;
  const ids = [itemId];
  for (let i = start + 1; i < navigation.items.length && navigation.items[i].depth > depth; i++) ids.push(navigation.items[i].id);
  return ids;
}
