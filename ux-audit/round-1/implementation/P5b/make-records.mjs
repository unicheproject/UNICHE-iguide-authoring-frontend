// Creates the records P5b mutates (named "UX-P5b ..."). Windows Node.
import { readFileSync, writeFileSync } from "node:fs";
import { call, closeAll } from "../../../tools/lib.mjs";
const seed = JSON.parse(readFileSync(new URL("../../../tools/seed.json", import.meta.url), "utf8"));
const P = seed.projects.populated.id;
const f = new URL("./records.json", import.meta.url);
let rec = {};
try { rec = JSON.parse(readFileSync(f, "utf8")); } catch {}
if (!rec.event) {
  const e = await call("curator", "POST", `/projects/${P}/events`, { title: "UX-P5b event", slug: "ux-p5b-event" });
  rec.event = e.id;
  const day = (d, h) => new Date(Date.UTC(2027, 0, d, h)).toISOString();
  for (const [d] of [[12], [19]]) await call("curator", "POST", `/projects/${P}/events/${e.id}/occurrences`, { startsAt: day(d, 10), endsAt: day(d, 12), status: "SCHEDULED" });
  console.log("event", e.id);
}
if (!rec.category) {
  const c = await call("curator", "POST", `/projects/${P}/categories`, { name: "UX-P5b category", scope: "POI", code: "ux-p5b-category" });
  rec.category = c.id;
  console.log("category", c.id);
}
writeFileSync(f, JSON.stringify(rec, null, 1));
await closeAll();
