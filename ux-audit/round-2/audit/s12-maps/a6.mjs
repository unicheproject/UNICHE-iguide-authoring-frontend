import { open, go, shot, POP, t, run, axe, focusDesc } from "./lib.mjs";
const MAP = "f8daa876-f2af-4552-95ae-431c96ed1b2d";
await run(async () => {
  const { browser, page } = await open("admin", { viewport: "1440" });
  page.on("pageerror", (e) => console.log("PAGEERROR", e.message.slice(0,200)));
  await go(page, `/projects/${POP}/maps/${MAP}`);
  await page.waitForTimeout(2500);
  for (const v of ["abc","999","12,5"]) {
    await page.locator("#f-minLatitude").fill(v);
    await page.locator("#f-minLatitude").blur();
    await page.getByRole("button", { name: "Save", exact: true }).click();
    await page.waitForTimeout(1500);
    console.log("SAVE", v, "alerts", JSON.stringify(await page.locator("[role=alert]").allInnerTexts()), "focus", await focusDesc(page));
    console.log(" errs", JSON.stringify(await page.locator("main .text-destructive, main [id$=error]").allInnerTexts()));
    await shot(page, "map-editor__save-"+v.replace(",","c"), "1440");
  }
  // 12,5 as min lat > max lat -> likely 422 or warning
  await browser.close();
});
