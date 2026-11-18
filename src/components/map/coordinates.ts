/**
 * Coordinate text handling for the map and floor plan editors (D-081). Authors type coordinates in fields as the
 * accessible alternative to dragging; the text can be anything, so it is parsed here once and never handed to Leaflet
 * or the API unchecked (a non-number reached Leaflet as `Invalid LatLng (NaN)` before, C1-72).
 */

/** Latitude and longitude limits in degrees. */
export const LAT_LIMIT = 90;
export const LNG_LIMIT = 180;

const DECIMAL = /^[+-]?(\d+([.,]\d+)?|[.,]\d+)$/;

/**
 * Reads a decimal number as an author types it: surrounding spaces ignored, a decimal comma accepted ("12,5" is
 * 12.5). Returns `null` for empty text, words, several separators, a thousands separator, or an exponent.
 */
export function parseDecimal(text: string): number | null {
  const trimmed = text.trim();
  if (!DECIMAL.test(trimmed)) return null;
  const value = Number(trimmed.replace(",", "."));
  return Number.isFinite(value) ? value : null;
}

/** Why a coordinate text is not acceptable, or `null` when it is. `axis` names the limit in the message. */
export function coordinateError(text: string, axis: "latitude" | "longitude"): string | null {
  if (!text.trim()) return `Enter a ${axis}.`;
  const limit = axis === "latitude" ? LAT_LIMIT : LNG_LIMIT;
  const value = parseDecimal(text);
  if (value === null) return `Use a number such as ${axis === "latitude" ? "37.9715" : "23.7257"}. A comma or a point is fine as the decimal mark.`;
  if (Math.abs(value) > limit) return `A ${axis} is between -${limit} and ${limit}.`;
  return null;
}

const UNIT_LABEL = { x: "Across (x)", y: "Down (y)" } as const;

/** Decimals kept for a geographic coordinate (about 0.1 m) and for a floor plan's 0 to 1 position. */
export const GEO_DIGITS = 6;
export const UNIT_DIGITS = 4;

/**
 * The one coordinate formatter (C3-75): a number rounded to `digits` decimals, trailing zeros trimmed, always with a
 * decimal point ("37.96884", never "37.968840" or "37,96884").
 */
export function formatCoordinate(value: number, digits: number = GEO_DIGITS): string {
  const text = value.toFixed(digits);
  if (Number(text) === 0) return "0";
  return text.includes(".") ? text.replace(/0+$/, "").replace(/\.$/, "") : text;
}

/**
 * Text as it should read after the author leaves a coordinate field: a valid number is shown through
 * {@link formatCoordinate} (a typed comma becomes a point, extra zeros go); anything else is returned as typed so the
 * error sentence still points at what was written.
 */
export function tidyCoordinate(text: string, digits: number = GEO_DIGITS): string {
  const value = parseDecimal(text);
  return value === null ? text : formatCoordinate(value, digits);
}

/** Why a unit-square coordinate (floor plan x or y, 0 to 1) is not acceptable, or `null`. */
export function unitError(text: string, axis: "x" | "y"): string | null {
  if (!text.trim()) return `Enter ${axis}.`;
  const value = parseDecimal(text);
  if (value === null) return `Use a number between 0 and 1, such as 0.25. A comma or a point is fine as the decimal mark.`;
  if (value < 0 || value > 1) return `${UNIT_LABEL[axis]} must be between 0 and 1.`;
  return null;
}

/** Parses a text already known to be valid; a failure here is a programming error, so it throws. */
export function mustParse(text: string): number {
  const value = parseDecimal(text);
  if (value === null) throw new Error(`Not a decimal number: "${text}"`);
  return value;
}

/** Whether `lat`, `lng` lies inside the south-west and north-east corners. */
export function isInside(lat: number, lng: number, bounds: [[number, number], [number, number]]): boolean {
  return lat >= bounds[0][0] && lat <= bounds[1][0] && lng >= bounds[0][1] && lng <= bounds[1][1];
}

/**
 * A position for the `index`-th item that has no coordinates of its own, spread on a spiral round `centre` so
 * several newly placed items do not stack on one spot. About 36 screen pixels apart at `zoom`.
 */
export function fanOut(centre: { lat: number; lng: number }, zoom: number, index: number): { lat: number; lng: number } {
  const degPerPx = 360 / (256 * 2 ** zoom);
  const radius = 36 * Math.sqrt(index + 1) * degPerPx;
  const angle = index * 2.399963; // the golden angle, in radians
  const lat = centre.lat + radius * Math.sin(angle) * Math.cos((centre.lat * Math.PI) / 180);
  const lng = centre.lng + radius * Math.cos(angle);
  return { lat: Math.max(-LAT_LIMIT, Math.min(LAT_LIMIT, lat)), lng: Math.max(-LNG_LIMIT, Math.min(LNG_LIMIT, lng)) };
}

/**
 * A spot on a floor plan for the `index`-th item placed without a click: a spiral round the middle, about 7 % of the
 * plan apart, so newly placed items do not all land on 0.5 / 0.5 (C1-98). Always inside the plan.
 */
export function fanOutUnit(index: number): { x: number; y: number } {
  const radius = 0.07 * Math.sqrt(index);
  const angle = index * 2.399963;
  const clamp = (v: number) => Math.min(0.96, Math.max(0.04, v));
  return { x: clamp(0.5 + radius * Math.cos(angle)), y: clamp(0.5 + radius * Math.sin(angle)) };
}

/** Why a rotation text is not acceptable, or `null` (empty is fine: no rotation). Whole degrees, 0 to 359. */
export function rotationError(text: string): string | null {
  const t = text.trim();
  if (t === "") return null;
  if (!/^\d+$/.test(t) || Number(t) > 359) return "Whole degrees from 0 to 359, clockwise from straight up.";
  return null;
}
