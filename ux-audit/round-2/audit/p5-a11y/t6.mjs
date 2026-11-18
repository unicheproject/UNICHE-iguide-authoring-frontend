import * as L from "./lib.mjs";
const { page, browser } = await L.open("curator", { viewport: "1440" });
const k = page.keyboard;
await L.nav(page, L.P("/pois"));
await L.watchLive(page);
let forced = true;
await page.route(/\/projects\/[^/]+\/pois$/, (route) => {
  if (route.request().method() !== "POST" || !forced) return route.continue();
  return route.fulfill({ status: 422, contentType: "application/problem+json", body: JSON.stringify({ type: "urn:x", code: "VALIDATION_ERROR", title: "Validation failed", status: 422, requestId: "req-r2p5-422", errors: [{ path: "exhibitCode", code: "DUPLICATE", message: "exhibitCode already used" }, { path: "title.en", code: "TOO_LONG", message: "title too long" }, { path: "placeId", code: "NOT_FOUND", message: "place gone" }] }) });
});
await page.getByRole("button", { name: /new point of interest/i }).focus(); await k.press("Enter"); await page.waitForTimeout(500);
await k.type("UX-R2-p5 Keyboard POI");
await k.press("Tab"); await k.press("Tab"); await k.press("Tab"); // place, category, code
L.log("t6", "on", await L.focus(page));
await k.type("R2P5-001");
await k.press("Enter"); await page.waitForTimeout(900);
L.log("t6", "after 422: focus", await L.focus(page));
L.log("t6", "alerts", await page.locator("[role=alert]").allTextContents());
L.log("t6", "live", (await L.liveLog(page)).slice(-3));
await L.shot(page, "poi-create__422-summary__1440");
const links = page.locator("[data-error-summary] a");
L.log("t6", "links", await links.allTextContents());
L.log("t6", "link hrefs", await links.evaluateAll((a) => a.map((x) => x.getAttribute("href") + "|" + x.getAttribute("role"))));
// keyboard to links
await k.press("Tab"); L.log("t6", "tab from summary", await L.focus(page));
await k.press("Enter"); await page.waitForTimeout(300); L.log("t6", "after Enter on link1", await L.focus(page));
// describedby
L.log("t6", "title desc", await page.getByRole("textbox", { name: /Title/ }).evaluate((e) => ({ invalid: e.getAttribute("aria-invalid"), db: e.getAttribute("aria-describedby"), t: e.getAttribute("aria-describedby") ? document.getElementById(e.getAttribute("aria-describedby").split(" ")[0])?.textContent : null })));
L.log("t6", "code desc", await page.getByRole("textbox", { name: "Exhibit code" }).evaluate((e) => ({ invalid: e.getAttribute("aria-invalid"), db: e.getAttribute("aria-describedby"), texts: (e.getAttribute("aria-describedby") ?? "").split(" ").map((i) => document.getElementById(i)?.textContent) })));
L.log("t6", "axe 422", await L.axe(page, "poi-create-422"));
// correct and resubmit: does summary clear?
forced = false;
await page.getByRole("textbox", { name: "Exhibit code" }).focus(); await k.press("Control+A"); await k.type("R2P5-" + Date.now().toString().slice(-6));
await page.waitForTimeout(300);
L.log("t6", "alerts after edit", await page.locator("[role=alert]").allTextContents());
await k.press("Enter"); await page.waitForTimeout(3500);
L.log("t6", "after create: url", page.url(), "title", await page.title(), "focus", await L.focus(page));
L.log("t6", "live", (await L.liveLog(page)).slice(-4));
await L.shot(page, "poi-editor__after-create__1440");
await browser.close();
