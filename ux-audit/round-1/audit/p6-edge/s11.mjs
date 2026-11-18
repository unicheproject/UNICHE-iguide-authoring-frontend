import { open, go, P, shot, log, alerts, focused } from "./lib.mjs";
import { readFileSync } from "node:fs";
const ids = JSON.parse(readFileSync("ux-audit/round-1/audit/p6-edge/ids.json","utf8"));
const { browser, context, page } = await open("curator", { viewport: "1440" });
page.on("dialog", d => d.accept());
const url = `/projects/${P}/pois/${ids.poiA}`;
await go(page, `/projects/${P}/pois`); await page.getByRole("link",{name:/UX-p6-edge POI A/}).first().click(); await page.waitForTimeout(1200);
await page.locator("#f-title").fill("UX-p6-edge POI A dirty2");
await page.evaluate(()=>history.back()); await page.waitForTimeout(800);
log("url with dialog", page.url().replace(/.*5173/,""));
await page.getByRole("button",{name:"Keep editing"}).click(); await page.waitForTimeout(600);
log("url after keep editing", page.url().replace(/.*5173/,""), "title", await page.locator("#f-title").inputValue(), "focus", await focused(page));
// project switch
await page.locator("header button").first().click(); await page.waitForTimeout(800);
await shot(page,"nav-away__switcher-open__1440");
log("popover:", (await page.locator("body").innerText()).split("\n").filter(Boolean).slice(0,40).join(" | ").slice(0,900));
const e = page.getByText("UX Audit – Empty").first();
log("empty option count", await e.count());
if (await e.count()) { await e.click(); await page.waitForTimeout(1500); log("after switch url", page.url().replace(/.*5173/,""), "dlg", await page.locator("[role=dialog]").count()); await shot(page,"nav-away__projectswitch__1440"); }
await browser.close();
