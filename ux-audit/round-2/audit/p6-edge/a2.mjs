import { open, go, P, ids, shot, settle, alerts, focused, main, problem, AP } from "./lib.mjs";
const I = ids();
const { browser, context, page } = await open("curator", { viewport: "1440" });
const cases = [
 ["403", () => problem(403, "FORBIDDEN")],
 ["404", () => problem(404, "RESOURCE_NOT_FOUND")],
 ["422", () => problem(422, "VALIDATION_FAILED", { errors: [{ field: "translations.en.summary", code: "TOO_LONG", message: "Summary too long" }], fieldErrors: [{ field: "translations.en.summary", message: "Summary too long" }] })],
 ["500", () => problem(500, "INTERNAL_ERROR")],
 ["502", () => problem(502, "BAD_GATEWAY")],
 ["503", () => problem(503, "SERVICE_UNAVAILABLE")],
 ["504", () => problem(504, "GATEWAY_TIMEOUT")],
];
for (const [name, mk] of cases) {
  await go(page, `/projects/${P}/pois/${I.poiA}`); await settle(page, 600);
  let hits = 0;
  await page.route(AP, (r) => { const m = r.request().method(); if (m === "PUT" || m === "POST" || m === "PATCH") { hits++; return r.fulfill(mk()); } return r.continue(); });
  await page.locator("#f-summary").fill("Edge-case test record. EDITED-SECRET-ZZ");
  await page.getByRole("button", { name: /^Save/ }).first().click();
  await page.waitForTimeout(1800);
  console.log(`\n=== ${name} hits=${hits}`);
  console.log("ALERTS", JSON.stringify(await alerts(page)));
  console.log("FOCUS", await focused(page));
  console.log("URL", page.url().slice(-60));
  console.log("BODY", (await main(page, 1100)));
  await shot(page, `poi-editor__save-${name}`);
  await page.unroute(AP);
  page.removeAllListeners("dialog");
  await page.evaluate(() => { window.onbeforeunload = null; });
}
await browser.close();
