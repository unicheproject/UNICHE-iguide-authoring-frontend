// Creates the records this stage mutates (named "UX-W0.2 ..."). Windows Node.
import { readFileSync, writeFileSync } from "node:fs";
import { call, closeAll } from "../../../tools/lib.mjs";
const seed = JSON.parse(readFileSync(new URL("../../../tools/seed.json", import.meta.url), "utf8"));
const P = seed.projects.populated.id;
const f = new URL("./records.json", import.meta.url);
let rec = {};
try { rec = JSON.parse(readFileSync(f, "utf8")); } catch {}
for (const key of ["draft"]) {
  if (rec[key]) continue;
  const p = await call("curator", "POST", `/projects/${P}/pois`, { title: `UX-W0.2 ${key} point`, placeId: null, code: null });
  rec[key] = p.id;
  console.log("created", key, p.id);
}
writeFileSync(f, JSON.stringify(rec, null, 1));
await closeAll();
