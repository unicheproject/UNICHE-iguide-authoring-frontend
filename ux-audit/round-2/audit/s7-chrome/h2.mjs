import { open, go, shot, run, POP, t, focusDesc } from "./lib.mjs";
await run(async () => {
  const { browser, page } = await open("curator", { viewport: "1440" });
  await go(page, `/projects/${POP}/pois`); await page.waitForTimeout(2500);
  await page.getByRole("link", { name: /Parthenon Frieze/ }).first().click(); await page.waitForTimeout(3000);
  const ti = page.getByLabel(/^Title/).first(); await ti.fill((await ti.inputValue()) + " X"); await page.waitForTimeout(300);
  // keyboard route: open switcher with keyboard, arrow to Empty D, Enter
  await page.locator("header button[aria-haspopup]").first().focus(); await page.keyboard.press("Enter"); await page.waitForTimeout(700);
  await page.keyboard.type("Empty D"); await page.waitForTimeout(500); await page.keyboard.press("ArrowDown"); console.log("row focus", await focusDesc(page)); await page.keyboard.press("Enter"); await page.waitForTimeout(1000);
  console.log("dialog count", await page.locator("[role=dialog]").count(), "focus:", await focusDesc(page));
  for (let i=0;i<4;i++){ await page.keyboard.press("Tab"); console.log(" tab ->", await focusDesc(page)); }
  console.log("popover reopened?", await page.locator("[data-radix-popper-content-wrapper]").count());
  await browser.close();
});
