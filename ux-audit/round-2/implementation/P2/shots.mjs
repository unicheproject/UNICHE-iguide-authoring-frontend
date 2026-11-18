import { open, go } from "../../../tools/session.mjs";
import { createRequire } from "node:module";
import { writeFileSync } from "node:fs";
const require = createRequire(new URL("../../../../package.json", import.meta.url));
const { AxeBuilder } = require("@axe-core/playwright");
const P = "6958c18f-60d2-4140-a524-5a43f8a2f6b5";
const D = "f56e8c75-94af-4c87-88c8-06cba46240a1";
const out = {};
const vps = process.argv.slice(2).length ? process.argv.slice(2) : ["1440", "1024", "768", "zoom200", "forced"];
for (const vp of vps) {
  const forced = vp === "forced";
  const { browser, page } = await open("admin", { viewport: forced ? "1280" : vp, forcedColors: forced ? "active" : "none" });
  for (const [name, id] of [["populated", P], ["drafts", D]]) {
    await page.addInitScript(() => {}).catch(() => {});
    await go(page, `/projects/${id}`);
    await page.waitForSelector("#status-title, #guide-title", { timeout: 40000 }).catch(() => {});
    await page.waitForTimeout(1200);
    await page.screenshot({ path: `P2/after/${name}-${vp}.png`, fullPage: false });
    if (vp === "1440") await page.screenshot({ path: `P2/after/${name}-${vp}-full.png`, fullPage: true }).catch(() => {});
    out[`${name}@${vp}`] = {
      h1: await page.locator("main h1").innerText(),
      rows: await page.locator("#warnings-title").count() ? await page.locator("#warnings-title").innerText() : null,
      status: await page.locator("#status-title").count() ? await page.locator("#status-title").innerText() : null,
      guide: await page.locator("#guide-title").count(),
      hscroll: await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1),
    };
    if (!forced) {
      const r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
      out[`${name}@${vp}`].axe = r.violations.filter((v) => ["serious", "critical"].includes(v.impact)).map((v) => `${v.id}:${v.nodes.length}:${v.nodes[0]?.target}`);
    }
  }
  await browser.close();
}
writeFileSync(`P2/after/result-${vps.join("_")}.json`, JSON.stringify(out, null, 1));
console.log(JSON.stringify(out, null, 1));
