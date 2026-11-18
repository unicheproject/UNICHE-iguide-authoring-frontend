import { open, go } from "../../../tools/session.mjs";
const P = "6958c18f-60d2-4140-a524-5a43f8a2f6b5";
const { browser, page } = await open("admin", { viewport: "1440" });
await go(page, `/projects/${P}/pois`); await page.waitForTimeout(2500);
const b = page.getByRole("button", { name: /^Actions for/ }).first(); await b.focus(); await page.keyboard.press("Enter"); await page.waitForTimeout(400);
const f = () => page.evaluate(() => `${document.activeElement?.getAttribute("role")}:${document.activeElement?.textContent?.trim().slice(0,20)}`);
console.log("open", await f()); await page.keyboard.press("ArrowDown"); console.log("down", await f());
await page.keyboard.press("Escape"); await page.waitForTimeout(200); console.log("esc", await page.evaluate(() => document.activeElement?.getAttribute("aria-label")));
await browser.close();
