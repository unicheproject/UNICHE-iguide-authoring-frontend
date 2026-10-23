import { createRouter, createWebHistory } from "vue-router";
import HomeView from "@/views/HomeView.vue";
import { workspaceSections } from "@/workspace/sections";

const sectionPattern = workspaceSections.map((s) => s.slug).join("|");

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/", name: "home", component: HomeView },
    { path: "/projects/new", name: "project-create", component: () => import("@/views/CreateProjectView.vue") },
    {
      // "Open in new tab" of the Preview: the visitor app alone, without the CMS chrome (`12` §3 Preview).
      path: "/projects/:projectId/app-preview",
      name: "app-preview",
      component: () => import("@/views/AppPreviewView.vue"),
      props: (route) => ({
        projectId: route.params.projectId,
        surface: route.query.surface,
        lang: route.query.lang,
        mode: route.query.mode,
        // A QR code's `?t=` (`11` §9): the stand-in app fires that trigger once loaded (DECISIONS.md D-019).
        t: route.query.t,
      }),
      meta: { bare: true },
    },
    // Entry route for deep links, including the Platform Portal's (12-cms-experience.md section 4).
    {
      path: "/projects/:projectId",
      component: () => import("@/views/workspace/ProjectLayout.vue"),
      props: true,
      children: [
        { path: "", name: "project", component: () => import("@/views/workspace/DashboardView.vue") },
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
          path: `:section(${sectionPattern})`,
          name: "project-section",
          component: () => import("@/views/workspace/SectionView.vue"),
          props: true,
        },
        { path: ":pathMatch(.*)*", redirect: { name: "project" } },
      ],
    },
    { path: "/:pathMatch(.*)*", redirect: { name: "home" } },
  ],
});

declare module "vue-router" {
  interface RouteMeta {
    /** Workspace section the page belongs to, for the active item of the left menu. */
    section?: string;
  }
}
