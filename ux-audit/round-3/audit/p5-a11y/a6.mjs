import * as H from "./h.mjs";
const log = H.LOG("a6");
const { browser, page } = await H.session();
try {
  await H.go(page, H.P("/pois"));
  await page.getByRole("button", { name: "New point of interest" }).focus();
  await page.keyboard.press("Tab"); await page.keyboard.press("Shift+Tab");
  const info = await page.evaluate(() => { const a = document.activeElement; const cs = getComputedStyle(a); return { outline: cs.outline, offset: cs.outlineOffset, shadow: cs.boxShadow, bg: cs.backgroundColor, focusVisible: a.matches(":focus-visible"), cls: a.className.slice(0, 300) }; });
  log("primary btn focus", info);
  const r = await page.getByRole("button", { name: "New point of interest" }).boundingBox();
  await page.screenshot({ path: H.here + "/shots/focus__primary-button-on-canvas__1440.png", clip: { x: r.x - 20, y: r.y - 20, width: r.width + 40, height: r.height + 40 } });
  await page.keyboard.press("Enter"); await H.sleep(500);
  await page.getByRole("button", { name: "Create and open" }).focus();
  const r2 = await page.getByRole("button", { name: "Create and open" }).boundingBox();
  log("dialog primary", await page.evaluate(() => { const cs = getComputedStyle(document.activeElement); return { outline: cs.outline, offset: cs.outlineOffset, shadow: cs.boxShadow, fv: document.activeElement.matches(":focus-visible") }; }));
  await page.screenshot({ path: H.here + "/shots/focus__primary-button-in-dialog__1440.png", clip: { x: r2.x - 60, y: r2.y - 20, width: r2.width + 80, height: r2.height + 40 } });
  // all variants on one page: scan every focusable on a few screens for ring vs outside contrast
} finally { await browser.close(); }
