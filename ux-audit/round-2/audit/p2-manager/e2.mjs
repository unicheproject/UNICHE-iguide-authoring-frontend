import { fresh, uiSignIn, shot, text, CMS, VIEWPORTS } from "./lib.mjs";
const { browser, context, page } = await fresh("1440");
await uiSignIn(page, "admin", "1440", () => {});
const P = "6958c18f-60d2-4140-a524-5a43f8a2f6b5";
const API = "http://localhost:8080/iguide/api/v1";
const prob = (status, code, title, detail) => ({ status, contentType: "application/problem+json", body: JSON.stringify({ type: "about:blank", title, status, code, detail, requestId: "req-R2-p2-" + status, instance: "/x" }) });
async function scenario(name, pattern, resp, path = `/projects/${P}`, wait = 3500) {
  await page.unrouteAll({behavior:"ignoreErrors"});
  await page.route(pattern, (r) => (r.request().method() === "GET" ? r.fulfill(resp) : r.continue()));
  await page.goto(CMS + path); await page.waitForTimeout(wait);
  await shot(page, `error__${name}`, "1440", false);
  console.log("   main landmarks:", await page.locator("main").count(), "h1:", await page.locator("h1").allInnerTexts());
  console.log(`== ${name}: title=${await page.title()}\n` + (await page.evaluate(()=>document.body.innerText)).slice(0, 700).replace(/\n+/g, " | "));
  console.log("   focus:", await page.evaluate(()=>document.activeElement?.tagName+" "+(document.activeElement?.textContent||"").slice(0,40)));
}
await scenario("dashboard-readiness-500", (u)=>u.href.startsWith(API)&&u.pathname.endsWith("/readiness"), prob(500, "INTERNAL", "Server error", "boom"));
await scenario("dashboard-readiness-422", (u)=>u.href.startsWith(API)&&u.pathname.endsWith("/readiness"), prob(422, "VALIDATION_FAILED", "Unprocessable", "x"));
// list 403 inside project
await scenario("places-list-403", (u)=>u.href.startsWith(API)&&/\/places$/.test(u.pathname), prob(403, "FORBIDDEN", "Forbidden", "no"), `/projects/${P}/places`);
// 401 session
await page.unrouteAll({behavior:"ignoreErrors"});
await page.route((u)=>u.href.startsWith(API)&&u.pathname.endsWith("/readiness"), (r) => r.fulfill(prob(401, "UNAUTHORIZED", "Unauthorized", "token expired")));
await page.goto(CMS + `/projects/${P}`); await page.waitForTimeout(5000);
await shot(page, "error__session-ended-401", "1440", false);
console.log("== 401:", page.url().slice(0,60), (await text(page, "[role=dialog], [role=alertdialog]").catch(()=>"(no dialog)")).slice(0,500).replace(/\n+/g," | "));
await browser.close();
