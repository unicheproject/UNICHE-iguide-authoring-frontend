import { call, closeAll, ensure } from "../../../tools/lib.mjs";
const P = (p) => `/projects/6958c18f-60d2-4140-a524-5a43f8a2f6b5${p}`;
await ensure("admin");
const id = "07927651-be7a-44e9-85eb-843d8ed219f7";
const cur = await call("admin", "GET", P(`/pois/${id}`));
const r = await call("admin", "POST", P(`/pois/${id}/status`), { version: cur.version, targetStatus: "ACTIVE" });
console.log(r.status, r.version);
await closeAll();
