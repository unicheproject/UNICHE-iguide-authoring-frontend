import { fresh, uiSignIn, shot, CMS } from "./lib.mjs";
const { browser, context, page } = await fresh("1440");
await uiSignIn(page, "admin", "1440", () => {});
const P = "6958c18f-60d2-4140-a524-5a43f8a2f6b5", API = "http://localhost:8080/iguide/api/v1";
const prob = (status, code, detail) => ({ status, contentType: "application/problem+json", body: JSON.stringify({ type: "about:blank", title: "x", status, code, detail, requestId: "req-R2-p2-" + status }) });
const body = () => page.evaluate(()=>document.body.innerText.replace(/\n+/g," | "));
// 1. 401 after load, in-app navigation
await page.goto(`${CMS}/projects/${P}/places`); await page.waitForTimeout(4500);
await page.route((u)=>u.href.startsWith(API)&&/\/pois$/.test(u.pathname), (r)=>r.fulfill(prob(401,"UNAUTHORIZED","token expired")));
await page.getByRole("link", { name: "Points of Interest" }).first().click(); await page.waitForTimeout(5000);
await shot(page, "error__session-ended-dialog", "1440", false);
console.log("401 inapp:", page.url().slice(0,80), "|", (await body()).slice(0,200), "| dialogs:", await page.locator("[role=dialog],[role=alertdialog]").count());
console.log("dialog text:", await page.locator("[role=dialog],[role=alertdialog]").first().innerText().catch(()=>"none"));
await browser.close();
