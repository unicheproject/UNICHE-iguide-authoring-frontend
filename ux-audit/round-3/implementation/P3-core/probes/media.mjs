import { open, go, P, settle } from "./h.mjs";
const { browser, page } = await open("admin", { viewport: "1440" });
await go(page, `/projects/${P}/media?alt=1&type=AUDIO`); await settle(page, 2000);
console.log(await page.getByRole("button", { name: /^Filters/ }).evaluate((b) => b.textContent.replace(/\s+/g, " ").trim()));
await go(page, `/projects/${P}/media`); await settle(page, 1500);
console.log(await page.getByRole("button", { name: /^Filters/ }).evaluate((b) => b.textContent.replace(/\s+/g, " ").trim()));
await browser.close();
