import * as L from "./lib.mjs";
const { page, browser } = await L.open("curator", { viewport: "1440" });
const k = page.keyboard;
await L.nav(page, L.P("/pois"));
await L.watchLive(page);
await page.route(/\/projects\/[^/]+\/pois$/, (route) => {
  if (route.request().method() !== "POST") return route.continue();
  return route.fulfill({ status: 422, contentType: "application/problem+json", body: JSON.stringify({ type: "urn:x", code: "VALIDATION_ERROR", title: "Validation failed", status: 422, requestId: "req-r2p5-422b", errors: [{ path: "code", code: "DUPLICATE", message: "code already used" }, { path: "title", code: "TOO_LONG", message: "title too long" }, { path: "slug", code: "TAKEN", message: "slug taken" }] }) });
});
await page.getByRole("button", { name: /new point of interest/i }).focus(); await k.press("Enter"); await page.waitForTimeout(500);
await k.type("UX-R2-p5 Dup");
await k.press("Tab"); await k.press("Tab"); await k.press("Tab"); await k.type("R2P5-001");
await k.press("Enter"); await page.waitForTimeout(900);
L.log("t7", "focus", await L.focus(page));
L.log("t7", "alerts", await page.locator("[data-error-summary]").allTextContents());
await L.shot(page, "poi-create__422-mapped__1440");
for (let i = 0; i < 3; i++) { await k.press("Tab"); const f = await L.focus(page); await k.press("Enter"); await page.waitForTimeout(300); L.log("t7", "link", i, f, "=> after Enter:", await L.focus(page)); await page.locator("[data-error-summary]").focus().catch(() => {}); await k.press("Tab"); for (let j = 0; j < i; j++) await k.press("Tab"); await page.locator("[data-error-summary] a").nth(i).focus(); }
L.log("t7", "title desc", await page.getByRole("textbox", { name: /Title/ }).evaluate((e) => ({ invalid: e.getAttribute("aria-invalid"), texts: (e.getAttribute("aria-describedby") ?? "").split(" ").map((i) => document.getElementById(i)?.textContent) })));
await page.getByRole("textbox", { name: /Title/ }).focus(); await k.type(" x"); await page.waitForTimeout(300);
L.log("t7", "summary after typing in title:", await page.locator("[data-error-summary]").allTextContents());
await k.press("Escape"); await page.waitForTimeout(400);
L.log("t7", "esc with dirty: dialogs", await page.locator("[role=dialog],[role=alertdialog]").count(), await L.focus(page));
L.log("t7", "dlg text", await page.locator("[role=alertdialog]").allTextContents());
await browser.close();
