import { createRouter, createWebHistory, type LocationQuery } from "vue-router";
import HomeView from "@/views/HomeView.vue";
import NotFoundView from "@/views/NotFoundView.vue";
import { installRouteAnnouncer } from "@/lib/routeAnnouncer";
import { clearStaleToasts } from "@/stores/toast";
import { workspaceSections } from "@/workspace/sections";

/** A Project id is a UUID; anything else under `/projects/` is an address that does not exist (C2-13). */
const UUID = "[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}";
const sectionPattern = workspaceSections.map((s) => s.slug).join("|");

/** The query parameters `/app-preview` reads, each with the characters it may carry (anything else is dropped). */
const APP_PREVIEW_PARAMS = {
  surface: /^[A-Za-z_]{1,24}$/,
  lang: /^[A-Za-z]{2,3}(?:-[A-Za-z0-9]{2,8}){0,3}$/,
  mode: /^[A-Za-z]{1,12}$/,
  orientation: /^(?:portrait|landscape)$/i,
  real: /^(?:1|true|yes|0|false|no)$/i,
  // A QR code's trigger code (`11` §9): a short opaque token.
  t: /^[\w.~-]{1,128}$/,
} as const;

/**
 * Whitelist parser of the `/app-preview` query (C3-64): the first value of each known parameter, trimmed, kept only
 * when it matches its pattern. Unknown parameters and over-long or oddly shaped values are dropped, never echoed.
 * `AppPreviewView` turns the strings into its typed values and applies its own defaults.
 */
export function parseAppPreviewQuery(query: LocationQuery): Partial<Record<keyof typeof APP_PREVIEW_PARAMS, string>> {
  const result: Partial<Record<keyof typeof APP_PREVIEW_PARAMS, string>> = {};
  for (const key of Object.keys(APP_PREVIEW_PARAMS) as (keyof typeof APP_PREVIEW_PARAMS)[]) {
    const raw = query[key];
    const value = (Array.isArray(raw) ? raw[0] : raw)?.trim();
    if (value && APP_PREVIEW_PARAMS[key].test(value)) result[key] = value;
  }
  return result;
}

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/", name: "home", component: HomeView, meta: { title: "Projects" } },
    { path: "/projects", redirect: { name: "home" } },
    { path: "/projects/new", name: "project-create", component: () => import("@/views/CreateProjectView.vue"), meta: { title: "Create project" } },
    {
      // "Open in new tab" of the Preview: the visitor app alone, without the CMS chrome (`12` §3 Preview).
      path: `/projects/:projectId(${UUID})/app-preview`,
      name: "app-preview",
      component: () => import("@/views/AppPreviewView.vue"),
      // `?t=` is a QR code's trigger (`11` §9): the stand-in app fires it once loaded (DECISIONS.md D-019).
      props: (route) => ({ projectId: route.params.projectId, ...parseAppPreviewQuery(route.query) }),
      meta: { bare: true },
    },
    // Entry route for deep links, including the Platform Portal's (12-cms-experience.md section 4).
    {
      path: `/projects/:projectId(${UUID})`,
      component: () => import("@/views/workspace/ProjectLayout.vue"),
      props: true,
      children: [
        { path: "", name: "project", component: () => import("@/views/workspace/DashboardView.vue"), meta: { title: "Dashboard" } },
        {
          path: "places",
          name: "places",
          component: () => import("@/views/workspace/places/PlacesView.vue"),
          meta: { section: "places" },
        },
        {
          path: "places/:placeId",
          name: "place-editor",
          component: () => import("@/views/workspace/places/PlaceEditorView.vue"),
          props: true,
          meta: { section: "places" },
        },
        {
          path: "pois",
          name: "pois",
          component: () => import("@/views/workspace/pois/PoisView.vue"),
          meta: { section: "pois" },
        },
        {
          path: "pois/:poiId",
          name: "poi-editor",
          component: () => import("@/views/workspace/pois/PoiEditorView.vue"),
          props: true,
          meta: { section: "pois" },
        },
        {
          path: "routes",
          name: "routes",
          component: () => import("@/views/workspace/routes/RoutesView.vue"),
          meta: { section: "routes" },
        },
        {
          path: "routes/:routeId",
          name: "route-editor",
          component: () => import("@/views/workspace/routes/RouteEditorView.vue"),
          props: true,
          meta: { section: "routes" },
        },
        {
          path: "guides",
          name: "guides",
          component: () => import("@/views/workspace/guides/GuidesView.vue"),
          meta: { section: "guides" },
        },
        {
          path: "guides/:guideId",
          name: "guide-editor",
          component: () => import("@/views/workspace/guides/GuideEditorView.vue"),
          props: true,
          meta: { section: "guides" },
        },
        {
          path: "events",
          name: "events",
          component: () => import("@/views/workspace/events/EventsView.vue"),
          meta: { section: "events" },
        },
        {
          path: "events/:eventId",
          name: "event-editor",
          component: () => import("@/views/workspace/events/EventEditorView.vue"),
          props: true,
          meta: { section: "events" },
        },
        {
          path: "categories",
          name: "categories",
          component: () => import("@/views/workspace/categories/CategoriesView.vue"),
          meta: { section: "categories" },
        },
        {
          path: "categories/:categoryId",
          name: "category-editor",
          component: () => import("@/views/workspace/categories/CategoryEditorView.vue"),
          props: true,
          meta: { section: "categories" },
        },
        {
          path: "maps",
          name: "maps",
          component: () => import("@/views/workspace/maps/MapsView.vue"),
          meta: { section: "maps" },
        },
        {
          path: "maps/:mapId",
          name: "map-editor",
          component: () => import("@/views/workspace/maps/MapEditorView.vue"),
          props: true,
          meta: { section: "maps" },
        },
        {
          path: "floor-plans",
          name: "floor-plans",
          component: () => import("@/views/workspace/maps/FloorPlansView.vue"),
          meta: { section: "floor-plans" },
        },
        {
          path: "floor-plans/:planId",
          name: "floor-plan-editor",
          component: () => import("@/views/workspace/maps/FloorPlanEditorView.vue"),
          props: true,
          meta: { section: "floor-plans" },
        },
        {
          path: "media",
          name: "media",
          component: () => import("@/views/workspace/media/MediaView.vue"),
          meta: { section: "media" },
        },
        {
          path: "media/:assetId",
          name: "asset-editor",
          component: () => import("@/views/workspace/media/AssetEditorView.vue"),
          props: true,
          meta: { section: "media" },
        },
        {
          path: "navigation",
          name: "navigation",
          component: () => import("@/views/workspace/navigation/NavigationView.vue"),
          meta: { section: "navigation" },
        },
        {
          path: "preview",
          name: "preview",
          component: () => import("@/views/workspace/PreviewView.vue"),
          meta: { section: "preview" },
        },
        {
          path: "overview",
          name: "overview",
          component: () => import("@/views/workspace/OverviewView.vue"),
          meta: { section: "overview" },
        },
        {
          path: "languages",
          name: "project-languages",
          component: () => import("@/views/workspace/LanguagesView.vue"),
          meta: { section: "languages" },
        },
        {
          path: "surfaces",
          name: "project-surfaces",
          component: () => import("@/views/workspace/SurfacesView.vue"),
          meta: { section: "surfaces" },
        },
        {
          // Visitor app → Translations (`12` §3 Translation workspace, DECISIONS.md D-021).
          path: "translations",
          name: "project-translations",
          component: () => import("@/views/workspace/TranslationsView.vue"),
          meta: { section: "translations" },
        },
        {
          path: `:section(${sectionPattern})`,
          name: "project-section",
          component: () => import("@/views/workspace/SectionView.vue"),
          props: true,
        },
        { path: ":pathMatch(.*)*", name: "project-not-found", component: NotFoundView, meta: { title: "Page not found" } },
      ],
    },
    { path: "/:pathMatch(.*)*", name: "not-found", component: NotFoundView, meta: { title: "Page not found" } },
  ],
});

installRouteAnnouncer(router);
// A route change clears the toasts of the screen that was left (D-102); one raised by the move itself survives.
router.afterEach((to, from, failure) => {
  if (!failure && to.path !== from.path) clearStaleToasts();
});

declare module "vue-router" {
  interface RouteMeta {
    /** Page name for `document.title` and the "<page> loaded" announcement, when the section does not give it. */
    title?: string;
    /** The visitor app preview in its own tab: no CMS chrome. */
    bare?: boolean;
    /** Workspace section the page belongs to, for the active item of the left menu. */
    section?: string;
  }
}
