import { open, go, shot, wait, url, ids, active, txt, live, liveLog } from "./h.mjs";
for (const vp of ["1440","1280","zoom200"]) {
const { browser, page } = await open("admin", { viewport: vp });
await go(page, url("pois", ids.poiDraft)); await wait(page, 1800);
const m = await page.evaluate(() => { const vh=innerHeight; let tot=0; const out=[]; for (const e of document.querySelectorAll("header, .editor-header, [class*=z-sticky]")) { const cs=getComputedStyle(e); if ((cs.position==="sticky"||cs.position==="fixed")) { const b=e.getBoundingClientRect(); if (b.height>0 && b.top<200) out.push(`${e.tagName}.${(e.className||"").toString().slice(0,30)} top${Math.round(b.top)} h${Math.round(b.height)}`);} } const h=document.querySelector(".editor-header"); const hb=h?.getBoundingClientRect(); return { vh, out, bottom: hb? Math.round(hb.bottom):null, pct: hb? Math.round(hb.bottom/vh*100):null }; });
console.log(vp, JSON.stringify(m));
await shot(page, `poi-draft__top__${vp}`);
if (vp==="1440") {
  await page.getByRole("button",{name:/Next missing/}).first().click(); await wait(page,500);
  console.log("next missing 1 ->", await active(page));
  // fill summary, description
  const s = page.locator("#f-summary"); await s.fill("Summary text here."); 
  await page.locator("#f-description").fill("Description text here.");
  await page.getByRole("button",{name:/Next missing/}).first().click(); await wait(page,500);
  console.log("next missing 2 ->", await active(page), "expanded:", await page.getByRole("button",{name:/Practical details/}).getAttribute("aria-expanded"));
  await shot(page, `poi-draft__next-missing-practical__1440`);
  const rect = await page.locator("*:focus").evaluate(e=>{const b=e.getBoundingClientRect(); return `y${Math.round(b.y)} h${Math.round(b.height)}`});
  console.log("focused rect", rect);
}
await browser.close();
}
