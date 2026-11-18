import { open, go, P, ids, shot, settle, alerts, focused, main, problem, AP } from "./lib.mjs";
const I = ids(); const PP = `/projects/${P}`;
const { browser, page } = await open("curator", { viewport: "1440" });
const navs = []; page.on("framenavigated", f => { if (f === page.mainFrame()) navs.push(f.url().slice(0, 90)); });
await go(page, `${PP}/pois/${I.poiA}`); await settle(page, 600);
await page.evaluate(() => localStorage.clear());
await go(page, `${PP}/pois/${I.poiA}`); await settle(page, 600);
navs.length = 0;
let puts = 0, calls = 0;
await page.route(AP, (r) => { calls++; if (r.request().method() === "PUT") puts++; return r.fulfill(problem(401, "UNAUTHENTICATED")); });
await page.locator("#f-summary").fill("EDITS-MUST-SURVIVE-401");
await page.getByRole("button", { name: /^Save/ }).first().click(); await page.waitForTimeout(4000);
console.log("calls", calls, "puts", puts, "navs", navs);
console.log("DIALOG", await page.locator("[role=dialog],[role=alertdialog]").first().innerText().catch(() => "(none)"));
console.log("ALERTS", JSON.stringify(await alerts(page)).slice(0, 500));
console.log("FOCUS", await focused(page));
await shot(page, "poi-editor__401-persistent-dialog");
await page.keyboard.press("Escape"); await page.waitForTimeout(500);
console.log("after Esc: dialog count", await page.locator("[role=dialog],[role=alertdialog]").count());
await page.keyboard.press("Tab"); await page.keyboard.press("Tab");
console.log("tab focus", await focused(page));
// Re-open dialog if closed? try Save again
await page.getByRole("button", { name: /^Save/ }).first().click().catch(()=>{}); await page.waitForTimeout(1500);
console.log("dialog after 2nd save", await page.locator("[role=dialog],[role=alertdialog]").count(), "calls", calls);
await page.unroute(AP);
const btn = page.getByRole("button", { name: /sign in/i }).first();
console.log("signin btn count", await btn.count());
if (await btn.count()) { await btn.click(); await page.waitForTimeout(8000); await page.waitForLoadState("networkidle").catch(()=>{}); }
console.log("URL after", page.url().slice(0,100));
if (page.url().includes("/realms/")) { console.log("at keycloak (SSO session ended?)"); await shot(page, "session__keycloak"); }
await settle(page, 1500);
console.log("summary field", await page.locator("#f-summary").inputValue().catch(() => "n/a"));
console.log("BODY", (await main(page, 2500)).slice(300, 1500));
await shot(page, "poi-editor__after-resignin");
await browser.close();
