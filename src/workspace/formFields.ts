/**
 * Conversions and checks shared by the Resource editors. Form fields hold strings, with "" for absent,
 * because inputs do; the API takes null for absent and numbers for numbers.
 */

export type Texts<K extends string> = Record<K, string>;

export function blankTexts<K extends string>(keys: readonly K[]): Texts<K> {
  return Object.fromEntries(keys.map((k) => [k, ""])) as Texts<K>;
}

/** Form texts from the API's texts of one language; missing and null become "". */
export function textsFrom<K extends string>(keys: readonly K[], source: Partial<Record<K, string | null>> | undefined): Texts<K> {
  return Object.fromEntries(keys.map((k) => [k, source?.[k] ?? ""])) as Texts<K>;
}

/** The API's texts of every enabled language; "" becomes null, languages without a row get all nulls. */
export function textsForApi<K extends string>(
  keys: readonly K[],
  languageCodes: string[],
  texts: Record<string, Texts<K>>,
): Record<string, Record<K, string | null>> {
  return Object.fromEntries(
    languageCodes.map((code) => [
      code,
      Object.fromEntries(keys.map((k) => [k, texts[code]?.[k] || null])) as Record<K, string | null>,
    ]),
  );
}

/** Adds an empty row for every enabled language that has none, leaving existing text alone. */
export function ensureTextRows<K extends string>(keys: readonly K[], languageCodes: string[], texts: Record<string, Texts<K>>) {
  for (const code of languageCodes) {
    if (!texts[code]) texts[code] = blankTexts(keys);
  }
}

export const optionalNumber = (value: string): number | null => (value.trim() ? Number(value) : null);
export const optionalText = (value: string): string | null => value.trim() || null;
export const numberText = (value: number | null | undefined): string => value?.toString() ?? "";

export function isWholeNumber(value: string, min: number, max: number): boolean {
  return /^\d+$/.test(value) && Number(value) >= min && Number(value) <= max;
}

/** Latitude and longitude are set together or not at all, each in its range. */
export function checkCoordinates(latitude: string, longitude: string, found: Record<string, string>) {
  const lat = latitude.trim();
  const lng = longitude.trim();
  if (!!lat !== !!lng) found.latitude = "Set latitude and longitude together, or leave both empty.";
  if (lat && (Number.isNaN(Number(lat)) || Math.abs(Number(lat)) > 90)) found.latitude = "A number between -90 and 90.";
  if (lng && (Number.isNaN(Number(lng)) || Math.abs(Number(lng)) > 180)) found.longitude = "A number between -180 and 180.";
}

/** "Title (English)" for `translations.en.title`, using the labels of the editor's text fields. */
export function describeTranslationPath(
  path: string,
  languages: { languageCode: string; displayName: string }[],
  labels: Record<string, { label: string }>,
): string | null {
  const match = /^translations\.([^.]+)(?:\.(\w+))?$/.exec(path);
  if (!match) return null;
  const language = languages.find((l) => l.languageCode === match[1])?.displayName ?? match[1];
  const field = match[2] ? labels[match[2]]?.label ?? match[2] : "Texts";
  return `${field} (${language})`;
}
