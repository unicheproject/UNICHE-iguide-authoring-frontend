// Creates the records P4 mutates (all named "UX-P4 ..."). Windows Node.
import { readFileSync, writeFileSync } from "node:fs";
import { call, closeAll } from "../../../tools/lib.mjs";
const seed = JSON.parse(readFileSync(new URL("../../../tools/seed.json", import.meta.url), "utf8"));
const P = seed.projects.populated.id;
const f = new URL("./records.json", import.meta.url);
let rec = {};
try { rec = JSON.parse(readFileSync(f, "utf8")); } catch {}
const save = () => writeFileSync(f, JSON.stringify(rec, null, 1));
const tr = (title, summary) => ({ title, summary, description: null, instructions: null, accessibilityInformation: null });
async function poi(key, title, summary) {
  if (rec[key]) return rec[key];
  const p = await call("curator", "POST", `/projects/${P}/pois`, { title, placeId: null, code: null });
  rec[key] = p.id; save(); console.log("created", key, p.id); return p.id;
}
const get = (kind, id) => call("curator", "GET", `/projects/${P}/${kind}/${id}`);
const status = async (kind, id, targetStatus) => { const r = await get(kind, id); return call("curator", "POST", `/projects/${P}/${kind}/${id}/status`, { targetStatus, version: r.version }); };
// POIs
const draft = await poi("draft", "UX-P4 draft point");
const active = await poi("active", "UX-P4 active point");
const pending = await poi("pending", "UX-P4 pending point");
const archived = await poi("archived", "UX-P4 archived point");
for (const [id, ready] of [[active, true], [pending, true]]) {
  const r = await get("pois", id);
  if (r.status === "DRAFT" && ready) {
    try { await call("curator", "PUT", `/projects/${P}/pois/${id}`, { ...Object.fromEntries(["slug","placeId","code","internalName","latitude","longitude","estimatedVisitMinutes","featured"].map((k)=>[k,r[k]??null])), featured: false, latitude: 37.9715, longitude: 23.7257, version: r.version, translations: { ...r.translations, en: { ...(r.translations.en||{}), title: r.translations.en?.title, summary: "A point for the P4 checks." }, el: { title: "UX-P4 σημείο", summary: "Δοκιμή." } } }); } catch (e) { console.log("put", e.message); }
    try { await status("pois", id, "ACTIVE"); console.log("activated", id); } catch (e) { console.log("activate", e.message); }
  }
}
{ const r = await get("pois", archived); if (r.status === "DRAFT") { try { await status("pois", archived, "ARCHIVED"); } catch (e) { console.log("archive", e.message); } } }
// Places
async function place(key, body) {
  if (rec[key]) return rec[key];
  const p = await call("curator", "POST", `/projects/${P}/places`, body);
  rec[key] = p.id; save(); console.log("created", key, p.id); return p.id;
}
const outdoor = await place("outdoor", { title: "UX-P4 outdoor place", type: "SITE" });
const indoor = await place("indoor", { title: "UX-P4 indoor place", type: "BUILDING" });
await place("sub", { title: "UX-P4 sub place", type: "FLOOR", parentPlaceId: indoor });
if (!rec.map) {
  const m = await call("curator", "POST", `/projects/${P}/maps`, { internalName: "UX-P4 map", placeId: outdoor, initialLatitude: 37.9715, initialLongitude: 23.7257, initialZoom: 16, minLatitude: 37.968, minLongitude: 23.72, maxLatitude: 37.975, maxLongitude: 23.731, area: "Acropolis", osmId: null });
  rec.map = m.id; save(); console.log("map", m.id);
}
if (!rec.plan) {
  const list = await call("curator", "GET", `/projects/${P}/assets?size=200&type=IMAGE`);
  const asset = (list.content ?? list).find((a) => a.type === "IMAGE" || a.type === "FLOOR_PLAN");
  const pl = await call("curator", "POST", `/projects/${P}/floor-plans`, { internalName: "UX-P4 floor plan", assetId: asset.id, placeId: indoor });
  rec.plan = pl.id; save(); console.log("plan", pl.id);
}
// A draft point with one trigger of each type, so the triggers card has content.
const tr0 = await call("curator", "GET", `/projects/${P}/triggers?size=200`);
const mine = (tr0.content ?? []).filter((t) => t.targetResourceId === draft && t.status !== "ARCHIVED");
if (!mine.length) {
  for (const [triggerType, code, configuration] of [["QR_CODE", null, {}], ["BEACON", null, { uuid: "e2c56db5-dffb-48d2-b060-d0f5a71096e0", major: 12, minor: 3, proximityMeters: 2, cooldownSeconds: 300 }], ["GEO_PROXIMITY", null, { latitude: 37.9715, longitude: 23.7257, radiusMeters: 30, cooldownSeconds: 300 }]]) {
    const t = await call("curator", "POST", `/projects/${P}/triggers`, { targetResourceType: "POI", targetResourceId: draft, triggerType, code, configuration });
    await call("curator", "POST", `/projects/${P}/triggers/${t.id}/status`, { targetStatus: "ACTIVE", version: t.version });
  }
  console.log("triggers added");
}
console.log(JSON.stringify(rec));
await closeAll();
