import { open, go, shot, axe, t, run, CMS, POP, EMPTY_D, AP, focusDesc } from "./lib.mjs";
await run(async () => {
  const { browser, context, page } = await open("curator", { viewport: "1440" });
  await go(page, `/projects/${POP}/dashboard`); await page.waitForTimeout(2000);
  const trig = page.locator("header button[aria-haspopup]").first();
  console.log("trigger attrs", await trig.evaluate(e=>e.outerHTML.slice(0,200)));
  await trig.click(); await page.waitForTimeout(1200);
  await shot(page,"switcher__open","1440");
  console.log("focus", await focusDesc(page));
  console.log(await t(page,"[role=dialog], [data-radix-popper-content-wrapper]"));
  await axe(page,"switcher-open");
  // keyboard
  for (const k of ["ArrowDown","ArrowDown","ArrowDown"]) { await page.keyboard.press(k); } console.log("after 3x Down focus", await focusDesc(page));
  await page.keyboard.press("Tab"); console.log("Tab ->", await focusDesc(page)); await page.keyboard.press("Tab"); console.log("Tab ->", await focusDesc(page));
  await page.keyboard.press("Escape"); await page.waitForTimeout(300); console.log("Esc focus", await focusDesc(page));
  // search variants
  await trig.click(); await page.waitForTimeout(600);
  const s = page.getByPlaceholder(/search/i); await s.fill("zzzz"); await page.waitForTimeout(500); await shot(page,"switcher__no-results","1440"); console.log("noresult:", (await t(page,"[data-radix-popper-content-wrapper]")).slice(0,300));
  await s.fill("Test Museum"); await page.waitForTimeout(500); await shot(page,"switcher__search-org","1440");
  await s.fill("κηφ"); await page.waitForTimeout(500); console.log("greek:", (await t(page,"[data-radix-popper-content-wrapper]")).slice(0,200));
  await s.fill(""); await page.waitForTimeout(500);
  // scroll the list to Needs setup
  const needs = page.getByText(/Needs setup/i).first(); console.log("needs setup count", await needs.count());
  if (await needs.count()) { await needs.scrollIntoViewIfNeeded(); await needs.click(); await page.waitForTimeout(800); await shot(page,"switcher__needs-setup-open","1440"); console.log((await t(page,"[data-radix-popper-content-wrapper]")).slice(-700)); }
  await browser.close();
});
