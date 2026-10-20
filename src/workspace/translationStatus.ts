import type { ProjectLanguage } from "@/platform/languages";

/**
 * How far one language of the Resource being edited is translated, for the editors' "Translations" panel.
 * The fields counted are the ones the content lists use for their completion dots, so list and editor agree.
 */
export interface LanguageStatus {
  language: ProjectLanguage;
  filled: number;
  total: number;
}

export function translationStatus(
  languages: ProjectLanguage[],
  total: number,
  filled: (languageCode: string) => number,
): LanguageStatus[] {
  return languages.map((language) => ({ language, filled: filled(language.languageCode), total }));
}

/** How many of `keys` hold text in one language of a form's texts. */
export function filledFields<K extends string>(texts: Partial<Record<K, string>> | undefined, keys: readonly K[]): number {
  return texts ? keys.filter((k) => texts[k]?.trim()).length : 0;
}
