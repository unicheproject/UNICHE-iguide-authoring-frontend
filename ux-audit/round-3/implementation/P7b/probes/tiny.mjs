import { open, go, P, ids, shot } from "./h.mjs";
import { createRequire } from "node:module";
const require = createRequire(new URL("../../../../../package.json", import.meta.url));
const AxeBuilder = require("@axe-core/playwright").default ?? require("@axe-core/playwright");
for (const vp of ["1440", "768"]) {
  const { browser, page } = await open("admin", { viewport: vp });
  await go(page, `/projects/${P}/media/${ids.tiny}`); await page.waitForTimeout(3500);
  console.log(vp, "preview img", await page.evaluate(() => { const i = document.querySelector("figure img"); return [i.clientWidth, i.clientHeight, i.naturalWidth, getComputedStyle(i).imageRendering]; }), await page.evaluate(()=>document.querySelector("figure figcaption")?.innerText));
  await shot(page, `editor__tiny__${vp}`);
  if (vp === "1440") {
    const r = await new AxeBuilder({ page }).withTags(["wcag2a","wcag2aa","wcag21a","wcag21aa"]).analyze();
    console.log("axe editor", r.violations.map((v) => v.id + ":" + v.impact + ":" + v.nodes.length));
    await page.getByLabel("Decorative image").click(); await page.waitForTimeout(500);
    const r2 = await new AxeBuilder({ page }).withTags(["wcag2a","wcag2aa","wcag21a","wcag21aa"]).analyze();
    console.log("axe confirm", r2.violations.map((v) => v.id + ":" + v.impact + ":" + v.nodes.length));
    await page.keyboard.press("Escape");
  }
  await browser.close();
}
// forced colours editor
{ const { browser, page } = await open("admin", { viewport: "1440", forcedColors: "active" });
  await go(page, `/projects/${P}/media/${ids.small}`); await page.waitForTimeout(3500);
  await page.getByLabel("Decorative image").focus(); await shot(page, "editor__forced-colors__1440"); await browser.close(); }
{ const { browser, page } = await open("admin", { viewport: "1440" });
  await go(page, `/projects/${P}/pois`); await page.waitForTimeout(3000);
  await page.locator("tbody a, ul a").filter({ hasText: /./ }).first().click(); await page.waitForTimeout(3000);
  await page.getByRole("button", { name: /Add Primary image/ }).first().click(); await page.waitForTimeout(1500);
  const r = await new AxeBuilder({ page }).withTags(["wcag2a","wcag2aa","wcag21a","wcag21aa"]).analyze();
  console.log("axe picker", r.violations.map((v) => v.id + ":" + v.impact + ":" + v.nodes.length)); await browser.close(); }
