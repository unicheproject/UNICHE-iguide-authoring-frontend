import { ref, watch, type Ref } from "vue";
import { ApiError, apiRequest } from "@/platform/api";
import { fetchAsset } from "@/platform/assets";
import { fetchTemplates, inkOn, loadFonts } from "@/platform/templates";

/*
 * The Project's theme as the stand-in visitor app draws it (`04` §9–11; backend D-040): the effective values of
 * `GET /projects/{id}/theme` (the Template's defaults overridden by the Project's), the app shell choices, and
 * the logos. The preview applies them as CSS variables (`themeStyle`); colours it derives (ink on the primary
 * colour, tints, muted text) are picked to keep the contrast `14` §2 asks for. A Project that is not initialized
 * has no theme and is drawn in the CMS default.
 */

export type ShellLanguageSwitcher = "HEADER" | "FOOTER" | "OFF";

export interface PreviewTheme {
  /** The style's name ("Byzantine Walls"), "Custom" when changed from it, or null for the CMS default. */
  styleName: string | null;
  primary: string;
  secondary: string;
  background: string;
  text: string;
  headingFont: string;
  bodyFont: string;
  cornerRadius: "SHARP" | "SOFT" | "ROUND";
  density: "COMPACT" | "REGULAR" | "SPACIOUS";
  shell: {
    languageSwitcher: ShellLanguageSwitcher;
    search: "HEADER" | "OFF";
    mobileMenu: "BOTTOM_BAR" | "BURGER";
    kioskHome: "TILES" | "HEADER_MENU";
  };
  logoUrl: string | null;
  compactLogoUrl: string | null;
}

export const DEFAULT_THEME: PreviewTheme = {
  styleName: null,
  primary: "#4c1d8b",
  secondary: "#b4235a",
  background: "#ffffff",
  text: "#030712",
  headingFont: "Georgia, serif",
  bodyFont: "inherit",
  cornerRadius: "SOFT",
  density: "REGULAR",
  shell: { languageSwitcher: "HEADER", search: "HEADER", mobileMenu: "BOTTOM_BAR", kioskHome: "HEADER_MENU" },
  logoUrl: null,
  compactLogoUrl: null,
};

interface ThemeResponse {
  stylePresetKey: string | null;
  stylePresetModified: boolean;
  logoAssetId: string | null;
  compactLogoAssetId: string | null;
  shell: Record<string, string> | null;
  effective: {
    headingFont: string;
    bodyFont: string;
    primaryColor: string;
    secondaryColor: string;
    backgroundColor: string;
    textColor: string;
    cornerRadius: PreviewTheme["cornerRadius"];
    density: PreviewTheme["density"];
  };
}

const TTL = 30_000;
const cache = new Map<string, { at: number; theme: Promise<PreviewTheme> }>();

/** The Project's theme, fetched at most every 30 seconds; the CMS default when the Project has none. */
export function loadProjectTheme(projectId: string): Promise<PreviewTheme> {
  const hit = cache.get(projectId);
  if (hit && Date.now() - hit.at < TTL) return hit.theme;
  const theme = fetchTheme(projectId).catch((e) => {
    cache.delete(projectId);
    if (e instanceof ApiError) return DEFAULT_THEME;
    throw e;
  });
  cache.set(projectId, { at: Date.now(), theme });
  return theme;
}

async function fetchTheme(projectId: string): Promise<PreviewTheme> {
  const [t, templates] = await Promise.all([
    apiRequest<ThemeResponse>(`/projects/${encodeURIComponent(projectId)}/theme`),
    fetchTemplates().catch(() => []),
  ]);
  // Font keys name the same family in every Template; presets too.
  const families = new Map(templates.flatMap((tpl) => tpl.fonts.map((f) => [f.key, f.family] as const)));
  const presetName = templates.flatMap((tpl) => tpl.stylePresets).find((p) => p.key === t.stylePresetKey)?.name ?? null;
  const e = t.effective;
  const heading = families.get(e.headingFont);
  const body = families.get(e.bodyFont);
  loadFonts([heading, body].filter((f): f is string => !!f));
  const logo = async (id: string | null) => {
    if (!id) return null;
    try {
      return (await fetchAsset(projectId, id)).url;
    } catch {
      return null;
    }
  };
  const [logoUrl, compactLogoUrl] = await Promise.all([logo(t.logoAssetId), logo(t.compactLogoAssetId)]);
  const shell = t.shell ?? {};
  return {
    styleName: t.stylePresetModified ? "Custom" : presetName,
    primary: e.primaryColor,
    secondary: e.secondaryColor,
    background: e.backgroundColor,
    text: e.textColor,
    headingFont: heading ? `"${heading}", Georgia, serif` : DEFAULT_THEME.headingFont,
    bodyFont: body ? `"${body}", system-ui, sans-serif` : DEFAULT_THEME.bodyFont,
    cornerRadius: e.cornerRadius,
    density: e.density,
    shell: {
      languageSwitcher: (shell.languageSwitcher as ShellLanguageSwitcher) ?? "HEADER",
      search: shell.search === "OFF" ? "OFF" : "HEADER",
      mobileMenu: shell.mobileMenu === "BURGER" ? "BURGER" : "BOTTOM_BAR",
      kioskHome: shell.kioskHome === "TILES" ? "TILES" : "HEADER_MENU",
    },
    logoUrl,
    compactLogoUrl: compactLogoUrl ?? logoUrl,
  };
}

/** The theme of the given Project, reloaded when the Project changes. */
export function useProjectTheme(projectId: Ref<string | null | undefined>): Ref<PreviewTheme> {
  const theme = ref<PreviewTheme>(DEFAULT_THEME);
  watch(
    projectId,
    async (id) => {
      theme.value = DEFAULT_THEME;
      if (!id) return;
      const loaded = await loadProjectTheme(id);
      if (projectId.value === id) theme.value = loaded;
    },
    { immediate: true },
  );
  return theme;
}

const RADIUS = { SHARP: "0.15em", SOFT: "0.6em", ROUND: "1.2em" } as const;
const SPACE = { COMPACT: "0.8", REGULAR: "1", SPACIOUS: "1.25" } as const;

/** The CSS variables the preview components read. */
export function themeStyle(t: PreviewTheme): Record<string, string> {
  return {
    "--t-primary": t.primary,
    "--t-on-primary": inkOn(t.primary),
    // Small headings and links in the primary colour only where it reads as text on the background.
    "--t-accent": contrast(t.primary, t.background) >= 4.5 ? t.primary : t.text,
    "--t-tint": mix(t.primary, t.background, 0.1),
    "--t-muted": readableMix(t.text, t.background),
    "--t-border": mix(t.text, t.background, 0.14),
    "--t-bg": t.background,
    "--t-text": t.text,
    "--t-heading": t.headingFont,
    "--t-body": t.bodyFont,
    "--t-radius": RADIUS[t.cornerRadius] ?? RADIUS.SOFT,
    "--t-space": SPACE[t.density] ?? SPACE.REGULAR,
  };
}

function rgb(hex: string): [number, number, number] {
  const v = hex.replace("#", "");
  return [0, 2, 4].map((i) => parseInt(v.slice(i, i + 2), 16)) as [number, number, number];
}

/** `share` of `a` over `b`. */
function mix(a: string, b: string, share: number): string {
  const [x, y] = [rgb(a), rgb(b)];
  return `#${x.map((c, i) => Math.round(c * share + y[i] * (1 - share)).toString(16).padStart(2, "0")).join("")}`;
}

/** Secondary text: the text colour softened as far as it stays at 4.5:1 on the background. */
function readableMix(text: string, background: string): string {
  for (const share of [0.62, 0.7, 0.8, 0.9]) {
    const candidate = mix(text, background, share);
    if (contrast(candidate, background) >= 4.5) return candidate;
  }
  return text;
}

function luminance(hex: string): number {
  const [r, g, b] = rgb(hex).map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}
