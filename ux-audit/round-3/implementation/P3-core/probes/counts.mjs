import { open, go, bearer, API } from "../../../../tools/session.mjs";
const P = "6958c18f-60d2-4140-a524-5a43f8a2f6b5";
const { browser, page } = await open("admin");
const auth = await bearer(page);
for (const k of ["pois","places","routes","guides","events","categories"]) {
  const r = await fetch(`${API}/projects/${P}/${k}?size=100`, { headers: { authorization: auth } });
  const j = await r.json().catch(()=>null);
  console.log(k, r.status, j?.totalElements ?? (Array.isArray(j)?j.length:Object.keys(j??{})), j?.totalPages);
}
await browser.close();
