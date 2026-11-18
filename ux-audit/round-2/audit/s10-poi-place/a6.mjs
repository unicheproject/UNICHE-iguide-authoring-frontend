import { open, go, rec, P, shot, ready, tall, SH, axe } from "./h.mjs";
const { browser, page } = await open("curator", { viewport: "1440" });
const errs=[]; page.on("pageerror",e=>errs.push(e.message)); page.on("console",m=>{if(m.type()==="error")errs.push(m.text().slice(0,150))});
const log=(...a)=>console.log(...a);
const focus=()=>page.evaluate(()=>{const a=document.activeElement;return a?`${a.tagName}#${a.id}.${(a.getAttribute("aria-label")||a.textContent||"").trim().slice(0,40)}`:null});
await go(page, `/projects/${P}/pois/${rec.poiA}`); await ready(page);
log("restore notice?", await page.getByText(/restore|unsaved draft/i).allInnerTexts());
await page.locator("#triggers").scrollIntoViewIfNeeded();
await page.getByRole("button",{name:/^\+?\s*QR code$/}).click(); await page.waitForTimeout(500);
await page.getByRole("button",{name:/Bluetooth beacon/}).click(); await page.waitForTimeout(500);
await page.getByRole("button",{name:/Geo-proximity/}).click(); await page.waitForTimeout(500);
// invalid save first
await page.keyboard.press("Control+s"); await page.waitForTimeout(2000);
log("errors after save with empty beacon/geo:", await page.locator("[role=alert]").allInnerTexts());
log("focus", await focus());
await page.screenshot({path:SH+"poi-editor__trigger-errors__1440.png"});
await page.locator("#triggers").getByLabel("Major").fill("12"); await page.locator("#triggers").getByLabel("Minor").fill("3");
await page.locator("#triggers").getByLabel("Latitude").fill("37.9715"); await page.locator("#triggers").getByLabel("Longitude").fill("23.7257");
await page.keyboard.press("Control+s"); await page.waitForTimeout(4000);
log("toasts", await page.locator("[role=status],[role=alert]").allInnerTexts());
log("focus", await focus());
log("hdr", await page.evaluate(()=>document.querySelector("[data-editor-primary]")?.closest("div[class*=sticky]")?.innerText.replace(/\n+/g," | ")));
await page.locator("#triggers").scrollIntoViewIfNeeded(); await page.waitForTimeout(500);
await page.screenshot({path:SH+"poi-editor__triggers-saved__1440.png"});
// test in preview
const href = await page.getByRole("link",{name:/Test in preview/}).first().getAttribute("href").catch(()=>null);
log("test in preview href", href, await page.getByRole("link",{name:/Test in preview/}).count(), await page.getByRole("button",{name:/Test in preview/}).count());
await browser.close(); log(errs);
