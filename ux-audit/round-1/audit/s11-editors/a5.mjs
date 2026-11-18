import { start, goP, log, dump, state, focused } from "./lib.mjs";
const s = await start("1440"); const { page } = s;
await page.goto("http://localhost:5173" + state().routeUrl); await page.waitForTimeout(2000);
await page.getByRole("button", { name: /add stop/i }).click();
await page.waitForTimeout(500);
log("focus in picker:", await focused(page));
await page.keyboard.type("zzzz"); await page.waitForTimeout(500);
await s.shot("route-picker__no-match");
log("NOMATCH:", (await dump(page, "[role=dialog]")).slice(0,300));
await page.keyboard.press("Control+A"); await page.keyboard.type("UX-s11"); await page.waitForTimeout(500);
await s.shot("route-picker__search-ux-s11");
await page.locator("[role=dialog] li, [role=dialog] [role=option], [role=dialog] button").filter({ hasText: "Stop Alpha" }).first().click();
await page.waitForTimeout(800);
log("dialog still open:", await page.locator("[role=dialog]").count(), "focus:", await focused(page));
await s.shot("route-1-stop");

for (const n of ["Bravo","Charlie","Delta","Echo","Foxtrot"]) {
  await page.getByRole("button", { name: /add stop/i }).click(); await page.waitForTimeout(400);
  await page.keyboard.type("Stop " + n).catch(()=>{});
  await page.waitForTimeout(400);
  const cnt = await page.locator("[role=dialog]").getByText(new RegExp("Stop " + n)).count();
  log(n, "matches", cnt);
  await page.locator("[role=dialog]").getByText(new RegExp("Stop " + n)).first().click();
  await page.waitForTimeout(500);
}
await s.tall("route-6-stops-tall");
log(await dump(page));
await s.browser.close();
