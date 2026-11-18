import { open, go, shot, settle, path } from "./lib2.mjs";
for (const vp of ["1280","zoom200"]) {
  const { browser, page } = await open("admin", { viewport: vp });
  try {
    await go(page, path("poiB")); await settle(page,2000);
    await page.locator("#f-lat").fill("zz"); await page.locator("#f-lng").fill("999");
    await page.getByRole("button",{name:"Add Beacon (Bluetooth)"}).click().catch(()=>{});
    await page.keyboard.press("Control+s"); await settle(page,1500);
    await shot(page,`poiB__error-summary__${vp}`);
    console.log(vp, await page.evaluate(()=>{const a=document.querySelector("[role=alert]");const hits=[...document.querySelectorAll("[role=alert]")].map(a=>{const r=a.closest("[class*=sticky],[style*=sticky]")||a;const b=r.getBoundingClientRect();return `${a.textContent.trim().slice(0,30)} -> wrapper ${r.tagName}.${(r.className||"").toString().slice(0,50)} y${Math.round(b.y)} h${Math.round(b.height)} pos ${getComputedStyle(r).position} bottom ${getComputedStyle(r).bottom} top ${getComputedStyle(r).top}`});return `vh ${innerHeight} ${hits.join(" || ")}`}));
  } finally { await browser.close(); }
}
