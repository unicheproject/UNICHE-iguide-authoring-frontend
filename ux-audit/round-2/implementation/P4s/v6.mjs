import { open, go } from "../../../tools/session.mjs";
const P = "6958c18f-60d2-4140-a524-5a43f8a2f6b5";
const D = "4e03e8e8-7d90-46bb-a3b0-4aab41d67135";
const A = "07927651-be7a-44e9-85eb-843d8ed219f7";
const log = (...a) => console.log(...a);
for (const vp of ["1440", "1024", "768", "zoom200"]) {
  const { browser, page } = await open("admin", { viewport: vp });
  await go(page, `/projects/${P}/pois/${A}`);
  await page.waitForSelector("[data-sticky-bar]", { timeout: 30000 }); await page.waitForTimeout(1500);
  await page.screenshot({ path: `after/active-${vp}.png` });
  const btn = page.locator("[data-preview-action]").first();
  if (!(await btn.isVisible())) { // narrow: open summary
    await page.getByRole("button", { name: /Active|Draft/ }).filter({ hasText: /Active/ }).first().click().catch(() => {});
  }
  await page.locator("[data-preview-action]:visible").first().click(); await page.waitForTimeout(1200);
  const w = await page.evaluate(() => { const p = document.getElementById("editor-preview"); const f = document.querySelector(".editor-shell .grid"); const pr = p?.getBoundingClientRect(); const fr = f?.getBoundingClientRect(); return { panel: pr && [Math.round(pr.left), Math.round(pr.width)], grid: fr && [Math.round(fr.left), Math.round(fr.width)] }; });
  const exp = page.getByRole("button", { name: /^Expand$/ });
  log(vp, "preview", JSON.stringify(w), "expand visible", await exp.count());
  await page.screenshot({ path: `after/preview-${vp}.png` });
  if (await exp.count()) { await exp.first().click(); await page.waitForTimeout(500); 
    const hdr = await page.evaluate(() => { const h = document.querySelector(".editor-header").getBoundingClientRect(); const ap = document.querySelector("[data-editor-primary]"); const r = ap.getBoundingClientRect(); const top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return { primaryClickable: ap.contains(top) }; });
    log(vp, "expanded", JSON.stringify(hdr)); await page.screenshot({ path: `after/preview-expanded-${vp}.png` }); }
  await browser.close();
}
