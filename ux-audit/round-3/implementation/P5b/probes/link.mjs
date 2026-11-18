import { call, closeAll } from "../../../../tools/lib.mjs";
import { readFileSync } from "node:fs";
const ids = JSON.parse(readFileSync(new URL("./ids.json", import.meta.url)));
const PID = "6958c18f-60d2-4140-a524-5a43f8a2f6b5"; const P = (p) => `/projects/${PID}${p}`;
console.log(await call("admin", "POST", P(`/pois/${ids.poi}/categories`), { categoryId: ids.category }));
await closeAll();
