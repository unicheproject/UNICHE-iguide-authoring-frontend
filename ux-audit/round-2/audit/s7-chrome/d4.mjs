import { open, go, shot, run, POP, AP, problem, focusDesc, t } from "./lib.mjs";
await run(async () => {
  const { browser, page } = await open("curator", { viewport: "1440" });
  await go(page, `/projects/${POP}/categories`); await page.waitForTimeout(2000);
  await page.getByPlaceholder(/search/i).first().fill("UX-R2-s7-chrome toast timing A"); await page.waitForTimeout(1200);
  const row = page.locator("tr, li").filter({ hasText: "UX-R2-s7-chrome toast timing A" }).first();
  await row.getByRole("button", { name: /actions|more/i }).click(); await page.waitForTimeout(400);
  console.log(await t(page,"[role=menu]"));
  await shot(page,"rowmenu__category","1440");
  await page.getByRole("menuitem", { name: /^Activate/ }).click(); await page.waitForTimeout(600);
  console.log(await t(page,"[role=dialog]")); await shot(page,"dialog__confirm-activate","1440");
  await page.evaluate(()=>{ window.__ev=[]; const c=document.querySelector(".z-toast"); ["focusin","focusout","mouseenter","mouseleave"].forEach(e=>c.addEventListener(e,()=>window.__ev.push(e+"@"+Math.round(performance.now())),true)); });
  await page.locator("[role=dialog]").getByRole("button", { name: /^activate/i }).last().click();
  await page.waitForSelector(".z-toast > div"); const t0=Date.now();
  console.log("toast:", (await page.locator(".z-toast").innerText()).replace(/\n/g," / "), "role", await page.locator(".z-toast > div").first().getAttribute("role"));
  console.log("focus after confirm", await focusDesc(page));
  await shot(page,"toast__activated","1440");
  let n=0; for(;n<120;n++){ await page.keyboard.press("Shift+Tab"); if((await page.evaluate(()=>document.activeElement.getAttribute("aria-label")))==="Dismiss notification") break; }
  console.log("shift-tabs", n, "elapsed", Date.now()-t0);
  for(let i=0;i<10;i++){ await page.waitForTimeout(1000); console.log(" +"+(Date.now()-t0)+" count", await page.locator(".z-toast > div").count(), await page.evaluate(()=>JSON.stringify(window.__ev))); }
  await browser.close();
});
