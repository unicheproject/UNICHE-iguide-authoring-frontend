import { readFileSync, writeFileSync } from "node:fs";
import { call, closeAll } from "../../../tools/lib.mjs";
const seed = JSON.parse(readFileSync(new URL("../../../tools/seed.json", import.meta.url), "utf8"));
const P = seed.projects.populated.id;
const f = new URL("./records.json", import.meta.url);
let rec = {}; try { rec = JSON.parse(readFileSync(f, "utf8")); } catch {}
const save = () => writeFileSync(f, JSON.stringify(rec, null, 1));
if (!rec.place) { const p = await call("curator","POST",`/projects/${P}/places`,{title:"UX-R2-s10 Place",type:"BUILDING"}); rec.place=p.id; save(); console.log("place",JSON.stringify(p).slice(0,400)); }
if (!rec.poiA) { const p = await call("curator","POST",`/projects/${P}/pois`,{title:"UX-R2-s10 POI A",placeId:rec.place,code:null}); rec.poiA=p.id; save(); console.log("poiA",JSON.stringify(p).slice(0,600)); }
if (!rec.poiB) { const p = await call("curator","POST",`/projects/${P}/pois`,{title:"UX-R2-s10 POI B",placeId:null,code:null}); rec.poiB=p.id; save(); }
if (!rec.plan) {
  const list = await call("curator","GET",`/projects/${P}/assets?size=200&type=IMAGE`);
  const asset = (list.content ?? list).find((a)=>a.type==="IMAGE"||a.type==="FLOOR_PLAN");
  const pl = await call("curator","POST",`/projects/${P}/floor-plans`,{internalName:"UX-R2-s10 floor plan",assetId:asset.id,placeId:rec.place});
  rec.plan=pl.id; save();
}
console.log(JSON.stringify(rec));
await closeAll();
