import { call, closeAll } from "../../../tools/lib.mjs";
import { rec, P } from "./h.mjs";
for (const id of rec.pois.slice(0,4)) { try { const p = await call("curator","GET",`/projects/${P}/pois/${id}`); const r = await call("curator","POST",`/projects/${P}/pois/${id}/status`,{targetStatus:"ACTIVE",version:p.version}); console.log("ok",r.status);} catch(e){console.log(e.message.slice(0,300));} }
await closeAll();
