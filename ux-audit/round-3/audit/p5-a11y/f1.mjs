import * as H from "./h.mjs";
const log = H.LOG("f1");
const { browser, page } = await H.session();
try {
  // icon focus screenshot
  await H.go(page, H.P("/categories")); await page.getByRole("searchbox").fill("UX-R3-p5 Category"); await H.sleep(900);
  await page.getByRole("link", { name: "UX-R3-p5 Category" }).first().focus(); await page.keyboard.press("Enter"); await H.sleep(2200);
  await page.locator("input[name=cat-icon]").nth(2).focus(); await page.keyboard.press("ArrowRight"); await H.sleep(300);
  await page.locator("input[name=cat-icon]:focus").evaluate(e => e.scrollIntoView({ block: "center" })); await H.sleep(300);
  await H.shot(page, "category-editor__icon-focus__1440");
  const lab = page.locator("input[name=cat-icon]:focus").locator("xpath=ancestor::label[1]"); log("label ring", await lab.evaluate(e => { const cs = getComputedStyle(e); return cs.outline + " | has-focus-visible:" + e.matches(":has(:focus-visible)"); }));
  // Event
  await H.go(page, H.P("/events?create=1"));
  await page.waitForSelector("[role=dialog] input"); await H.sleep(800);
  log("event dialog", await page.evaluate(() => [...document.querySelectorAll("[role=dialog] input,[role=dialog] select,[role=dialog] button")].map(e => e.tagName + ":" + (e.labels?.[0]?.textContent.trim() || e.getAttribute("aria-label") || e.textContent.trim()).slice(0, 40))));
  await page.keyboard.type("UX-R3-p5 Event", { delay: 10 });
  await page.getByRole("button", { name: "Create and open" }).focus(); await H.press(page, "Enter", "create event", log, 2500);
  log(page.url(), JSON.stringify(await H.title(page)));
  log("headings", await page.evaluate(() => [...document.querySelectorAll("h1,h2,h3")].map(h => h.tagName + " " + h.textContent.trim().slice(0, 40))));
  await H.shot(page, "event-editor__new__1440");
  await H.snap(page, "event-editor", "main");
} finally { await browser.close(); }
