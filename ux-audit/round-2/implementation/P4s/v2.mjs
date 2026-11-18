import { open, go } from "../../../tools/session.mjs";
const P = "6958c18f-60d2-4140-a524-5a43f8a2f6b5";
const A = "07927651-be7a-44e9-85eb-843d8ed219f7";
const { browser, page } = await open("admin", { viewport: "1440" });
await go(page, `/projects/${P}/pois/${A}`);
await page.waitForSelector("[data-sticky-bar]", { timeout: 30000 }); await page.waitForTimeout(2000);
await page.screenshot({ path: "after/active-clean-1440.png" });
console.log(await page.evaluate(() => [...document.querySelectorAll("header button, [data-editor-primary]")].map((b) => b.textContent.trim() + "|" + b.getAttribute("aria-disabled"))));
await browser.close();
