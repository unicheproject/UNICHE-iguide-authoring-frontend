import { open, go, rec, P, shot, ready, tall, SH } from "./h.mjs";
const { browser, page } = await open("curator", { viewport: "1440" });
const errs=[]; page.on("pageerror",e=>errs.push(e.message)); page.on("console",m=>{if(m.type()==="error")errs.push(m.text().slice(0,150))});
const log=(...a)=>console.log(...a);
const focus=()=>page.evaluate(()=>{const a=document.activeElement;return a?`${a.tagName}#${a.id}.${(a.getAttribute("aria-label")||a.textContent||"").trim().slice(0,40)}`:null});
await go(page, `/projects/${P}/pois/${rec.poiA}`); await ready(page);
const hdr=async()=>page.evaluate(()=>{const b=document.querySelector("[data-editor-primary]"); const hd=b?.closest("header,div[class*=sticky]"); return {primary:b?.textContent.trim(), disabled:b?.disabled, aria:b?.getAttribute("aria-disabled"), cls:b?.className.slice(0,120), hdr:hd?.innerText.replace(/\n+/g," | ")}});
log("initial", JSON.stringify(await hdr()));
await page.locator("#f-summary").fill("A bronze statue found near the north gate. It shows a standing figure.");
await page.waitForTimeout(600);
log("dirty", JSON.stringify(await hdr()));
await page.screenshot({path:SH+"poi-editor__draft-dirty__1440.png"});
// Title readiness - fill lat/long and place etc.
await page.keyboard.press("Control+s"); await page.waitForTimeout(2500);
log("after ctrl+s", JSON.stringify(await hdr()), "focus", await focus());
log("toasts", await page.locator("[role=status],[role=alert]").allInnerTexts());
await page.screenshot({path:SH+"poi-editor__draft-saved__1440.png"});
log("version row", await page.evaluate(()=>[...document.querySelectorAll("aside dt, aside dd, aside div")].map(e=>e.textContent.trim()).filter(t=>/Version/.test(t)).slice(0,2)));
// Activate flow
await page.getByRole("button",{name:/^Activate$/}).click(); await page.waitForTimeout(1500);
log("dialog", await page.locator("[role=dialog],[role=alertdialog]").first().innerText().catch(()=>"none"));
log("focus in dialog", await focus());
await page.screenshot({path:SH+"poi-editor__activate-confirm__1440.png"});
await browser.close();
log(errs);
