import { open, go, shot, wait, url, ids, active, txt } from "./h.mjs";
for (const vp of ["1440","1280","1024","zoom200"]) {
const { browser, page } = await open("admin", { viewport: vp });
await go(page, url("pois", ids.poiDraft)); await wait(page, 1800);
await page.evaluate(()=>{ const m=document.querySelector("main"); m.scrollTop=600; window.scrollTo(0,600); }); await wait(page,500);
const m = await page.evaluate(() => { const vh=innerHeight; let maxB=0; const out=[]; for (const e of document.querySelectorAll("body *")) { const cs=getComputedStyle(e); if (cs.position==="sticky"||cs.position==="fixed") { const b=e.getBoundingClientRect(); if (b.height>0 && b.top<=120 && b.bottom>0 && b.width>300) { out.push(`${e.tagName}.${(e.className||"").toString().slice(0,25)} top${Math.round(b.top)} h${Math.round(b.height)} w${Math.round(b.width)}`); maxB=Math.max(maxB,b.bottom);} } } return { vh, out, maxB: Math.round(maxB), pct: Math.round(maxB/vh*100) }; });
console.log(vp, JSON.stringify(m));
await shot(page, `poi-draft__scrolled__${vp}`);
await browser.close();
}
