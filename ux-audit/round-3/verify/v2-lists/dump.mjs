import { open, go, P, ready } from "./h.mjs";
const { browser, page } = await open("admin", { viewport: "1440" });
await go(page, `/projects/${P}/pois`); await ready(page);
console.log(await page.evaluate(() => document.querySelector("[data-row-id]").outerHTML.replace(/\s+/g," ").slice(0,3500)));
console.log(await page.evaluate(() => document.querySelector("thead").outerHTML.replace(/\s+/g," ").slice(0,1500)));
await browser.close();
