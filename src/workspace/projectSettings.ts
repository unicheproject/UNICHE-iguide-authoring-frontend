import { ref, watch, type Ref } from "vue";
import { ApiError } from "@/platform/api";
import { fetchSettings, type Capability, type ProjectSettings } from "@/platform/settings";

/*
 * The Project settings the Content screens follow (CMS D-049): capabilities switched off in App settings → Features
 * grey their content kinds and trigger types with the reason (`12` §3), and Event times are shown in the Project
 * timezone (`03` §15). Null while loading, for a Project that is not initialized, or when the settings cannot be
 * read: then nothing is greyed (the backend still checks) and times use the browser's timezone.
 */

const TTL = 30_000;
const cache = new Map<string, { at: number; settings: Promise<ProjectSettings | null> }>();

export function loadProjectSettings(projectId: string): Promise<ProjectSettings | null> {
  const hit = cache.get(projectId);
  if (hit && Date.now() - hit.at < TTL) return hit.settings;
  const settings = fetchSettings(projectId).catch((e) => {
    cache.delete(projectId);
    if (e instanceof ApiError) return null;
    throw e;
  });
  cache.set(projectId, { at: Date.now(), settings });
  return settings;
}

export function useProjectSettings(projectId: Ref<string | null | undefined>): Ref<ProjectSettings | null> {
  const settings = ref<ProjectSettings | null>(null);
  watch(
    projectId,
    async (id) => {
      settings.value = null;
      if (!id) return;
      const loaded = await loadProjectSettings(id);
      if (projectId.value === id) settings.value = loaded;
    },
    { immediate: true },
  );
  return settings;
}

const CAPABILITY_NAMES: Record<Capability, string> = {
  PAGES: "Pages",
  POI_EXPLORATION: "Points of Interest",
  ROUTES: "Routes",
  GUIDES: "Guides",
  MAPS: "Maps",
  FLOOR_PLANS: "Floor plans",
  EVENTS: "Events",
  SEARCH: "Search",
  OFFLINE_CONTENT: "Offline content",
  LOCATION_TRIGGERS: "Location triggers",
  QR_TRIGGERS: "QR codes",
  FEEDBACK: "Feedback",
  CHATBOT: "Chat",
};

/** Why visitors cannot use a capability, or null when they can (or the settings are unknown). */
export function capabilityOff(settings: ProjectSettings | null, capability: Capability): string | null {
  if (!settings) return null;
  if (!settings.capabilities.includes(capability)) return "not offered by this Project's Template";
  if (settings.featureConfiguration[capability] === false) return "disabled in App settings → Features";
  return null;
}

/** The Content menu items and the capabilities that make them visible to visitors. */
export const SECTION_CAPABILITIES: Record<string, Capability[]> = {
  pois: ["POI_EXPLORATION"],
  routes: ["ROUTES"],
  guides: ["GUIDES"],
  events: ["EVENTS"],
  // One menu item for both: off only when visitors get neither maps nor floor plans.
  maps: ["MAPS", "FLOOR_PLANS"],
};

/** Why a Content menu item is greyed, such as "Events: disabled in App settings → Features", or null. */
export function sectionOff(settings: ProjectSettings | null, slug: string): string | null {
  const capabilities = SECTION_CAPABILITIES[slug];
  if (!capabilities) return null;
  const reasons = capabilities.map((c) => capabilityOff(settings, c));
  if (!reasons.every((r) => r)) return null;
  return capabilities.map((c, i) => `${CAPABILITY_NAMES[c]}: ${reasons[i]}`).join("; ");
}
