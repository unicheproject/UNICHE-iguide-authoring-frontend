import { triggerSurfaces, type Trigger } from "@/platform/triggers";

/**
 * The visitor surfaces as the stand-in preview draws them (`04` §6; DECISIONS.md D-014, D-015, D-082). Sizes are real
 * viewport sizes in CSS pixels: a laptop browser, a phone, and a portrait kiosk at the common 1080 x 1920.
 */
export const SURFACES = {
  WEB: { label: "Web", caption: "Desktop browser", width: 1280, height: 800, font: 16 },
  MOBILE: { label: "Mobile", caption: "Phone", width: 390, height: 780, font: 15 },
  KIOSK: { label: "Kiosk", caption: "Kiosk screen", width: 1080, height: 1920, font: 24 },
} as const;

export type Surface = keyof typeof SURFACES;

/** Every surface in the order the controls list them. */
export const SURFACE_KEYS = ["WEB", "MOBILE", "KIOSK"] as const satisfies readonly Surface[];

/** A Kiosk is portrait by default; the other surfaces have one orientation. */
export type Orientation = "portrait" | "landscape";

/** How a frame is sized: Fit shrinks to the room, the others are fixed scales. */
export type Zoom = "fit" | "100" | "50";

/** The real size of a surface in the given orientation (only a Kiosk turns). */
export function surfaceSize(surface: Surface, orientation: Orientation = "portrait"): { width: number; height: number } {
  const { width, height } = SURFACES[surface];
  return surface === "KIOSK" && orientation === "landscape" ? { width: height, height: width } : { width, height };
}

/** "Kiosk screen, 1080 × 1920" for the caption under a frame. */
export function surfaceCaption(surface: Surface, orientation: Orientation = "portrait"): string {
  const { width, height } = surfaceSize(surface, orientation);
  return `${SURFACES[surface].caption}, ${width} × ${height}`;
}

/**
 * Whether a trigger can reach a visitor on the surface: the surfaces it names, or those able to run its type (a Bluetooth
 * beacon is sensed by a phone only, `03` §14), so a beacon is not offered on Web or Kiosk.
 */
export function triggerReaches(trigger: Pick<Trigger, "triggerType" | "supportedSurfaces">, surface: Surface): boolean {
  return triggerSurfaces(trigger.triggerType, trigger.supportedSurfaces).includes(surface);
}

/** The first of the Project's surfaces that is enabled, in the order Web, Mobile, Kiosk; Web when none is known. */
export function firstEnabledSurface(enabled: readonly Surface[] | null | undefined): Surface {
  return SURFACE_KEYS.find((s) => enabled?.includes(s)) ?? "WEB";
}

/** Reads a surface from text in any case, or null when it names none. */
export function parseSurface(value: unknown): Surface | null {
  if (typeof value !== "string") return null;
  const upper = value.trim().toUpperCase();
  return SURFACE_KEYS.find((s) => s === upper) ?? null;
}
