import { open, go, P } from "./h.mjs";
const { browser, page } = await open("admin", { viewport: "1440" });
await go(page, `/projects/${P}/media?type=AUDIO&alt=1`); await page.waitForTimeout(2500);
await page.getByRole("button", { name: "Remove filter Type: Audio" }).focus(); await page.keyboard.press("Enter"); await page.waitForTimeout(800);
console.log(await page.evaluate(() => { const e = document.activeElement; return e.tagName + " " + (e.getAttribute("aria-label") || e.getAttribute("placeholder")); }));
await browser.close();
