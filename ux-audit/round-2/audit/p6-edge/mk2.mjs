import { call, closeAll } from "../../../tools/lib.mjs";
import { ids } from "./lib.mjs";
const I = ids(); const PP = "/projects/6958c18f-60d2-4140-a524-5a43f8a2f6b5";
for (const [k, kind] of [["poiB","pois"],["poiC","pois"],["route","routes"]]) {
  const r = await call("curator", "GET", `${PP}/${kind}/${I[k]}`);
  try { const o = await call("curator", "POST", `${PP}/${kind}/${I[k]}/status`, { targetStatus: "ACTIVE", version: r.version }); console.log(k, "->", o.status); } catch (e) { console.log(k, e.message.slice(0, 500)); }
}
await closeAll();
