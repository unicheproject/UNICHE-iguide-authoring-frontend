import { open, go, freshCtx, shot, run, CMS, POP, t, focusDesc } from "./lib.mjs";
await run(async () => {
  { const { browser, context, page } = await freshCtx("1440");
    await context.route(/idp\.uniche-eccch\.eu/, (r) => r.abort("connectionrefused"));
    await page.goto(CMS + "/"); const t0=Date.now();
    for (let i=0;i<8;i++){ await page.waitForTimeout(5000); console.log("idp-down +"+(Date.now()-t0)+"ms:", (await t(page)).replace(/\n+/g," | ").slice(0,160)); if(!/Checking/.test(await t(page))) break; }
    await shot(page,"session-unreachable__idp-down-40s","1440"); await browser.close(); }
  { const { browser, context, page } = await open("curator", { viewport: "1440" });
    await go(page, `/projects/${POP}/places`); await page.waitForTimeout(2500);
    await context.setOffline(true); await page.evaluate(()=>window.dispatchEvent(new Event("offline"))); await page.waitForTimeout(600);
    const vis = () => page.evaluate(()=>[...document.querySelectorAll("[role=alert]")].filter(e=>e.offsetHeight>0).map(e=>e.innerText.slice(0,30)));
    console.log("offline visible alerts", JSON.stringify(await vis()));
    // mutate offline: Place row action
    await page.getByRole("button",{name:/new place/i}).click(); await page.waitForTimeout(500);
    console.log((await t(page,"[role=dialog]")).slice(0,200)); await shot(page,"offline__create-dialog-open","1440");
    await page.locator("[role=dialog] input").first().fill("UX-R2-s7-chrome offline test"); 
    const btns = await page.locator("[role=dialog] button").allInnerTexts(); console.log("dialog buttons", btns);
    await page.getByRole("button",{name:/^create/i}).last().click(); await page.waitForTimeout(900);
    console.log("after submit offline:", (await t(page,"[role=dialog]")).replace(/\n+/g," | ").slice(0,400)); await shot(page,"offline__create-submit","1440");
    await page.keyboard.press("Escape");
    await context.setOffline(false); await page.waitForTimeout(500);
    await page.getByRole("button",{name:/check again/i}).click(); await page.waitForTimeout(2500);
    console.log("after Check again online, visible alerts", JSON.stringify(await vis())); 
    await browser.close(); }
});
