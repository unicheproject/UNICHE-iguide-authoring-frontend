import { open, bearer, CMS, API } from "../../../tools/session.mjs";
const P = "6958c18f-60d2-4140-a524-5a43f8a2f6b5";
const { browser, page } = await open("admin", { viewport: { width: 1280, height: 720 } });
const tok = await bearer(page);
const r = await fetch(`${API}/projects/${P}/assets?size=200`, { headers: { Authorization: tok } });
const j = await r.json(); if(!r.ok){console.log(r.status, JSON.stringify(j).slice(0,300));}
const list = j.content ?? j;
for (const a of list.filter(a=>a.type==="IMAGE")) console.log(a.id, a.status, a.decorative, a.internalName, JSON.stringify(Object.fromEntries(Object.entries(a.translations).map(([k,v])=>[k,!!v.alternativeText]))), a.usageCount);
await browser.close();
