import { open, go, shot, POP, t, focusDesc, run, AxeBuilder, chromium } from "./lib.mjs";
await run(async () => {
  let { browser, context, page } = await open("curator", { viewport: "1280", forcedColors: "active" });
  await go(page, `/projects/${POP}/preview`); await page.waitForTimeout(1000);
  await page.screenshot({path:"shots/preview__forced-colors-tabs-zoom__1280.png", clip:{x:260,y:270,width:860,height:75}});
  await browser.close();
  for (const vp of ["1440","768"]) {
    ({ browser, context, page } = await open("curator", { viewport: vp }));
    const base = `/projects/${POP}/app-preview`;
    const cases = { default:"", mobile:"?surface=MOBILE", kiosk:"?surface=KIOSK&lang=el&mode=live", invalid:"?surface=TABLET&lang=xx&mode=foo", lower:"?surface=mobile" };
    for (const [k,q] of Object.entries(cases)) {
      await go(page, base+q); await page.waitForTimeout(1200);
      console.log(vp,k,"title:",await page.title(),"| url", page.url().replace(/.*app-preview/,""));
      console.log("   text:", (await t(page)).slice(0,330).replace(/\n+/g," | "));
      console.log("   widths", await page.evaluate(()=>({sw:document.documentElement.scrollWidth,cw:document.documentElement.clientWidth,sh:document.documentElement.scrollHeight,frame:document.querySelector("[data-preview-frame]")?.dataset.scale})));
      if (vp==="1440"||k==="default") await shot(page, `newtab__${k}`, vp, k==="kiosk");
    }
    await browser.close();
  }
  // QR auto-fire and missing project, 404
  ({ browser, context, page } = await open("curator", { viewport: "1280" }));
  await go(page, `/projects/${POP}/preview`); await page.waitForTimeout(1000);
  const [pop] = await Promise.all([context.waitForEvent("page"), page.getByRole("button",{name:"Open in new tab"}).click()]);
  await pop.waitForLoadState("networkidle").catch(()=>{}); await pop.waitForTimeout(1500);
  console.log("NEW TAB url", pop.url(), "title", await pop.title(), "opener?", await pop.evaluate(()=>!!window.opener));
  await pop.screenshot({path:"shots/newtab__from-button__1280.png"});
  await pop.close();
  // wrong surface-> opens with current state?
  await page.getByRole("tab",{name:"Mobile",exact:true}).click(); await page.getByRole("tab",{name:"Ελληνικά",exact:true}).click(); await page.getByRole("tab",{name:"Live",exact:true}).click();
  const [pop2] = await Promise.all([context.waitForEvent("page"), page.getByRole("button",{name:"Open in new tab"}).click()]);
  await pop2.waitForTimeout(1500); console.log("NEW TAB2 url", pop2.url(), "title", await pop2.title());
  await pop2.close();
  // missing project
  await go(page, `/projects/00000000-0000-0000-0000-000000000000/app-preview`); await page.waitForTimeout(1000);
  console.log("MISSING:", await page.title(), (await t(page)).slice(0,200).replace(/\n+/g," | ")); await shot(page,"newtab__missing-project","1280");
  await go(page, `/projects/${POP}/app-preview/nothing`); await page.waitForTimeout(800); console.log("SUB 404:", await page.title(), (await t(page)).slice(0,150).replace(/\n+/g," | "));
  await browser.close();
});
