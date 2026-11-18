import { open, go, rec, P, ready, SH } from "./h.mjs";
const { browser, page } = await open("curator", { viewport: "1440" });
await go(page, `/projects/${P}/pois/${rec.poiA}`); await ready(page);
await page.locator("#f-lat").focus();
const seq=[]; for(let i=0;i<45;i++){await page.keyboard.press("Tab"); seq.push(await page.evaluate(()=>{const a=document.activeElement;return (a.getAttribute("aria-label")||a.title||a.textContent||a.className.toString()).trim().slice(0,28)+"|"+a.tagName+"|"+(a.getAttribute("role")||"")}));}
console.log(seq.join("\n"));
await browser.close();
