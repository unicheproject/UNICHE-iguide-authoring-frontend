import { open, go } from "../../../tools/session.mjs";
import { readFileSync } from "node:fs";
const P = "6958c18f-60d2-4140-a524-5a43f8a2f6b5";
const r = JSON.parse(readFileSync("records.json", "utf8"));
const { browser, page } = await open("admin", { viewport: "1440" });
await page.route(/\/places\?/, async (route) => { const res = await route.fetch(); const body = await res.json(); const extra = body.content.slice(0, 8).map((p, i) => ({ ...p, id: "00000000-0000-4000-8000-00000000000" + i })); body.content = [...body.content, ...extra]; await route.fulfill({ response: res, json: body }); });
await go(page, `/projects/${P}/pois/${r.poi}`);
await page.waitForSelector("[data-sticky-bar]", { timeout: 30000 }); await page.waitForTimeout(2500);
console.log("place options", await page.locator("#f-place option").count(), "category options", await page.locator("#f-category option").count(), "filter inputs", await page.getByLabel("Filter places").count());
if (await page.getByLabel("Filter places").count()) {
  await page.getByLabel("Filter places").fill("acro"); await page.waitForTimeout(300);
  console.log("filtered options", await page.locator("#f-place option").count(), "| status:", await page.locator("[role=status]").allInnerTexts());
  await page.locator("#f-place").scrollIntoViewIfNeeded(); await page.screenshot({ path: "after/filter-1440.png" });
}
await browser.close();
