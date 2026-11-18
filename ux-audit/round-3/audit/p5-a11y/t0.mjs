import * as H from "./h.mjs";
const log = H.LOG("t0");
const { browser, page } = await H.session();
try {
  await H.go(page, "/");
  log("home", await H.title(page), await H.AE(page));
  await H.shot(page, "home__load__1440");
  await H.snap(page, "home");
  log(await page.evaluate(() => [...document.querySelectorAll("[aria-live],[role=status],[role=alert]")].map(e => e.outerHTML.slice(0,160))));
  log(await page.evaluate(() => [...document.querySelectorAll("header,nav,main,aside,[role=banner],[role=navigation],[role=main]")].map(e=>e.tagName+" "+(e.getAttribute("aria-label")||""))));
} finally { await browser.close(); }
