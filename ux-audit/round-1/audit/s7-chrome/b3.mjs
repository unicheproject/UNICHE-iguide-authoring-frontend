import { open, go, shot, log, P, problem, focused, VIEWPORTS, CMS } from "./lib.mjs";
const { browser, context, page } = await open("curator", { viewport: "1440" });
await go(page, `/projects/${P}/pois`); await page.waitForSelector("nav#workspace-nav",{timeout:60000}); await page.waitForTimeout(2000);
// 401 on places list
let n=0;
await page.route(/\/iguide\/api\/v1\/projects\/[^/]+\/places(\?.*)?$/, r => { n++; r.fulfill(problem(401,"UNAUTHORIZED")); });
const urls=[]; page.on("framenavigated", f=>{ if(f===page.mainFrame()) urls.push(f.url().slice(0,90)); });
await page.locator("nav#workspace-nav").getByRole("link",{name:"Places",exact:true}).click();
await page.waitForTimeout(8000);
log("401 hits", n); log(urls.join("\n"));
await shot(page, "session-expired__after-401__1440");
log("final", page.url());
// toasts: none to force? check a 409/500 on a place PATCH not necessary
await browser.close();
