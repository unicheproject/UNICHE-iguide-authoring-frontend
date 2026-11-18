import { session, go, P, ids, LOG, sleep } from "./h.mjs";
const { browser, page } = await session({ viewport: "1440" });
await go(page, P(`/pois/${ids.poi}?back=${encodeURIComponent("lang=it&missing=1&q=x&bad=1")}`)); await page.waitForSelector("#status-card-heading"); await sleep(500);
console.log(page.url());
console.log(await page.locator("nav[aria-label=Breadcrumb] a").first().getAttribute("href"));
await page.locator("nav[aria-label=Breadcrumb] a").first().click(); await sleep(800); console.log("after click:", page.url().split("/pois")[1]);
await browser.close();
