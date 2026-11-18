import { open, go, rec, P, shot, ready, tall, SH, axe } from "./h.mjs";
const { browser, page } = await open("curator", { viewport: "1440" });
const errs=[]; page.on("pageerror",e=>errs.push(e.message)); page.on("console",m=>{if(m.type()==="error")errs.push(m.text().slice(0,150))});
const log=(...a)=>console.log(...a);
const focus=()=>page.evaluate(()=>{const a=document.activeElement;return a?`${a.tagName}#${a.id}.${(a.getAttribute("aria-label")||a.textContent||"").trim().slice(0,40)}`:null});
await go(page, `/projects/${P}/pois/${rec.poiA}`); await ready(page);
// unsaved edit then reload -> restore notice
await page.locator("#f-description").fill("Unsaved description for restore test.");
await page.waitForTimeout(1500);
await page.goto(page.url()); await ready(page);
log("restore text:", await page.locator("body").innerText().then(t=>(t.match(/.{0,80}(restore|Restore).{0,120}/)||[])[0]));
await page.screenshot({path:SH+"poi-editor__restore-notice__1440.png"});
await browser.close(); log(errs);
