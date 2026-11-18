import { call, closeAll } from "../../../tools/lib.mjs";
import fs from "node:fs";
const P = "6958c18f-60d2-4140-a524-5a43f8a2f6b5";
const f="ux-audit/round-3/verify/v3-editors/ids.json";
const ids = JSON.parse(fs.readFileSync(f,"utf8"));
const r = await call("admin","POST",`/projects/${P}/pois`,{ title:"UX-R3V-v3 POI triggers", placeId:null, code:null }); ids.poiTrig=r.id;
const r2 = await call("admin","POST",`/projects/${P}/pois`,{ title:"UX-R3V-v3 POI triggers2", placeId:null, code:null }); ids.poiTrig2=r2.id;
fs.writeFileSync(f, JSON.stringify(ids,null,1)); await closeAll();
