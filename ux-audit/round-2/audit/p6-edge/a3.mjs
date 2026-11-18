import { open, go, P, ids, shot, settle, alerts, focused, main, problem, AP } from "./lib.mjs";
import { call, closeAll } from "../../../tools/lib.mjs";
const I = ids();
const { browser, context, page } = await open("curator", { viewport: "1440" });
const PP = `/projects/${P}`;
// 422 with proper shape
await go(page, `${PP}/pois/${I.poiA}`); await settle(page, 600);
await page.evaluate(() => localStorage.clear());
await go(page, `${PP}/pois/${I.poiA}`); await settle(page, 600);
await page.route(AP, (r) => { const m = r.request().method(); if (m === "PUT") return r.fulfill(problem(422, "VALIDATION_FAILED", { errors: [{ path: "translations.en.summary", code: "TOO_LONG", message: "Summary must be at most 300 characters." }, { path: "latitude", code: "OUT_OF_RANGE", message: "Latitude must be between -90 and 90." }] })); return r.continue(); });
await page.locator("#f-summary").fill("Edge EDITED-SECRET-ZZ");
await page.getByRole("button", { name: /^Save/ }).first().click(); await page.waitForTimeout(1500);
console.log("422 ALERTS", JSON.stringify(await alerts(page)));
console.log("422 FOCUS", await focused(page));
console.log("422 summary links", await page.evaluate(() => [...document.querySelectorAll("[role=alert] a, [role=alert] button")].map(e => e.tagName + ":" + e.textContent.trim() + ":" + (e.getAttribute("href")||""))));
console.log("422 field desc", await page.evaluate(() => ["f-summary","f-lat"].map(id => { const e = document.getElementById(id); return id + " invalid=" + e?.getAttribute("aria-invalid") + " desc=" + e?.getAttribute("aria-describedby") + " descText=" + (e?.getAttribute("aria-describedby")||"").split(" ").map(d=>document.getElementById(d)?.textContent?.trim()).join("/"); })));
await shot(page, "poi-editor__save-422-fields");
// click first summary link -> where focus goes
const link = page.locator("[role=alert] a, [role=alert] button").first();
if (await link.count()) { await link.click(); await page.waitForTimeout(400); console.log("422 after link click focus", await focused(page)); }
// type in field -> error clears?
await page.locator("#f-summary").fill("Edge fixed"); await page.waitForTimeout(400);
console.log("422 after typing: summary field invalid=", await page.locator("#f-summary").getAttribute("aria-invalid"), "alerts", JSON.stringify(await alerts(page)).slice(0,300));
await page.unroute(AP);

// 401 once: first PUT 401 then continue
await go(page, `${PP}/pois/${I.poiA}`); await settle(page, 600);
let n = 0; const seen = [];
await page.route(AP, (r) => { const m = r.request().method(); if (m === "PUT") { n++; seen.push("PUT#" + n); if (n === 1) return r.fulfill(problem(401, "UNAUTHENTICATED")); } return r.continue(); });
await page.locator("#f-summary").fill("401-once edit");
await page.getByRole("button", { name: /^Save/ }).first().click(); await page.waitForTimeout(3000);
console.log("401-once puts", seen, "ALERTS", JSON.stringify(await alerts(page)).slice(0,400));
console.log("401-once body", (await main(page, 3000)).includes("session ended"));
await shot(page, "poi-editor__401-once");
await page.unroute(AP);

// 409 real: bump version via API while page open
await go(page, `${PP}/pois/${I.poiC}`); await settle(page, 600);
await page.evaluate(() => localStorage.clear());
const cur = await call("curator", "GET", `${PP}/pois/${I.poiC}`);
await call("curator", "PUT", `${PP}/pois/${I.poiC}`, { ...cur, version: cur.version, translations: { en: { ...cur.translations.en, summary: "THEIRS summary from colleague", title: "UX-R2-p6 POI Gamma (theirs)" } } });
await page.locator("#f-summary").fill("MINE summary from me");
await page.getByRole("button", { name: /^Save/ }).first().click(); await page.waitForTimeout(2500);
console.log("409 real DIALOG", await page.locator("[role=dialog],[role=alertdialog]").first().innerText().catch(() => "(no dialog)"));
console.log("409 ALERTS", JSON.stringify(await alerts(page)).slice(0,500));
console.log("409 FOCUS", await focused(page));
await shot(page, "poi-editor__save-409-real");
await closeAll(); await browser.close();
