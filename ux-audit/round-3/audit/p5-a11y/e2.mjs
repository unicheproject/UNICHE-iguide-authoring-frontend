import * as H from "./h.mjs";
const log = H.LOG("e2");
const { browser, page } = await H.session();
try {
  await H.go(page, H.P("/categories")); await page.getByRole("searchbox").fill("UX-R3-p5 Category"); await H.sleep(900);
  await page.getByRole("link", { name: "UX-R3-p5 Category" }).first().focus(); await page.keyboard.press("Enter"); await H.sleep(2200);
  const g = page.getByRole("radiogroup", { name: /Icon/ }).or(page.getByRole("group", { name: "Icon" })).first();
  log("group", await g.evaluate(e => e.outerHTML.slice(0, 300)));
  const radios = g.getByRole("radio"); log("radio count", await radios.count());
  await radios.first().focus(); log("first", H.brief(await H.AE(page)));
  // Tab count within group
  const before = await H.AE(page);
  await page.keyboard.press("Tab"); log("Tab from first radio ->", H.brief(await H.AE(page)));
  await page.keyboard.press("Shift+Tab");
  for (const k of ["ArrowRight", "ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp", "End", "Home"]) { await H.press(page, k, "icon", log, 350); log("   checked idx:", await page.evaluate(() => [...document.querySelectorAll("input[name=cat-icon]")].findIndex(i => i.checked)), "tabbable:", await page.evaluate(() => [...document.querySelectorAll("input[name=cat-icon]")].filter(i => i.tabIndex === 0).length)); }
  log("ring (label wrapper)", JSON.stringify(await H.chk(page)));
  await H.shot(page, "category-editor__icon-focus__1440");
  log("live", JSON.stringify(await H.live(page)));
  await H.axe(page, "category-editor", log);
} finally { await browser.close(); }
