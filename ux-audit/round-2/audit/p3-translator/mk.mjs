import { readFileSync, writeFileSync } from "node:fs";
import { raw, call, closeAll } from "../../../tools/lib.mjs";
const P = "/projects/6958c18f-60d2-4140-a524-5a43f8a2f6b5";
const W = (m, p, b) => call("curator", m, P + p, b);
const out = {};
const poi = await W("POST", "/pois", { title: "UX-R2-p3 Stoa of Attalos Gallery" });
const cur = await W("GET", `/pois/${poi.id}`);
const body = { version: cur.version, slug: cur.slug, placeId: null, code: null, internalName: "ux-r2-p3-stoa", latitude: null, longitude: null, estimatedVisitMinutes: 8, featured: false,
  translations: { en: { title: "UX-R2-p3 Stoa of Attalos Gallery", summary: "A reconstructed two-storey colonnade that once housed shops.", description: "The Stoa was rebuilt in the 1950s. Walk the full length of the ground floor and look for the marble benches.\n\nThe upper floor shows finds from the Agora excavations.", instructions: "Enter from the east door and keep the columns on your left.", accessibilityInformation: "Step-free entrance on the east side; a lift serves the upper floor." } } };
out.poi = await W("PUT", `/pois/${poi.id}`, body);
const poi2 = await W("POST", "/pois", { title: "UX-R2-p3 Active Kouros Hall" });
const c2 = await W("GET", `/pois/${poi2.id}`);
out.poi2 = await W("PUT", `/pois/${poi2.id}`, { version: c2.version, slug: c2.slug, placeId: null, code: null, internalName: "ux-r2-p3-kouros", latitude: 37.9715, longitude: 23.7257, estimatedVisitMinutes: 5, featured: false,
  translations: { en: { title: "UX-R2-p3 Active Kouros Hall", summary: "Standing youths from the sixth century BC.", description: "A quiet hall of marble kouroi.", instructions: null, accessibilityInformation: null }, el: { title: "UX-R2-p3 Αίθουσα των Κούρων", summary: "Όρθιοι νέοι του έκτου αιώνα π.Χ.", description: null, instructions: null, accessibilityInformation: null } } });
// category
const cat = await W("POST", "/categories", { name: "UX-R2-p3 Marketplace Life", scope: "POI", parentCategoryId: null });
const cc = await W("GET", `/categories/${cat.id}`);
out.cat = await W("PUT", `/categories/${cat.id}`, { version: cc.version, code: cc.code, scope: "POI", parentCategoryId: null, icon: "shop", translations: { en: { name: "UX-R2-p3 Marketplace Life", description: "Shops, stoas and daily trade in the ancient city." } } });
// guide
const g = await W("POST", "/guides", { title: "UX-R2-p3 Walking the Agora" });
const gg = await W("GET", `/guides/${g.id}`);
out.guide = await W("PUT", `/guides/${g.id}`, { version: gg.version, slug: gg.slug, internalName: "ux-r2-p3-guide", estimatedReadingMinutes: 4, featured: false, translations: { en: { title: "UX-R2-p3 Walking the Agora", summary: "A short reading about the civic heart of Athens." } } });
for (const t of ["The Agora was the place where Athenians met to trade, vote and argue.", "Begin at the Panathenaic Way, the road that ran diagonally through the square.", "Finish at the Stoa of Attalos, where the museum now stands."]) {
  await W("POST", `/guides/${g.id}/blocks`, { blockType: "TEXT", translations: { en: { text: t } } }).catch(e => console.log("block", e.message.slice(0, 300)));
}
out.guide = await W("GET", `/guides/${g.id}`);
// event
const e = await W("POST", "/events", { title: "UX-R2-p3 Evening Lecture" });
const ee = await W("GET", `/events/${e.id}`);
out.event = await W("PUT", `/events/${e.id}`, { version: ee.version, slug: ee.slug, placeId: null, poiId: null, routeId: null, bookingUrl: null, internalName: "ux-r2-p3-event", featured: false, translations: { en: { title: "UX-R2-p3 Evening Lecture", summary: "A lecture on the ancient marketplace.", description: "Doors open at 18:30. Seats are limited.", locationText: "Main hall, second floor." } } });
for (const [s, en] of [["2026-12-04T18:30:00Z", "2026-12-04T20:00:00Z"], ["2026-12-11T18:30:00Z", "2026-12-11T20:00:00Z"]]) await W("POST", `/events/${e.id}/occurrences`, { startsAt: s, endsAt: en, status: "SCHEDULED" }).catch(x => console.log("occ", x.message.slice(0, 300)));
out.event = await W("GET", `/events/${e.id}`);
// route
const r = await W("POST", "/routes", { title: "UX-R2-p3 Agora Stroll", type: "OUTDOOR" });
const rr = await W("GET", `/routes/${r.id}`);
await W("PUT", `/routes/${r.id}`, { version: rr.version, slug: rr.slug, type: "OUTDOOR", travelMode: "WALKING", difficulty: "EASY", estimatedDurationMinutes: 45, distanceMeters: 1200, loop: false, internalName: "ux-r2-p3-route", featured: false, translations: { en: { title: "UX-R2-p3 Agora Stroll", summary: "A gentle walk between three stops.", description: "Wear comfortable shoes." } } }).catch(x => console.log("route put", x.message.slice(0, 400)));
const pois = (await W("GET", "/pois?size=20&page=0&status=ACTIVE")).content.slice(0, 3);
for (const [i, p] of pois.entries()) await W("POST", `/routes/${r.id}/stops`, { poiId: p.id, translations: { en: { titleOverride: null, description: `Stop ${i + 1} description in English.`, navigationInstructions: i ? "Continue along the marked path." : "Start at the gate.", narrative: `Narrative for stop ${i + 1}.` } } }).catch(x => console.log("stop", x.message.slice(0, 300)));
out.route = await W("GET", `/routes/${r.id}`);
// asset
const png = readFileSync(new URL("../../../round-1/audit/p3-translator/UX-p3-translator-image.png", import.meta.url));
const form = new FormData(); form.append("file", new Blob([png], { type: "image/png" }), "UX-R2-p3 mosaic.png"); form.append("internalName", "UX-R2-p3 mosaic");
const ar = await raw("curator", "POST", P + "/assets", undefined, form);
console.log("asset", ar.status, JSON.stringify(ar.json).slice(0, 200));
const a = ar.json;
out.asset = await W("PUT", `/assets/${a.id}`, { version: a.version, internalName: "UX-R2-p3 mosaic", decorative: false, translations: { en: { title: "UX-R2-p3 Floor mosaic", caption: "Detail of a floor mosaic.", alternativeText: "A mosaic of blue and gold tiles forming a wave pattern.", credits: "Photo: UX audit", transcript: null } } });
const ids = { poi: out.poi.id, poi2: out.poi2.id, cat: out.cat.id, guide: out.guide.id, event: out.event.id, route: out.route.id, asset: out.asset.id };
console.log(ids, "guide blocks", out.guide.blocks?.length, "route stops", out.route.stops?.length, "event occ", out.event.occurrences?.length);
writeFileSync(new URL("./ids.json", import.meta.url), JSON.stringify(ids, null, 1));
await closeAll();
