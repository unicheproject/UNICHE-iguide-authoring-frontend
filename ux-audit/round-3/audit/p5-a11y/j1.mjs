import * as H from "./h.mjs";
const log = H.LOG("j1");
const { browser, page } = await H.session();
try {
  await H.go(page, H.P("/preview")); await H.sleep(1500);
  log("route", JSON.stringify(await H.title(page)));
  await H.shot(page, "preview__load__1440");
  await H.snap(page, "preview", "main");
  await page.evaluate(() => document.querySelector("h1").focus());
  for (let i = 0; i < 24; i++) { const a = (await H.tab(page, 1))[0]; log("preview tab", i + 1, H.brief(a), H.flag(await H.chk(page))); if (a.body) break; }
} finally { await browser.close(); }
