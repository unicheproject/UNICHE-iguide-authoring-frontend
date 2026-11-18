import { call, closeAll } from "../tools/lib.mjs";
const P = { populated: "6958c18f-60d2-4140-a524-5a43f8a2f6b5", B: "1d6971ce-6391-4da8-848e-8d7466d25128", C: "ceee1b24-e7c4-474e-93ba-f77067ed8a72", D: "f56e8c75-94af-4c87-88c8-06cba46240a1" };
for (const [k, id] of Object.entries(P)) {
  for (const acct of ["admin", "curator"]) {
    try { const p = await call(acct, "GET", `/projects/${id}`); const pl = await call(acct, "GET", `/projects/${id}/places?size=1`); const po = await call(acct, "GET", `/projects/${id}/pois?size=1`);
      console.log(k, acct, "OK", p.initialized, "places", pl.totalElements, "pois", po.totalElements);
    } catch (e) { console.log(k, acct, "ERR", String(e.message).slice(0, 90)); }
  }
}
await closeAll();
