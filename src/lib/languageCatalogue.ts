import type { TextDirection } from "@/platform/languages";

/** Languages the CMS offers to add, with their own name and text direction. */
export interface KnownLanguage {
  code: string;
  displayName: string;
  englishName: string;
  direction: TextDirection;
}

export const KNOWN_LANGUAGES: KnownLanguage[] = [
  { code: "el", displayName: "Ελληνικά", englishName: "Greek", direction: "LTR" },
  { code: "en", displayName: "English", englishName: "English", direction: "LTR" },
  { code: "fr", displayName: "Français", englishName: "French", direction: "LTR" },
  { code: "de", displayName: "Deutsch", englishName: "German", direction: "LTR" },
  { code: "it", displayName: "Italiano", englishName: "Italian", direction: "LTR" },
  { code: "es", displayName: "Español", englishName: "Spanish", direction: "LTR" },
  { code: "pt", displayName: "Português", englishName: "Portuguese", direction: "LTR" },
  { code: "nl", displayName: "Nederlands", englishName: "Dutch", direction: "LTR" },
  { code: "bg", displayName: "Български", englishName: "Bulgarian", direction: "LTR" },
  { code: "ro", displayName: "Română", englishName: "Romanian", direction: "LTR" },
  { code: "tr", displayName: "Türkçe", englishName: "Turkish", direction: "LTR" },
  { code: "ar", displayName: "العربية", englishName: "Arabic", direction: "RTL" },
  { code: "he", displayName: "עברית", englishName: "Hebrew", direction: "RTL" },
  { code: "zh", displayName: "中文", englishName: "Chinese", direction: "LTR" },
  { code: "ja", displayName: "日本語", englishName: "Japanese", direction: "LTR" },
];
