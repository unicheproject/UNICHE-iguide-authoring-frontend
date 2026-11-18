import { session, go, P, ids, sleep } from "./h.mjs";
const { browser, page } = await session({ viewport: "1440" });
page.on("response", async (r) => { if (/references|where-used/.test(r.url())) console.log(r.status(), r.url().split("/iguide")[1], (await r.text()).slice(0, 400)); });
await go(page, P(`/categories/${ids.catUsed}`)); await page.waitForSelector("#status-card-heading"); await sleep(1500);
console.log((await page.locator("#editor-side-column").innerText()).replace(/\s+/g, " ").slice(0, 600));
await browser.close();
