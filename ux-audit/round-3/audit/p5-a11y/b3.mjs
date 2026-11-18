import * as H from "./h.mjs";
import { openPoi } from "./lib2.mjs";
const log = H.LOG("b3");
const { browser, page } = await H.session();
try {
  await openPoi(page);
  // edit title: focus title textarea
  const title = page.getByLabel("Title", { exact: false }).first(); await title.focus();
  await page.keyboard.press("End"); await page.keyboard.type(" – Parthenon test", { delay: 8 }); await H.sleep(500);
  log("after typing", JSON.stringify(await H.live(page)));
  log("state line", await page.evaluate(() => [...document.querySelectorAll("[role=status]")].map(e => e.id + ":" + e.textContent.trim().slice(0, 80))));
  await H.shot(page, "poi-editor__dirty__1440");
  await page.keyboard.press("Control+s"); await H.sleep(1800);
  log("ctrl+s", H.brief(await H.AE(page)), JSON.stringify(await H.live(page)));
  await H.shot(page, "poi-editor__saved__1440");
  log("state line after", await page.evaluate(() => [...document.querySelectorAll("[role=status]")].map(e => e.textContent.trim().slice(0, 100))));
  // language tabs
  await page.getByRole("tab", { name: /English/ }).focus();
  for (const k of ["ArrowRight", "ArrowRight", "ArrowRight", "ArrowLeft", "End", "Home"]) { await H.press(page, k, "langtab", log, 500); log("   tabpanel/selected:", await page.evaluate(() => [...document.querySelectorAll("[role=tab]")].map(t => t.getAttribute("aria-selected") + "/" + t.tabIndex).join(" "))); }
  await page.keyboard.press("ArrowRight"); await H.sleep(500);
  log("tab Greek focus chk", JSON.stringify(await H.chk(page)));
  await H.shot(page, "poi-editor__greek-tab__1440");
  await H.snap(page, "poi-editor-greek", "main");
  log("tab key from tab ->", (await H.tab(page, 1)).map(H.brief));
  // Copy source
  const copy = page.getByRole("button", { name: /copy/i }); log("copy buttons", await copy.allTextContents());
  if (await copy.count()) { await copy.first().focus(); await H.press(page, "Enter", "copy source", log, 700); }
  // next missing
  await page.getByRole("button", { name: /Next missing/ }).focus();
  await H.press(page, "Enter", "next missing", log, 900);
  log("after next missing", JSON.stringify(await H.chk(page)));
  await H.shot(page, "poi-editor__next-missing__1440");
} finally { await browser.close(); }
