import { open, go, freshCtx, shot, axe, run, CMS, POP, AP, t, focusDesc } from "./lib.mjs";
await run(async () => {
  // IdP unreachable
  for (const vp of ["1440","zoom200"]) {
    const { browser, context, page } = await freshCtx(vp);
    await context.route(/idp\.uniche-eccch\.eu/, (r) => r.abort("connectionrefused"));
    await page.goto(CMS + "/"); await page.waitForLoadState("networkidle").catch(()=>{}); await page.waitForTimeout(4000);
    await shot(page, "session-unreachable__idp-down", vp);
    if (vp==="1440") { console.log(await t(page)); console.log("title", await page.title()); await axe(page,"idp-down"); }
    await browser.close();
  }
  // offline banner + layout shift
  for (const vp of ["1440","768","zoom200"]) {
    const { browser, context, page } = await open("curator", { viewport: vp });
    await go(page, `/projects/${POP}/places`); await page.waitForTimeout(2500);
    const before = await page.evaluate(()=>({ main: document.querySelector("main")?.getBoundingClientRect().top, h1: document.querySelector("h1")?.getBoundingClientRect().top }));
    await context.setOffline(true);
    await page.evaluate(()=>window.dispatchEvent(new Event("offline")));
    await page.waitForTimeout(800);
    const after = await page.evaluate(()=>({ main: document.querySelector("main")?.getBoundingClientRect().top, h1: document.querySelector("h1")?.getBoundingClientRect().top, banner: document.querySelector("[role=alert]")?.innerText }));
    console.log(vp, "h1 top before/after", before.h1, after.h1, "| banner:", JSON.stringify(after.banner));
    await shot(page, "offline__banner", vp);
    if (vp==="1440") {
      await axe(page,"offline");
      // try a mutating action offline: New place
      await page.getByRole("button",{name:/new place/i}).click().catch(()=>{}); await page.waitForTimeout(600);
      console.log("new place dialog while offline:", await page.locator("[role=dialog]").count()); await shot(page,"offline__new-place-click","1440");
      await page.keyboard.press("Escape");
      // Check again while offline
      await page.getByRole("button",{name:/check again/i}).click(); await page.waitForTimeout(1200); console.log("still banner after check again (offline):", await page.locator("[role=alert]").count());
      await context.setOffline(false); await page.evaluate(()=>window.dispatchEvent(new Event("online"))); await page.waitForTimeout(2000); console.log("banner after back online:", await page.locator("text=You are offline").count());
    }
    await browser.close();
  }
});
