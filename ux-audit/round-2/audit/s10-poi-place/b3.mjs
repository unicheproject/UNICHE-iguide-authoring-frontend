import { open, go, rec, P, ready, SH, tall } from "./h.mjs";
const { browser, page } = await open("curator", { viewport: "1440" });
const log=(...a)=>console.log(...a);
const focus=()=>page.evaluate(()=>{const a=document.activeElement;return a?`${a.tagName}#${a.id}.${(a.getAttribute("aria-label")||a.textContent||"").trim().slice(0,40)}`:null});
await go(page, `/projects/${P}/pois/${rec.poiA}`); await ready(page);
// Discard dialog first (cancel)
await page.getByRole("button",{name:/^Discard changes$/}).click(); await page.waitForTimeout(700);
log("discard dialog:", await page.getByRole("dialog").innerText()); log("focus", await focus());
await page.screenshot({path:SH+"poi-editor__discard-confirm__1440.png"});
await page.keyboard.press("Escape"); await page.waitForTimeout(500); log("focus after Esc", await focus());
await page.getByRole("button",{name:/^Apply changes$/}).click(); await page.waitForTimeout(1200);
log("apply dialog:", await page.getByRole("dialog").innerText());
await page.screenshot({path:SH+"poi-editor__apply-confirm__1440.png"});
await page.getByRole("dialog").getByRole("button",{name:/Apply/}).last().click(); await page.waitForTimeout(3500);
log("focus after apply", await focus());
log("toasts", await page.locator("[role=status],[role=alert]").allInnerTexts());
log("hdr", await page.evaluate(()=>document.querySelector("[data-editor-primary]")?.closest("div[class*=sticky]")?.innerText.replace(/\n+/g," | ")));
log("side", await page.evaluate(()=>document.querySelector("aside")?.innerText.replace(/\n+/g," | ").slice(0,500)));
await browser.close();
