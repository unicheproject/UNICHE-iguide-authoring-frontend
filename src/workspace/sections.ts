/**
 * Primary navigation of the Project workspace, in the order and grouping of the CMS mockup
 * (`navSpec` in iGuide CMS.html). Titles and subtitles are the mockup's page heads. Some sections are
 * not menu items of their own but tabs of one (`tabGroups` in the mockup): App settings holds Appearance,
 * Languages, Surfaces, and Features; Maps & Floor Plans holds Maps and Floor plans.
 */

export interface WorkspaceSection {
  /** Path segment under `/projects/{projectId}/`. */
  slug: string;
  title: string;
  subtitle: string;
}

export type WorkspaceNavEntry = { group: string } | { section: WorkspaceSection };

const section = (slug: string, title: string, subtitle: string): WorkspaceSection => ({ slug, title, subtitle });
const item = (s: WorkspaceSection): WorkspaceNavEntry => ({ section: s });

const appSettings = section(
  "app-settings",
  "App settings",
  "Brand, theme and the chrome the visitor app draws around every Page. None of this can be set per page.",
);
const languages = section("languages", "Languages", "Every text field is translated per language; the default language is mandatory");
const surfaces = section("surfaces", "Surfaces", "The surfaces the Template ships; each can be enabled or disabled for this Project");
const features = section(
  "features",
  "Features",
  "Template capabilities, Project feature configuration and the manifest features map use one vocabulary",
);
const maps = section("maps", "Maps & Floor Plans", "Geographic maps that place Points of Interest and Places");
const floorPlans = section("floor-plans", "Maps & Floor Plans", "Indoor plans with normalized coordinates per Resource");

export const workspaceNav: WorkspaceNavEntry[] = [
  { group: "Content" },
  item(section("places", "Places", "Physical or conceptual locations, from region to room")),
  item(section("pois", "Points of Interest", "Objects and spots visitors can open directly")),
  item(section("routes", "Routes", "Ordered sequences of stops through your content")),
  item(section("guides", "Guides", "Entries with text and an optional story: reading pieces, products, businesses, archive items")),
  item(section("events", "Events", "Dated happenings visitors can plan around")),
  item(section("categories", "Categories", "Taxonomy used to group and filter content")),
  item(section("media", "Media", "Images, audio, video, documents and 3D models used by your content")),
  item(maps),
  { group: "Visitor app" },
  item(
    section(
      "overview",
      "Overview",
      "Content fills Pages, Pages are reached through Navigation, the Theme paints them, and Preview renders the result per surface.",
    ),
  ),
  item(appSettings),
  item(section("pages", "Pages", "Pages seeded by the Template, restricted to its allowed component types")),
  item(
    section(
      "navigation",
      "Navigation",
      "Menus of the visitor app per context and surface. A surface-specific menu wins over one for all surfaces.",
    ),
  ),
  item(section("translations", "Translations", "Completeness of every resource per language")),
  item(
    section(
      "preview",
      "Preview",
      "The runtime rendered with your unpublished content, per surface and language. Preview never changes what visitors see.",
    ),
  ),
  item(section("launch", "Launch", "Readiness, the Application status, preview links, and Deployment Packages")),
  { group: "Project" },
  item(section("audit-log", "Audit log", "Append-only authoring events; visitor analytics are never stored locally")),
];

/** Sections shown as tabs of a menu item, with the tab labels, in order. */
export const tabGroups: Record<string, { slug: string; label: string }[]> = {
  "app-settings": [
    { slug: "app-settings", label: "Appearance" },
    { slug: "languages", label: "Languages" },
    { slug: "surfaces", label: "Surfaces" },
    { slug: "features", label: "Features" },
  ],
  maps: [
    { slug: "maps", label: "Maps" },
    { slug: "floor-plans", label: "Floor plans" },
  ],
};

const tabSections = [languages, surfaces, features, floorPlans];

export const workspaceSections: WorkspaceSection[] = [
  ...workspaceNav.flatMap((e) => ("section" in e ? [e.section] : [])),
  ...tabSections,
];

export function findSection(slug: string): WorkspaceSection | undefined {
  return workspaceSections.find((s) => s.slug === slug);
}

/** The menu item a section belongs to: itself, or the item whose tabs include it. */
export function navOwner(slug: string): string {
  const owner = Object.entries(tabGroups).find(([, tabs]) => tabs.some((t) => t.slug === slug));
  return owner ? owner[0] : slug;
}

/** The tabs to show above a section, if it is one of a group. */
export function tabsOf(slug: string): { owner: string; tabs: { slug: string; label: string }[] } | null {
  const owner = navOwner(slug);
  return tabGroups[owner] ? { owner, tabs: tabGroups[owner] } : null;
}

/** Sections with a page of their own, by route name; the others open the placeholder page. */
const DEDICATED_ROUTES: Record<string, string> = {
  places: "places",
  pois: "pois",
  routes: "routes",
  guides: "guides",
  events: "events",
  categories: "categories",
  media: "media",
  maps: "maps",
  "floor-plans": "floor-plans",
  languages: "project-languages",
  surfaces: "project-surfaces",
  overview: "overview",
  preview: "preview",
};

export function sectionLocation(projectId: string, slug: string) {
  const name = DEDICATED_ROUTES[slug];
  return name ? { name, params: { projectId } } : { name: "project-section", params: { projectId, section: slug } };
}
