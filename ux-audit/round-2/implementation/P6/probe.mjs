import { open, go } from "../../../tools/session.mjs";
const P = "6958c18f-60d2-4140-a524-5a43f8a2f6b5";
const { browser, page } = await open("admin", { viewport: "1440" });
await go(page, `/projects/${P}/maps`);
await page.waitForSelector("tbody a", { timeout: 20000 }).catch(() => {});
console.log((await page.$$eval("tbody a", (a) => a.map((x) => x.textContent.trim().slice(0, 40) + " " + x.getAttribute("href")))).join("\n"));
await browser.close();
