import { open, go, shot, settle, path, measure } from "./lib2.mjs";
const { browser, page } = await open("admin", { viewport: "1440" });
const foc = () => page.evaluate(()=>{const a=document.activeElement;return `${a.tagName}#${a.id} "${(a.getAttribute("aria-label")||a.textContent||"").trim().slice(0,40)}"`});
let reqs=[]; page.on("request",r=>{ if(/triggers/.test(r.url())&&r.method()!=="GET") reqs.push(r.method()+" "+r.url().slice(-40)); });
try {
  await go(page, path("poiA")); await settle(page,2000);
  await page.getByRole("button",{name:/Restore as draft/}).click(); await settle(page,2500);
  console.log("restore focus", await foc());
  await shot(page,"poiA__restored__1440");
  // trigger empty rows
  await page.setViewportSize({width:1440,height:1500});
  await page.getByRole("button",{name:/Beacon/}).first().click(); await page.getByRole("button",{name:/Geo-proximity/}).click(); await page.getByRole("button",{name:/QR code/}).click(); await settle(page,400);
  await page.locator("#f-lat").fill("abc"); await page.locator("#f-lng").press("Tab"); await page.locator("#f-lng").fill("95"); await page.locator("#f-lng").press("Tab");
  await settle(page,300);
  await page.keyboard.press("Control+s"); await settle(page,1800);
  await shot(page,"poiA__trigger-validation__1440x1500");
  console.log("requests", reqs);
  console.log("errors:", await page.locator("[aria-invalid=true]").evaluateAll(e=>e.map(x=>x.id+":"+(x.getAttribute("aria-describedby")||""))));
  console.log("summary:", await page.locator("[role=alert]").allInnerTexts());
  console.log("focus", await foc());
} finally { await browser.close(); }
