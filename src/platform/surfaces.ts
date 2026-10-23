import { apiRequest } from "./api";

/*
 * The Project's surfaces (spec 03 section 2, 12 section 4 Change surfaces; backend D-029): which of WEB, MOBILE, and
 * KIOSK are enabled, and the WEB surface's public web address, which QR codes and absolute links need. The types
 * are hand-written until the generated client exists (GAPS.md G-001).
 */

export type SurfaceName = "WEB" | "MOBILE" | "KIOSK";

export interface SurfaceConfiguration {
  /** WEB only: the origin where the organization hosts the web build, such as `https://guide.museum.gr`. */
  publicBaseUrl?: string;
}

export interface ProjectSurface {
  surface: SurfaceName;
  enabled: boolean;
  sortOrder: number;
  configuration: SurfaceConfiguration;
}

export interface SurfaceInput {
  surface: SurfaceName;
  enabled: boolean;
  configuration: SurfaceConfiguration;
}

const path = (projectId: string) => `/projects/${encodeURIComponent(projectId)}/surfaces`;

/** All three surfaces, in the order WEB, MOBILE, KIOSK; one never saved reads as disabled. */
export async function fetchSurfaces(projectId: string, signal?: AbortSignal): Promise<ProjectSurface[]> {
  return (await apiRequest<{ surfaces: ProjectSurface[] }>(path(projectId), { signal })).surfaces;
}

/** Saves all three surfaces at once; errors name `surfaces[i].configuration.publicBaseUrl`. */
export async function updateSurfaces(projectId: string, surfaces: SurfaceInput[]): Promise<ProjectSurface[]> {
  return (await apiRequest<{ surfaces: ProjectSurface[] }>(path(projectId), { method: "PUT", body: { surfaces } })).surfaces;
}

/** The WEB address QR codes use: only while WEB is enabled. */
export function publicBaseUrlOf(surfaces: ProjectSurface[]): string | null {
  const web = surfaces.find((s) => s.surface === "WEB");
  return web?.enabled && web.configuration.publicBaseUrl ? web.configuration.publicBaseUrl : null;
}
