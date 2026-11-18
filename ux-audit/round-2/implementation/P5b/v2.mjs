import { open, go } from "../../../tools/session.mjs";
const P = "6958c18f-60d2-4140-a524-5a43f8a2f6b5", C = "40f6ddf4-aa94-46cc-99b2-a1b49f40f0e9", USED = "79aaf581-d009-4294-a11b-bf5a8fa980f3";
const log = (...a) => console.log(...a);
for (const vp of ["1440", "1024", "768", "zoom200"]) {
  const { browser, page } = await open("admin", { viewport: vp });
  await go(page, `/projects/${P}/categories/${C}`);
  await page.waitForSelector("#f-icon", { timeout: 30000 }); await page.waitForTimeout(1200);
  const radios = page.locator('#f-icon input[type=radio]');
  await radios.nth(1).focus();
  const cols = await page.evaluate(() => { const l = [...document.querySelectorAll("#f-icon label")]; return l.filter((x) => x.offsetTop === l[0].offsetTop).length; });
  const idx = async () => page.evaluate(() => [...document.querySelectorAll('#f-icon input[type=radio]')].findIndex((r) => r === document.activeElement));
  await page.keyboard.press("ArrowDown"); const a = await idx();
  await page.keyboard.press("ArrowDown"); const b = await idx();
  await page.keyboard.press("ArrowUp"); const c = await idx();
  await page.keyboard.press("ArrowRight"); const d = await idx();
  log(vp, "cols", cols, "start 1 -> down", a, "down", b, "up", c, "right", d, "checked", await page.evaluate(() => [...document.querySelectorAll('#f-icon input[type=radio]')].findIndex((r) => r.checked)));
  await page.screenshot({ path: `after/category-${vp}.png` });
  if (vp === "1440") {
    await page.getByLabel("Subcategory").check().catch(() => {});
    log("live", await page.$$eval("[aria-live]", (e) => e.map((x) => x.textContent.trim()).filter(Boolean)));
    await go(page, `/projects/${P}/categories/${USED}`);
    await page.waitForSelector("#f-icon", { timeout: 30000 }); await page.waitForTimeout(1500);
    log("h2s", await page.$$eval("h2", (h) => h.map((x) => x.textContent.trim())));
    log("lock", await page.locator("#cat-scope-help").innerText());
    log("status card reason", await page.$$eval("[aria-label], p", (e) => e.map((x) => x.textContent.trim()).filter((t) => /^Used by/.test(t))));
    await page.getByRole("button", { name: "Show where it is used" }).click();
    log("focus", await page.evaluate(() => document.activeElement.id));
    await page.screenshot({ path: "after/category-used-1440.png" });
  }
  await browser.close();
}
