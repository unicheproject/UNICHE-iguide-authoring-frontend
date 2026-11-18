import { open, go } from "../../../tools/session.mjs";
import { createRequire } from "node:module";
import { writeFileSync } from "node:fs";
const require = createRequire(new URL("../../../../package.json", import.meta.url));
const { AxeBuilder } = require("@axe-core/playwright");
const P = "6958c18f-60d2-4140-a524-5a43f8a2f6b5";
const pages = {
  "poi-editor": `/projects/${P}/pois/546c5177-effd-49c8-acae-85d751f89bbe`,
  "route-editor": `/projects/${P}/routes/9743e460-8351-4897-8ee5-eecc13fcbf19`,
  "category-editor": `/projects/${P}/categories/79aaf581-d009-4294-a11b-bf5a8fa980f3`,
  "guide-empty": `/projects/${P}/guides/e52e1e9d-bba7-4c8b-b186-c73d2bc34579`,
  "poi-list": `/projects/${P}/pois`,
};
const vps = process.argv.slice(2).length ? process.argv.slice(2) : ["1024", "768"];
const axe = {};
for (const vp of vps) {
  const forced = vp === "forced";
  const { browser, page } = await open("admin", { viewport: forced ? "1280" : vp, forcedColors: forced ? "active" : "none" });
  for (const [name, path] of Object.entries(pages)) {
    await go(page, path);
    await page.waitForSelector(name.endsWith("list") ? "thead th, [role=search]" : "[data-sticky-bar]", { timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(1800);
    await page.screenshot({ path: `after/${name}-${vp}.png` });
    await page.evaluate(() => (document.getElementById("main").scrollTop = 700)); await page.waitForTimeout(300);
    await page.screenshot({ path: `after/${name}-${vp}-scrolled.png` });
    if (!forced) {
      const r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
      axe[`${name}@${vp}`] = r.violations.filter((v) => ["serious", "critical"].includes(v.impact)).map((v) => `${v.id}:${v.nodes.length}:${v.nodes[0]?.target}`);
    }
  }
  await browser.close();
}
writeFileSync(`after/axe-${vps.join("_")}.json`, JSON.stringify(axe, null, 1));
console.log(JSON.stringify(axe, null, 1));
