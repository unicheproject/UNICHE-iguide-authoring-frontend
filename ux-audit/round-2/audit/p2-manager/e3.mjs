import { fresh, uiSignIn, shot, text, CMS } from "./lib.mjs";
const { browser, context, page } = await fresh("1440");
await uiSignIn(page, "admin", "1440", () => {});
const P = "6958c18f-60d2-4140-a524-5a43f8a2f6b5";
const API = "http://localhost:8080/iguide/api/v1";
const prob = (status, code, title, detail) => ({ status, contentType: "application/problem+json", body: JSON.stringify({ type: "about:blank", title, status, code, detail, requestId: "req-R2-p2-" + status }) });
await page.goto(CMS + `/projects/${P}/places`); await page.waitForTimeout(4000);
// 401 on every API call from now
await page.route((u)=>u.href.startsWith(API), (r)=> r.fulfill(prob(401,"UNAUTHORIZED","Unauthorized","token expired")));
await page.reload(); await page.waitForTimeout(6000);
console.log("401 url:", page.url().slice(0,70), "title:", await page.title());
await shot(page, "error__session-ended-401-all", "1440", false);
console.log((await page.evaluate(()=>document.body.innerText)).slice(0,600).replace(/\n+/g," | "));
await page.unrouteAll({behavior:"ignoreErrors"});
// offline
await page.goto(CMS + `/projects/${P}/places`); await page.waitForTimeout(4000);
await context.setOffline(true);
await page.getByRole("link", { name: "Points of Interest" }).first().click().catch(()=>{});
await page.waitForTimeout(3500);
await shot(page, "error__offline", "1440", false);
console.log("OFFLINE:", (await page.evaluate(()=>document.body.innerText)).replace(/\n+/g," | ").slice(0,900));
await context.setOffline(false); await page.waitForTimeout(3000);
console.log("ONLINE:", (await page.evaluate(()=>document.body.innerText)).replace(/\n+/g," | ").slice(0,300));
await shot(page, "error__back-online", "1440", false);
// slow network on dashboard
await page.route((u)=>u.href.startsWith(API), async (r)=>{ await new Promise(s=>setTimeout(s,4000)); r.continue(); });
await page.goto(CMS + `/projects/${P}`); await page.waitForTimeout(1500);
await shot(page, "loading__dashboard-slow", "1440", false);
await browser.close();
