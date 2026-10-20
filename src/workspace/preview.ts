import type { Bounds, CanvasMarker } from "@/components/map/GeoMapCanvas.vue";
import type { Asset, AssetUsage, MediaBinding } from "@/platform/assets";
import type { ProjectLanguage } from "@/platform/languages";

/*
 * The model of the editors' "Preview" panel (`12` §3, Resource editors). A stand-in until the web runtime
 * can be embedded (DECISIONS.md D-014): each editor describes its Resource as blocks, from the live form,
 * and `ResourcePreview.vue` draws them in a visitor shell.
 */

/**
 * A text as the visitor would read it. A language without the value shows the default-language value, as
 * the manifest fills it (`11` §3), and is marked missing; null when no language has a value.
 */
export type PreviewText = { text: string; missing: boolean } | null;

export interface PreviewImage {
  url: string;
  alt: string;
}

export type StoryNode =
  | { type: "paragraph"; text: string }
  | { type: "heading"; text: string }
  | { type: "image"; image: PreviewImage | null };

/** A Resource another screen of the preview app opens. */
export interface PreviewTarget {
  type: "PLACE" | "POI" | "ROUTE" | "GUIDE" | "EVENT";
  id: string;
}

export interface PreviewListItem {
  title: string;
  subtitle?: string;
  muted?: boolean;
  /** Opens that Resource when the preview is navigable. */
  target?: PreviewTarget;
}

export type PreviewBlock =
  | { type: "hero"; image: PreviewImage }
  | { type: "text"; heading?: string; value: PreviewText; label: string }
  | { type: "facts"; items: { label: string; value: string }[] }
  | { type: "list"; heading: string; items: PreviewListItem[] }
  | { type: "story"; nodes: StoryNode[] }
  | { type: "gallery"; images: PreviewImage[] }
  | { type: "audio" | "video"; heading: string; url: string }
  | { type: "link"; label: string; url: string }
  | { type: "map"; view: { lat: number; lng: number; zoom: number }; bounds: Bounds | null; markers: CanvasMarker[] };

export interface PreviewModel {
  kindLabel: string;
  /** The previewed language, and the name the "missing" markers use. */
  language: ProjectLanguage | null;
  /** The default language's name, which a missing text falls back to. */
  fallbackName: string | null;
  title: PreviewText;
  blocks: PreviewBlock[];
}

/** The previewed language and the default one, for resolving texts. */
export interface PreviewLanguages {
  active: string | null;
  fallback: string | null;
}

/** The languages part of a model, and the codes the text helpers take. */
export function previewLanguages(languages: ProjectLanguage[], active: string | null, defaultLanguage: string | null) {
  return {
    language: languages.find((l) => l.languageCode === active) ?? null,
    fallbackName: languages.find((l) => l.languageCode === defaultLanguage)?.displayName ?? null,
    codes: { active, fallback: defaultLanguage } as PreviewLanguages,
  };
}

/** The value of `key` in the previewed language, else the default language's, marked missing. */
export function textIn<K extends string>(
  translations: Record<string, Partial<Record<K, string | null>>>,
  key: K,
  { active, fallback }: PreviewLanguages,
): PreviewText {
  const own = active ? translations[active]?.[key]?.trim() : "";
  if (own) return { text: own, missing: false };
  const other = fallback ? translations[fallback]?.[key]?.trim() : "";
  return other ? { text: other, missing: true } : null;
}

const imageOf = (asset: Asset, language: string | null): PreviewImage => ({
  url: asset.url,
  alt: (language && asset.translations[language]?.alternativeText) || "",
});

/**
 * The Assets bound for `usage`, in order: for the previewed language, its own binding, else the binding for
 * every language (`11` §3).
 */
export function mediaFor(
  media: MediaBinding[],
  assets: Asset[],
  usage: AssetUsage,
  { active }: PreviewLanguages,
): Asset[] {
  const bound = media.filter((m) => m.usage === usage);
  const own = bound.filter((m) => m.languageCode && m.languageCode === active);
  const chosen = own.length ? own : bound.filter((m) => !m.languageCode);
  return chosen.flatMap((m) => assets.filter((a) => a.id === m.assetId));
}

/** The usual media blocks: the hero image first, the others after the texts. */
export function heroBlock(media: MediaBinding[], assets: Asset[], langs: PreviewLanguages): PreviewBlock[] {
  const hero = mediaFor(media, assets, "HERO_IMAGE", langs)[0];
  return hero ? [{ type: "hero", image: imageOf(hero, langs.active) }] : [];
}

export function mediaBlocks(media: MediaBinding[], assets: Asset[], langs: PreviewLanguages): PreviewBlock[] {
  const blocks: PreviewBlock[] = [];
  const audio = mediaFor(media, assets, "AUDIO_NARRATION", langs)[0];
  if (audio) blocks.push({ type: "audio", heading: "Audio narration", url: audio.url });
  const video = mediaFor(media, assets, "VIDEO", langs)[0];
  if (video) blocks.push({ type: "video", heading: "Video", url: video.url });
  const gallery = mediaFor(media, assets, "GALLERY_IMAGE", langs);
  if (gallery.length) blocks.push({ type: "gallery", images: gallery.map((a) => imageOf(a, langs.active)) });
  return blocks;
}

export function storyImage(assets: Asset[], assetId: string, langs: PreviewLanguages): PreviewImage | null {
  const asset = assets.find((a) => a.id === assetId);
  return asset ? imageOf(asset, langs.active) : null;
}

/** Text blocks for the given keys, with the labels the editor shows; values in no language are left out. */
export function textBlocks<K extends string>(
  translations: Record<string, Partial<Record<K, string | null>>>,
  fields: { key: K; label: string; heading?: string }[],
  langs: PreviewLanguages,
): PreviewBlock[] {
  return fields.flatMap(({ key, label, heading }) => {
    const value = textIn(translations, key, langs);
    return value ? [{ type: "text" as const, heading, value, label }] : [];
  });
}
