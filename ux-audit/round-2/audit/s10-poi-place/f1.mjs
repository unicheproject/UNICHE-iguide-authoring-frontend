import { open, go, rec, P, ready, SH, tall, axe } from "./h.mjs";
const log=(...a)=>console.log(...a);
const focus=(page)=>page.evaluate(()=>{const a=document.activeElement;return a?`${a.tagName}#${a.id}.${(a.getAttribute("aria-label")||a.textContent||"").trim().slice(0,40)}`:null});
for (const vp of ["1440","1024"]) {
const { browser, page } = await open("curator", { viewport: vp });
await go(page, `/projects/${P}/pois/${rec.poiA}`); await ready(page);
if(vp==="1440") log("lat placeholder", await page.locator("#f-lat").getAttribute("placeholder"), "value", JSON.stringify(await page.locator("#f-lat").inputValue()));
const btn = page.getByRole("button",{name:/Preview in app/}).first();
await btn.click(); await page.waitForTimeout(3000);
log(vp,"focus after open", await focus(page));
const info = await page.evaluate(()=>{const r=document.querySelector("[aria-label*='review' i][role=region],[data-resource-preview]"); return r?{h:Math.round(r.getBoundingClientRect().height),w:Math.round(r.getBoundingClientRect().width),t:r.innerText.slice(0,300)}:null});
log(vp,"panel", JSON.stringify(info), "mainH", await page.evaluate(()=>document.querySelector("main").scrollHeight));
await page.screenshot({path:SH+`preview-in-app__open__${vp}.png`});
await tall(page,`preview-in-app__open-tall__${vp}`);
const exp = page.getByRole("button",{name:/Expand/});
log("expand btn", await exp.count());
if (await exp.count()) { await exp.first().click(); await page.waitForTimeout(2500); log("focus after expand", await focus(page)); await page.screenshot({path:SH+`preview-in-app__expanded__${vp}.png`}); log("dialog?", await page.getByRole("dialog").count(), "Esc..."); await page.keyboard.press("Escape"); await page.waitForTimeout(800); log("focus after esc", await focus(page), "dialog", await page.getByRole("dialog").count()); }
await browser.close();
}
