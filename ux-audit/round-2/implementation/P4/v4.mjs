import { open, go, VIEWPORTS } from "../../../tools/session.mjs";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
const require = createRequire("C:/Users/mirto/IdeaProjects/iguide/uniche_iguide_frontend/package.json");
const { default: AxeBuilder } = require("@axe-core/playwright");
const P = "6958c18f-60d2-4140-a524-5a43f8a2f6b5";
const r = JSON.parse(readFileSync("records.json", "utf8"));
const log = (...a) => console.log(...a);
for (const vp of ["1440", "1024", "768", "zoom200"]) {
  const { browser, page } = await open("admin", { viewport: vp });
  for (const [k, path] of [["poi", `/projects/${P}/pois/${r.poi}`], ["place", `/projects/${P}/places/${r.place}`]]) {
    await go(page, path);
    await page.waitForSelector("[data-sticky-bar]", { timeout: 30000 }); await page.waitForTimeout(2500);
    const h = await page.evaluate(() => document.querySelector("main").scrollHeight);
    const axe = await new AxeBuilder({ page }).analyze();
    const bad = axe.violations.filter((v) => ["serious", "critical"].includes(v.impact));
    log(vp, k, "main", h, "axe serious/critical:", bad.map((v) => v.id + ":" + v.nodes.length).join(",") || "none", "| horizontal overflow:", await page.evaluate(() => document.documentElement.scrollWidth > innerWidth));
    const vs = page.viewportSize();
    await page.setViewportSize({ width: vs.width, height: Math.max(vs.height, 2300) }); await page.waitForTimeout(500);
    await page.screenshot({ path: `after/${k}-${vp}.png` });
    await page.setViewportSize(vs);
  }
  if (vp === "1440") {
    const img = page.locator("[data-qr-block] img");
    await go(page, `/projects/${P}/pois/${r.poi}`); await page.waitForSelector("[data-sticky-bar]"); await page.waitForTimeout(2500);
    log("qr img count", await img.count(), await img.count() ? await img.first().evaluate((i) => [i.naturalWidth, i.naturalHeight]) : "");
    log("qr block text:", (await page.locator("[data-qr-block]").first().innerText().catch(() => "none")).replace(/\n/g, " | "));
    await page.locator("#triggers").scrollIntoViewIfNeeded(); await page.waitForTimeout(500);
    await page.screenshot({ path: "after/triggers-1440.png" });
  }
  await browser.close();
}
// forced colors
const { browser, page } = await open("admin", { viewport: "1440", forcedColors: "active" });
await go(page, `/projects/${P}/pois/${r.poi}`); await page.waitForSelector("[data-sticky-bar]"); await page.waitForTimeout(2500);
await page.setViewportSize({ width: 1440, height: 2300 }); await page.waitForTimeout(500);
await page.screenshot({ path: "after/poi-forced-1440.png" });
await browser.close();
