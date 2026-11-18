import { call, closeAll } from "../../../../tools/lib.mjs";
import { readFileSync, writeFileSync } from "node:fs";
const f = new URL("./ids.json", import.meta.url); const ids = JSON.parse(readFileSync(f));
const PID = "6958c18f-60d2-4140-a524-5a43f8a2f6b5"; const P = (p) => `/projects/${PID}${p}`;
const cat = await call("admin", "POST", P("/categories"), { name: "UX-R3-P5b Category B active user", scope: "POI" });
await call("admin", "POST", P(`/categories/${cat.id}/status`), { targetStatus: "ACTIVE", version: cat.version });
ids.categoryB = cat.id;
const poi = await call("admin", "POST", P("/pois"), { title: "UX-R3-P5b POI active user", code: null });
await call("admin", "POST", P(`/pois/${poi.id}/categories`), { categoryId: cat.id });
try { await call("admin", "POST", P(`/pois/${poi.id}/status`), { targetStatus: "ACTIVE", version: poi.version }); console.log("poi active"); } catch (e) { console.log("act fail", e.message.slice(0,300)); }
ids.poiB = poi.id;
writeFileSync(f, JSON.stringify(ids)); console.log(ids);
await closeAll();
