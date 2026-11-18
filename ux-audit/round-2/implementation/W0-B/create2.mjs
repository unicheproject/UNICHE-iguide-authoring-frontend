import { call, closeAll, ensure } from "../../../tools/lib.mjs";
const P = (p) => `/projects/6958c18f-60d2-4140-a524-5a43f8a2f6b5${p}`;
await ensure("admin");
const poi = await call("admin", "POST", P("/pois"), { title: "UX-R2-W0B Draft stop POI" });
const r = await call("admin", "POST", P("/routes"), { title: "UX-R2-W0B Draft stop route", type: "OUTDOOR" }).catch(async () => call("admin", "POST", P("/routes"), { title: "UX-R2-W0B Draft stop route", type: "THEMATIC" }));
await call("admin", "POST", P(`/routes/${r.id}/stops`), { poiId: poi.id, translations: { en: { titleOverride: null, description: "x", navigationInstructions: "x", narrative: "x" } } });
console.log(r.id);
await closeAll();
