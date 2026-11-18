import * as H from "./h.mjs";
import { openPoi } from "./lib2.mjs";
const log = H.LOG("b4");
const { browser, page } = await H.session();
try {
  await openPoi(page);
  await page.getByRole("button", { name: "Activate", exact: true }).focus();
  await H.press(page, "Enter", "activate open", log, 800);
  await H.shot(page, "poi-activate__confirm__1440");
  await H.snap(page, "poi-activate", "[role=dialog],[role=alertdialog]");
  log("dlg", await page.evaluate(() => { const d = document.querySelector("[role=alertdialog],[role=dialog]"); return { role: d.getAttribute("role"), name: d.getAttribute("aria-label") || document.getElementById(d.getAttribute("aria-labelledby"))?.textContent, desc: document.getElementById(d.getAttribute("aria-describedby"))?.textContent?.slice(0, 200), text: d.innerText.slice(0, 500) }; }));
  log("tabs:"); for (let i = 0; i < 6; i++) { const a = (await H.tab(page, 1))[0]; log(i, H.brief(a), H.flag(await H.chk(page))); }
  await H.axe(page, "poi-activate-dialog", log);
  await H.press(page, "Escape", "esc", log, 500);
  log("Activate regained?", await page.evaluate(() => document.activeElement.textContent.trim().slice(0, 30)));
  await page.getByRole("button", { name: "Activate", exact: true }).focus(); await page.keyboard.press("Enter"); await H.sleep(600);
  const rev = page.getByRole("button", { name: /Review in editor/i }).or(page.getByRole("link", { name: /Review in editor/i }));
  log("review btn count", await rev.count());
  await rev.first().focus(); await H.press(page, "Enter", "review in editor", log, 800);
  log("after review", JSON.stringify(await H.chk(page)), JSON.stringify(await H.title(page)));
  await H.shot(page, "poi-activate__after-review__1440");
} finally { await browser.close(); }
