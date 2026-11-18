import * as H from "./h.mjs";
const { browser, page } = await H.session({});
const auth = await (async()=>{ const r = page.waitForRequest(r=>r.url().startsWith(H.API)&&!!r.headers()["authorization"],{timeout:45000}); await H.go(page, H.P("/pois")); return (await r).headers()["authorization"]; })();
const out = {};
for (const k of ["pois","places","routes","guides","events","categories","maps","floor-plans","assets"]) {
  const r = await page.request.get(`${H.API}/projects/${H.PID}/${k}?size=200&q=UX-R3V-v5`, { headers: { authorization: auth } });
  const j = await r.json().catch(()=>null);
  const items = (j?.content ?? j ?? []).filter?.(x => JSON.stringify(x).includes("UX-R3V-v5")) ?? [];
  out[k] = { status: r.status(), n: items.length, items: items.map(x=>x.id+" "+x.status+" "+JSON.stringify(x).slice(0,0)) };
}
console.log(JSON.stringify(out,null,1));
await browser.close();
