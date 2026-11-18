import { open, go, shot, POP, t, run, axe, focusDesc } from "./lib.mjs";
await run(async () => {
  for (const vp of ["1440","768"]) {
  const { browser, page } = await open("admin", { viewport: vp });
  page.on("pageerror", (e) => console.log("PAGEERROR", e.message.slice(0,200)));
  await go(page, `/projects/${POP}/floor-plans`);
  await page.getByRole("button", { name: "New floor plan" }).click();
  await page.waitForTimeout(600);
  await shot(page, "new-plan__open", vp);
  console.log("focus", await focusDesc(page));
  await page.getByRole("button", { name: "Create floor plan" }).click().catch(async()=>console.log("buttons", await page.getByRole("dialog").getByRole("button").allInnerTexts()));
  await page.waitForTimeout(500);
  await shot(page, "new-plan__empty-submit", vp);
  console.log("errors", JSON.stringify(await page.getByRole("dialog").locator("[role=alert], .text-destructive").allInnerTexts()), "focus", await focusDesc(page));
  console.log("options", await page.locator("#fp-place option").allInnerTexts());
  if (vp==="1440") {
    await page.locator("#fp-asset").click();
    await page.waitForTimeout(1500);
    await shot(page, "new-plan__image-picker", vp);
    console.log("picker", (await t(page,"[role=dialog]:last-of-type")).slice(0,600));
    await axe(page,"new-plan-picker");
  }
  await browser.close();
  }
});
