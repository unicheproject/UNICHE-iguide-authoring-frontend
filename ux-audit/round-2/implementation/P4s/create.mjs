// Creates UX-R2-P4s records: a DRAFT POI with a long title, an ACTIVE POI (with a pending Working Copy to apply later), a Route with 3 stops.
import { call, closeAll, ensure } from "../../../tools/lib.mjs";
import { writeFileSync } from "node:fs";
const P = (p) => `/projects/6958c18f-60d2-4140-a524-5a43f8a2f6b5${p}`;
await ensure("admin");
const body = (poi, title) => ({ version: poi.version, slug: poi.slug, internalName: "ux-r2-p4s", estimatedVisitMinutes: 3, featured: false, latitude: "37.97150", longitude: "23.72570", placeId: null,
  translations: { en: { title, summary: "Probe summary", description: "Probe description for the shell checks." }, el: { title: title + " (el)", summary: "x", description: "x" } } });
const longTitle = "UX-R2-P4s Draft POI with a very long title that has to wrap to two lines in the header and grow in the field";
const d = await call("admin", "POST", P("/pois"), { title: longTitle });
const d2 = await call("admin", "PUT", P(`/pois/${d.id}`), body(d, longTitle)).catch((e) => ({ err: e.message }));
const a = await call("admin", "POST", P("/pois"), { title: "UX-R2-P4s Active POI" });
const a2 = await call("admin", "PUT", P(`/pois/${a.id}`), body(a, "UX-R2-P4s Active POI")).catch((e) => ({ err: e.message }));
let act; try { act = await call("admin", "POST", P(`/pois/${a.id}/status`), { version: a2.version, status: "ACTIVE" }); } catch (e) { act = { err: e.message }; }
const out = { draft: d.id, draftUpd: d2.err ?? d2.version, active: a.id, activeUpd: a2.err ?? a2.version, act: act.err ?? act.status };
writeFileSync("records.json", JSON.stringify(out, null, 1));
console.log(JSON.stringify(out));
await closeAll();
