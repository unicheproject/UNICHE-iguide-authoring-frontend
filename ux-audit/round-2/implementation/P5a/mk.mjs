import { call, closeAll } from "../../../tools/lib.mjs";
import fs from "fs";
const P = "6958c18f-60d2-4140-a524-5a43f8a2f6b5";
const rec = fs.existsSync("P5a/records.json") ? JSON.parse(fs.readFileSync("P5a/records.json")) : {};
if (!rec.route) rec.route = (await call("admin","POST",`/projects/${P}/routes`,{title:"UX-R2-P5a Route",slug:"ux-r2-p5a-route",type:"OUTDOOR"})).id;
if (!rec.guide) rec.guide = (await call("admin","POST",`/projects/${P}/guides`,{title:"UX-R2-P5a Guide",slug:"ux-r2-p5a-guide"})).id;
fs.writeFileSync("P5a/records.json", JSON.stringify(rec));
const pois = await call("admin","GET",`/projects/${P}/pois?size=200`);
const list = pois.content ?? pois;
const by = {};
for (const p of list) { const k = `${p.latitude},${p.longitude}`; (by[k] ??= []).push(p.id+" "+(p.translations?.en?.title??p.title)); }
console.log(rec, Object.entries(by).filter(([,v])=>v.length>1).map(([k,v])=>k+" "+v.length+" "+v[0]).slice(0,5), "nopos", Object.entries(by).filter(([k])=>k.includes("null")).map(([k,v])=>v.length));
await closeAll();
