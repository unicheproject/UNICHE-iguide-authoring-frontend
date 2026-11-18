import { open, go, rec, P, ready, SH, tall, axe } from "./h.mjs";
const log=(...a)=>console.log(...a);
const focus=(page)=>page.evaluate(()=>{const a=document.activeElement;return a?`${a.tagName}#${a.id}.${(a.getAttribute("aria-label")||a.textContent||"").trim().slice(0,40)}`:null});
const { browser, context, page } = await open("curator", { viewport: "1440" });
await go(page, `/projects/${P}/pois/${rec.poiB}`); await ready(page);
await page.getByRole("button",{name:/^Restore as draft$/}).first().click(); await page.waitForTimeout(2500);
log("restore focus", await focus(page), "toasts", await page.locator("[role=status]").allInnerTexts().then(a=>a.filter(Boolean)));
const prob=(status,extra={})=>({status,contentType:"application/problem+json",body:JSON.stringify({type:"about:blank",title:"x",status,requestId:"req-7f3a-"+status,...extra})});
// 1. 503
await page.route(new RegExp(`/pois/${rec.poiB}$`), r=> r.request().method()==="PUT" ? r.fulfill(prob(503,{code:"SERVICE_UNAVAILABLE",detail:"upstream timed out at db-3"})) : r.continue());
await page.locator("#f-summary").fill("503 test summary"); await page.keyboard.press("Control+s"); await page.waitForTimeout(2000);
log("503:", await page.locator("[role=alert]").allInnerTexts().then(a=>a.filter(Boolean))); log("focus", await focus(page));
await page.screenshot({path:SH+"poi-editor__save-503__1440.png"});
await page.unroute(new RegExp(`/pois/${rec.poiB}$`));
// 2. 422 with field errors
const re=new RegExp(`/pois/${rec.poiB}$`);
await page.route(re, r=> r.request().method()==="PUT" ? r.fulfill(prob(422,{code:"VALIDATION_FAILED",errors:[{path:"translations.en.title",code:"SIZE",message:"Too long"},{path:"translations.en.summary",code:"SIZE",message:"Too long"},{path:"latitude",code:"RANGE",message:"Out of range"}]})) : r.continue());
await page.keyboard.press("Control+s"); await page.waitForTimeout(2000);
log("422:", await page.locator("[role=alert]").allInnerTexts().then(a=>a.filter(Boolean))); log("focus", await focus(page));
log("field error links", await page.locator("[role=alert] a").allInnerTexts());
log("aria-invalid", await page.locator("[aria-invalid=true]").evaluateAll(e=>e.map(x=>x.id+":"+x.getAttribute("aria-describedby"))));
await page.screenshot({path:SH+"poi-editor__save-422__1440.png"});
await page.locator("[role=alert] a").first().click(); await page.waitForTimeout(500); log("after summary link focus", await focus(page));
await page.unroute(re);
// 3. 403
await page.route(re, r=> r.request().method()==="PUT" ? r.fulfill(prob(403,{code:"FORBIDDEN"})) : r.continue());
await page.keyboard.press("Control+s"); await page.waitForTimeout(2000);
log("403:", await page.locator("[role=alert]").allInnerTexts().then(a=>a.filter(Boolean)));
await page.unroute(re);
await page.route(re, r=> r.request().method()==="PUT" ? r.fulfill(prob(404,{code:"RESOURCE_NOT_FOUND"})) : r.continue());
await page.keyboard.press("Control+s"); await page.waitForTimeout(2000);
log("404:", await page.locator("[role=alert]").allInnerTexts().then(a=>a.filter(Boolean)));
await page.unroute(re);
// 4. offline
await context.setOffline(true); await page.waitForTimeout(800);
await page.keyboard.press("Control+s"); await page.waitForTimeout(2500);
log("offline:", await page.locator("[role=alert],[role=status]").allInnerTexts().then(a=>a.filter(Boolean)));
log("primary disabled offline?", await page.evaluate(()=>document.querySelector("[data-editor-primary]").getAttribute("aria-disabled")));
await page.screenshot({path:SH+"poi-editor__offline__1440.png"});
await context.setOffline(false); await page.waitForTimeout(2500);
log("online again:", await page.locator("[role=alert],[role=status]").allInnerTexts().then(a=>a.filter(Boolean)));
// 5. leave guard
await page.getByRole("link",{name:"Routes"}).first().click(); await page.waitForTimeout(1200);
log("guard:", await page.getByRole("dialog").innerText().catch(()=>"none")); log("focus", await focus(page));
await page.screenshot({path:SH+"poi-editor__leave-guard__1440.png"});
await browser.close();
