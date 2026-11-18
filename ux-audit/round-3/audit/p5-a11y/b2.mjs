import * as H from "./h.mjs";
const log = H.LOG("b2");
const { browser, page } = await H.session();
try {
  await H.go(page, H.P("/pois")); 
  await page.getByRole("searchbox").fill("UX-R3-p5 POI A"); await H.sleep(900);
  await page.getByRole("link", { name: "UX-R3-p5 POI A" }).first().focus(); await H.press(page, "Enter", "open", log, 2000);
  const url = page.url();
  // English tab ring
  const tab = page.getByRole("tab", { name: /English/ }).or(page.getByRole("button", { name: /^English/ })).first();
  await tab.focus(); await page.keyboard.press("Shift+Tab"); await page.keyboard.press("Tab");
  log("lang tab", H.brief(await H.AE(page)), JSON.stringify(await H.chk(page)));
  const bb = await tab.boundingBox();
  await page.screenshot({ path: H.here + "/shots/poi-editor__lang-tab-focus__1440.png", clip: { x: bb.x - 30, y: bb.y - 20, width: 520, height: bb.height + 40 } });
  await page.screenshot({ path: H.here + "/shots/poi-editor__lang-tab-focus-full__1440.png" });
  // On this page link
  const l = page.getByRole("link", { name: /^Details/ }).first(); await l.focus();
  log("on this page", JSON.stringify(await H.chk(page)));
  await page.screenshot({ path: H.here + "/shots/poi-editor__onthispage-focus__1440.png" });
  log("tablist roles", await page.evaluate(() => [...document.querySelectorAll("[role=tablist],[role=tab]")].map(e => e.getAttribute("role") + ":" + e.textContent.trim().slice(0, 20))));
} finally { await browser.close(); }
