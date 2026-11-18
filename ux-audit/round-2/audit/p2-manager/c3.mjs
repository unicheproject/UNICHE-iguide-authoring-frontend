import { fresh, uiSignIn, shot, text, CMS, VIEWPORTS } from "./lib.mjs";
const { browser, page } = await fresh("1280");
await uiSignIn(page, "admin", "1280", () => {});
await page.goto(CMS + "/projects/new?resume=cddb627d-1ec0-4f83-9dca-91da3df58183"); await page.waitForTimeout(3000);
await shot(page, "create__step2-resumed", "1280");
const hints = await page.locator("[aria-label^='What is']").evaluateAll(e=>e.map(x=>x.getAttribute("aria-label")));
console.log("hints step2:", hints);
if (hints.length) { await page.locator("[aria-label^='What is']").first().click(); await page.waitForTimeout(400); await shot(page, "create__step2-hint-open", "1280", false); console.log((await text(page,"[role=dialog],[data-reka-popper-content-wrapper]").catch(()=>""))); await page.keyboard.press("Escape"); }
await page.getByRole("button", { name: /^Continue/ }).click(); await page.waitForTimeout(1200);
console.log("focus:", await page.evaluate(()=>document.activeElement?.tagName+" "+(document.activeElement?.textContent||"").slice(0,50)));
await shot(page, "create__step3", "1280");
console.log("STEP3\n" + (await text(page, "main")).split("Languages and surfaces")[2]?.slice(0,1800));
console.log("hints step3:", await page.locator("[aria-label^='What is']").evaluateAll(e=>e.map(x=>x.getAttribute("aria-label"))));
console.log("btns:", JSON.stringify(await page.evaluate(()=>[...document.querySelectorAll("main button")].map(b=>b.textContent.trim()+"|"+(b.getAttribute("aria-disabled")||"")+"|"+(b.title||"")))));
await page.getByRole("button", { name: /^Continue/ }).click(); await page.waitForTimeout(1200);
await shot(page, "create__step4-review", "1280");
console.log("STEP4\n" + (await text(page, "main")).split("Review")[2]?.slice(0,1800));
console.log("btns:", JSON.stringify(await page.evaluate(()=>[...document.querySelectorAll("main button")].map(b=>b.textContent.trim()+"|"+(b.getAttribute("aria-disabled")||"")+"|"+(b.title||"")))));
await browser.close();
