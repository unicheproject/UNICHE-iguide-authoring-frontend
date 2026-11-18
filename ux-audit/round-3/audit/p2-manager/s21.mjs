import { open, go } from "../../../tools/session.mjs";
import { shot } from "./lib.mjs";
const POP="6958c18f-60d2-4140-a524-5a43f8a2f6b5";
const { browser, page } = await open("admin", { viewport: "1440" });
await go(page, "/projects/"+POP+"/pois?pending=true"); await page.waitForTimeout(2500);
const href = await page.evaluate(()=>[...document.querySelectorAll("a")].find(a=>/pois\/[0-9a-f-]{36}/.test(a.href))?.href);
await go(page, href.replace("http://localhost:5173","")); await page.waitForTimeout(3000);
await shot(page,"poi-editor-pending__top__1440");
console.log(await page.evaluate(()=>document.querySelector("main")?.innerText.slice(0,1400)));
const bs = page.locator("button[aria-label^='What'], button[aria-label^='Why'], button[aria-label^='How']");
for (let i=0;i<await bs.count();i++){ const b=bs.nth(i); const lab=await b.getAttribute("aria-label"); await b.scrollIntoViewIfNeeded(); await b.click(); await page.waitForTimeout(300);
 console.log("HINT", lab, "=>", await page.evaluate(()=>[...document.querySelectorAll("[data-radix-popper-content-wrapper]")].pop()?.innerText)); if(i===0) await shot(page,"helphint__working-copy__1440"); await page.keyboard.press("Escape"); }
// Preview page jargon
await go(page, "/projects/"+POP+"/preview"); await page.waitForTimeout(3500);
await shot(page,"preview__populated__1440");
console.log("PREVIEW CONTROLS\n", await page.evaluate(()=>document.querySelector("main")?.innerText.slice(0,1500)));
console.log("preview hints", await page.evaluate(()=>[...document.querySelectorAll("button[aria-label^='What'],button[aria-label^='Why'],button[aria-label^='How']")].map(b=>b.getAttribute("aria-label"))));
await go(page, "/projects/"+POP+"/launch"); await page.waitForTimeout(1500);
await shot(page,"launch__placeholder__1440");
console.log("LAUNCH", await page.evaluate(()=>document.querySelector("main")?.innerText));
await browser.close();
