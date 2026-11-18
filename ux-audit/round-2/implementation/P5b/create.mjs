import { call, closeAll, ensure } from "../../../tools/lib.mjs";
import { writeFileSync } from "node:fs";
const P = (p) => `/projects/6958c18f-60d2-4140-a524-5a43f8a2f6b5${p}`;
await ensure("admin");
const e = await call("admin", "POST", P("/events"), { title: "UX-R2-P5b Event", slug: "ux-r2-p5b-event" });
const c = await call("admin", "POST", P("/categories"), { name: "UX-R2-P5b Category", code: "ux-r2-p5b-category", scope: "POI", parentCategoryId: null }).catch((x) => ({ err: x.message }));
writeFileSync("records.json", JSON.stringify({ event: e.id, category: c.id ?? c.err }, null, 1));
console.log(e.id, c.id ?? c.err);
await closeAll();
