import { apiSession } from "./api.mjs"; import { ids } from "./h.mjs";
const s = await apiSession();
const kinds={place:"places",poiDraft:"pois",poiActive:"pois",guide:"guides",event:"events",cat:"categories",catUsed:"categories",route:"routes",poiTrig:"pois",poiTrig2:"pois"};
for (const [k,v] of Object.entries(kinds)) { const r = await s.call("GET",`/${v}/${ids[k]}`); const j=r.json; console.log(k, r.status, j.status, "v"+j.version, j.title||j.name, "wc:", j.workingCopy? "yes":"no", Object.keys(j).join(",").slice(0,200)); }
await s.browser.close();
