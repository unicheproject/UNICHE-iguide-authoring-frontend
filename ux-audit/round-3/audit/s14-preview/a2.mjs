import { open, go } from "../../../tools/session.mjs";
import { writeFileSync } from "node:fs";
const P="6958c18f-60d2-4140-a524-5a43f8a2f6b5";
const D="ux-audit/round-3/audit/s14-preview/";
const out=[];
for (const vp of ["1440","1280","1024","768","zoom200"]) {
  const { browser, page } = await open("admin",{viewport:vp});
  await go(page,`/projects/${P}/preview`);
  await page.waitForTimeout(1200);
  for (const surf of ["Web","Mobile","Kiosk"]) {
    await page.getByRole("tab",{name:surf,exact:true}).click();
    await page.waitForTimeout(500);
    const orients = surf==="Kiosk"?["Portrait","Landscape"]:[null];
    for (const o of orients) {
      if(o) {await page.getByRole("tab",{name:o}).click(); await page.waitForTimeout(300);}
      const sizes = surf==="Mobile"?[null]:["Fit width","100 %","50 %"];
      for (const z of sizes) {
        if (z){ const t=page.getByRole("tab",{name:z,exact:true}); if(await t.count()) {await t.click(); await page.waitForTimeout(400);} else {out.push({vp,surf,o,z,missing:true}); continue;} }
        const m=await page.evaluate(()=>{
          const f=document.querySelector('[data-preview-frame]');const inner=f.firstElementChild;
          const reg=document.querySelector('[role=region]');
          const cap=reg.querySelector('p').textContent.replace(/\s+/g,' ').trim();
          const b=inner.getBoundingClientRect(), fb=f.getBoundingClientRect();
          const tabs=[...document.querySelectorAll('[role=tablist]')].map(t=>t.getAttribute('aria-label')+':'+[...t.querySelectorAll('[role=tab]')].map(x=>x.textContent.trim()).join('/'));
          return {scale:f.dataset.scale,frameW:Math.round(b.width*10)/10,hostW:Math.round(fb.width),frameTop:Math.round(b.top+scrollY),hostH:Math.round(fb.height),frameH:Math.round(b.height),sw:document.documentElement.scrollWidth-document.documentElement.clientWidth,hostSW:f.scrollWidth>f.clientWidth,cap,tabs,regionTop:Math.round(reg.getBoundingClientRect().top+scrollY),docH:document.documentElement.scrollHeight};
        });
        out.push({vp,surf,o,z,...m});
        if (["1440","768","zoom200"].includes(vp)) await page.screenshot({path:`${D}shots/preview__${surf}${o?"-"+o:""}-${(z||"real").replace(/[ %]/g,"")}__${vp}.png`});
      }
    }
  }
  await browser.close();
}
writeFileSync(D+"a2.json",JSON.stringify(out,null,1));
for(const r of out) console.log(r.vp,r.surf,r.o||"",r.z||"-",r.missing?"MISSING":`scale ${r.scale} frameW ${r.frameW} host ${r.hostW} top ${r.frameTop} regionTop ${r.regionTop} sw ${r.sw} hostSW ${r.hostSW} | ${r.cap.slice(0,110)}`);
