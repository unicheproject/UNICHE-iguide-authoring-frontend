import { open, go, CMS, API } from "../../../tools/session.mjs";
import { shot } from "./lib.mjs";
const P = { populated:"6958c18f-60d2-4140-a524-5a43f8a2f6b5", emptyb:"1d6971ce-6391-4da8-848e-8d7466d25128" };
for (const vp of ["1440","768"]) {
const { browser, page } = await open("admin", { viewport: vp });
await go(page, "/");
for (const [k,id] of Object.entries(P)) {
  await page.addInitScript(()=>{ window.__ls=[]; new PerformanceObserver(l=>{for(const e of l.getEntries()) window.__ls.push({v:+e.value.toFixed(4), t:Math.round(e.startTime), s:e.sources?.map(s=>s.node?.nodeName+":"+(s.node?.className||"").toString().slice(0,30))})}).observe({type:"layout-shift",buffered:true}); });
  // delay API by 1500ms to hold the skeleton
  await page.route(API+"/**", async r => { await new Promise(res=>setTimeout(res,1200)); r.continue(); });
  await page.goto(CMS+"/projects/"+id);
  await page.waitForTimeout(1800);
  await shot(page, `dashboard-${k}__skeleton__${vp}`);
  const sk = await page.evaluate(()=>({txt:document.body.innerText.slice(0,300), status:[...document.querySelectorAll("[role=status]")].map(s=>s.innerText), skeletons:document.querySelectorAll(".animate-pulse,[class*=skeleton]").length, h1:document.querySelector("h1")?.getBoundingClientRect().y}));
  console.log(vp,k,"SKELETON",JSON.stringify(sk));
  await page.waitForTimeout(6000);
  await shot(page, `dashboard-${k}__after-skeleton__${vp}`);
  const r = await page.evaluate(()=>({ls:window.__ls, cls:window.__ls.reduce((a,b)=>a+b.v,0), h1:document.querySelector("h1")?.getBoundingClientRect().y}));
  console.log(vp,k,"LS",JSON.stringify(r));
  await page.unroute(API+"/**");
}
await browser.close();
}
