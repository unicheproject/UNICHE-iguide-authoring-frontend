import { open, go } from "../../../../tools/session.mjs";
const PID="6958c18f-60d2-4140-a524-5a43f8a2f6b5", POI="05ed359e-934c-448f-83bb-2bb1ce540da3";
const out="C:/Users/mirto/IdeaProjects/iguide/uniche_iguide_frontend/ux-audit/round-3/implementation/P4/after/";
const { browser, page } = await open("admin",{viewport:"1440"});
const writes=[]; let lose=true;
page.on("request",r=>{ if(/\/triggers/.test(r.url())&&r.method()!=="GET") writes.push(r.method()+" "+(r.postData()||"").slice(60,120)+" "+r.url().split("/triggers")[1]); });
// Response lost: the QR create reaches the platform, the answer never arrives.
await page.route(/\/triggers$/, async route=>{ const r=route.request(); if(r.method()==="POST" && lose && /QR_CODE/.test(r.postData()||"")) { lose=false; await route.fetch(); return route.fulfill({status:503,contentType:"application/problem+json",body:JSON.stringify({status:503,title:"x",code:"SERVICE_UNAVAILABLE"})}); } return route.continue(); });
await go(page,`/projects/${PID}/pois/${POI}`);
await page.waitForSelector("text=How visitors reach it");
await page.getByRole("button",{name:/^Add QR code/}).click();
const code="P4LOST"+Math.floor(Math.random()*9000+1000);
await page.locator("[data-trigger-row]").last().getByLabel("Code").fill(code);
await page.getByRole("button",{name:/^Save$/}).first().click(); await page.waitForTimeout(2500);
console.log("first",writes); writes.length=0;
const txt=async()=>page.evaluate(()=>document.querySelector("[data-editor-summary], [role=alert]")?.textContent?.slice(0,300)); console.log(await txt());
await page.getByRole("button",{name:/^Save$/}).first().click(); await page.waitForTimeout(2500);
console.log("retry",writes, await txt(), await page.evaluate(()=>document.body.innerText.match(/already uses[^.]*\./g)));
await browser.close();
