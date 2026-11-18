import { call, closeAll } from "../../../tools/lib.mjs";
import fs from "node:fs";
const P = "6958c18f-60d2-4140-a524-5a43f8a2f6b5";
const p = (x) => `/projects/${P}${x}`;
const ids = JSON.parse(fs.readFileSync("ux-audit/round-3/verify/v3-editors/ids.json","utf8"));
const N = (s) => `UX-R3V-v3 ${s}`;
const r = await call("admin","POST",p("/routes"),{ title: N("Route"), type: "OUTDOOR" }); ids.route = r.id; console.log("route", r.id);
// 5 close POIs with coordinates for map pins
ids.stopPois = [];
for (let i=0;i<5;i++){
  const q = await call("admin","POST",p("/pois"),{ title: N(`Stop ${i+1} Παρθενώνας Άθηνα`), placeId:null, code:null });
  const cur = await call("admin","GET",p(`/pois/${q.id}`));
  await call("admin","PUT",p(`/pois/${q.id}`),{ version: cur.version, slug: cur.slug, placeId: null, code: null, internalName: null, latitude: 37.9715+i*0.00008, longitude: 23.7257+i*0.00008, estimatedVisitMinutes: null, featured:false, translations: cur.translations });
  ids.stopPois.push(q.id);
}
for (const id of ids.stopPois) { await call("admin","POST",p(`/routes/${ids.route}/stops`),{ poiId:id, translations:{en:{titleOverride:null,description:null,navigationInstructions:null,narrative:null}} }).catch(e=>console.log("stop err", e.message.slice(0,200))); }
fs.writeFileSync("ux-audit/round-3/verify/v3-editors/ids.json", JSON.stringify(ids,null,1));
await closeAll();
