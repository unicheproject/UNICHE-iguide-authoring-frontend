import { open, go, P, shot, settle } from "./h.mjs";
const { browser, page } = await open("admin", { viewport: "1280" });
for (const [k, idxs] of [["pois",[0,2]],["routes",[3,17]],["guides",[0]],["places",[3]]]) {
  await go(page, `/projects/${P}/${k}`); await settle(page, 2000);
  const res = await page.evaluate((idxs) => [...document.querySelectorAll("main table tbody tr")].map((tr,i)=>({tr,i})).filter(x=>idxs.includes(x.i)).map(({tr,i}) => {
    const out=[]; [...tr.children].forEach((td,ci)=>{ const tb=td.getBoundingClientRect(); [...td.querySelectorAll("*")].forEach(e=>{const b=e.getBoundingClientRect(); if(b.width>0&&b.right>tb.right+1) out.push({row:i,col:ci,tag:e.tagName,cls:(e.className.baseVal??e.className).toString().slice(0,40),txt:(e.innerText||"").slice(0,40),over:Math.round(b.right-tb.right),tdW:Math.round(tb.width),elW:Math.round(b.width)});});}); return out.slice(0,5); }), idxs);
  console.log(k, JSON.stringify(res));
}
await go(page, `/projects/${P}/pois`); await settle(page, 1500);
await page.evaluate(()=>document.querySelector("main table tbody tr").scrollIntoView());
await shot(page, "pois__rows__1280");
await browser.close();
