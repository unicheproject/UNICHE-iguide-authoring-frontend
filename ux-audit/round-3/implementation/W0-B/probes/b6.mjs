import { session, go, P, ids, LOG, shot, sleep, AE } from "./h.mjs";
import { createRequire } from "node:module";
const require = createRequire(new URL("../../../../../package.json", import.meta.url));
const log = LOG("b6");
const { browser, page } = await session({ viewport: "1440" });
// B6 side card metrics, three editors
for (const [k, id] of [["pois", ids.wc1], ["places", ids.place], ["routes", ids.route]]) {
  await go(page, P(`/${k}/${id}`)); await page.waitForSelector("#editor-side-column [data-side-card]", { timeout: 20000 }); await sleep(400);
  log(k, "side cards", await page.evaluate(() => [...document.querySelectorAll("#editor-side-column [data-side-card]")].map((c) => { const h = c.querySelector("h2"); const cs = getComputedStyle(h), cc = getComputedStyle(c); return `${h.textContent.trim().slice(0, 14)}|${cs.fontSize}|${cc.paddingTop}|h2count=${c.querySelectorAll("h2").length}`; })));
  log(k, "texts gap", await page.evaluate(() => { const h = [...document.querySelectorAll("h2")].find((x) => x.textContent.trim() === "Texts"); const t = document.querySelector("[role=tab]"); return h && t ? Math.round(t.getBoundingClientRect().top - h.getBoundingClientRect().bottom) : null; }));
  log(k, "revision", await page.locator("[data-revision]").innerText());
}
// B11 list back
await go(page, P(`/pois/${ids.poi}?back=${encodeURIComponent("lang=it&missing=1&q=x&bad=1")}`)); await page.waitForSelector("#status-card-heading"); 
const href = await page.locator("nav[aria-label*=readcrumb], nav").locator("a", { hasText: "Points of Interest" }).first().getAttribute("href");
log("B11 breadcrumb href:", href);
await page.locator("nav a", { hasText: "Points of Interest" }).first().click(); await sleep(800);
log("B11 url after click:", page.url().split("/pois")[1]);
// B10 closed select
await go(page, P(`/pois/${ids.poi}`)); await page.waitForSelector("#status-card-heading");
log("B10 selected option text:", JSON.stringify(await page.evaluate(() => [...document.querySelectorAll("select")].map((s) => s.selectedOptions[0]?.text))));
// B10 offline click
await page.locator("#f-title").fill("UX-R3-W0B POI A edit"); await sleep(300);
await page.context().setOffline(true); await sleep(1500);
await page.evaluate(() => window.dispatchEvent(new Event("offline")));
await sleep(500);
await page.locator("[data-editor-primary]").click({ force: true }); await sleep(500);
log("B10 offline primary aria-disabled:", await page.locator("[data-editor-primary]").getAttribute("aria-disabled"));
await page.context().setOffline(false);
await browser.close();
