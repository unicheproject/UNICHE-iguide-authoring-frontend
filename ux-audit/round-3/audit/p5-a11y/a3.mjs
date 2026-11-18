import * as H from "./h.mjs";
const log = H.LOG("a3");
const { browser, page } = await H.session();
try {
  await H.go(page, H.P("/pois"));
  await H.snap(page, "x");
  const ax = await H.axe(page, "poi-list-default", log);
  // `/` from h1
  await page.evaluate(() => document.querySelector("h1").focus());
  await H.press(page, "/", "slash from h1", log);
  await page.keyboard.type("Parthenon", { delay: 15 }); await H.sleep(900);
  log("search typed", JSON.stringify(await H.live(page)));
  await H.shot(page, "poi-list__search__1440");
  // slash while in input should type "/"
  await page.keyboard.press("/"); log("slash in input value:", await page.evaluate(() => document.activeElement.value));
  await page.keyboard.press("Backspace");
  await page.keyboard.press("Control+a"); await page.keyboard.press("Backspace"); await H.sleep(700);
  log(JSON.stringify(await H.live(page)));
  // segments
  await H.tab(page, 1); log("after search ->", H.brief(await H.AE(page)), JSON.stringify(await H.ring(page)));
  await H.shot(page, "poi-list__segment-focus__1440");
  for (const k of ["ArrowRight", "ArrowRight", "ArrowLeft", "End", "Home"]) await H.press(page, k, "segment", log, 700);
  log("segment snapshot", await page.locator("[role=radiogroup],group, fieldset").first().evaluate(e => e.outerHTML.slice(0, 600)).catch(()=>"none"));
  // Tab leaves group to Filters
  await H.tab(page, 1); log("next", H.brief(await H.AE(page)));
  await H.press(page, "Enter", "open filters", log, 500);
  await H.shot(page, "poi-list__filters-open__1440");
  log("popover", await page.evaluate(() => { const d = document.querySelector("[role=dialog],[role=menu],[data-reka-popper-content-wrapper] > *"); return d ? { role: d.getAttribute("role"), name: d.getAttribute("aria-label") || d.getAttribute("aria-labelledby"), html: d.outerHTML.slice(0, 200) } : null; }));
  await H.snap(page, "poi-filters", "[role=dialog],[data-reka-popper-content-wrapper]");
  for (let i = 0; i < 14; i++) { const a = (await H.tab(page, 1))[0]; log(" filters tab", i, H.brief(a), JSON.stringify(await H.ring(page))); }
  await H.axe(page, "poi-filters-open", log);
  await H.press(page, "Escape", "esc filters", log, 400);
  log("ring on Filters btn", JSON.stringify(await H.ring(page)));
} finally { await browser.close(); }
