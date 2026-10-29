import type { RouteLocationRaw } from "vue-router";
import { listAssets, type Asset } from "@/platform/assets";
import { categoryFromResponse, categoryName, listCategories, type Category } from "@/platform/categories";
import { eventFromResponse, eventTitle, listEvents, type CmsEvent } from "@/platform/events";
import { guideFromResponse, guideTitle, listGuides, storyComplete, type Guide, type GuideBody, type GuideBlockType } from "@/platform/guides";
import { listPlaces, placeFromResponse, placeTitle, type Place, type ResourceStatus } from "@/platform/places";
import { listPois, poiFromResponse, poiTitle, type Poi } from "@/platform/pois";
import { listRoutes, routeFromResponse, routeTitle, type Route } from "@/platform/routes";
import type { TranslatedKind } from "@/platform/translations";

/**
 * What the Translation workspace knows of each kind (iGuide spec 12 section 3, DECISIONS.md D-021): its translated
 * fields with labels, which of them count towards completeness (the same fields the lists' dots count), how to read
 * its rows, and where its editor is. Every Resource becomes one `TranslationItem`, so the matrix and the editor treat
 * the seven kinds alike.
 */

export type CatalogKind = TranslatedKind | "assets";

export interface TextField {
  key: string;
  label: string;
  multiline: boolean;
  /** Counts towards complete / partial / missing; optional extras do not. */
  counts: boolean;
  helper?: string;
}

/** Texts of one language: field → text, null when absent. */
export type LanguageTexts = Record<string, string | null>;

export interface StopTexts {
  id: string | null;
  /** The stop's Point of Interest, as the heading of its card. */
  title: string;
  texts: Record<string, LanguageTexts>;
}

/** One block of a Guide's story: a TEXT block's rich text, or a REFERENCE block's caption, per language. */
export interface GuideBlockTexts {
  id: string;
  type: GuideBlockType;
  /** A reference's target in the default language; empty for a text block. */
  title: string;
  bodies: Record<string, GuideBody | null>;
  captions: Record<string, string | null>;
}

export interface TranslationItem {
  kind: CatalogKind;
  id: string;
  /** In the default language, falling back to the slug or internal name. */
  title: string;
  status: ResourceStatus;
  hasWorkingCopy: boolean;
  version: number;
  fields: TextField[];
  texts: Record<string, LanguageTexts>;
  /** Guides: the story's blocks in order, each saved through its block (DECISIONS.md D-031). */
  blocks?: GuideBlockTexts[];
  /** Routes: the stops' own texts, which do not count towards the Route's completeness. */
  stops?: StopTexts[];
  /** Assets only: what decides which fields count. */
  asset?: { type: Asset["type"]; decorative: boolean };
}

export type ItemState = "complete" | "partial" | "missing";

export interface KindInfo {
  kind: CatalogKind;
  /** Plural, as in the kind chips: "Places", "Media". */
  label: string;
  /** Singular, as in sentences. */
  noun: string;
}

export const KINDS: KindInfo[] = [
  { kind: "places", label: "Places", noun: "place" },
  { kind: "pois", label: "Points of interest", noun: "point of interest" },
  { kind: "routes", label: "Routes", noun: "route" },
  { kind: "guides", label: "Guides", noun: "guide" },
  { kind: "events", label: "Events", noun: "event" },
  { kind: "categories", label: "Categories", noun: "category" },
  { kind: "assets", label: "Media", noun: "media item" },
];

const f = (key: string, label: string, multiline = true, counts = true, helper?: string): TextField => ({ key, label, multiline, counts, helper });

/** The translated fields per kind, labelled as the editors label them. */
export const FIELDS: Record<CatalogKind, TextField[]> = {
  places: [
    f("title", "Title", false),
    f("summary", "Summary"),
    f("description", "Description"),
    f("visitorInformation", "Visitor information", true, true, "Opening hours, tickets, how to get there."),
    f("accessibilityInformation", "Accessibility information", true, true, "Step-free access, surfaces, seating, assistance."),
  ],
  pois: [
    f("title", "Title", false),
    f("summary", "Summary"),
    f("description", "Description"),
    f("instructions", "Instructions"),
    f("accessibilityInformation", "Accessibility information"),
  ],
  routes: [f("title", "Title", false), f("summary", "Summary"), f("description", "Description"), f("instructions", "Instructions")],
  guides: [f("title", "Title", false), f("summary", "Summary")],
  events: [
    f("title", "Title", false),
    f("summary", "Summary"),
    f("description", "Description"),
    f("locationText", "Location text", false, false, "Optional: where, in words, when the event has no place."),
  ],
  categories: [f("name", "Name", false), f("description", "Description")],
  assets: [
    f("title", "Title", false),
    f("caption", "Caption", true, false),
    f("alternativeText", "Alternative text", true, false, "What the image shows, for people who cannot see it."),
    f("credits", "Credits", false, false),
    f("transcript", "Transcript", true, false, "The words spoken in the audio or video."),
  ],
};

export const STOP_FIELDS: TextField[] = [
  f("titleOverride", "Title at this stop", false, false, "Empty: the point of interest's title is used."),
  f("description", "Description", true, false),
  f("navigationInstructions", "How to get there", true, false),
  f("narrative", "Narrative", true, false),
];

/** Every Resource of every kind, read in parallel, in each list's own order. */
export async function loadItems(projectId: string, defaultLanguage: string | null, signal?: AbortSignal): Promise<TranslationItem[]> {
  const [places, pois, routes, guides, events, categories, assets] = await Promise.all([
    listPlaces(projectId, signal),
    listPois(projectId, signal),
    listRoutes(projectId, signal),
    listGuides(projectId, signal),
    listEvents(projectId, signal),
    listCategories(projectId, signal),
    listAssets(projectId, signal),
  ]);
  const poiTitles = new Map(pois.map((p) => [p.id, poiTitle(p, defaultLanguage)]));
  // A Guide reference's heading: its target's title, by "TYPE:id".
  const targetTitles = new Map<string, string>([
    ...places.map((p) => [`PLACE:${p.id}`, placeTitle(p, null, defaultLanguage)] as [string, string]),
    ...pois.map((p) => [`POI:${p.id}`, poiTitle(p, defaultLanguage)] as [string, string]),
    ...routes.map((r) => [`ROUTE:${r.id}`, routeTitle(r, defaultLanguage)] as [string, string]),
    ...events.map((e) => [`EVENT:${e.id}`, eventTitle(e, defaultLanguage)] as [string, string]),
  ]);
  const bySort = <T extends { sortOrder: number }>(rows: T[]) => [...rows].sort((a, b) => a.sortOrder - b.sortOrder);
  return [
    ...bySort(places).map((p) => fromPlace(p, defaultLanguage)),
    ...bySort(pois).map((p) => fromPoi(p, defaultLanguage)),
    ...bySort(routes).map((r) => fromRoute(r, defaultLanguage, poiTitles)),
    ...bySort(guides).map((g) => fromGuide(g, defaultLanguage, targetTitles)),
    ...bySort(events).map((e) => fromEvent(e, defaultLanguage)),
    ...bySort(categories).map((c) => fromCategory(c, defaultLanguage)),
    ...assets.map((a) => fromAsset(a, defaultLanguage)),
  ];
}

/** A read DTO from a save (or a working copy's rendering) as an item, keeping the stops' headings. */
export function itemFromResponse(kind: CatalogKind, raw: unknown, defaultLanguage: string | null, previous?: TranslationItem): TranslationItem {
  const poiTitles = new Map((previous?.stops ?? []).map((s) => [s.id ?? "", s.title]));
  switch (kind) {
    case "places":
      return fromPlace(placeFromResponse(raw), defaultLanguage);
    case "pois":
      return fromPoi(poiFromResponse(raw), defaultLanguage);
    case "routes": {
      const route = routeFromResponse(raw);
      const titles = new Map(route.stops.map((s) => [s.poiId, poiTitles.get(s.id ?? "") ?? ""]));
      return fromRoute(route, defaultLanguage, titles);
    }
    case "guides": {
      const guide = guideFromResponse(raw);
      const titles = new Map((previous?.blocks ?? []).map((b) => [b.id, b.title]));
      const targets = new Map(guide.blocks.flatMap((b) => (b.id && b.resourceType ? [[`${b.resourceType}:${b.resourceId}`, titles.get(b.id) ?? ""]] : [])) as [string, string][]);
      return fromGuide(guide, defaultLanguage, targets);
    }
    case "events":
      return fromEvent(eventFromResponse(raw), defaultLanguage);
    case "categories":
      return fromCategory(categoryFromResponse(raw), defaultLanguage);
    case "assets":
      return fromAsset(raw as Asset, defaultLanguage);
  }
}

function textsOf(translations: Record<string, object>, fields: TextField[]): Record<string, LanguageTexts> {
  return Object.fromEntries(
    Object.entries(translations).map(([code, t]) => [
      code,
      Object.fromEntries(fields.map((field) => [field.key, ((t as Record<string, unknown>)[field.key] as string | null | undefined) ?? null])),
    ]),
  );
}

const base = (r: { id: string; status: ResourceStatus; version: number; hasWorkingCopy?: boolean }) => ({
  id: r.id,
  status: r.status,
  version: r.version,
  hasWorkingCopy: !!r.hasWorkingCopy,
});

function fromPlace(p: Place, def: string | null): TranslationItem {
  return { ...base(p), kind: "places", title: placeTitle(p, null, def), fields: FIELDS.places, texts: textsOf(p.translations, FIELDS.places) };
}

function fromPoi(p: Poi, def: string | null): TranslationItem {
  return { ...base(p), kind: "pois", title: poiTitle(p, def), fields: FIELDS.pois, texts: textsOf(p.translations, FIELDS.pois) };
}

function fromRoute(r: Route, def: string | null, poiTitles: Map<string, string>): TranslationItem {
  return {
    ...base(r),
    kind: "routes",
    title: routeTitle(r, def),
    fields: FIELDS.routes,
    texts: textsOf(r.translations, FIELDS.routes),
    stops: r.stops.map((s, i) => ({
      id: s.id,
      title: poiTitles.get(s.poiId) || `Stop ${i + 1}`,
      texts: textsOf(s.translations, STOP_FIELDS),
    })),
  };
}

function fromGuide(g: Guide, def: string | null, targetTitles: Map<string, string>): TranslationItem {
  return {
    ...base(g),
    kind: "guides",
    title: guideTitle(g, def),
    fields: FIELDS.guides,
    texts: textsOf(g.translations, FIELDS.guides),
    blocks: g.blocks.flatMap((b) =>
      b.id
        ? [{
            id: b.id,
            type: b.blockType,
            title: b.blockType === "REFERENCE" ? targetTitles.get(`${b.resourceType}:${b.resourceId}`) || "Unavailable item" : "",
            bodies: Object.fromEntries(Object.entries(b.translations).map(([code, t]) => [code, t.text])),
            captions: Object.fromEntries(Object.entries(b.translations).map(([code, t]) => [code, t.caption])),
          }]
        : [],
    ),
  };
}

function fromEvent(e: CmsEvent, def: string | null): TranslationItem {
  return { ...base(e), kind: "events", title: eventTitle(e, def), fields: FIELDS.events, texts: textsOf(e.translations, FIELDS.events) };
}

function fromCategory(c: Category, def: string | null): TranslationItem {
  return {
    ...base(c),
    kind: "categories",
    title: categoryName(c, def),
    fields: FIELDS.categories,
    texts: textsOf(c.translations, FIELDS.categories),
  };
}

function fromAsset(a: Asset, def: string | null): TranslationItem {
  return {
    id: a.id,
    status: a.status,
    version: a.version,
    hasWorkingCopy: false,
    kind: "assets",
    title: (def ? a.translations[def]?.title?.trim() : undefined) || a.internalName,
    fields: FIELDS.assets,
    texts: textsOf(a.translations, FIELDS.assets),
    asset: { type: a.type, decorative: a.decorative },
  };
}

/**
 * The fields that count for this item: the kind's counted fields, and for media the ones its type needs (alternative
 * text for a non-decorative image, a transcript for audio and video).
 */
export function countedFields(item: TranslationItem): string[] {
  if (item.kind !== "assets") return item.fields.filter((field) => field.counts).map((field) => field.key);
  const keys = ["title"];
  if (item.asset?.type === "IMAGE" && !item.asset.decorative) keys.push("alternativeText");
  if (item.asset?.type === "AUDIO" || item.asset?.type === "VIDEO") keys.push("transcript");
  return keys;
}

/** How much of one language is written: the counted fields, plus a Guide's story (every text block written). */
export function itemProgress(item: TranslationItem, language: string): { state: ItemState; filled: number; total: number } {
  const texts = item.texts[language];
  const keys = countedFields(item);
  let filled = keys.filter((key) => texts?.[key]?.trim()).length;
  let total = keys.length;
  const story = item.blocks
    ? storyComplete({ blocks: item.blocks.map((b) => ({ id: b.id, blockType: b.type, resourceType: null, resourceId: null,
        translations: { [language]: { text: b.bodies[language] ?? null, caption: null } } })) }, language)
    : null;
  if (story !== null) {
    total += 1;
    if (story) filled += 1;
  }
  return { state: filled === 0 ? "missing" : filled === total ? "complete" : "partial", filled, total };
}

/** The item's own editor, where everything that is not text is edited. */
export function editorLocation(projectId: string, item: TranslationItem): RouteLocationRaw {
  const params = { projectId };
  switch (item.kind) {
    case "places":
      return { name: "place-editor", params: { ...params, placeId: item.id } };
    case "pois":
      return { name: "poi-editor", params: { ...params, poiId: item.id } };
    case "routes":
      return { name: "route-editor", params: { ...params, routeId: item.id } };
    case "guides":
      return { name: "guide-editor", params: { ...params, guideId: item.id } };
    case "events":
      return { name: "event-editor", params: { ...params, eventId: item.id } };
    case "categories":
      return { name: "category-editor", params: { ...params, categoryId: item.id } };
    case "assets":
      return { name: "asset-editor", params: { ...params, assetId: item.id } };
  }
}
