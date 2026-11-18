import { open, go, shot, P, settle } from "./lib.mjs";
const ID="061eca49-e97e-483a-b48f-3dff0d96a3cc";
const { browser, context, page } = await open("curator", { viewport: "1440" });
const live=()=>page.evaluate(()=>[...document.querySelectorAll("[role=status],[role=alert],[aria-live]")].map(e=>e.textContent.trim().slice(0,260)).filter(Boolean));
await go(page, `/projects/${P}/pois/${ID}`); await page.getByRole("heading",{level:1}).first().waitFor(); await settle(page,1500);
await page.getByLabel("Summary").fill("error-state text");
const mock=async(status,body)=>{ await page.unroute("**/pois/*/working-copy").catch(()=>{}); await page.route("**/pois/*/working-copy", r=> r.request().method()==="PUT" ? r.fulfill({status,contentType:"application/problem+json",body:JSON.stringify(body)}) : r.continue()); };
// 422
await mock(422,{type:"about:blank",title:"Unprocessable",status:422,code:"VALIDATION_FAILED",detail:"Invalid",requestId:"req-r2-422",errors:[{field:"summary.en",code:"TOO_LONG",message:"Too long"}]});
await page.getByRole("button",{name:/^Save draft/}).click(); await settle(page,1500);
console.log("422 live:", await live(), "dialogs", await page.getByRole("dialog").count()); await shot(page,"poi-editor__save-422__1440");
console.log("422 main:", (await page.locator("main").innerText()).split("\n").filter(l=>/fix|Too long|req-|couldn|could not|went wrong|rejected/i.test(l)).slice(0,6));
// 503
await mock(503,{type:"about:blank",title:"Unavailable",status:503,code:"PLATFORM_UNAVAILABLE",requestId:"req-r2-503"});
await page.getByRole("button",{name:/^Save draft/}).click(); await settle(page,1500);
console.log("503 live:", await live(), "dialogs", await page.getByRole("dialog").count()); await shot(page,"poi-editor__save-503__1440");
console.log("503 toast/main:", (await page.locator("body").innerText()).split("\n").filter(l=>/req-|couldn|could not|went wrong|unavailable|try again/i.test(l)).slice(0,6));
// slow
await page.unroute("**/pois/*/working-copy");
await page.route("**/pois/*/working-copy", async r=>{ if(r.request().method()==="PUT"){ await new Promise(x=>setTimeout(x,6000)); } r.continue(); });
await page.getByRole("button",{name:/^Save draft/}).click(); await settle(page,4000);
console.log("slow@4s live:", await live()); await shot(page,"poi-editor__save-slow-4s__1440");
await settle(page,4000);
await page.unroute("**/pois/*/working-copy");
// offline
await context.setOffline(true); await page.getByLabel("Summary").fill("dirty offline"); await page.getByRole("button",{name:/^Save draft/}).click(); await settle(page,2500);
console.log("offline live:", await live()); await shot(page,"poi-editor__save-offline__1440");
await context.setOffline(false); await settle(page,2000);
await page.reload(); await page.getByRole("heading",{level:1}).first().waitFor(); await settle(page,2500);
await shot(page,"poi-editor__after-reload-dirty__1440");
console.log("RESTORE:", (await page.locator("main").innerText()).split("\n").filter(l=>/restore|unsaved|browser|draft/i.test(l)).slice(0,5));
await browser.close();
