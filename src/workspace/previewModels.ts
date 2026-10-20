import type { CanvasMarker } from "@/components/map/GeoMapCanvas.vue";
import { eventTitle } from "@/platform/events";
import type { CmsEvent } from "@/platform/events";
import { guideTitle, type Guide } from "@/platform/guides";
import type { GeoMap } from "@/platform/maps";
import { placeTitle, type Place } from "@/platform/places";
import { poiTitle, type Poi } from "@/platform/pois";
import { routeDifficultyLabel, routeModeLabel, routeTitle, routeTypeLabel, type Route } from "@/platform/routes";
import { placeTypeLabel } from "@/views/workspace/places/placeTree";
import type { PreviewData } from "./previewData";
import {
  heroBlock,
  mediaBlocks,
  previewLanguages,
  storyImage,
  textBlocks,
  textIn,
  type PreviewBlock,
  type PreviewListItem,
  type PreviewModel,
  type PreviewTarget,
  type PreviewText,
  type StoryNode,
} from "./preview";

/*
 * Detail screens of the stand-in visitor app built from saved Resources (DECISIONS.md D-015). The editors'
 * own panels build the same screens from their live forms; links between Resources make the app navigable.
 */

export interface PreviewContext {
  data: PreviewData;
  language: string | null;
  defaultLanguage: string | null;
}

function langs(ctx: PreviewContext) {
  return previewLanguages(ctx.data.languages, ctx.language, ctx.defaultLanguage);
}

/** A Resource's title as a list shows it: the previewed language, else the default, else the slug. */
export function titleOf(ctx: PreviewContext, target: PreviewTarget): string {
  const d = ctx.data;
  const lang = ctx.language;
  const own = <T extends { translations: Record<string, { title: string | null }> }>(r: T | undefined) =>
    (r && lang ? r.translations[lang]?.title?.trim() : "") || "";
  switch (target.type) {
    case "PLACE": {
      const p = d.places.find((x) => x.id === target.id);
      return p ? own(p) || placeTitle(p, null, ctx.defaultLanguage) : "Unavailable place";
    }
    case "POI": {
      const p = d.pois.find((x) => x.id === target.id);
      return p ? own(p) || poiTitle(p, ctx.defaultLanguage) : "Unavailable point of interest";
    }
    case "ROUTE": {
      const r = d.routes.find((x) => x.id === target.id);
      return r ? own(r) || routeTitle(r, ctx.defaultLanguage) : "Unavailable route";
    }
    case "GUIDE": {
      const g = d.guides.find((x) => x.id === target.id);
      return g ? own(g) || guideTitle(g, ctx.defaultLanguage) : "Unavailable guide";
    }
    case "EVENT": {
      const e = d.events.find((x) => x.id === target.id);
      return e ? own(e) || eventTitle(e, ctx.defaultLanguage) : "Unavailable event";
    }
  }
}

/** Whether a list or card shows the title in another language than the previewed one. */
export function titleMissing(ctx: PreviewContext, target: PreviewTarget): boolean {
  const d = ctx.data;
  const all: { id: string; translations: Record<string, { title: string | null }> }[] =
    target.type === "PLACE" ? d.places : target.type === "POI" ? d.pois : target.type === "ROUTE" ? d.routes
      : target.type === "GUIDE" ? d.guides : d.events;
  const r = all.find((x) => x.id === target.id);
  return !!r && !!ctx.language && !r.translations[ctx.language]?.title?.trim();
}

/** The summary a card shows, with the same fallback as the detail screen. */
export function summaryOf(ctx: PreviewContext, target: PreviewTarget): PreviewText {
  const d = ctx.data;
  const all: { id: string; translations: Record<string, { summary: string | null }> }[] =
    target.type === "PLACE" ? d.places : target.type === "POI" ? d.pois : target.type === "ROUTE" ? d.routes
      : target.type === "GUIDE" ? d.guides : d.events;
  const r = all.find((x) => x.id === target.id);
  return r ? textIn(r.translations, "summary", { active: ctx.language, fallback: ctx.defaultLanguage }) : null;
}

/** The hero image of a card, if the Resource has one in the previewed language or for all. */
export function cardImage(ctx: PreviewContext, target: PreviewTarget): string | null {
  const d = ctx.data;
  const r = target.type === "POI" ? d.pois.find((x) => x.id === target.id)
    : target.type === "ROUTE" ? d.routes.find((x) => x.id === target.id)
      : target.type === "GUIDE" ? d.guides.find((x) => x.id === target.id)
        : target.type === "EVENT" ? d.events.find((x) => x.id === target.id) : undefined;
  if (!r) return null;
  const hero = heroBlock(r.media, d.assets, { active: ctx.language, fallback: ctx.defaultLanguage })[0];
  return hero && hero.type === "hero" ? hero.image.url : null;
}

const linkItem = (ctx: PreviewContext, target: PreviewTarget, subtitle?: string): PreviewListItem => ({
  title: titleOf(ctx, target),
  subtitle,
  target,
});

function mapBlock(ctx: PreviewContext, map: GeoMap): PreviewBlock {
  const markers: CanvasMarker[] = map.placements.map((p, i) => ({
    key: `${p.resourceType}:${p.resourceId}`,
    lat: p.latitude,
    lng: p.longitude,
    label: String(i + 1),
    title: titleOf(ctx, { type: p.resourceType === "POI" ? "POI" : "PLACE", id: p.resourceId }),
  }));
  const bounds =
    map.minLatitude !== null && map.minLongitude !== null && map.maxLatitude !== null && map.maxLongitude !== null
      ? ([[map.minLatitude, map.minLongitude], [map.maxLatitude, map.maxLongitude]] as [[number, number], [number, number]])
      : null;
  return { type: "map", view: { lat: map.initialLatitude, lng: map.initialLongitude, zoom: map.initialZoom }, bounds, markers };
}

function placeModel(ctx: PreviewContext, place: Place): PreviewModel {
  const { language, fallbackName, codes } = langs(ctx);
  const parent = place.parentPlaceId ? ctx.data.places.find((p) => p.id === place.parentPlaceId) : undefined;
  const blocks: PreviewBlock[] = [
    { type: "facts", items: [{ label: "", value: placeTypeLabel(place.type) }] },
    ...textBlocks(place.translations, [
      { key: "summary", label: "Summary" },
      { key: "description", label: "Description" },
      { key: "visitorInformation", label: "Visitor information", heading: "Visit" },
      { key: "accessibilityInformation", label: "Accessibility information", heading: "Accessibility" },
    ], codes),
  ];
  const map = ctx.data.maps.find((m) => m.placeId === place.id);
  if (map) blocks.push(mapBlock(ctx, map));
  if (parent) blocks.push({ type: "list", heading: "Part of", items: [linkItem(ctx, { type: "PLACE", id: parent.id })] });
  const children = ctx.data.places.filter((p) => p.parentPlaceId === place.id);
  blocks.push({ type: "list", heading: "Places inside", items: children.map((c) => linkItem(ctx, { type: "PLACE", id: c.id })) });
  const pois = ctx.data.pois.filter((p) => p.placeId === place.id);
  blocks.push({ type: "list", heading: "Points of interest here", items: pois.map((p) => linkItem(ctx, { type: "POI", id: p.id })) });
  const events = ctx.data.events.filter((e) => e.placeId === place.id);
  blocks.push({ type: "list", heading: "Events", items: events.map((e) => linkItem(ctx, { type: "EVENT", id: e.id })) });
  return { kindLabel: "Place", language, fallbackName, title: textIn(place.translations, "title", codes), blocks };
}

function poiModel(ctx: PreviewContext, poi: Poi): PreviewModel {
  const { language, fallbackName, codes } = langs(ctx);
  const facts = [
    ...(poi.code ? [{ label: "No.", value: poi.code }] : []),
    ...(poi.estimatedVisitMinutes ? [{ label: "Visit", value: `${poi.estimatedVisitMinutes} min` }] : []),
  ];
  const blocks: PreviewBlock[] = [
    ...heroBlock(poi.media, ctx.data.assets, codes),
    { type: "facts", items: facts },
    ...textBlocks(poi.translations, [
      { key: "summary", label: "Summary" },
      { key: "description", label: "Description" },
      { key: "instructions", label: "Instructions", heading: "When you are there" },
      { key: "accessibilityInformation", label: "Accessibility information", heading: "Accessibility" },
    ], codes),
    ...mediaBlocks(poi.media, ctx.data.assets, codes),
  ];
  if (poi.placeId && ctx.data.places.some((p) => p.id === poi.placeId)) {
    blocks.push({ type: "list", heading: "Where", items: [linkItem(ctx, { type: "PLACE", id: poi.placeId })] });
  }
  const routes = ctx.data.routes.filter((r) => r.stops.some((s) => s.poiId === poi.id));
  blocks.push({ type: "list", heading: "On these routes", items: routes.map((r) => linkItem(ctx, { type: "ROUTE", id: r.id })) });
  return { kindLabel: "Point of interest", language, fallbackName, title: textIn(poi.translations, "title", codes), blocks };
}

function routeModel(ctx: PreviewContext, route: Route): PreviewModel {
  const { language, fallbackName, codes } = langs(ctx);
  const facts = [
    { label: "", value: routeTypeLabel(route.type) },
    ...(route.estimatedDurationMinutes ? [{ label: "Duration", value: `${route.estimatedDurationMinutes} min` }] : []),
    ...(route.distanceMeters ? [{ label: "Distance", value: `${(route.distanceMeters / 1000).toFixed(1)} km` }] : []),
    ...(route.difficulty ? [{ label: "Difficulty", value: routeDifficultyLabel(route.difficulty) }] : []),
    ...(route.mode ? [{ label: "", value: routeModeLabel(route.mode) }] : []),
    ...(route.loop ? [{ label: "", value: "Loop" }] : []),
  ];
  const stops = [...route.stops].sort((a, b) => a.position - b.position).map((stop): PreviewListItem => {
    const override = ctx.language ? stop.translations[ctx.language]?.titleOverride?.trim() : "";
    const description = ctx.language ? stop.translations[ctx.language]?.description?.trim() : "";
    const visible = ctx.data.pois.some((p) => p.id === stop.poiId);
    return {
      title: override || titleOf(ctx, { type: "POI", id: stop.poiId }),
      subtitle: description || undefined,
      target: visible ? { type: "POI", id: stop.poiId } : undefined,
      muted: !visible,
    };
  });
  const blocks: PreviewBlock[] = [
    ...heroBlock(route.media, ctx.data.assets, codes),
    { type: "facts", items: facts },
    ...textBlocks(route.translations, [
      { key: "summary", label: "Summary" },
      { key: "description", label: "Description" },
      { key: "instructions", label: "Instructions", heading: "Before you start" },
    ], codes),
    { type: "list", heading: "Stops", items: stops },
    ...mediaBlocks(route.media, ctx.data.assets, codes),
  ];
  return { kindLabel: "Route", language, fallbackName, title: textIn(route.translations, "title", codes), blocks };
}

const GUIDE_TARGETS: Record<string, PreviewTarget["type"] | undefined> = {
  POI: "POI",
  ROUTE: "ROUTE",
  PLACE: "PLACE",
  EVENT: "EVENT",
};

function guideModel(ctx: PreviewContext, guide: Guide): PreviewModel {
  const { language, fallbackName, codes } = langs(ctx);
  const own = ctx.language ? guide.translations[ctx.language]?.body?.blocks ?? [] : [];
  const fallback = ctx.defaultLanguage ? guide.translations[ctx.defaultLanguage]?.body?.blocks ?? [] : [];
  const story = own.length ? own : fallback;
  const nodes: StoryNode[] = story.flatMap((b): StoryNode[] => {
    if (b.type === "image") return [{ type: "image", image: storyImage(ctx.data.assets, b.assetId, codes) }];
    return b.text.trim() ? [{ type: b.type, text: b.text.trim() }] : [];
  });
  const blocks: PreviewBlock[] = [
    ...heroBlock(guide.media, ctx.data.assets, codes),
    { type: "facts", items: guide.estimatedReadingMinutes ? [{ label: "Reading", value: `${guide.estimatedReadingMinutes} min` }] : [] },
    ...textBlocks(guide.translations, [{ key: "summary", label: "Summary" }], codes),
  ];
  if (nodes.length) {
    if (!own.length) blocks.push({ type: "text", label: "Story", value: { text: "The story below is in the default language.", missing: true } });
    blocks.push({ type: "story", nodes });
  }
  blocks.push({
    type: "list",
    heading: "Related",
    items: guide.items.flatMap((item) => {
      const type = GUIDE_TARGETS[item.resourceType];
      return type ? [linkItem(ctx, { type, id: item.resourceId })] : [];
    }),
  });
  blocks.push(...mediaBlocks(guide.media, ctx.data.assets, codes));
  return { kindLabel: "Guide", language, fallbackName, title: textIn(guide.translations, "title", codes), blocks };
}

function eventModel(ctx: PreviewContext, event: CmsEvent): PreviewModel {
  const { language, fallbackName, codes } = langs(ctx);
  const fmt = (iso: string) =>
    new Date(iso).toLocaleString(ctx.language ?? undefined, { dateStyle: "medium", timeStyle: "short" });
  const links: PreviewListItem[] = [
    ...(event.placeId ? [linkItem(ctx, { type: "PLACE", id: event.placeId })] : []),
    ...(event.poiId ? [linkItem(ctx, { type: "POI", id: event.poiId })] : []),
    ...(event.routeId ? [linkItem(ctx, { type: "ROUTE", id: event.routeId })] : []),
  ];
  const blocks: PreviewBlock[] = [
    ...heroBlock(event.media, ctx.data.assets, codes),
    ...textBlocks(event.translations, [
      { key: "summary", label: "Summary" },
      { key: "locationText", label: "Location text", heading: "Where" },
      { key: "description", label: "Description" },
    ], codes),
    {
      type: "list",
      heading: "Dates",
      items: event.occurrences.map((o) => ({
        title: `${fmt(o.startsAt)} – ${fmt(o.endsAt)}`,
        subtitle: o.status === "CANCELLED" ? "Cancelled" : undefined,
        muted: o.status === "CANCELLED",
      })),
    },
    ...(event.bookingUrl ? [{ type: "link" as const, label: "Book", url: event.bookingUrl }] : []),
    { type: "list", heading: "See also", items: links },
    ...mediaBlocks(event.media, ctx.data.assets, codes),
  ];
  return { kindLabel: "Event", language, fallbackName, title: textIn(event.translations, "title", codes), blocks };
}

/** The detail screen of a Resource the visitor can reach, or null when it is not shown in this mode. */
export function modelFor(ctx: PreviewContext, target: PreviewTarget): PreviewModel | null {
  const d = ctx.data;
  switch (target.type) {
    case "PLACE": {
      const r = d.places.find((x) => x.id === target.id);
      return r ? placeModel(ctx, r) : null;
    }
    case "POI": {
      const r = d.pois.find((x) => x.id === target.id);
      return r ? poiModel(ctx, r) : null;
    }
    case "ROUTE": {
      const r = d.routes.find((x) => x.id === target.id);
      return r ? routeModel(ctx, r) : null;
    }
    case "GUIDE": {
      const r = d.guides.find((x) => x.id === target.id);
      return r ? guideModel(ctx, r) : null;
    }
    case "EVENT": {
      const r = d.events.find((x) => x.id === target.id);
      return r ? eventModel(ctx, r) : null;
    }
  }
}
