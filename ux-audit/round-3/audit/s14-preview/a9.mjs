import { open, go, API } from "../../../tools/session.mjs";
import { writeFileSync, readFileSync } from "node:fs";
const P="6958c18f-60d2-4140-a524-5a43f8a2f6b5";
const D="ux-audit/round-3/audit/s14-preview/";
const log=[]; const L=(k,v)=>{log.push([k,v]);console.log(k,JSON.stringify(v));};
const prob=(status,title,extra={})=>({status,contentType:"application/problem+json",body:JSON.stringify({type:"about:blank",title,status,requestId:"req-r3-s14-"+status,...extra})});
const body=()=>page.evaluate(()=>({h:[...document.querySelectorAll('[role=alert],[role=status]')].map(e=>e.innerText.replace(/\s+/g,' ').trim().slice(0,260)),focus:document.activeElement.tagName+':'+document.activeElement.textContent.trim().slice(0,30),title:document.title}));
var page;
{
 const s=await open("admin",{viewport:"1440"}); page=s.page;
 // A. 503 on places + retry
 await page.route(new RegExp(`/projects/${P}/places(\\?|$)`),r=>r.fulfill(prob(503,"Service Unavailable",{detail:"jdbc timeout db-7",code:"PLATFORM_UNAVAILABLE"})));
 await go(page,`/projects/${P}/preview`); await page.waitForTimeout(2500);
 L("503",await body()); await page.screenshot({path:D+"shots/preview__503__1440.png"});
 L("503 openTab disabled",await page.getByRole("button",{name:/Open in new tab/}).evaluate(b=>({d:b.disabled,a:b.getAttribute("aria-disabled")})));
 await page.unroute(new RegExp(`/projects/${P}/places(\\?|$)`));
 await page.getByRole("button",{name:/try again|retry/i}).first().click(); await page.waitForTimeout(2500);
 L("afterRetry",await body()); L("focus after retry",await page.evaluate(()=>document.activeElement.tagName+':'+document.activeElement.textContent.trim().slice(0,30)));
 // B. 403 and 404 and offline
 for (const st of [403,500]) {
   await page.route(new RegExp(`/projects/${P}/pois(\\?|$)`),r=>r.fulfill(prob(st,"x",{detail:"raw detail leak",code:st===403?"FORBIDDEN":"INTERNAL"})));
   await go(page,`/projects/${P}/preview`); await page.waitForTimeout(2200); L(String(st),await body());
   await page.unroute(new RegExp(`/projects/${P}/pois(\\?|$)`));
 }
 // C. slow network (skeleton)
 await page.route(new RegExp(`/projects/${P}/places(\\?|$)`),async r=>{await new Promise(x=>setTimeout(x,4000));r.continue();});
 await page.goto("http://localhost:5173/projects/"+P+"/preview"); await page.waitForTimeout(1500);
 L("loading",await page.evaluate(()=>({busy:document.querySelector('[aria-busy=true]')?.tagName,status:[...document.querySelectorAll('[role=status]')].map(e=>e.getAttribute('aria-label')||e.textContent.trim()),btn:[...document.querySelectorAll('button')].find(b=>/Open in new tab/.test(b.textContent))?.getAttribute('aria-disabled')})));
 await page.screenshot({path:D+"shots/preview__loading__1440.png"});
 await page.waitForTimeout(4500); await page.unroute(new RegExp(`/projects/${P}/places(\\?|$)`));
 // D. pristine: empty lists + no triggers
 const empty={content:[],page:0,size:50,totalElements:0,totalPages:0,first:true,last:true};
 const kinds=["places","pois","routes","guides","events","triggers","assets","maps"];
 for(const k of kinds) await page.route(new RegExp(`/projects/${P}/${k}(\\?|$)`),r=>r.fulfill({status:200,contentType:"application/json",body:JSON.stringify(empty)}));
 await go(page,`/projects/${P}/preview`); await page.waitForTimeout(2500);
 L("empty",await page.evaluate(()=>({toolbar:document.querySelector('[data-preview-toolbar]')?.innerText.replace(/\s+/g,' '),notes:document.querySelector('#fire-trigger-notes')?.innerText,status:[...document.querySelectorAll('p[role=status]')].map(p=>p.textContent.trim()),standIn:document.querySelector('[data-preview-frame] [class*=origin-top-left]')?.innerText.replace(/\s+/g,' ').slice(0,300),sel:document.getElementById('fire-trigger')?.disabled})));
 await page.screenshot({path:D+"shots/preview__empty-project__1440.png"});
 await page.getByRole("tab",{name:"Live"}).click(); await page.waitForTimeout(500);
 await page.screenshot({path:D+"shots/preview__empty-live__1440.png"});
 await go(page,`/projects/${P}/app-preview`); await page.waitForTimeout(2000); await page.screenshot({path:D+"shots/newtab__empty-project__1440.png"});
 L("newtab empty",await page.evaluate(()=>document.querySelector('[data-preview-frame]')?.innerText.replace(/\s+/g,' ').slice(0,300)));
 await s.browser.close();
}
writeFileSync(D+"a9.json",JSON.stringify(log,null,1));
