import type { LocationQuery, LocationQueryRaw, RouteLocationNormalizedLoaded, RouteLocationRaw } from "vue-router";

/**
 * The list state that survives a visit to an editor (D-107 contract, C3-51): the translator's worklist (`lang`,
 * `missing`), the search, status, sort and page of the list the author came from. A list writes it as `back` on the
 * links to its items; `EditorShell` reads it for the breadcrumb and the Back button, so returning to the list shows the
 * same worklist instead of the unfiltered one.
 */
export const LIST_BACK_KEYS = ["q", "status", "lang", "missing", "sort", "dir", "page", "category", "featured", "pending", "view"] as const;

type ListBackKey = (typeof LIST_BACK_KEYS)[number];
const allowed = new Set<string>(LIST_BACK_KEYS);

/** The first value of a query entry, or null when it is absent or empty. */
function firstValue(value: unknown): string | null {
  const one = Array.isArray(value) ? value[0] : value;
  return typeof one === "string" && one !== "" ? one : null;
}

/**
 * The value of the `back` query parameter for a list's current query: only the whitelisted keys with a value, in
 * the whitelist's order, as a query string without the leading `?` ("q=temple&lang=it&missing=1"). An empty string
 * when nothing is set (the list is unfiltered), which a link then leaves out.
 */
export function listBackQuery(query: LocationQuery | Record<string, unknown>): string {
  const params = new URLSearchParams();
  for (const key of LIST_BACK_KEYS) {
    const value = firstValue((query as Record<string, unknown>)[key]);
    if (value !== null) params.set(key, value);
  }
  return params.toString();
}

/**
 * The list query an editor route carries in `back`, as a router query object limited to the whitelisted keys; null
 * when there is none, so the breadcrumb then links to the plain list.
 */
export function readListBack(route: Pick<RouteLocationNormalizedLoaded, "query">): LocationQueryRaw | null {
  const raw = firstValue(route.query.back);
  if (raw === null) return null;
  const query: LocationQueryRaw = {};
  for (const [key, value] of new URLSearchParams(raw)) {
    if (allowed.has(key as ListBackKey) && value !== "") query[key] = value;
  }
  return Object.keys(query).length ? query : null;
}

/**
 * The list location with the worklist the author came from put back: `to` with the `back` query merged in.
 * A location given as a string, or one that already has a query, is returned as is.
 */
export function withListBack(to: RouteLocationRaw, route: Pick<RouteLocationNormalizedLoaded, "query">): RouteLocationRaw {
  const back = readListBack(route);
  if (!back || typeof to === "string" || ("query" in to && to.query)) return to;
  return { ...to, query: back };
}
