import { open, go, shot, axe, run, CMS, POP, AP, t, focusDesc } from "./lib.mjs";
await run(async () => {
  // slow loading states
  for (const vp of ["1440","768"]) {
    const { browser, page } = await open("curator", { viewport: vp });
    await go(page, "/"); await page.waitForTimeout(1500);
    await page.route(AP, async (r) => { await new Promise(s=>setTimeout(s,4000)); r.continue(); });
    await page.goto(CMS + `/projects/${POP}/pois`); await page.waitForTimeout(1500);
    await shot(page,"loading__project-shell-1.5s",vp); console.log(vp,"1.5s text:", (await t(page)).replace(/\n+/g," | ").slice(0,200));
    await page.waitForTimeout(4500); await shot(page,"loading__page-skeleton-6s",vp); console.log(vp,"6s text:", (await t(page)).replace(/\n+/g," | ").slice(0,300));
    await page.waitForTimeout(6000); console.log(vp,"12s text:", (await t(page)).replace(/\n+/g," | ").slice(0,200));
    await browser.close();
  }
  // forced colors
  { const { browser, page } = await open("curator", { viewport: "1440", forcedColors: "active" });
    await go(page, `/projects/${POP}/dashboard`); await page.waitForTimeout(2500); await shot(page,"forced__dashboard-chrome","1440");
    await page.locator("header button[aria-haspopup]").first().click(); await page.waitForTimeout(800); await shot(page,"forced__switcher-open","1440");
    await page.keyboard.press("Escape");
    await page.locator("header button").last().click(); await page.waitForTimeout(500); await shot(page,"forced__user-menu","1440");
    await page.keyboard.press("Escape");
    await go(page, "/"); await page.waitForTimeout(2000); await shot(page,"forced__home","1440");
    await browser.close(); }
  { const { browser, page } = await open("curator", { viewport: "1440", forcedColors: "active" });
    await go(page, `/projects/${POP}/categories`); await page.waitForTimeout(2000);
    await page.getByRole("button", { name: /new category/i }).click(); await page.waitForTimeout(500); await page.getByRole("button", { name: /^create/i }).click(); await page.waitForTimeout(500); await shot(page,"forced__dialog-errors","1440");
    await browser.close(); }
});
