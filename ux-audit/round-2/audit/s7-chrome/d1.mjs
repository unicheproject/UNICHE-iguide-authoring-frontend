import { open, go, shot, axe, t, run, CMS, POP, AP, focusDesc } from "./lib.mjs";
await run(async () => {
  const { browser, page } = await open("curator", { viewport: "1440" });
  await go(page, `/projects/${POP}/categories`); await page.waitForTimeout(2500);
  await page.getByRole("button", { name: /new category/i }).click(); await page.waitForTimeout(600);
  console.log("focus", await focusDesc(page)); console.log(await t(page,"[role=dialog]"));
  await shot(page,"dialog__create-category-empty","1440");
  const box = await page.locator("[role=dialog]").boundingBox(); console.log("dialog box", JSON.stringify(box));
  await axe(page,"create-dialog");
  // empty submit
  await page.getByRole("button", { name: /^create/i }).click(); await page.waitForTimeout(600);
  await shot(page,"dialog__create-category-invalid","1440"); console.log("focus after invalid", await focusDesc(page)); console.log((await t(page,"[role=dialog]")).slice(0,400));
  // Esc
  await page.keyboard.press("Escape"); await page.waitForTimeout(400);
  console.log("after Esc dialogs", await page.locator("[role=dialog]").count(), "focus", await focusDesc(page));
  await browser.close();
});
