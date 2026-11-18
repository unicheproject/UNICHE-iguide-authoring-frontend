import * as H from "./h.mjs";
const log = H.LOG("a7");
const { browser, page } = await H.session();
try {
  for (const [name, path] of [["dashboard", "/"], ["poi-list", "/pois"], ["places", "/places"], ["media", "/media"], ["routes", "/routes"]]) {
    await H.go(page, H.P(path));
    await page.evaluate(() => document.querySelector("h1")?.focus());
    await H.sweep(page, 45, name, log);
  }
} finally { await browser.close(); }
