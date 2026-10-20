import { apiRequest } from "./api";
import type { ResourceStatus } from "./places";
import type { ResourceReference } from "./references";

/**
 * Categories as the CMS mockup of 2026-10-01 defines them: each applies to Points of Interest or to Routes,
 * has at most two levels (a category and its subcategories), and shows a built-in icon. A Point of Interest
 * or Route has at most one Category.
 */
export const CATEGORY_SCOPES = ["POI", "ROUTE"] as const;
export type CategoryScope = (typeof CATEGORY_SCOPES)[number];

const SCOPE_LABELS: Record<CategoryScope, string> = { POI: "Points of Interest", ROUTE: "Routes" };
export const scopeLabel = (scope: CategoryScope) => SCOPE_LABELS[scope];

/** The mockup's icon set (`icons()`): label and a 24 × 24 stroke path. */
export const CATEGORY_ICONS: Record<string, [string, string]> = {
  monument: ["Monument", "M3 21h18M4 18h16M4 8h16M12 3l8 5H4zM7 8v10M12 8v10M17 8v10"],
  building: ["Museum", "M4 21V6l8-3 8 3v15M9 21v-5h6v5M8 9h2M14 9h2M8 13h2M14 13h2M3 21h18"],
  statue: ["Sculpture", "M12 2.5a2 2 0 1 1 0 4 2 2 0 0 1 0-4M9 9h6l-1 6h-4zM10 15l-1 4M14 15l1 4M7 21h10"],
  vase: ["Pottery", "M9 3h6M10 3c0 3-4 5-4 10a6 6 0 0 0 12 0c0-5-4-7-4-10M8 21h8"],
  church: ["Church", "M12 2v4M10 4h4M6 21V11l6-5 6 5v10M10 21v-4h4v4M3 21h18"],
  castle: ["Castle", "M4 21V8h3v2h2V8h2v2h2V8h2v2h2V8h3v13M10 21v-4h4v4M3 21h18"],
  tree: ["Nature", "M12 2l6 9h-3l4 6H5l4-6H6zM12 17v5"],
  mountain: ["Mountain", "M2 20l7-12 4 6 3-4 6 10z"],
  beach: ["Beach", "M3 19c2 0 2-1.5 4.5-1.5S10 19 12 19s2-1.5 4.5-1.5S19 19 21 19M17 9a3 3 0 1 1-6 0 3 3 0 0 1 6 0M3 15h18"],
  view: ["Viewpoint", "M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12zM12 9a3 3 0 1 1 0 6 3 3 0 0 1 0-6"],
  food: ["Food", "M7 3v8M5 3v5a2 2 0 0 0 4 0V3M7 11v10M17 3c-2 1-3 4-3 7h3v11"],
  shop: ["Shop", "M5 8h14l-1 13H6zM9 8V6a3 3 0 0 1 6 0v2"],
  info: ["Info", "M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18M12 11v6M12 7.5v.5"],
  photo: ["Photo", "M4 7h3l2-3h6l2 3h3v13H4zM12 10a3.5 3.5 0 1 1 0 7 3.5 3.5 0 0 1 0-7"],
  water: ["Water", "M12 3s6 7 6 11a6 6 0 0 1-12 0c0-4 6-11 6-11"],
  harbour: ["Harbour", "M12 3a2 2 0 1 1 0 4 2 2 0 0 1 0-4M12 7v14M8 11h8M5 14a7 7 0 0 0 14 0"],
  factory: ["Industry", "M3 21V11l5 3v-3l5 3v-3l5 3V5h3v16zM7 18h2M12 18h2M17 18h2"],
  trail: ["Trail", "M5 21V4M5 4h11l-2 4 2 4H5"],
  family: ["Family", "M8 6a2 2 0 1 1 0 4 2 2 0 0 1 0-4M16 8a1.6 1.6 0 1 1 0 3.2 1.6 1.6 0 0 1 0-3.2M5 21v-6a3 3 0 0 1 6 0v6M13.5 21v-4a2.5 2.5 0 0 1 5 0v4"],
  bike: ["Bike", "M6 14a3.5 3.5 0 1 1 0 7 3.5 3.5 0 0 1 0-7M18 14a3.5 3.5 0 1 1 0 7 3.5 3.5 0 0 1 0-7M6 17.5l4-8h5l3 8M10 9.5l3 8M9 6h3"],
};
/** Drawn for a Category without an icon. */
export const NO_ICON_PATH = "M12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8";

export interface CategoryTranslation {
  name: string | null;
  description: string | null;
}

export interface Category {
  id: string;
  projectId: string;
  code: string;
  status: ResourceStatus;
  scope: CategoryScope;
  /** Null for a top-level Category. */
  parentCategoryId: string | null;
  /** A key of `CATEGORY_ICONS`, or null. */
  icon: string | null;
  sortOrder: number;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
  version: number;
  hasWorkingCopy: boolean;
  workingCopyUpdatedAt: string | null;
  translations: Record<string, CategoryTranslation>;
  /** Points of Interest or Routes in the Category. */
  resourceCount: number;
}

const base = (projectId: string) => `/projects/${encodeURIComponent(projectId)}/categories`;

/** Every Category of the Project, in order: the backend serves at most 200 per page (backend D-024). */
export async function listCategories(projectId: string, signal?: AbortSignal): Promise<Category[]> {
  const categories: Category[] = [];
  for (let page = 0; ; page++) {
    const result = await apiRequest<{ content: Category[]; totalPages: number }>(
      `${base(projectId)}?size=200&page=${page}`,
      { signal },
    );
    categories.push(...result.content);
    if (page + 1 >= result.totalPages) return categories;
  }
}

export function fetchCategory(projectId: string, categoryId: string): Promise<Category> {
  return apiRequest<Category>(`${base(projectId)}/${encodeURIComponent(categoryId)}`);
}

export function createCategory(
  projectId: string,
  input: { name: string; code: string; scope: CategoryScope; parentCategoryId: string | null },
): Promise<Category> {
  return apiRequest<Category>(base(projectId), { method: "POST", body: input });
}

export function updateCategory(
  projectId: string,
  categoryId: string,
  input: {
    version: number;
    code: string;
    scope: CategoryScope;
    parentCategoryId: string | null;
    icon: string | null;
    translations: Record<string, CategoryTranslation>;
  },
): Promise<Category> {
  return apiRequest<Category>(`${base(projectId)}/${encodeURIComponent(categoryId)}`, { method: "PUT", body: input });
}

export function changeCategoryStatus(projectId: string, categoryId: string, targetStatus: ResourceStatus, version: number): Promise<Category> {
  return apiRequest<Category>(`${base(projectId)}/${encodeURIComponent(categoryId)}/status`, { method: "POST", body: { targetStatus, version } });
}

export function fetchCategoryReferences(projectId: string, categoryId: string): Promise<ResourceReference[]> {
  return apiRequest<ResourceReference[]>(`${base(projectId)}/${encodeURIComponent(categoryId)}/references`);
}

export function categoryName(category: Category, defaultLanguage: string | null): string {
  return (defaultLanguage ? category.translations[defaultLanguage]?.name?.trim() : undefined) || category.code;
}

export function categoryCompleteness(category: Category, languageCode: string): "complete" | "partial" | "missing" {
  const t = category.translations[languageCode];
  const filled = t ? [t.name, t.description].filter((v) => v?.trim()).length : 0;
  if (filled === 0) return "missing";
  return filled === 2 ? "complete" : "partial";
}

export const categoryIconPath = (category: Pick<Category, "icon"> | null | undefined) =>
  (category?.icon && CATEGORY_ICONS[category.icon]?.[1]) || NO_ICON_PATH;

/** A Category in tree order with its level: 0 for a top-level Category, 1 for a subcategory. */
export interface CategoryNode {
  category: Category;
  depth: 0 | 1;
}

/**
 * The two-level tree (mockup `catTree`): each top-level Category followed by its subcategories, both by
 * `sortOrder`. A subcategory whose parent is missing from the list shows at the top level.
 */
export function categoryTree(categories: Category[], scope?: CategoryScope, includeArchived = false): CategoryNode[] {
  const list = categories
    .filter((c) => (includeArchived || c.status !== "ARCHIVED") && (!scope || c.scope === scope))
    .sort((a, b) => a.sortOrder - b.sortOrder);
  const ids = new Set(list.map((c) => c.id));
  const tops = list.filter((c) => !c.parentCategoryId || !ids.has(c.parentCategoryId));
  return tops.flatMap((top) => [
    { category: top, depth: 0 as const },
    ...list.filter((c) => c.parentCategoryId === top.id).map((c) => ({ category: c, depth: 1 as const })),
  ]);
}

/** "Sculpture › Kouroi" for a subcategory (mockup `catLabel`). */
export function categoryLabel(category: Category, all: Category[], defaultLanguage: string | null): string {
  const parent = category.parentCategoryId ? all.find((c) => c.id === category.parentCategoryId) : undefined;
  return (parent ? `${categoryName(parent, defaultLanguage)} › ` : "") + categoryName(category, defaultLanguage);
}

/** Top-level Categories of a scope that a Category can sit under, never itself. */
export function parentChoices(categories: Category[], scope: CategoryScope, defaultLanguage: string | null, exclude?: string) {
  return categories
    .filter((c) => c.scope === scope && !c.parentCategoryId && c.status !== "ARCHIVED" && c.id !== exclude)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((c) => ({ id: c.id, label: categoryName(c, defaultLanguage) }));
}

/** The choices of a Point of Interest's or Route's Category select. */
export function assignableCategories(categories: Category[], scope: CategoryScope, defaultLanguage: string | null) {
  return categoryTree(categories, scope).map(({ category }) => ({ id: category.id, label: categoryLabel(category, categories, defaultLanguage) }));
}

/**
 * Puts a Point of Interest or Route in `categoryId`, or in none, through its `.../categories` bindings
 * (backend D-024: at most one Category per Resource). Only a DRAFT Resource accepts the change.
 */
export async function setResourceCategory(
  projectId: string,
  kind: "pois" | "routes",
  resourceId: string,
  categoryId: string | null,
): Promise<void> {
  const path = `/projects/${encodeURIComponent(projectId)}/${kind}/${encodeURIComponent(resourceId)}/categories`;
  const current = await apiRequest<{ id: string; categoryId: string }[]>(path);
  if (current.length === 1 && current[0].categoryId === categoryId) return;
  for (const binding of current) await apiRequest(`${path}/${encodeURIComponent(binding.id)}`, { method: "DELETE" });
  if (categoryId) await apiRequest(path, { method: "POST", body: { categoryId } });
}
