import { readFileSync, writeFileSync } from "node:fs";
import { call, closeAll } from "../../../tools/lib.mjs";
const seed = JSON.parse(readFileSync(new URL("../../../tools/seed.json", import.meta.url), "utf8"));
const P = seed.projects.populated.id;
const f = new URL("./records.json", import.meta.url);
let rec = {}; try { rec = JSON.parse(readFileSync(f, "utf8")); } catch {}
const save = () => writeFileSync(f, JSON.stringify(rec, null, 1));
rec.pois ??= [];
const names = ["Alpha","Bravo","Charlie","Delta","Echo","Foxtrot"];
while (rec.pois.length < 6) { const n = names[rec.pois.length]; const p = await call("curator","POST",`/projects/${P}/pois`,{title:`UX-R2-s11 POI ${n}`,placeId:null,code:null}); rec.pois.push(p.id); save(); }
if (!rec.route) { rec.route = (await call("curator","POST",`/projects/${P}/routes`,{title:"UX-R2-s11 Route",slug:"ux-r2-s11-route",type:"OUTDOOR"})).id; save(); }
if (!rec.guide) { rec.guide = (await call("curator","POST",`/projects/${P}/guides`,{title:"UX-R2-s11 Guide",slug:"ux-r2-s11-guide"})).id; save(); }
if (!rec.event) { const e = await call("curator","POST",`/projects/${P}/events`,{title:"UX-R2-s11 Event",slug:"ux-r2-s11-event"}); rec.event=e.id; save();
  const day=(d,h)=>new Date(Date.UTC(2027,1,d,h)).toISOString();
  for (const d of [9,16]) await call("curator","POST",`/projects/${P}/events/${e.id}/occurrences`,{startsAt:day(d,10),endsAt:day(d,12),status:"SCHEDULED"}); }
if (!rec.category) { rec.category = (await call("curator","POST",`/projects/${P}/categories`,{name:"UX-R2-s11 Category",scope:"POI",code:"ux-r2-s11-category"})).id; save(); }
console.log(JSON.stringify(rec));
await closeAll();
