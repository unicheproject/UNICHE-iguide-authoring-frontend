import { open, go, P, shot } from "./h.mjs";
const { browser, page } = await open("admin", { viewport: "1440" });
page.on("pageerror", (e) => console.log("PAGEERR", e.message));
page.on("console", (m) => m.type() === "error" && console.log("CONSOLE", m.text().slice(0, 300)));
await go(page, `/projects/${P}/media?view=list`); await page.waitForTimeout(4000);
console.log(await page.evaluate(() => document.querySelector("main")?.innerText.slice(0, 400)));
await shot(page, "dbg");
await browser.close();
