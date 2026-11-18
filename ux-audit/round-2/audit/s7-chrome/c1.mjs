import { open, go, shot, axe, t, run, CMS, POP, AP, focusDesc } from "./lib.mjs";
await run(async () => {
  for (const vp of ["1280","1024","768","zoom200"]) {
    const { browser, page } = await open("curator", { viewport: vp });
    await go(page, `/projects/${POP}/places`); await page.waitForTimeout(2500);
    await shot(page, "chrome__places", vp);
    const menu = page.getByRole("button", { name: "Menu" });
    if (await menu.isVisible().catch(()=>false)) {
      await menu.click(); await page.waitForTimeout(500); await shot(page, "chrome__drawer-open", vp);
      console.log(vp, "drawer focus", await focusDesc(page), "| aria-modal", await page.locator("#workspace-nav").getAttribute("aria-modal"));
      if (vp==="768") { await axe(page,"drawer"); 
        await page.keyboard.press("Tab"); const f1=await focusDesc(page); for(let i=0;i<30;i++) await page.keyboard.press("Tab"); console.log("after 31 tabs in open drawer", await focusDesc(page), "first tab", f1);
      }
      await page.keyboard.press("Escape"); await page.waitForTimeout(300); console.log(vp, "after Esc focus", await focusDesc(page));
    } else console.log(vp, "no menu button");
    await browser.close();
  }
  // OFF capabilities via mocked settings
  for (const vp of ["1440","768"]) {
    const { browser, page } = await open("curator", { viewport: vp });
    await page.route(new RegExp(`/projects/${POP}/(app-)?settings`), async (r) => { if (r.request().method()!=="GET") return r.continue(); const res = await r.fetch(); let j; try { j = await res.json(); } catch { return r.fulfill({response:res}); } console.log("settings keys", Object.keys(j).join(",")); j.capabilities = (j.capabilities||[]).filter(c=>!["MAPS","FLOOR_PLANS","ROUTES"].includes(c)); j.featureConfiguration = { ...(j.featureConfiguration||{}), EVENTS:false, GUIDES:false }; r.fulfill({ response: res, json: j }); });
    await go(page, `/projects/${POP}/events`); await page.waitForTimeout(2500);
    await shot(page, "nav__off-capabilities-events", vp);
    if (vp==="1440") console.log((await t(page,"#workspace-nav")).slice(0,500), "\n---MAIN HEAD\n", (await t(page,"main")).slice(0,500));
    await browser.close();
  }
});
