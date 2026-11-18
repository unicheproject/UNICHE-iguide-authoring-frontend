// Creates the records this package mutates (named "UX-P5a ..."). Windows Node.
import { readFileSync, writeFileSync } from "node:fs";
import { call, closeAll } from "../../../tools/lib.mjs";
const seed = JSON.parse(readFileSync(new URL("../../../tools/seed.json", import.meta.url), "utf8"));
const P = seed.projects.populated.id;
const f = new URL("./records.json", import.meta.url);
let rec = {};
try { rec = JSON.parse(readFileSync(f, "utf8")); } catch {}
if (!rec.route) rec.route = (await call("curator", "POST", `/projects/${P}/routes`, { title: "UX-P5a Route", slug: "ux-p5a-route", type: "OUTDOOR" })).id;
if (!rec.guide) rec.guide = (await call("curator", "POST", `/projects/${P}/guides`, { title: "UX-P5a Guide", slug: "ux-p5a-guide" })).id;
console.log(rec);
writeFileSync(f, JSON.stringify(rec, null, 1));
await closeAll();
