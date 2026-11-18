import { open, go, shot, settle, path } from "./lib2.mjs";
const { browser, context, page } = await open("admin", { viewport: "1440" });
const foc = () => page.evaluate(()=>{const a=document.activeElement;return `${a.tagName}#${a.id} "${(a.getAttribute("aria-label")||a.textContent||"").trim().slice(0,40)}"`});
let posts=[];
try {
  await page.setViewportSize({width:1440,height:1500});
  await go(page, path("poiA")); await settle(page,2000);
  const uuid = crypto.randomUUID();
  await page.route(/\/triggers/, async (route)=>{ const r=route.request(); if(r.method()==="POST"){ posts.push(Date.now()%100000+" "+(r.postData()||"").slice(0,50)); if(/BEACON/i.test(r.postData()||"")) return route.fulfill({status:503,contentType:"application/problem+json",body:JSON.stringify({type:"about:blank",title:"Service Unavailable",status:503,code:"SERVICE_UNAVAILABLE",detail:"SECRET",requestId:"req-s10-503"})}); } return route.continue(); });
  await page.getByRole("button",{name:"Add Beacon (Bluetooth)"}).click(); await page.getByRole("button",{name:"Add Geo-proximity"}).click(); await settle(page,400);
  await page.locator("#t-3-uuid,#t-2-uuid").first().fill(uuid);
  const ids = await page.locator("#triggers input").evaluateAll(e=>e.map(x=>x.id));
  console.log("trigger inputs", ids.join(","));
  for (const [suffix,val] of [["major","11"],["minor","22"],["lat","37.97"],["lng","23.72"]]) { const el = page.locator(`#triggers input[id$="-${suffix}"]`).last(); await el.fill(val); }
  await page.keyboard.press("Control+s"); await settle(page,3500);
  await shot(page,"poiA__partial-failure__1440x1500");
  console.log("posts", posts);
  console.log("alerts:", (await page.locator("[role=alert],[role=status]").allInnerTexts()).filter(Boolean));
  console.log("header:", (await page.locator(".editor-header").innerText()).replace(/\n/g," / "));
  console.log("focus", await foc());
  await page.unroute(/\/triggers/);
  // leave guard: navigate via breadcrumb with unsaved changes
  await page.locator("#f-summary").fill("Guard test edit"); await settle(page,300);
  await page.getByRole("link",{name:"Points of Interest"}).first().click(); await settle(page,800);
  await shot(page,"poiA__leave-guard__1440x1500");
  const d = page.getByRole("dialog"); console.log("guard dialog:", await d.count() ? (await d.innerText()).replace(/\n+/g," / ") : "none", "| focus", await foc());
  if (await d.count()) { await page.keyboard.press("Escape"); await settle(page,400); console.log("after esc focus", await foc(), page.url().slice(-20)); }
  // offline ctrl+s
  await context.setOffline(true); await page.locator("#f-summary").click(); await page.keyboard.press("Control+s"); await settle(page,1200);
  await shot(page,"poiA__offline-save__1440x1500");
  console.log("offline:", (await page.locator("[role=alert],[role=status]").allInnerTexts()).filter(Boolean), (await page.locator(".editor-header").innerText()).replace(/\n/g," / "));
  await context.setOffline(false);
} finally { await browser.close(); }
