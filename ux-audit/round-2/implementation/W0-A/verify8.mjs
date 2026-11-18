import { readFileSync } from "node:fs";
import { open, go } from "../../../tools/session.mjs";
const P = "6958c18f-60d2-4140-a524-5a43f8a2f6b5";
const css = readFileSync(new URL("./built.css", import.meta.url), "utf8");
const OUT = "ux-audit/round-2/implementation/W0-A/after/";
const withCss = async (page) => { await page.evaluate(() => document.querySelectorAll('style[data-vite-dev-id*="style.css"]').forEach((s) => s.remove())); await page.addStyleTag({ content: css }); await page.waitForTimeout(400); };
for (const vp of ["1440", "1024", "768", "zoom200"]) {
  const { browser, page } = await open("admin", { viewport: vp });
  await go(page, `/projects/not-a-uuid`); await page.waitForSelector("main h1"); await withCss(page);
  await page.screenshot({ path: OUT + `notfound__${vp}.png` });
  await go(page, `/projects/${P}/pois`); await page.waitForSelector("main h1"); await page.waitForTimeout(1500); await withCss(page);
  const small = await page.evaluate(() => [...document.querySelectorAll("button")].filter(b => b.offsetParent && !(b.textContent||"").trim()).map(b => b.getBoundingClientRect()).filter(r => r.width < 40 || r.height < 40).length);
  console.log(vp, "icon buttons under 40px on POI list:", small);
  await page.screenshot({ path: OUT + `poi-list__${vp}.png` });
  await browser.close();
}
