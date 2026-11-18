import { open, go } from "../../../tools/session.mjs";
import { createRequire } from "node:module";
const D = "ux-audit/round-2/implementation/P3-core/after";
const P = "6958c18f-60d2-4140-a524-5a43f8a2f6b5";
const { browser, page } = await open("admin", { viewport: "1440" });
await page.route(/\/pois(\?|$)/, async (route) => { await new Promise((r) => setTimeout(r, 4000)); await route.continue(); });
await page.goto(`http://localhost:5173/projects/${P}/pois`);
await page.waitForTimeout(2500);
await page.screenshot({ path: `${D}/pois-loading-1440.png` });
console.log("loading counts:", await page.evaluate(() => document.querySelector("fieldset")?.innerText.replace(/\s+/g, " ")), "search disabled:", await page.evaluate(() => document.querySelector('input[type=search]')?.disabled));
await page.waitForTimeout(4500);
// error state
await page.unroute(/\/pois(\?|$)/);
await go(page, `/projects/${P}/pois?q=zzzz`); await page.waitForTimeout(2500);
await page.screenshot({ path: `${D}/pois-no-match-1440.png` });
console.log("clear buttons:", await page.getByRole("button", { name: "Clear filters" }).count());
// axe
const require = createRequire(import.meta.url);
try {
  const { AxeBuilder } = require("@axe-core/playwright");
  for (const url of [`/projects/${P}/pois`, `/projects/${P}/pois?q=zzzz`]) {
    await go(page, url); await page.waitForTimeout(2000);
    const r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
    console.log(url.split("pois")[1] || "/", r.violations.map((v) => `${v.impact}:${v.id}(${v.nodes.length})`));
  }
  await go(page, `/projects/${P}/pois`); await page.waitForTimeout(1500);
  await page.getByRole("button", { name: /^Filters/ }).click(); await page.waitForTimeout(400);
  const r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  console.log("popover", r.violations.map((v) => `${v.impact}:${v.id}(${v.nodes.length})`));
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: /^New point of interest$/ }).first().click(); await page.waitForTimeout(500);
  const r2 = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  console.log("dialog", r2.violations.map((v) => `${v.impact}:${v.id}(${v.nodes.length})`));
  // single pass / empty submit
  await page.getByRole("button", { name: "Create and open" }).click(); await page.waitForTimeout(500);
  console.log("summary:", await page.locator("[data-error-summary]").innerText());
  await page.screenshot({ path: `${D}/create-poi-errors-1440.png` });
} catch (e) { console.log("axe err", e.message); }
await browser.close();
