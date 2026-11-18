import { open, go, shot, axe, t, run, CMS, POP, AP, problem, focusDesc } from "./lib.mjs";
await run(async () => {
  for (const vp of ["1440","768","zoom200"]) {
    const { browser, context, page } = await open("curator", { viewport: vp });
    await go(page, `/projects/${POP}/dashboard`); await page.waitForTimeout(1200);
    await page.route(AP, (r) => r.fulfill(problem(401, "UNAUTHENTICATED")));
    await page.getByRole("link", { name: /^Places/ }).first().click().catch(async()=>{ await page.getByRole("button",{name:/menu/i}).click(); await page.getByRole("link",{name:/^Places/}).first().click(); });
    await page.waitForSelector("[role=dialog]", { timeout: 8000 });
    await page.waitForTimeout(400);
    await shot(page, "session-ended__dialog", vp);
    if (vp === "1440") {
      console.log("focus", await focusDesc(page)); console.log(await t(page,"[role=dialog]"));
      console.log("dialog attrs", await page.evaluate(()=>{const d=document.querySelector("[role=dialog]");return d.outerHTML.slice(0,300)}));
      await page.keyboard.press("Escape"); await page.waitForTimeout(300); console.log("after Esc dialog count", await page.locator("[role=dialog]").count());
      for (let i=0;i<3;i++){ await page.keyboard.press("Tab"); console.log("tab", await focusDesc(page)); }
      await axe(page, "session-ended");
      // background inert?
      console.log("bg main inert/aria-hidden", await page.evaluate(()=>{const m=document.querySelector("main");return m? (m.closest("[inert]")?"inert":m.closest("[aria-hidden=true]")?"aria-hidden":"none"):"nomain"}));
    }
    await browser.close();
  }
  // session loop
  for (const vp of ["1440","zoom200"]) {
    const { browser, context, page } = await open("curator", { viewport: vp });
    await go(page, `/projects/${POP}/dashboard`); await page.waitForTimeout(1200);
    await page.evaluate(()=>sessionStorage.setItem("iguide.signInRedirectAt", String(Date.now())));
    await page.route(AP, (r) => r.fulfill(problem(401, "UNAUTHENTICATED")));
    await page.getByRole("link", { name: /^Places/ }).first().click().catch(async()=>{ await page.getByRole("button",{name:/menu/i}).click(); await page.getByRole("link",{name:/^Places/}).first().click(); });
    await page.waitForTimeout(2000);
    await shot(page, "session-loop__page", vp);
    if (vp==="1440"){ console.log(await t(page)); console.log("title", await page.title()); await axe(page,"session-loop"); console.log("dialogs", await page.locator("[role=dialog]").count());}
    await browser.close();
  }
});
