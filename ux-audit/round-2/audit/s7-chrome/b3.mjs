import { open, go, shot, axe, t, run, CMS, POP, AP, problem, focusDesc } from "./lib.mjs";
await run(async () => {
  const { browser, context, page } = await open("curator", { viewport: "1440" });
  const cases = [[403,"PROJECT_ACCESS_DENIED"],[404,"PROJECT_NOT_FOUND"],[500,"INTERNAL_ERROR"],[502,"BAD_GATEWAY"],[503,"CATALOGUE_UNAVAILABLE"],[504,"GATEWAY_TIMEOUT"]];
  for (const [st,code] of cases) {
    await page.unroute(AP).catch(()=>{});
    await page.route(AP, (r) => { const u=r.request().url(); if (new RegExp(`/projects/${POP}$`).test(u.split("?")[0]) && r.request().method()==="GET") return r.fulfill(problem(st, code)); return r.continue(); });
    await page.goto(CMS+`/projects/${POP}/dashboard`); await page.waitForLoadState("networkidle").catch(()=>{}); await page.waitForTimeout(1500);
    console.log("=====",st, "title:", await page.title(), "| focus:", await focusDesc(page));
    console.log(await t(page,"main, body"));
    await shot(page, `error__${st}`, "1440");
    if (st===403||st===503) await axe(page, "err"+st);
  }
  await browser.close();
});
