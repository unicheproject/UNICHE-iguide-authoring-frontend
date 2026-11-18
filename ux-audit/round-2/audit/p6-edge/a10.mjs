import { open, go, P, ids, shot, settle, alerts, focused, main, problem, AP } from "./lib.mjs";
const I = ids(); const PP = `/projects/${P}`;
const { browser, context, page } = await open("curator", { viewport: "1440" });
await go(page, `${PP}/pois/${I.poiA}`); await settle(page, 600);
await page.evaluate(() => localStorage.clear());
await go(page, `${PP}/pois/${I.poiA}`); await settle(page, 600);
await page.locator("#f-summary").fill("offline edit");
await context.setOffline(true); await page.waitForTimeout(1500);
console.log("OFFLINE ALERTS", JSON.stringify(await alerts(page)).slice(0, 700));
console.log("disabled:", JSON.stringify(await page.evaluate(() => [...document.querySelectorAll("button,a")].filter(b => b.offsetParent && (b.disabled || b.getAttribute("aria-disabled") === "true")).map(b => (b.textContent||"").trim().replace(/\s+/g," ").slice(0,30) + " | title=" + (b.title||"") + " | desc=" + (b.getAttribute("aria-describedby")? document.getElementById(b.getAttribute("aria-describedby"))?.textContent?.trim().slice(0,80):"")))));
await shot(page, "poi-editor__offline");
await page.keyboard.press("Control+s"); await page.waitForTimeout(800);
console.log("after Ctrl+S offline", JSON.stringify(await alerts(page)).slice(0, 400));
// list page offline
await page.evaluate(() => 0);
await context.setOffline(false); await page.waitForTimeout(3500);
console.log("ONLINE ALERTS", JSON.stringify(await alerts(page)).slice(0, 500));
await shot(page, "poi-editor__back-online");
await page.getByRole("button", { name: /^Save/ }).first().click(); await page.waitForTimeout(2500);
console.log("retry save ALERTS", JSON.stringify(await alerts(page)).slice(0, 400));
// single aborted fetch should not flip banner: abort one GET
await go(page, `${PP}/pois`); await settle(page, 800);
let k = 0; await page.route(AP, (r) => { if (r.request().method()==="GET" && k++ === 0) return r.abort("failed"); return r.continue(); });
await page.getByRole("link", { name: /Routes/ }).first().click(); await page.waitForTimeout(2500);
console.log("after 1 aborted GET: ", JSON.stringify(await alerts(page)).slice(0, 400), "|", (await page.locator("main").innerText()).replace(/\n+/g," | ").slice(0,200));
await shot(page, "routes-list__one-aborted-fetch");
await page.unroute(AP);
// two failures
let m = 0; await page.route(AP, (r) => { if (r.request().method()==="GET") return r.abort("failed"); return r.continue(); });
await page.getByRole("link", { name: /Guides/ }).first().click(); await page.waitForTimeout(3500);
console.log("after failing GETs: ", JSON.stringify(await alerts(page)).slice(0, 500), "|", (await page.locator("main").innerText()).replace(/\n+/g," | ").slice(0,300));
await shot(page, "guides-list__network-failing");
await page.unroute(AP); await page.waitForTimeout(4000);
console.log("recovered alerts", JSON.stringify(await alerts(page)).slice(0, 300));
await browser.close();
