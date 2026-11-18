import { open, go, shot, POP, t, run, axe, AP } from "./lib.mjs";
await run(async () => {
  for (const vp of ["1440","1024","768","zoom200"]) {
    const { browser, page } = await open("admin", { viewport: vp });
    page.on("pageerror", (e) => console.log("PAGEERROR", e.message.slice(0,200)));
    await go(page, `/projects/${POP}/maps`);
    await page.waitForTimeout(1200);
    await shot(page, "maps-list__default", vp, true);
    if (vp==="1440") {
      console.log((await t(page,"main")).slice(0,2500));
      const tabs = await page.locator('[role=tab], nav a, a[aria-current]').allInnerTexts(); console.log("TABS", tabs.slice(0,30));
      await axe(page, "maps-list");
    }
    await go(page, `/projects/${POP}/floor-plans`);
    await page.waitForTimeout(1200);
    await shot(page, "plans-list__default", vp, true);
    if (vp==="1440") { console.log((await t(page,"main")).slice(0,3500)); await axe(page,"plans-list"); }
    await browser.close();
  }
});
