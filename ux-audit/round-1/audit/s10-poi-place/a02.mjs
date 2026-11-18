import { start, goEd, tall, poi, place } from "./common.mjs";
const s = await start("1440");
const t = { "poi-active-wc": `/pois/${poi("frieze").id}`, "poi-draft": `/pois/${poi("horsemen").id}`, "poi-archived": `/pois/${poi("copies").id}`,
 "place-outdoor": `/places/${place("site").id}`, "place-indoor-plan": `/places/${place("parthenon").id}` };
for (const [k, p] of Object.entries(t)) { await goEd(s.page, p); console.log(k, await tall(s, k)); }
await s.browser.close();
