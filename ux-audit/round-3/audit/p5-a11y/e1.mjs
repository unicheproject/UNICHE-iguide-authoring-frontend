import * as H from "./h.mjs";
const log = H.LOG("e1");
const { browser, page } = await H.session();
try {
  await H.go(page, H.P("/categories?create=1"));
  await page.waitForSelector("[role=dialog] input"); await H.sleep(800);
  log("dialog", await page.evaluate(() => [...document.querySelectorAll("[role=dialog] input,[role=dialog] select,[role=dialog] textarea,[role=dialog] button")].map(e => e.tagName + ":" + (e.labels?.[0]?.textContent.trim() || e.getAttribute("aria-label") || e.textContent.trim()).slice(0, 40))));
  await page.keyboard.type("UX-R3-p5 Category", { delay: 10 });
  await page.keyboard.press("Tab"); log("after title tab:", H.brief(await H.AE(page))); await page.keyboard.press("Space"); await H.sleep(200); log("checked:", await page.evaluate(()=>document.activeElement.checked)); const sel = page.locator("[role=dialog] select"); const n = await sel.count(); log("selects", n);
  if (n) { await sel.first().focus(); await page.keyboard.type("Poi"); log("applies:", await sel.first().inputValue()); }
  await page.getByRole("button", { name: /Create/ }).last().focus(); await H.press(page, "Enter", "create category", log, 2500);
  log(page.url(), JSON.stringify(await H.title(page)));
  log("headings", await page.evaluate(() => [...document.querySelectorAll("h1,h2,h3")].map(h => h.tagName + " " + h.textContent.trim().slice(0, 40))));
  await H.snap(page, "category-editor", "main");
  await H.shot(page, "category-editor__new__1440");
  log("radios", await page.evaluate(() => [...document.querySelectorAll("[role=radiogroup],[role=radio],input[type=radio]")].slice(0, 6).map(e => e.tagName + ":" + e.getAttribute("role") + ":" + (e.getAttribute("aria-label") || e.getAttribute("name") || "").slice(0, 40))));
} finally { await browser.close(); }
