import { start, goEd, P } from "./common.mjs";
const s = await start("1440"); const { page } = s;
await goEd(page, "/places");
await page.getByRole("button", { name: /new place/i }).first().click();
await page.waitForTimeout(400);
// Esc
await page.keyboard.press("Escape"); await page.waitForTimeout(300);
console.log("dialog after Esc:", await page.getByRole("dialog").count(), "focus:", await page.evaluate(()=>document.activeElement?.textContent?.trim().slice(0,30)));
await page.getByRole("button", { name: /new place/i }).first().click(); await page.waitForTimeout(400);
console.log("focus in dialog:", await page.evaluate(()=>document.activeElement?.textContent?.trim().slice(0,40)));
// submit empty
await page.getByRole("button", { name: /create place/i }).click(); await page.waitForTimeout(800);
console.log("url", page.url());
await s.shot("create-place__after-submit-empty");
console.log((await page.locator("main").innerText()).slice(0,300));
await s.browser.close();
