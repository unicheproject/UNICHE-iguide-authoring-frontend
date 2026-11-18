import * as H from "./h.mjs";
const log = H.LOG("h1");
const ids = JSON.parse((await import("node:fs")).readFileSync(H.here + "/ids.json", "utf8"));
const { browser, page } = await H.session();
try {
  await H.go(page, H.P("/pois/" + ids.poi)); await H.sleep(800);
  await page.getByRole("button", { name: /Add Primary image/ }).focus(); await H.press(page, "Enter", "open picker", log, 1500);
  await H.shot(page, "asset-picker__open__1440");
  await H.snap(page, "asset-picker", "[role=dialog]");
  log("dlg", await page.evaluate(() => { const d = document.querySelector("[role=dialog]"); return { name: d.getAttribute("aria-label") || document.getElementById(d.getAttribute("aria-labelledby"))?.textContent, modal: d.getAttribute("aria-modal"), text: d.innerText.slice(0, 250) }; }));
  await page.keyboard.press("Tab"); await page.keyboard.press("Tab"); await page.keyboard.press("Tab"); log("on first tile?", H.brief(await H.AE(page)));
  for (const k of ["ArrowRight", "ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp", "End", "Home"]) await H.press(page, k, "tiles", log, 300);
  log("tile attrs", await page.evaluate(() => { const a = document.activeElement; return { role: a.getAttribute("role"), pressed: a.getAttribute("aria-pressed"), checked: a.getAttribute("aria-checked"), selected: a.getAttribute("aria-selected"), tabindex: a.tabIndex, name: a.getAttribute("aria-label") || a.textContent.trim().slice(0, 100) }; }));
  await H.press(page, "ArrowRight", "to second", log, 300);
  await H.press(page, "Space", "select", log, 500);
  log("selected state", await page.evaluate(() => { const a = document.activeElement; return { pressed: a.getAttribute("aria-pressed"), checked: a.getAttribute("aria-checked"), cls: a.className.slice(0,80) }; }), JSON.stringify(await H.live(page)));
  await H.shot(page, "asset-picker__selected__1440");
  log("ring", JSON.stringify(await H.chk(page)));
  await page.getByRole("button", { name: /^Use this image/ }).focus(); await H.press(page, "Enter", "use image", log, 1500);
  log("after attach", JSON.stringify(await H.chk(page)));
  await H.shot(page, "poi-editor__image-attached__1440");
  await H.axe(page, "asset-picker", log);
} finally { await browser.close(); }
