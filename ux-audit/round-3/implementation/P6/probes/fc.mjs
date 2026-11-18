import { go, shot, POP, PLAN, run, log, start } from "./lib.mjs";
await run(async () => {
  const { browser, page } = await start("1024", { forcedColors: "active" });
  await go(page, `/projects/${POP}/floor-plans/${PLAN}`); await page.waitForTimeout(2500);
  await page.getByRole("button", { name: /^Place / }).first().click(); await page.waitForTimeout(700);
  await shot(page, "plan-editor__armed-forced-colours", "1024");
  log("fc shot ok");
  await browser.close();
});
