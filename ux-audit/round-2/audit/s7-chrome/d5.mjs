import { open, go, shot, run, POP, AP, problem, focusDesc, t } from "./lib.mjs";
await run(async () => {
  for (const vp of ["1440","768","zoom200"]) {
  const { browser, page } = await open("curator", { viewport: vp });
  await go(page, `/projects/${POP}/categories`); await page.waitForTimeout(2000);
  await page.getByPlaceholder(/search/i).first().fill("UX-R2-s7-chrome toast timing B"); await page.waitForTimeout(1200);
  await page.route(AP, (r) => (r.request().method()==="POST"||r.request().method()==="PUT"||r.request().method()==="PATCH") ? r.fulfill(problem(500,"INTERNAL_ERROR",{detail:"Something went wrong on our side while saving the thing."})) : r.continue());
  for (let i=0;i<4;i++) {
    const row = page.locator("tr, li, article").filter({ hasText: "UX-R2-s7-chrome toast timing B" }).first();
    await row.getByRole("button", { name: /actions|more/i }).click(); await page.waitForTimeout(300);
    await page.getByRole("menuitem", { name: /^Activate/ }).click(); await page.waitForTimeout(500);
    await page.locator("[role=dialog]").getByRole("button", { name: /^activate/i }).last().click(); await page.waitForTimeout(900);
    if (await page.locator("[role=dialog]").count()) { if (i===0) { await shot(page,"dialog__confirm-activate-refused",vp); console.log(vp,"dialog still open after 500:", (await t(page,"[role=dialog]")).slice(-300)); } await page.keyboard.press("Escape"); await page.waitForTimeout(300); }
  }
  console.log(vp, "toasts:", await page.evaluate(()=>[...document.querySelectorAll(".z-toast > div")].map(d=>d.getAttribute("role")+" "+d.innerText.replace(/\n/g," / "))));
  await shot(page,"toast__error-stack",vp);
  await browser.close(); }
});
