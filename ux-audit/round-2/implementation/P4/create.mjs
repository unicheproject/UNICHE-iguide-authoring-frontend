import { call, closeAll, ensure } from "../../../tools/lib.mjs";
import { writeFileSync } from "node:fs";
const P = (p) => `/projects/6958c18f-60d2-4140-a524-5a43f8a2f6b5${p}`;
await ensure("admin");
const poi = await call("admin", "POST", P("/pois"), { title: "UX-R2-P4 Empty POI" });
const place = await call("admin", "POST", P("/places"), { title: "UX-R2-P4 Empty place", type: "BUILDING" }).catch((e) => ({ err: e.message }));
writeFileSync("records.json", JSON.stringify({ poi: poi.id, place: place.id ?? place.err }, null, 1));
console.log(poi.id, place.id ?? place.err);
await closeAll();
