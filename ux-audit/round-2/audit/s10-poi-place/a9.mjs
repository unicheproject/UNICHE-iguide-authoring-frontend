import { open, go, rec, P, shot, ready, tall, SH, axe } from "./h.mjs";
const { browser, page } = await open("curator", { viewport: "1440" });
const errs=[]; page.on("pageerror",e=>errs.push(e.message)); page.on("console",m=>{if(m.type()==="error")errs.push(m.text().slice(0,150))});
const log=(...a)=>console.log(...a);
const focus=()=>page.evaluate(()=>{const a=document.activeElement;return a?`${a.tagName}#${a.id}.${(a.getAttribute("aria-label")||a.textContent||"").trim().slice(0,40)}`:null});
await go(page, `/projects/${P}/pois/${rec.poiA}`); await ready(page);
await page.locator("#f-description").fill("Unsaved description for restore test."); await page.waitForTimeout(1500); await page.goto(page.url()); await ready(page);
await page.getByRole("button",{name:/^Restore$/}).click(); await page.waitForTimeout(800);
log("focus after restore", await focus(), "desc:", await page.locator("#f-description").inputValue());
await page.getByRole("button",{name:/^Save draft$/}).click(); await page.waitForTimeout(2500);
// triggers: add QR + geo, reload without saving
await page.locator("#triggers").scrollIntoViewIfNeeded();
await page.getByRole("button",{name:/^\+?\s*QR code$/}).click(); await page.waitForTimeout(500);
await page.waitForTimeout(1500);
await page.goto(page.url()); await ready(page);
log("after reload with unsaved QR row: restore notice?", await page.locator("body").innerText().then(t=>/Unsaved changes from/.test(t)), "QR rows:", await page.locator("#triggers").innerText().then(t=>/Remove QR code/.test(t)));
// now add QR and save
await page.locator("#triggers").scrollIntoViewIfNeeded();
await page.getByRole("button",{name:/^\+?\s*QR code$/}).click(); await page.waitForTimeout(500);
await page.getByRole("button",{name:/^Save draft$/}).click(); await page.waitForTimeout(4000);
log("toasts", await page.locator("[role=status],[role=alert]").allInnerTexts());
await page.locator("#triggers").scrollIntoViewIfNeeded(); await page.waitForTimeout(800);
await page.screenshot({path:SH+"poi-editor__qr-saved__1440.png"});
log("QR link/text:", await page.locator("[data-qr-block]").first().innerText().catch(()=>"none"));
log("test in preview", await page.getByRole("link",{name:/Test in preview/}).first().getAttribute("href"));
log("used in:", await page.locator("aside").innerText().then(t=>t.slice(t.indexOf("Used in"))));
await browser.close(); log(errs);
