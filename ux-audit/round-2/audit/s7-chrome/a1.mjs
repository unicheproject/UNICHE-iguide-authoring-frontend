import { freshCtx, shot, axe, t, run, CMS } from "./lib.mjs";
await run(async () => {
  for (const vp of ["1440","1024","768","zoom200"]) {
    const { browser, page } = await freshCtx(vp);
    await page.goto(CMS + "/"); await page.waitForTimeout(150);
    if (vp==="1440") await shot(page, "signin__splash-early", vp);
    await page.waitForLoadState("networkidle").catch(()=>{}); await page.waitForTimeout(800);
    await shot(page, "signin__view", vp, true);
    if (vp==="1440") { console.log(await t(page)); await axe(page, "signin");
      const tabs=[]; for (let i=0;i<5;i++){ await page.keyboard.press("Tab"); tabs.push(await page.evaluate(()=>{const e=document.activeElement;return e.tagName+":"+(e.textContent||"").trim().slice(0,40)})); } console.log("TAB", tabs.join(" | "));
      await shot(page, "signin__focus", vp);
      console.log("title", await page.title());
      console.log(await page.evaluate(()=>document.body.innerHTML.length));
    }
    await browser.close();
  }
  const { browser, page } = await freshCtx("1440", { forcedColors: "active" });
  await page.goto(CMS + "/"); await page.waitForLoadState("networkidle").catch(()=>{}); await page.waitForTimeout(800);
  await shot(page, "signin__view-forced", "1440"); await browser.close();
});
