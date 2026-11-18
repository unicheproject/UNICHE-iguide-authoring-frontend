import { open, go, P, ready, shot } from "./h.mjs";
const { browser, page } = await open("admin", { viewport: "1440" });
for (const k of ["places","pois","routes"]) { await go(page, `/projects/${P}/${k}`); await ready(page); console.log(k, page.url(), await page.locator("[data-row-id]").count(), await page.locator("main h1").first().innerText().catch(()=>"-")); }
await shot(page, "t0");
await browser.close();
