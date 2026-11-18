import { open, go } from "../../../tools/session.mjs";
import { createRequire } from "node:module";
const require = createRequire(new URL("../../../../package.json", import.meta.url));
const { AxeBuilder } = require("@axe-core/playwright");
const P = "6958c18f-60d2-4140-a524-5a43f8a2f6b5";
const OUT = "ux-audit/round-2/implementation/P6/after/";
const out = {};
const axe = async (page, name) => {
  const r = await new AxeBuilder({ page }).analyze();
  out["axe " + name] = r.violations.filter((v) => ["serious", "critical"].includes(v.impact)).map((v) => v.id + ":" + v.nodes.length);
};
for (const vp of ["1440", "768"]) {
  const { browser, page } = await open("admin", { viewport: vp });
  await go(page, `/projects/${P}/floor-plans`);
  await page.getByRole("button", { name: "New floor plan" }).first().click();
  await page.waitForTimeout(600);
  await page.getByRole("button", { name: "Create floor plan" }).click();
  await page.waitForTimeout(600);
  out["fp summary focus " + vp] = await page.evaluate(() => document.activeElement?.hasAttribute("data-error-summary"));
  out["fp summary text " + vp] = await page.locator("[data-error-summary]").innerText();
  await page.screenshot({ path: OUT + `new-fp-errors-${vp}.png` });
  if (vp === "1440") {
    await page.getByRole("button", { name: /Choose image/ }).click();
    await page.waitForTimeout(1200);
    await page.screenshot({ path: OUT + `new-fp-picker-1440.png` });
    await axe(page, "picker");
    await page.keyboard.press("Escape");
  }
  await browser.close();
}
{
  const { browser, page } = await open("admin", { viewport: "1440" });
  await go(page, `/projects/${P}/maps`);
  await page.getByRole("button", { name: "New map" }).first().click();
  await page.waitForTimeout(800);
  const dlg = page.locator("[role=dialog]").first();
  out.dialogBefore = await dlg.boundingBox();
  await page.screenshot({ path: OUT + "new-map-before-1440.png" });
  await page.getByLabel("Find area").fill("Naxos");
  await page.getByRole("button", { name: "Search", exact: true }).click();
  await page.waitForTimeout(3000);
  out.dialogAfter = await dlg.boundingBox();
  await page.screenshot({ path: OUT + "new-map-after-1440.png" });
  await axe(page, "new map");
  await browser.close();
}
{
  const { browser, page } = await open("admin", { viewport: "1440", forcedColors: "active" });
  await go(page, `/projects/${P}/maps/f8daa876-f2af-4552-95ae-431c96ed1b2d`);
  await page.waitForSelector(".leaflet-container"); await page.waitForTimeout(2500);
  await page.getByRole("button", { name: /Try the visitor filter/ }).click();
  await page.screenshot({ path: OUT + "map-forced-1440.png" });
  await browser.close();
}
{
  const { browser, page } = await open("admin", { viewport: "1024" });
  await go(page, `/projects/${P}/maps/f8daa876-f2af-4552-95ae-431c96ed1b2d`);
  await page.waitForSelector(".leaflet-container"); await page.waitForTimeout(2500);
  await axe(page, "map 1024");
  await go(page, `/projects/${P}/floor-plans/3b81f75c-3a3e-45a2-9676-89f1d283457b`);
  await page.waitForSelector(".plan-plane"); await page.waitForTimeout(1500);
  await page.getByRole("button", { name: /^Place / }).first().click();
  await axe(page, "plan armed 1024");
  await browser.close();
}
console.log(JSON.stringify(out, null, 1));
