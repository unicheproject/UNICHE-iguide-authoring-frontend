import * as H from "./h.mjs";
const log = H.LOG("v1");
const { browser, page } = await H.session();
try {
  await H.go(page, "/"); await H.sleep(1000);
  await page.getByRole("searchbox").focus();
  await page.keyboard.type("audit", { delay: 20 }); await H.sleep(700);
  log("typed", JSON.stringify(await H.live(page)), H.brief(await H.AE(page)));
  for (const k of ["ArrowDown", "ArrowDown", "ArrowUp", "ArrowUp"]) await H.press(page, k, "home list", log, 250);
  await H.shot(page, "home__search-arrows__1440");
  await page.keyboard.press("Escape"); log("esc value:", await page.evaluate(() => document.activeElement.value || "(empty)"));
  await page.keyboard.type("zzzzqq", { delay: 10 }); await H.sleep(700); log("no results:", JSON.stringify(await H.live(page)), await page.evaluate(() => document.querySelector("main").innerText.slice(150, 400)));
  await H.shot(page, "home__search-empty__1440");
  await H.axe(page, "home-empty-search", log);
  await page.keyboard.press("Control+a"); await page.keyboard.type("UX Audit – Populated"); await H.sleep(600);
  await page.keyboard.press("ArrowDown"); await H.press(page, "Enter", "open project from home", log, 1500);
  log("land", JSON.stringify(await H.title(page)));
} finally { await browser.close(); }
