import { open, go, P, ids, shot, settle, alerts, focused, problem, AP } from "./lib.mjs";
const I = ids(); const PP = `/projects/${P}`;
const { browser, page } = await open("curator", { viewport: "zoom200" });
const vis = async (label, re) => { const r = await page.evaluate((src) => { const re = new RegExp(src, "i"); const out = []; for (const b of document.querySelectorAll("[role=dialog] button")) { if (!re.test(b.textContent || "")) continue; const r = b.getBoundingClientRect(); out.push(`${(b.textContent||"").trim().slice(0,20)} y=${Math.round(r.top)}-${Math.round(r.bottom)} (vh ${innerHeight}) x=${Math.round(r.left)}-${Math.round(r.right)} (vw ${innerWidth})`); } return out; }, re.source); console.log(label, r); };
await go(page, `${PP}/pois`); await settle(page, 1500);
await page.getByRole("button", { name: /New point/ }).first().click(); await page.waitForTimeout(800);
await vis("create dialog buttons", /create|cancel/);
await shot(page, "poi-create__dialog", "zoom200");
await page.locator("[role=dialog] button[type=submit]").click(); await page.waitForTimeout(800);
await vis("create dialog after error", /create|cancel/);
await shot(page, "poi-create__error", "zoom200");
await page.keyboard.press("Escape");
// leave guard
await go(page, `${PP}/pois/${I.poiA}`); await settle(page, 1500);
await page.evaluate(() => localStorage.clear());
await page.locator("#f-summary").fill("zoom guard"); await page.waitForTimeout(500);
await page.getByRole("button", { name: /Menu|navigation/i }).first().click().catch(() => {}); await page.waitForTimeout(500);
await page.getByRole("link", { name: "Routes", exact: true }).first().click().catch(e => console.log("nav click fail")); await page.waitForTimeout(800);
await vis("guard dialog", /keep|leave/);
await shot(page, "poi-editor__leave-guard", "zoom200");
await page.keyboard.press("Escape");
// 409 dialog
await page.route(AP, (r) => r.request().method() === "PUT" ? r.fulfill(problem(409, "VERSION_CONFLICT", { currentVersion: 99 })) : r.continue());
const sv = page.getByRole("button", { name: /^Save/ }).first();
await page.evaluate(() => window.scrollTo(0, 0));
await sv.click().catch(e => console.log("save click fail")); await page.waitForTimeout(2000);
await vis("409 dialog", /reload|save my|choose/);
await shot(page, "poi-editor__conflict-dialog", "zoom200");
await page.unroute(AP); await page.keyboard.press("Escape");
// session dialog
await page.route(AP, (r) => r.fulfill(problem(401, "UNAUTHENTICATED")));
await page.reload().catch(() => {}); await page.waitForTimeout(4000);
await vis("session dialog", /sign in/);
await shot(page, "session-ended__dialog", "zoom200");
console.log("body:", (await page.locator("body").innerText()).replace(/\n+/g," | ").slice(0,300));
await browser.close();
