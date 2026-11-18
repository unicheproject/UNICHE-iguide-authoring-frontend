import { call, closeAll } from "../../../../tools/lib.mjs";
import { readFileSync } from "node:fs";
const ids = JSON.parse(readFileSync(new URL("./ids.json", import.meta.url)));
const PID = "6958c18f-60d2-4140-a524-5a43f8a2f6b5"; const W = (m, p, b) => call("admin", m, `/projects/${PID}${p}`, b);
const pois = await W("GET", `/pois?size=200`);
const p = (pois.content ?? pois).find((x) => x.slug === "ux-r3-w0b-poi-uses-cat");
console.log(p.id, p.categoryIds, p.version);
console.log(JSON.stringify(await W("GET", `/categories/${ids.catUsed}/references`)));
await closeAll();
