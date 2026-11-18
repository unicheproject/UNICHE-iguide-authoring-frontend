import { session, go, P, ids, LOG, shot, sleep } from "./h.mjs";
import { createRequire } from "node:module";
const require = createRequire(new URL("../../../../../package.json", import.meta.url));
const AxeBuilder = require("@axe-core/playwright").default;
const log = LOG("ax");
const run = async (page, name) => { const r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze(); log(name, "violations:", r.violations.map((v) => `${v.id}(${v.impact}):${v.nodes.length}`)); };
for (const vp of ["1440", "1024", "768", "zoom200"]) {
  const { browser, page } = await session({ viewport: vp });
  await go(page, P(`/pois/${ids.wc1}`)); await page.waitForSelector("#f-summary"); await page.locator("#f-summary").fill("axe " + Date.now()); await sleep(500);
  await run(page, "wc1-dirty-" + vp); await shot(page, "final-wc1-dirty-" + vp);
  if (vp === "1440") {
    await go(page, P(`/pois/${ids.actB}`)); await page.waitForSelector("#status-card-heading"); await page.getByRole("button", { name: "Activate", exact: true }).first().click(); await sleep(500);
    await run(page, "activate-dialog-1440"); await shot(page, "final-activate-dialog-1440"); await page.keyboard.press("Escape");
  }
  await browser.close();
}
const { browser, page } = await session({ viewport: "1440", forcedColors: "active" });
await go(page, P(`/pois/${ids.wc1}`)); await page.waitForSelector("#f-summary"); await page.locator("#f-summary").fill("fc " + Date.now()); await sleep(500); await shot(page, "final-forced-colours-1440");
await browser.close();
