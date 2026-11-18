import * as H from "./h.mjs";
const log = H.LOG("m1");
const { browser, page } = await H.session();
try {
  await H.go(page, H.P("/pois")); await H.sleep(1000);
  await page.route(/\/iguide\/api\/v1\/.*/, (r) => r.fulfill({ status: 401, contentType: "application/problem+json", body: JSON.stringify({ type: "urn:uniche:problem:UNAUTHENTICATED", code: "UNAUTHENTICATED", status: 401, title: "SECRET-TITLE", detail: "SECRET-DETAIL", requestId: "req-r3-p5-401" }) }));
  await page.getByRole("link", { name: "Routes", exact: true }).first().focus(); await H.press(page, "Enter", "go routes under 401", log, 2500);
  await H.shot(page, "session-ended__dialog__1440");
  await H.snap(page, "session-ended", "[role=dialog],[role=alertdialog]");
  log("dlg", await page.evaluate(() => { const d = document.querySelector("[role=alertdialog],[role=dialog]"); return d ? { role: d.getAttribute("role"), text: d.innerText.slice(0, 500), name: d.getAttribute("aria-label") || document.getElementById(d.getAttribute("aria-labelledby"))?.textContent } : null; }));
  log("secret leaked?", await page.evaluate(() => /SECRET/.test(document.body.innerText)));
  log("tab:"); for (let i = 0; i < 4; i++) { const a = (await H.tab(page, 1))[0]; log(i, H.brief(a), H.flag(await H.chk(page))); }
  await H.axe(page, "session-ended", log);
  await H.press(page, "Escape", "esc", log, 800);
  log("after esc", JSON.stringify(await H.title(page)), H.brief(await H.AE(page)), "dialog count", await page.locator("[role=dialog],[role=alertdialog]").count());
  await page.unroute(/\/iguide\/api\/v1\/.*/);
} finally { await browser.close(); }
