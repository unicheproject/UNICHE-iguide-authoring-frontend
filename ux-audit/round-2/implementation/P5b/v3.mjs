import { open, go } from "../../../tools/session.mjs";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const AxeBuilder = require("../../../../node_modules/@axe-core/playwright").default ?? require("../../../../node_modules/@axe-core/playwright").AxeBuilder;
const P = "6958c18f-60d2-4140-a524-5a43f8a2f6b5", E = "77518b1f-f224-4493-b6e1-9b86b13d44e8", C = "40f6ddf4-aa94-46cc-99b2-a1b49f40f0e9";
const log = (...a) => console.log(...a);
const axe = async (page, name) => {
  const r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  log("axe", name, r.violations.filter((v) => ["serious", "critical"].includes(v.impact)).map((v) => `${v.id}:${v.nodes.length}`), "all:", r.violations.map((v) => v.id));
};
for (const vp of ["1440", "1024", "768", "zoom200"]) {
  const { browser, page } = await open("admin", { viewport: vp });
  await go(page, `/projects/${P}/events/${E}`);
  await page.waitForSelector("#occ-add", { timeout: 30000 }); await page.waitForTimeout(1500);
  if (!(await page.$('[id^="occ-start-"][id$="-day"]'))) { await page.click("#occ-add"); await page.waitForTimeout(300); }
  await page.locator("#dates").scrollIntoViewIfNeeded().catch(() => {});
  await page.getByRole("button", { name: /Repeat weekly/ }).click().catch(() => {});
  await page.screenshot({ path: `after/event-dates-${vp}.png` });
  log(vp, "h-scroll", await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth));
  if (vp === "1440" || vp === "zoom200") await axe(page, `event ${vp}`);
  if (vp === "1440") {
    // Greek tab shot; and the forced-colours / combobox open state
    await page.locator("#f-poiId").click(); await page.waitForTimeout(300);
    await page.screenshot({ path: "after/event-combobox-open-1440.png" });
    await axe(page, "event combobox open");
    await page.keyboard.press("Escape");
  }
  await go(page, `/projects/${P}/categories/${C}`);
  await page.waitForSelector("#f-icon", { timeout: 30000 }); await page.waitForTimeout(1200);
  if (vp === "1440") {
    await page.getByText("Routes", { exact: true }).first().click();
    await page.waitForTimeout(400);
    log("scope live", await page.$$eval("[aria-live]", (e) => e.map((x) => x.textContent.trim()).filter(Boolean)));
    await page.getByText("Points of Interest", { exact: true }).first().click();
  }
  if (vp === "1440" || vp === "zoom200") await axe(page, `category ${vp}`);
  await browser.close();
}
const { browser, page } = await open("admin", { viewport: "1440", forcedColors: "active" });
await go(page, `/projects/${P}/events/${E}`);
await page.waitForSelector("#occ-add", { timeout: 30000 }); await page.waitForTimeout(1500);
await page.screenshot({ path: "after/event-forced-1440.png" });
await go(page, `/projects/${P}/categories/${C}`);
await page.waitForSelector("#f-icon", { timeout: 30000 }); await page.waitForTimeout(1200);
await page.locator("#f-icon").scrollIntoViewIfNeeded();
await page.screenshot({ path: "after/category-forced-1440.png" });
await browser.close();
