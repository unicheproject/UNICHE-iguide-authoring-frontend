import { open, go } from "../../../tools/session.mjs";
import { readFileSync } from "node:fs";
const P = "6958c18f-60d2-4140-a524-5a43f8a2f6b5";
const r = JSON.parse(readFileSync("records.json", "utf8"));
for (const vp of ["1440", "1024", "zoom200"]) {
  const { browser, page } = await open("admin", { viewport: vp });
  await go(page, `/projects/${P}/pois/${r.poi}`);
  await page.waitForSelector("[data-sticky-bar]", { timeout: 30000 }); await page.waitForTimeout(2000);
  console.log(vp, "inset", await page.evaluate(() => document.documentElement.style.getPropertyValue("--toast-inset-right")));
  if (vp === "1440") {
    await page.screenshot({ path: "after/poi-1440-b.png" });
    await page.getByRole("button", { name: "Activate", exact: true }).first().click(); await page.waitForTimeout(800);
    await page.screenshot({ path: "after/activate-1440.png" });
    await page.getByRole("button", { name: "Review in editor" }).click(); await page.waitForTimeout(800);
    console.log("focus after review:", await page.evaluate(() => document.activeElement?.id || document.activeElement?.tagName));
  }
  if (vp === "1024") {
    const act = page.locator("button", { hasText: /^Activate$/ }).first();
    console.log("compact activate count", await act.count());
  }
  if (vp === "zoom200") {
    const add = page.getByRole("button", { name: /Add primary image|Choose image/i }).first();
    console.log("add btn", await add.count());
    if (await add.count()) { await add.scrollIntoViewIfNeeded(); await add.click(); await page.waitForTimeout(2500);
      await page.screenshot({ path: "after/picker-zoom200.png" });
      console.log("picker rows", await page.locator("[role=dialog] [role=option], [role=dialog] li, [role=dialog] [role=radio]").count()); }
  }
  await browser.close();
}
