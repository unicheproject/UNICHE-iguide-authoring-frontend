import { open, go, shot, P, settle } from "./lib.mjs";
const ID="061eca49-e97e-483a-b48f-3dff0d96a3cc";
const { browser, context, page } = await open("curator", { viewport: "1440" });
const live=()=>page.evaluate(()=>[...document.querySelectorAll("[role=status],[role=alert],[aria-live]")].map(e=>e.textContent.trim().slice(0,220)).filter(Boolean));
await go(page, `/projects/${P}/pois/${ID}`); await page.getByRole("heading",{level:1}).first().waitFor(); await settle(page,1500);
// 1. dirty then leave via breadcrumb
await page.getByLabel("Summary").fill("dirty then leave"); await settle(page,300);
await page.getByRole("link",{name:"Points of Interest"}).first().click(); await settle(page,800);
console.log("LEAVE dialog:", await page.getByRole("dialog").count()? (await page.getByRole("dialog").innerText()).replace(/\n/g," | "):"none, url "+page.url());
await shot(page,"poi-editor__leave-guard__1440");
if(await page.getByRole("dialog").count()){ console.log("focus in dlg", await page.evaluate(()=>document.activeElement?.textContent.slice(0,30))); await page.keyboard.press("Escape"); await settle(page,300); console.log("after Esc url", page.url().split("/").pop().slice(0,10), "focus", await page.evaluate(()=>document.activeElement?.textContent.slice(0,30)));}
// 2. Apply while dirty
await page.getByRole("button",{name:/^Apply changes/}).click(); await settle(page,800);
console.log("APPLY while dirty dialog:", await page.getByRole("dialog").count()? (await page.getByRole("dialog").innerText()).replace(/\n/g," | "):"none"); await shot(page,"poi-editor__apply-while-dirty__1440");
if(await page.getByRole("dialog").count()) await page.getByRole("dialog").getByRole("button",{name:/Keep editing|Cancel/}).click();
// 3. 409 on save
await page.route("**/pois/*/working-copy", r=> r.request().method()==="PUT" ? r.fulfill({status:409,contentType:"application/problem+json",body:JSON.stringify({type:"about:blank",title:"Conflict",status:409,code:"VERSION_CONFLICT",detail:"The Working Copy changed.",requestId:"req-r2-409"})}) : r.continue());
await page.getByRole("button",{name:/^Save draft/}).click(); await settle(page,1500);
console.log("409:", await live()); await shot(page,"poi-editor__save-409__1440");
console.log("body 409 text:", (await page.locator("main").innerText()).match(/(changed|conflict|mine|current)[^\n]*/gi)?.slice(0,4));
await page.unroute("**/pois/*/working-copy");
// 4. 422
await page.route("**/pois/*/working-copy", r=> r.request().method()==="PUT" ? r.fulfill({status:422,contentType:"application/problem+json",body:JSON.stringify({type:"about:blank",title:"Unprocessable",status:422,code:"VALIDATION_FAILED",detail:"Invalid",requestId:"req-r2-422",errors:[{field:"summary.en",code:"TOO_LONG",message:"Too long"}]})}) : r.continue());
await page.getByRole("button",{name:/^Save draft/}).click(); await settle(page,1500);
console.log("422:", await live()); await shot(page,"poi-editor__save-422__1440");
await page.unroute("**/pois/*/working-copy");
// 5. 503
await page.route("**/pois/*/working-copy", r=> r.request().method()==="PUT" ? r.fulfill({status:503,contentType:"application/problem+json",body:JSON.stringify({type:"about:blank",title:"Unavailable",status:503,code:"PLATFORM_UNAVAILABLE",requestId:"req-r2-503"})}) : r.continue());
await page.getByRole("button",{name:/^Save draft/}).click(); await settle(page,1500);
console.log("503:", await live()); await shot(page,"poi-editor__save-503__1440");
await page.unroute("**/pois/*/working-copy");
// 6. slow save
await page.route("**/pois/*/working-copy", async r=>{ if(r.request().method()==="PUT"){ await new Promise(x=>setTimeout(x,5000)); } r.continue(); });
await page.getByRole("button",{name:/^Save draft/}).click(); await settle(page,3800);
console.log("slow@3.8s:", await live()); await shot(page,"poi-editor__save-slow__1440");
await settle(page,3000);
await page.unroute("**/pois/*/working-copy");
// 7. offline
await context.setOffline(true); await page.getByLabel("Summary").fill("dirty offline"); await page.getByRole("button",{name:/^Save draft/}).click(); await settle(page,2500);
console.log("offline:", await live()); await shot(page,"poi-editor__save-offline__1440");
await context.setOffline(false); await settle(page,1500);
// reload with dirty to see Restore
await page.reload(); await page.getByRole("heading",{level:1}).first().waitFor(); await settle(page,2000);
await shot(page,"poi-editor__after-reload-dirty__1440");
console.log("RESTORE:", (await page.locator("main").innerText()).match(/(restore|unsaved|draft from)[^\n]*/gi)?.slice(0,4));
await browser.close();
