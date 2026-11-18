import * as H from "./h.mjs";
import { openRoute } from "./lib3.mjs";
const log = H.LOG("c2");
const { browser, page } = await H.session();
try {
  await openRoute(page);
  await page.getByRole("button", { name: "Add stops" }).focus();
  await H.press(page, "Enter", "add stops", log, 1000);
  await H.shot(page, "route-stop-picker__open__1440");
  await H.snap(page, "stop-picker", "[role=dialog]");
  log("dlg", await page.evaluate(() => { const d = document.querySelector("[role=dialog]"); return { name: d.getAttribute("aria-label") || document.getElementById(d.getAttribute("aria-labelledby"))?.textContent, text: d.innerText.slice(0, 300) }; }));
  await page.keyboard.type("Parthenon", { delay: 10 }); await H.sleep(700);
  log("typed", H.brief(await H.AE(page)), JSON.stringify(await H.live(page)));
  for (const k of ["ArrowDown", "Enter", "ArrowDown", "Enter", "ArrowDown", "Enter"]) await H.press(page, k, "picker", log, 500);
  log("role listbox?", await page.evaluate(() => [...document.querySelectorAll("[role=dialog] [role=listbox],[role=dialog] [role=option]")].slice(0, 5).map(e => e.getAttribute("role") + ":" + e.getAttribute("aria-selected") + ":" + e.textContent.trim().slice(0, 30))));
  await H.shot(page, "route-stop-picker__picked__1440");
  const done = page.getByRole("button", { name: /Done|Add .* stop|Close|Add$/ }); log("footer btns", await page.evaluate(() => [...document.querySelectorAll("[role=dialog] button")].map(b => b.textContent.trim().slice(0, 30))));
} finally { await browser.close(); }
