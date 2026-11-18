import { open, go, rec, P, ready, SH, tall, axe } from "./h.mjs";
const log=(...a)=>console.log(...a);
const focus=(page)=>page.evaluate(()=>{const a=document.activeElement;return a?`${a.tagName}#${a.id}.${(a.getAttribute("aria-label")||a.textContent||"").trim().slice(0,40)}`:null});
const { browser, page } = await open("curator", { viewport: "1440" });
await go(page, `/projects/${P}/pois/${rec.poiB}`); await ready(page);
// Save and activate on dirty draft + refusal
await page.locator("#f-summary").fill("Summary for activation attempt.");
log("status card button", await page.locator("aside").getByRole("button").allInnerTexts().then(a=>a.filter(x=>/ctivate/.test(x))));
await page.route(new RegExp(`/pois/${rec.poiB}/status$`), r=>r.fulfill({status:409,contentType:"application/problem+json",body:JSON.stringify({status:409,code:"READINESS_FAILED",title:"Not ready",detail:"The point of interest cannot be activated: its Place is not active.",requestId:"req-act-409"})}));
await page.locator("aside").getByRole("button",{name:/ctivate/}).first().click(); await page.waitForTimeout(1000);
log("dlg1", await page.getByRole("dialog").innerText().catch(()=>"none"));
await page.getByRole("dialog").getByRole("button",{name:/ctivate/}).last().click(); await page.waitForTimeout(2500);
log("dlg after refusal", await page.getByRole("dialog").innerText().catch(()=>"closed")); log("focus", await focus(page));
await page.screenshot({path:SH+"poi-editor__activate-refused__1440.png"});
await page.keyboard.press("Escape"); await page.waitForTimeout(500);
await page.unrouteAll();
// header warnings button
await page.getByRole("button",{name:/warnings/}).first().click().catch(e=>log("warn btn",e.message.slice(0,60))); await page.waitForTimeout(600);
log("after warnings click focus", await focus(page), "scrollTop", await page.evaluate(()=>document.querySelector("main").scrollTop));
// On this page links
await page.getByRole("link",{name:/^Media/}).first().click().catch(()=>{}); await page.waitForTimeout(800);
log("after Media nav focus", await focus(page), "scrollTop", await page.evaluate(()=>document.querySelector("main").scrollTop), "url", page.url().slice(-40));
// Next missing
await page.getByRole("button",{name:/Next missing/}).first().click().catch(e=>log("nm",e.message.slice(0,60))); await page.waitForTimeout(800);
log("after next missing", await focus(page), await page.evaluate(()=>document.querySelector("[role=tab][aria-selected=true]")?.textContent.trim()));
await browser.close();
