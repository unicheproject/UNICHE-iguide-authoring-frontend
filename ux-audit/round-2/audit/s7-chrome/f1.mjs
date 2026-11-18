import { open, go, freshCtx, shot, axe, run, CMS, POP, EMPTY_D, t, focusDesc } from "./lib.mjs";
await run(async () => {
  for (const vp of ["1440","1280","1024","768","zoom200"]) {
    const { browser, context, page } = await open("curator", { viewport: vp });
    await go(page, `/projects/${POP}/dashboard`); await page.waitForTimeout(1500);
    await go(page, `/projects/${EMPTY_D}/dashboard`); await page.waitForTimeout(1500);
    await page.locator("header a[aria-label]").first().click(); await page.waitForTimeout(2500);
    await shot(page, "home__recent", vp);
    if (vp==="1440") {
      console.log("title", await page.title(), "focus", await focusDesc(page)); console.log((await t(page,"main")).slice(0,1500));
      await axe(page,"home");
      const s = page.getByPlaceholder("Search projects"); await s.fill("Ευ"); await page.waitForTimeout(600); await shot(page,"home__search-greek","1440"); console.log("greek search rows:", (await t(page,"main")).slice(0,300).replace(/\n+/g," | "));
      await s.fill("museotek"); await page.waitForTimeout(600); console.log("search 'museotek':", (await t(page,"main")).slice(0,400).replace(/\n+/g," | "));
      await s.fill("qqq"); await page.waitForTimeout(600); await shot(page,"home__no-results","1440"); console.log("none:", (await t(page,"main")).slice(0,300).replace(/\n+/g," | "));
    }
    await browser.close();
  }
});
