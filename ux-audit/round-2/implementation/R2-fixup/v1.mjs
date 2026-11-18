import { open, go } from "../../../tools/session.mjs";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
const require = createRequire(new URL("../../../../package.json", import.meta.url));
const { AxeBuilder } = require("@axe-core/playwright");
const P = "6958c18f-60d2-4140-a524-5a43f8a2f6b5";
const r = JSON.parse(readFileSync("records.json", "utf8"));
async function axe(page, name) {
  try { const res = await new AxeBuilder({ page }).withTags(["wcag2a","wcag2aa","wcag21a","wcag21aa"]).analyze();
    console.log("axe", name, res.violations.filter(v=>["serious","critical"].includes(v.impact)).map(v=>v.id+":"+v.nodes.length)); } catch (e) { console.log("axe fail", e.message.slice(0,80)); }
}
for (const vp of ["1440", "1024", "768", "zoom200"]) {
  const { browser, page } = await open("admin", { viewport: vp });
  await go(page, `/projects/${P}/pois/${r.poi}`);
  await page.waitForSelector("[data-sticky-bar]", { timeout: 30000 }); await page.waitForTimeout(2500);
  console.log(vp, "poi scrollHeight", await page.evaluate(() => document.querySelector("main").scrollHeight));
  await page.screenshot({ path: `after/poi-${vp}.png`, fullPage: false });
  if (vp === "1440") {  await axe(page, "poi"); }
  await go(page, `/projects/${P}`);
  await page.waitForTimeout(3000);
  await page.screenshot({ path: `after/dash-${vp}.png` });
  if (vp === "1440") await axe(page, "dash");
  await browser.close();
}
