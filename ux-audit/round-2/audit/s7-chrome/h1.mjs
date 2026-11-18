import { open, go, shot, axe, run, CMS, POP, EMPTY_D, t, focusDesc } from "./lib.mjs";
await run(async () => {
  for (const vp of ["1440","zoom200"]) {
  const { browser, page } = await open("curator", { viewport: vp });
  await go(page, `/projects/${POP}/pois`); await page.waitForTimeout(2500);
  await page.getByRole("link", { name: /Parthenon Frieze/ }).first().click(); await page.waitForTimeout(3000);
  const title = page.locator("input").filter({ hasNot: page.locator("[type=search]") }).first();
  const ti = page.getByLabel(/^Title/).first(); await ti.fill((await ti.inputValue()) + " X"); await page.waitForTimeout(500);
  console.log(vp,"editor url", page.url().slice(-50));
  await shot(page,"switch__editor-dirty",vp);
  await page.locator("header button[aria-haspopup]").first().click(); await page.waitForTimeout(800);
  await page.getByPlaceholder(/search/i).fill("Empty D"); await page.waitForTimeout(600);
  await page.getByText("UX Audit – Empty D").first().click(); await page.waitForTimeout(1000);
  console.log(vp,"dialogs:", await page.locator("[role=dialog]").count(), "popover open:", await page.locator("[data-radix-popper-content-wrapper]").count());
  await shot(page,"switch__unsaved-confirm",vp);
  console.log(await t(page,"[role=dialog]")); console.log("focus", await focusDesc(page));
  if (vp==="1440") await axe(page,"leave-confirm");
  await page.keyboard.press("Escape"); await page.waitForTimeout(500);
  console.log(vp,"after Esc: dialogs", await page.locator("[role=dialog]").count(), "url", page.url().slice(-30), "focus", await focusDesc(page), "title input value kept:", (await ti.inputValue()).slice(-8));
  await browser.close(); }
});
