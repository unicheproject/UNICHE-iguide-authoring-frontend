import { open, go } from "../../../tools/session.mjs";
import fs from "fs";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const P = "6958c18f-60d2-4140-a524-5a43f8a2f6b5";
const rec = JSON.parse(fs.readFileSync("records.json"));
const vp = process.argv[2] ?? "1440";
const { browser, page } = await open("admin", { viewport: vp });
const log = (...a) => console.log(...a);
// fan-out route
await go(page, `/projects/${P}/routes/${rec.route}`);
await page.waitForSelector("#add-stop", { timeout: 40000 }); await page.waitForTimeout(1500);
await page.click("#add-stop"); await page.fill("#pick-search", "UX-s11-editors Stop");
await page.fill("#pick-search", "UX-s11-editors"); for (let i=0;i<5;i++){ await page.press("#pick-search","Enter"); await page.waitForTimeout(150);} 
await page.getByRole("button", { name: /^Done/ }).click(); await page.waitForTimeout(2500);
log("fanned note:", await page.getByText(/spread out slightly/).count());
await page.locator(".route-map-pin").screenshot({ path: `after/route-map-fan-${vp}.png` });
await page.screenshot({ path: `after/route-${vp}.png` });
const { AxeBuilder } = require("@axe-core/playwright");
let r = await new AxeBuilder({ page }).analyze();
log("axe route:", r.violations.filter(v=>["serious","critical"].includes(v.impact)).map(v=>v.id));
// guide
await go(page, `/projects/${P}/guides/${rec.guide}`);
await page.waitForSelector("#add-element-end", { timeout: 40000 }); await page.waitForTimeout(1500);
log("guide header:", await page.evaluate(() => document.querySelector("[data-sticky-bar]")?.innerText.replace(/\s+/g," ")));
for (let i=0;i<3;i++){ await page.click("#add-element-end"); await page.waitForTimeout(150); }
log("5 empty blocks header:", await page.evaluate(() => document.querySelector("[data-sticky-bar]")?.innerText.replace(/\s+/g," ")));
log("tabs:", await page.evaluate(() => [...document.querySelectorAll("[role=tab]")].map(t=>t.innerText.replace(/\s+/g," "))));
await page.screenshot({ path: `after/guide-${vp}.png` });
await page.getByRole("button", { name: /^Remove /i }).first().click(); await page.waitForTimeout(400);
log("guide focus after remove:", await page.evaluate(() => document.activeElement?.innerText.replace(/\s+/g," ")));
r = await new AxeBuilder({ page }).analyze();
log("axe guide:", r.violations.filter(v=>["serious","critical"].includes(v.impact)).map(v=>v.id));
await browser.close();
