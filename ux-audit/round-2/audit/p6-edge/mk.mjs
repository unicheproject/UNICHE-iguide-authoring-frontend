import { writeFileSync, readFileSync } from "node:fs";
import { call, raw, closeAll } from "../../../tools/lib.mjs";
const PP = "/projects/6958c18f-60d2-4140-a524-5a43f8a2f6b5";
const W = (m, p, b) => call("curator", m, PP + p, b);
const out = {};
const mkPoi = async (title, extra = {}) => { const p = await W("POST", "/pois", { title }); const c = await W("GET", `/pois/${p.id}`);
  return W("PUT", `/pois/${p.id}`, { version: c.version, slug: c.slug, placeId: null, code: null, internalName: null, latitude: 37.9715, longitude: 23.7257, estimatedVisitMinutes: 5, featured: false, translations: { en: { title, summary: "Edge-case test record.", description: "Body text.", instructions: null, accessibilityInformation: null } }, ...extra }); };
out.poiA = (await mkPoi("UX-R2-p6 POI Alpha")).id;      // draft, will be edited
out.poiB = (await mkPoi("UX-R2-p6 POI Beta")).id;       // referenced by route, will be activated
out.poiC = (await mkPoi("UX-R2-p6 POI Gamma")).id;      // conflict test
out.poiD = (await mkPoi("UX-R2-p6 POI Delta")).id;      // to be deleted-ish? (just 404 forced)
// activate B
let b = await W("GET", `/pois/${out.poiB}`);
try { await W("POST", `/pois/${out.poiB}/status`, { targetStatus: "ACTIVE", version: b.version }); console.log("B active"); } catch (e) { console.log("activate B", e.message.slice(0, 400)); }
const pl = await W("POST", "/places", { title: "UX-R2-p6 Place", environment: "OUTDOOR", type: "DESTINATION", parentPlaceId: null }).catch(e => { console.log("place", e.message.slice(0,300)); });
out.place = pl?.id;
const r = await W("POST", "/routes", { title: "UX-R2-p6 Route", type: "OUTDOOR" }); out.route = r.id;
const rr = await W("GET", `/routes/${r.id}`);
await W("PUT", `/routes/${r.id}`, { version: rr.version, slug: rr.slug, type: "OUTDOOR", travelMode: "WALKING", difficulty: "EASY", estimatedDurationMinutes: 30, distanceMeters: 900, loop: false, internalName: null, featured: false, translations: { en: { title: "UX-R2-p6 Route", summary: "Edge test route.", description: "x" } } }).catch(x => console.log("route put", x.message.slice(0, 300)));
for (const p of [out.poiA, out.poiB, out.poiC]) await W("POST", `/routes/${r.id}/stops`, { poiId: p, translations: { en: { titleOverride: null, description: "Stop.", navigationInstructions: "Go.", narrative: "N." } } }).catch(x => console.log("stop", x.message.slice(0, 300)));
const g = await W("POST", "/guides", { title: "UX-R2-p6 Guide" }); out.guide = g.id;
const gg = await W("GET", `/guides/${g.id}`);
await W("PUT", `/guides/${g.id}`, { version: gg.version, slug: gg.slug, internalName: null, estimatedReadingMinutes: 3, featured: false, translations: { en: { title: "UX-R2-p6 Guide", summary: "Edge guide." } } });
for (const t of ["First paragraph.", "Second paragraph.", "Third paragraph."]) await W("POST", `/guides/${g.id}/blocks`, { blockType: "TEXT", translations: { en: { text: t } } }).catch(e => console.log("block", e.message.slice(0, 200)));
const e = await W("POST", "/events", { title: "UX-R2-p6 Event" }); out.event = e.id;
const ee = await W("GET", `/events/${e.id}`);
await W("PUT", `/events/${e.id}`, { version: ee.version, slug: ee.slug, placeId: null, poiId: null, routeId: null, bookingUrl: null, internalName: null, featured: false, translations: { en: { title: "UX-R2-p6 Event", summary: "s", description: "d", locationText: "l" } } });
for (const [s, en] of [["2026-12-04T18:30:00Z", "2026-12-04T20:00:00Z"], ["2026-12-11T18:30:00Z", "2026-12-11T20:00:00Z"]]) await W("POST", `/events/${e.id}/occurrences`, { startsAt: s, endsAt: en, status: "SCHEDULED" }).catch(x => console.log("occ", x.message.slice(0, 200)));
const c = await W("POST", "/categories", { name: "UX-R2-p6 Category", scope: "POI", parentCategoryId: null }); out.cat = c.id;
// asset
const png = readFileSync(new URL("./files/UX-R2-p6-ok.png", import.meta.url));
const form = new FormData(); form.append("file", new Blob([png], { type: "image/png" }), "UX-R2-p6 base.png"); form.append("internalName", "UX-R2-p6 base asset");
const ar = await raw("curator", "POST", PP + "/assets", undefined, form); console.log("asset", ar.status); out.asset = ar.json?.id;
writeFileSync(new URL("./ids.json", import.meta.url), JSON.stringify(out, null, 1));
console.log(out);
await closeAll();
