import * as H from "./h.mjs";
const log = H.LOG("b1");
const { browser, page } = await H.session();
try {
  await H.go(page, H.P("/pois?create=1"));
  await page.waitForSelector("[role=dialog] input"); await H.sleep(800);
  await page.keyboard.type("UX-R3-p5 POI A", { delay: 10 });
  await H.press(page, "Enter", "create submit", log, 2500);
  log("editor", page.url(), JSON.stringify(await H.title(page)), H.brief(await H.AE(page)));
  await H.shot(page, "poi-editor__new__1440");
  await H.snap(page, "poi-editor");
  await H.axe(page, "poi-editor-new", log);
  // landmark + heading outline
  log("headings", await page.evaluate(() => [...document.querySelectorAll("h1,h2,h3,h4")].map(h => h.tagName + " " + h.textContent.trim().slice(0, 40))));
  log("landmarks", await page.evaluate(() => [...document.querySelectorAll("header,nav,main,aside,section[aria-label],section[aria-labelledby],form,[role=region],[role=search]")].map(e => e.tagName.toLowerCase() + "[" + (e.getAttribute("aria-label") || e.getAttribute("aria-labelledby") || "") + "]")));
  await page.evaluate(() => document.querySelector("h1").focus());
  const lines = await H.sweep(page, 70, "poi-editor", log);
  log(lines.join(" | "));
} finally { await browser.close(); }
