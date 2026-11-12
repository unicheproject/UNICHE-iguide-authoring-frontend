import { apiRequest } from "./api";
import type { Project, ProjectResponse } from "./catalogue";
import { toProject } from "./catalogue";
import type { TextDirection } from "./languages";
import type { SurfaceName } from "./surfaces";

/*
 * Application Templates and Project initialization (`04` §3–9, `12` §4 Create a Project; backend D-040): the
 * platform-owned Template versions a Project is initialized from, their style presets, and
 * `POST /projects/{id}/initialize`, which copies the chosen Template's defaults into the Project. Hand-written
 * until the generated client exists (GAPS.md G-001).
 */

export type CornerRadius = "SHARP" | "SOFT" | "ROUND";
export type Density = "COMPACT" | "REGULAR" | "SPACIOUS";

export interface StylePreset {
  key: string;
  name: string;
  description: string;
  /** The Template's `defaultStylePreset`, marked "Suggested". */
  suggested: boolean;
  headingFont: string;
  bodyFont: string;
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  cornerRadius: CornerRadius;
  density: Density;
}

export interface TemplateLanguage {
  languageCode: string;
  displayName: string;
  direction: TextDirection;
  isDefault: boolean;
}

export interface ApplicationTemplate {
  id: string;
  key: string;
  version: number;
  status: string;
  /** In the caller's language, falling back to English. */
  name: string;
  description: string;
  supportedSurfaces: SurfaceName[];
  capabilities: string[];
  /** The languages the Template proposes; the first is the default. */
  defaultLanguages: TemplateLanguage[];
  /** The CSS family of every font key the Template allows. */
  fonts: { key: string; family: string }[];
  stylePresets: StylePreset[];
  defaultStylePreset: string;
  initialCategories: { code: string; scope: string; icon: string; name: string }[];
}

/** The ACTIVE Template versions, in the order the backend lists them. */
export async function fetchTemplates(signal?: AbortSignal): Promise<ApplicationTemplate[]> {
  return (await apiRequest<{ templates: ApplicationTemplate[] }>("/templates", { signal })).templates;
}

export interface InitializeInput {
  templateId: string;
  stylePreset: string;
  languages: { languageCode: string; displayName: string; direction: TextDirection }[];
  defaultLanguage: string;
  surfaces: SurfaceName[];
}

/**
 * Initializes the Project from the Template (`12` §4 step 3). Idempotent while the Project is not initialized: a
 * failed attempt keeps nothing, so it can be sent again; `409 PROJECT_ALREADY_INITIALIZED` once it succeeded.
 * Field errors name `templateId`, `stylePreset`, `languages[i].…`, `defaultLanguage`, and `surfaces[i]`.
 */
export async function initializeProject(projectId: string, input: InitializeInput): Promise<Project> {
  return toProject(
    await apiRequest<ProjectResponse>(`/projects/${encodeURIComponent(projectId)}/initialize`, {
      method: "POST",
      body: input,
    }),
  );
}

/** The ink readable on a colour, near-black or white, whichever contrasts more (`14` §2; backend Q-022). */
export function inkOn(hex: string): string {
  return contrast(hex, "#030712") >= contrast(hex, "#ffffff") ? "#030712" : "#ffffff";
}

function luminance(hex: string): number {
  const v = hex.replace("#", "");
  const [r, g, b] = [0, 2, 4].map((i) => {
    const c = parseInt(v.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const loadedFonts = new Set<string>();

/** Loads the font families a tile or preview draws in, once each, from the same font service as the CMS. */
export function loadFonts(families: string[]): void {
  const missing = families.filter((f) => !loadedFonts.has(f));
  if (!missing.length) return;
  missing.forEach((f) => loadedFonts.add(f));
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = `https://fonts.googleapis.com/css2?${missing
    .map((f) => `family=${encodeURIComponent(f).replace(/%20/g, "+")}:wght@400;700`)
    .join("&")}&display=swap`;
  document.head.appendChild(link);
}
