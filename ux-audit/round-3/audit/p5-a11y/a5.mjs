import * as H from "./h.mjs";
const log = H.LOG("a5");
const { browser, page } = await H.session();
try {
  await H.go(page, H.P("/pois?create=1"));
  await H.sleep(600);
  log("create via ?create=1: ae", H.brief(await H.AE(page)), JSON.stringify(await H.title(page)));
  await H.shot(page, "poi-create__open__1440");
  await H.snap(page, "poi-create", "[role=dialog]");
  log("dialog", await page.evaluate(() => { const d = document.querySelector("[role=dialog]"); return { name: d.getAttribute("aria-label") || document.getElementById(d.getAttribute("aria-labelledby"))?.textContent, modal: d.getAttribute("aria-modal"), desc: document.getElementById(d.getAttribute("aria-describedby"))?.textContent }; }));
  log("tab order in dialog:"); for (let i = 0; i < 10; i++) { const a = (await H.tab(page, 1))[0]; log(i, H.brief(a), JSON.stringify(await H.ring(page))); }
  // fill via keyboard: focus title
  await page.getByLabel(/^Title/).first().focus();
  // empty submit
  await page.keyboard.press("Enter"); await H.sleep(700);
  log("empty submit ->", H.brief(await H.AE(page)), JSON.stringify(await H.live(page)));
  await H.shot(page, "poi-create__empty-submit__1440");
  await H.snap(page, "poi-create-errors", "[role=dialog]");
  log("summary", await page.evaluate(() => { const s = document.querySelector("[role=dialog] [role=alert], [role=dialog] [data-error-summary], [role=dialog] [aria-labelledby*=summary]"); return s ? s.outerHTML.slice(0, 500) : null; }));
  await H.axe(page, "poi-create-errors", log);
  // forced 422
  await page.route("**/pois", async (route) => { if (route.request().method() === "POST") { await route.fulfill({ status: 422, contentType: "application/problem+json", body: JSON.stringify({ type: "urn:uniche:problem:VALIDATION_ERROR", code: "VALIDATION_ERROR", title: "Validation", status: 422, requestId: "req-r3-p5-422", errors: [{ path: "title.en", code: "BLANK", message: "Title must not be blank (forced)" }, { path: "slug", code: "INVALID", message: "Slug is not valid (forced)" }] }) }); } else await route.continue(); });
  await page.getByLabel(/^Title/).first().fill("UX-R3-p5 POI 422");
  await page.getByLabel(/^Title/).first().press("Enter"); await H.sleep(1200);
  log("422 ->", H.brief(await H.AE(page)), JSON.stringify(await H.live(page)));
  await H.shot(page, "poi-create__422__1440");
  await H.snap(page, "poi-create-422", "[role=dialog]");
  log("summary links", await page.evaluate(() => [...document.querySelectorAll("[role=dialog] a, [role=dialog] [role=alert] button")].map(e => e.textContent.trim())));
  const link = page.locator("[role=dialog] a").first();
  if (await link.count()) { await link.focus(); await H.press(page, "Enter", "summary link", log, 400); }
  await H.axe(page, "poi-create-422", log);
  await page.unroute("**/pois");
  await H.press(page, "Escape", "esc dialog", log, 500);
  log("after esc", page.url(), JSON.stringify(await H.title(page)));
} finally { await browser.close(); }
