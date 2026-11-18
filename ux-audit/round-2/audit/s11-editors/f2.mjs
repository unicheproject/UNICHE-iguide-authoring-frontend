import { open, go, rec, P, ready } from "./h.mjs";
const { browser, page } = await open("curator", { viewport: "zoom200" });
await go(page, `/projects/${P}/categories/${rec.category}`); await ready(page,1500);
await page.evaluate(()=>{const m=document.querySelector("main"); m.scrollTop=500;}); await page.waitForTimeout(400);
await page.screenshot({path:"ux-audit/round-2/audit/s11-editors/shots/category-editor__scrolled-sticky__zoom200.png"});
await page.keyboard.press("Tab"); 
// focus a field deep in form, check scroll-padding: tab through to icon radio
await page.getByRole("radio",{name:/Pottery/}).focus(); await page.waitForTimeout(300);
const r = await page.evaluate(()=>{const e=document.activeElement.closest("label")||document.activeElement; const b=e.getBoundingClientRect(); const st=[...document.querySelectorAll("*")].filter(x=>getComputedStyle(x).position==="sticky"&&x.getBoundingClientRect().height>20).map(x=>x.getBoundingClientRect().bottom); return {top:b.top,bottom:b.bottom, stickyBottom:Math.max(...st)}});
console.log(JSON.stringify(r));
await page.screenshot({path:"ux-audit/round-2/audit/s11-editors/shots/category-icon__focused__zoom200.png"});
await browser.close();
