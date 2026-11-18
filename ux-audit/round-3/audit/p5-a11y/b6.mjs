import * as H from "./h.mjs";
import { openPoi } from "./lib2.mjs";
const log = H.LOG("b6");
const { browser, page } = await H.session();
try {
  await openPoi(page);
  await page.getByRole("button", { name: /position on the map/ }).first().focus(); await page.keyboard.press("Enter"); await H.sleep(1200);
  const g = page.getByRole("group", { name: /Site map/ }).first();
  const gname = await g.getAttribute("aria-label"); log("group label:", gname);
  await g.focus(); await H.shot(page, "poi-editor__pin-group-focus__1440");
  log("group chk", JSON.stringify(await H.chk(page)));
  const lat = page.locator("#f-lat"), lng = page.locator("#f-lng");
  log("before", await lat.inputValue(), await lng.inputValue());
  for (const k of ["ArrowUp", "ArrowRight", "Shift+ArrowDown", "ArrowLeft", "+", "-"]) { await H.press(page, k, "pin", log, 400); log("   ->", await lat.inputValue(), await lng.inputValue()); }
  await H.press(page, "Escape", "pin esc", log, 300);
  await H.shot(page, "poi-editor__pin-moved__1440");
  // skip map
  await page.keyboard.press("Shift+Tab"); log("shift-tab from group:", H.brief(await H.AE(page)));
  await H.press(page, "Enter", "skip map", log, 400);
  log("axe w/ map open"); await H.axe(page, "poi-editor-map-open", log);
  await H.press(page, "Control+s", "save", log, 1800);
} finally { await browser.close(); }
