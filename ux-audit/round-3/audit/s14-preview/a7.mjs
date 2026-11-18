import { open, go, API } from "../../../tools/session.mjs";
import { writeFileSync, readFileSync } from "node:fs";
const P="6958c18f-60d2-4140-a524-5a43f8a2f6b5";
const D="ux-audit/round-3/audit/s14-preview/";
const T=JSON.parse(readFileSync(D+"triggers.json"));
const qrA=T.find(t=>t.type==="QR_CODE"&&t.status==="ACTIVE");
const log=[]; const L=(k,v)=>{log.push([k,v]);console.log(k,JSON.stringify(v));};
const info=(page)=>page.evaluate(()=>{const r=e=>{if(!e)return null;const b=e.getBoundingClientRect();return {x:Math.round(b.x),y:Math.round(b.y),w:Math.round(b.width),h:Math.round(b.height)}};
 const hd=document.querySelector('header');const f=document.querySelector('[data-preview-frame]');
 return {title:document.title,hdr:r(hd),ctl:[...document.querySelectorAll('header select, header input')].map(e=>[e.id,e.value,r(e)]),frame:r(f?.firstElementChild),scale:f?.dataset.scale,sw:document.documentElement.scrollWidth-document.documentElement.clientWidth,h1:[...document.querySelectorAll('h1,h2')].map(h=>h.textContent.trim().slice(0,50)),alerts:[...document.querySelectorAll('[role=status],[role=alert]')].map(e=>e.textContent.trim().slice(0,160)),focus:document.activeElement?.tagName+':'+(document.activeElement?.id||document.activeElement?.textContent||'').trim().slice(0,30),lang:document.documentElement.lang, standIn:document.querySelector('[data-preview-frame] [class*=origin-top-left]')?.innerText.replace(/\s+/g,' ').slice(0,100)}});
const cases=[
 ["default",""],
 ["kiosk-it-live","?surface=kiosk&lang=it&mode=live"],
 ["mobile-el","?surface=MOBILE&lang=el"],
 ["landscape-real","?surface=KIOSK&orientation=landscape&real=1"],
 ["qr",`?t=${qrA.code}`],
 ["qr-unknown","?t=zzz-nope"],
 ["bad-params","?surface=tablet&lang=xx&mode=banana"],
 ["xss","?t=%3Cb%3Ex%3C%2Fb%3E&lang=%3Cscript%3E"],
];
for (const vp of ["1440","768","zoom200"]) {
  const { browser, page } = await open("admin",{viewport:vp});
  for (const [n,q] of cases) {
    if(vp!=="1440" && !["default","bad-params","kiosk-it-live"].includes(n)) continue;
    await go(page,`/projects/${P}/app-preview${q}`); await page.waitForTimeout(1800);
    L(`${vp} ${n}`,await info(page));
    await page.screenshot({path:D+`shots/newtab__${n}__${vp}.png`});
  }
  if(vp==="1440"){
    // missing project
    await go(page,`/projects/11111111-1111-4111-8111-111111111111/app-preview`); await page.waitForTimeout(1800);
    L("missingProject",await info(page)); await page.screenshot({path:D+`shots/newtab__missing-project__1440.png`});
    L("missingProjectCard",await page.locator("main").innerText());
    // 503
    await page.route(`${API}/projects/${P}/places*`,r=>r.fulfill({status:503,contentType:"application/problem+json",body:JSON.stringify({type:"about:blank",title:"Service Unavailable",status:503,detail:"SQL timeout on db-3 secret",code:"PLATFORM_UNAVAILABLE",requestId:"req-r3-s14-503"})}));
    await go(page,`/projects/${P}/app-preview`); await page.waitForTimeout(2500);
    L("503",await info(page)); L("503text",await page.locator("main").innerText()); await page.screenshot({path:D+`shots/newtab__503__1440.png`});
    await page.unroute(`${API}/projects/${P}/places*`);
    // interactions: change selects, history
    await go(page,`/projects/${P}/app-preview`); await page.waitForTimeout(1500);
    await page.locator("#np-surface").selectOption("MOBILE"); await page.waitForTimeout(600); L("afterSurface",page.url()+" | "+await page.evaluate(()=>document.title));
    await page.locator("#np-lang").selectOption({index:1}); await page.waitForTimeout(600); L("afterLang",page.url()+" | "+await page.evaluate(()=>document.title));
    await page.goBack(); await page.waitForTimeout(600); L("afterBack",page.url());
    // keyboard
    await page.evaluate(()=>document.body.focus());
    const seq=[];for(let i=0;i<8;i++){await page.keyboard.press("Tab");seq.push(await page.evaluate(()=>document.activeElement.tagName+':'+(document.activeElement.getAttribute('aria-label')||document.activeElement.id||document.activeElement.textContent).trim().slice(0,30)));}
    L("kbd",seq);
    // focus ring on dark? 
  }
  await browser.close();
}
writeFileSync(D+"a7.json",JSON.stringify(log,null,1));
