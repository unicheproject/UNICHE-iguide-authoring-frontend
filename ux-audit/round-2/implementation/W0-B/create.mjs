// Creates the UX-R2-W0B records: an empty-story Guide and a POI with a QR trigger (activated).
import { call, closeAll, ensure } from "../../../tools/lib.mjs";
import { writeFileSync } from "node:fs";
const P = (p) => `/projects/6958c18f-60d2-4140-a524-5a43f8a2f6b5${p}`;
await ensure("admin");
const g = await call("admin", "POST", P("/guides"), { title: "UX-R2-W0B Empty story guide" });
const poi = await call("admin", "POST", P("/pois"), { title: "UX-R2-W0B QR point of interest" });
const upd = await call("admin", "PUT", P(`/pois/${poi.id}`), { version: poi.version, slug: poi.slug, internalName: "ux-r2-w0b", estimatedVisitMinutes: 3, featured: false, latitude: "37.97150", longitude: "23.72570", placeId: null,
  translations: { en: { title: "UX-R2-W0B QR point of interest", summary: "Probe", description: "Probe record for the Deactivate check." }, el: { title: "UX-R2-W0B QR", summary: "x", description: "x" } } }).catch((e) => ({ err: e.message }));
const trig = await call("admin", "POST", P("/triggers"), { targetResourceType: "POI", targetResourceId: poi.id, triggerType: "QR_CODE", supportedSurfaces: null, configuration: {}, code: "ux-r2-w0b-qr" }).catch((e) => ({ err: e.message }));
const out = { guide: g.id, poi: poi.id, poiSlug: poi.slug, upd: upd.err ?? upd.version, trig: trig.err ?? trig.id };
writeFileSync("records.json", JSON.stringify(out, null, 1));
console.log(JSON.stringify(out));
await closeAll();
