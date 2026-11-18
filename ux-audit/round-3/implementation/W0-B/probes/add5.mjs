import { call, closeAll } from "../../../../tools/lib.mjs";
import { readFileSync } from "node:fs";
const ids = JSON.parse(readFileSync(new URL("./ids.json", import.meta.url)));
const PID = "6958c18f-60d2-4140-a524-5a43f8a2f6b5"; const W = (m, p, b) => call("admin", m, `/projects/${PID}${p}`, b);
await W("POST", "/pois/cfe1efc9-67ac-434c-8df8-74e369ec5c78/categories", { categoryId: ids.catUsed });
console.log(JSON.stringify(await W("GET", `/categories/${ids.catUsed}/references`)).slice(0, 300));
await closeAll();
