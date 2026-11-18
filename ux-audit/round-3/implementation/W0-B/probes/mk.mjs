import { call, closeAll } from "../../../../tools/lib.mjs";
import { readFileSync, writeFileSync } from "node:fs";
const idsFile = new URL("./ids.json", import.meta.url);
const ids = JSON.parse(readFileSync(idsFile));
const PID = "6958c18f-60d2-4140-a524-5a43f8a2f6b5"; const P = (p) => `/projects/${PID}${p}`;
const W = (m, p, b) => call("admin", m, P(p), b);
const what = process.argv[2];
if (what === "poi") { const n = process.argv[3]; ids[n] = (await W("POST", "/pois", { title: "UX-R3-W0B POI " + n, placeId: ids.place, code: null })).id; }
if (what === "poi-active") { const n = process.argv[3]; const x = await W("POST", "/pois", { title: "UX-R3-W0B POI " + n, placeId: ids.place, code: null }); await W("POST", `/pois/${x.id}/status`, { targetStatus: "ACTIVE", version: x.version }); ids[n] = x.id; }
if (what === "route") { const n = process.argv[3]; ids[n] = (await W("POST", "/routes", { title: "UX-R3-W0B Route " + n, type: "OUTDOOR" })).id; }
if (what === "event") { const n = process.argv[3]; ids[n] = (await W("POST", "/events", { title: "UX-R3-W0B Event " + n })).id; }
if (what === "guide") { const n = process.argv[3]; ids[n] = (await W("POST", "/guides", { title: "UX-R3-W0B Guide " + n })).id; }
writeFileSync(idsFile, JSON.stringify(ids)); console.log(ids);
await closeAll();
