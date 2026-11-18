import * as H from "./h.mjs";
const log = H.LOG("d1");
const { browser, page } = await H.session();
try {
  await H.go(page, H.P("/guides?create=1"));
  await page.waitForSelector("[role=dialog] input"); await H.sleep(800);
  log("dialog fields", await page.evaluate(() => [...document.querySelectorAll("[role=dialog] input,[role=dialog] select,[role=dialog] textarea")].map(e => e.tagName + ":" + (e.labels?.[0]?.textContent.trim() || e.getAttribute("aria-label")).slice(0, 40))));
  await page.keyboard.type("UX-R3-p5 Guide", { delay: 10 });
  await page.getByRole("button", { name: "Create and open" }).focus(); await H.press(page, "Enter", "create guide", log, 2500);
  log(page.url(), JSON.stringify(await H.title(page)));
  log("headings", await page.evaluate(() => [...document.querySelectorAll("h1,h2,h3")].map(h => h.tagName + " " + h.textContent.trim().slice(0, 40))));
  log("buttons", await page.evaluate(() => [...document.querySelectorAll("main button")].map(b => (b.getAttribute("aria-label") || b.textContent.trim()).slice(0, 50))));
  await H.shot(page, "guide-editor__new__1440");
} finally { await browser.close(); }
