import { open, go, shot, axe, run, CMS, POP, t, focusDesc } from "./lib.mjs";
await run(async () => {
  for (const vp of ["1440","zoom200"]) {
    const { browser, page } = await open("curator", { viewport: vp });
    await go(page, `/projects/${POP}/dashboard`); await page.waitForTimeout(2500);
    const um = page.locator("header button").last(); console.log(vp,"user btn:", await um.evaluate(e=>e.outerHTML.slice(0,160)));
    await um.focus(); await page.keyboard.press("Enter"); await page.waitForTimeout(500);
    await shot(page,"usermenu__open",vp); console.log(vp,"menu focus", await focusDesc(page)); console.log((await t(page,"[role=menu]")));
    if (vp==="1440") await axe(page,"usermenu");
    await page.keyboard.press("ArrowDown"); console.log("ArrowDown ->", await focusDesc(page)); await page.keyboard.press("Escape"); await page.waitForTimeout(300); console.log("Esc focus", await focusDesc(page));
    await browser.close();
  }
});
