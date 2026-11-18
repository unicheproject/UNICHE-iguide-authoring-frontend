import { go, shot, POP, run, log, start, axe, box, focusDesc } from "./lib.mjs";
const vp = process.argv[2] || "1440"; const touch = process.argv[3] === "touch";
const create = process.argv[4] === "create";
await run(async () => {
  const { browser, page } = await start(vp, { touch });
  log("=== F1 plans list + new plan", vp, touch ? "touch" : "mouse");
  await go(page, `/projects/${POP}/floor-plans`); await page.waitForTimeout(2500);
  await shot(page, "plans-list__default", vp);
  log("list text", (await page.locator("main").innerText()).replace(/\n+/g, " | ").slice(0, 500));
  await axe(page, `plans list ${vp}`);
  await page.getByRole("button", { name: "New floor plan" }).first().click(); await page.waitForTimeout(900);
  log("new plan first focus", await focusDesc(page));
  const d = await page.evaluate(box('[role=dialog]')); log("dialog box", d);
  await shot(page, "new-plan__open", vp);
  await axe(page, `new plan dialog ${vp}`);
  // submit empty
  await page.getByRole("button", { name: "Create floor plan" }).click(); await page.waitForTimeout(600);
  log("empty submit", (await page.locator('[role=dialog]').innerText()).replace(/\n+/g, " | ").slice(0, 500), "dialog box", await page.evaluate(box('[role=dialog]')), "focus", await focusDesc(page));
  await shot(page, "new-plan__empty-submit", vp);
  if (create) {
    await page.locator("#fp-asset").click(); await page.waitForTimeout(2500);
    await shot(page, "new-plan__picker", vp);
    log("picker tiles", await page.locator('[role=dialog] [role=listbox] > *, [role=dialog] [data-asset-tile]').count());
    log("picker dialogs", await page.locator('[role=dialog]').count());
  }
  await browser.close();
});
