import { open, go, shot, settle, path } from "./lib2.mjs";
const { browser, page } = await open("admin", { viewport: "1440" });
const foc = () => page.evaluate(()=>{const a=document.activeElement;return `${a.tagName}#${a.id} "${(a.getAttribute("aria-label")||a.textContent||"").trim().slice(0,40)}"`});
let posts=[]; 
try {
  await page.setViewportSize({width:1440,height:1500});
  await go(page, path("poiA")); await settle(page,2000);
  await page.route(/\/triggers/, async (route)=>{ const r=route.request(); if(r.method()==="POST"){ posts.push(Date.now()%100000+" "+(r.postData()||"").slice(0,60)); if(/BEACON/i.test(r.postData()||"")) return route.fulfill({status:503,contentType:"application/problem+json",body:JSON.stringify({type:"about:blank",title:"Service Unavailable",status:503,code:"SERVICE_UNAVAILABLE",detail:"SECRET",requestId:"req-s10-503"})}); } return route.continue(); });
  await page.getByRole("button",{name:/QR code/}).click(); await page.getByRole("button",{name:/Beacon/}).first().click(); await settle(page,400);
  await page.locator("#t-2-uuid").fill("e2c56db5-dffb-48d2-b060-d0f5a71096e0"); await page.locator("#t-2-major").fill("1"); await page.locator("#t-2-minor").fill("2");
  await page.keyboard.press("Control+s"); await settle(page,3500);
  await shot(page,"poiA__partial-failure__1440x1500");
  console.log("posts", posts);
  console.log("alerts:", await page.locator("[role=alert],[role=status]").allInnerTexts());
  console.log("header:", await page.locator(".editor-header").innerText());
  console.log("focus", await foc());
  await page.unroute(/\/triggers/); posts=[];
  await page.keyboard.press("Control+s"); await settle(page,3500);
  await shot(page,"poiA__after-retry__1440x1500");
  console.log("retry posts", posts.length, "header:", await page.locator(".editor-header").innerText());
  // QR caption
  const qr = page.locator("#triggers"); console.log("QR area text:", (await qr.innerText()).slice(0,700));
  // Test in preview
  const tp = page.getByRole("button",{name:/Test in preview/}).first(); const href = await tp.evaluate(e=>e.tagName+"|"+(e.getAttribute("href")||"")+"|"+(e.getAttribute("target")||""));
  console.log("test in preview:", href);
} finally { await browser.close(); }
