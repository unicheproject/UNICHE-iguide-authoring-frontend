import { open, go, shot, P, settle } from "./lib.mjs";
const ID="061eca49-e97e-483a-b48f-3dff0d96a3cc";
const { browser, page } = await open("curator", { viewport: "1440" });
const log=[]; page.on("response", r=>{ if(r.url().includes("/api/v1") && r.request().method()!=="GET") log.push(r.request().method()+" "+r.url().split("/api/v1")[1].replace(/[0-9a-f-]{36}/g,"ID")+" "+r.status()) });
await go(page, `/projects/${P}/pois/${ID}`);
await page.getByRole("heading", { level: 1 }).first().waitFor(); await settle(page,1500);
const sum=page.getByLabel("Summary");
await sum.fill("Edited summary one - pending");
await settle(page,500);
await shot(page,"poi-editor__active-dirty__1440");
console.log("HEADER dirty:", await page.locator("header").nth(1).innerText().catch(()=>"?"));
let t=Date.now(); await page.keyboard.press("Control+s");
await page.waitForFunction(()=>![...document.querySelectorAll("button")].some(b=>/Saving/.test(b.textContent)),null,{timeout:30000});
console.log("Ctrl+S ms",Date.now()-t, log.join(" | ")); log.length=0; await settle(page,700);
await shot(page,"poi-editor__active-pending-saved__1440");
console.log("TOASTS", await page.evaluate(()=>[...document.querySelectorAll("[role=status],[aria-live]")].map(e=>e.textContent.trim().slice(0,200)).filter(Boolean)));
console.log("banner:", await page.locator("text=Working Copy").first().evaluate(e=>e.parentElement.innerText));
console.log("focus", await page.evaluate(()=>document.activeElement?.outerHTML.slice(0,100)));
// second edit + Save draft via button
await sum.fill("Edited summary two - pending"); 
await page.getByRole("button",{name:/^Save draft/}).click(); 
await page.waitForFunction(()=>![...document.querySelectorAll("button")].some(b=>/Saving/.test(b.textContent)),null,{timeout:30000}); await settle(page,500);
console.log("Save draft click log", log.join(" | "));
// leave via breadcrumb
await page.getByRole("link",{name:"Points of Interest"}).first().click(); await settle(page,1500);
console.log("after leave url", page.url(), "dialog?", await page.getByRole("dialog").count());
await page.getByLabel("Pending changes").check(); await settle(page,1200);
console.log("URL with pending", page.url());
await shot(page,"pois-list__pending-filter__1440");
console.log((await page.locator("main").innerText()).split("Actions")[1]?.slice(0,300));
// dashboard
await go(page, `/projects/${P}`); await settle(page,1500);
await shot(page,"dashboard__waiting-to-apply__1440");
const txt=await page.locator("main").innerText(); const i=txt.indexOf("Waiting"); console.log("DASH:", txt.slice(i,i+500));
await browser.close();
