import { open, go, shot, POP, axe, focusDesc } from "./lib.mjs";
const kinds = ["places","pois","routes","guides","events","categories"];
{
  const { browser, page } = await open("curator", { viewport: "1440" });
  for (const k of kinds) { await go(page, `/projects/${POP}/${k}`); await page.getByRole("heading", { level: 1 }).first().waitFor(); await page.waitForTimeout(900); await axe(page, k); }
  // scroll restore on Back
  await go(page, `/projects/${POP}/pois`); await page.waitForTimeout(1000);
  await page.mouse.move(700, 500); await page.mouse.wheel(0, 2500); await page.waitForTimeout(500);
  const st = await page.evaluate(() => document.querySelector("main").scrollTop);
  const link = page.locator("tbody tr a").filter({ visible: true }).nth(14);
  const name = await link.innerText(); await link.scrollIntoViewIfNeeded(); await link.click(); await page.waitForTimeout(1200);
  await page.goBack(); await page.waitForTimeout(1500);
  console.log("scroll before", st, "after back", await page.evaluate(() => document.querySelector("main").scrollTop), "| opened:", name, "| focus:", await focusDesc(page));
  // Greek/accent-insensitive search
  await go(page, `/projects/${POP}/pois?q=${encodeURIComponent("κορη")}`); await page.waitForTimeout(900);
  console.log("greek 'κορη' rows:", await page.locator("tbody tr").count(), "search-in all");
  await go(page, `/projects/${POP}/pois?q=${encodeURIComponent("KORE")}`); await page.waitForTimeout(900);
  console.log("'KORE' rows:", await page.locator("tbody tr").count(), "| announce:", await page.locator("[role=status]").allTextContents());
  await browser.close();
}
{
  const { browser, page } = await open("curator", { viewport: "1440", forcedColors: "active" });
  for (const k of ["events", "pois"]) { await go(page, `/projects/${POP}/${k}`); await page.getByRole("heading", { level: 1 }).first().waitFor(); await page.waitForTimeout(900); await shot(page, `${k}-list__forced-colors`, "1440"); }
  await page.getByRole("button", { name: /Actions for/ }).first().click(); await page.waitForTimeout(300); await shot(page, "events-list__forced-colors-menu", "1440");
  await browser.close();
}
