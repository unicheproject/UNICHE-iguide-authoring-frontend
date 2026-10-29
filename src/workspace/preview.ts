import type { Bounds, CanvasMarker } from "@/components/map/GeoMapCanvas.vue";
import type { Asset, AssetUsage, MediaBinding } from "@/platform/assets";
import type { GuideBlock } from "@/platform/guides";
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
  | { type: "heading"; text: string; level?: 2 | 3 }
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
  /** `missing`: the previewed language has none of it, so the default language shows. */
  | { type: "story"; nodes: StoryNode[]; missing?: boolean }
  /** One Guide REFERENCE block: its target as a card, with its caption. */
  | { type: "reference"; item: PreviewListItem; captionMissing?: boolean }
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

/**
 * A Guide's blocks in the order written (`12` §3 Guide): each TEXT block's rich text in the previewed language,
 * falling back to the default language and marked missing; each REFERENCE block as a card of its target with its
 * caption. `reference` names a target, or returns null for one the preview cannot show.
 */
export function guideStoryBlocks(
  blocks: GuideBlock[],
  assets: Asset[],
  langs: PreviewLanguages,
  reference: (block: GuideBlock) => PreviewListItem | null,
): PreviewBlock[] {
  const result: PreviewBlock[] = [];
  for (const block of blocks) {
    if (block.blockType === "TEXT") {
      const own = langs.active ? block.translations[langs.active]?.text?.blocks ?? [] : [];
      const fallback = langs.fallback ? block.translations[langs.fallback]?.text?.blocks ?? [] : [];
      const nodes = (own.length ? own : fallback).flatMap((b): StoryNode[] => {
        if (b.type === "image") return [{ type: "image", image: storyImage(assets, b.assetId, langs) }];
        if (!b.text.trim()) return [];
        return [b.type === "heading" ? { type: "heading", text: b.text.trim(), level: b.level } : { type: "paragraph", text: b.text.trim() }];
      });
      if (nodes.length) result.push({ type: "story", nodes, missing: !own.length });
      continue;
    }
    const item = reference(block);
    if (!item) continue;
    const own = langs.active ? block.translations[langs.active]?.caption?.trim() : undefined;
    const fallback = langs.fallback ? block.translations[langs.fallback]?.caption?.trim() : undefined;
    result.push({ type: "reference", item: { ...item, subtitle: own || fallback || item.subtitle }, captionMissing: !own && !!fallback });
  }
  return result;
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
