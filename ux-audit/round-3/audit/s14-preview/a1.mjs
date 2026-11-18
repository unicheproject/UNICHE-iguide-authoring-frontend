import { open, go, CMS, VIEWPORTS } from "../../../tools/session.mjs";
import { writeFileSync } from "node:fs";
const P="6958c18f-60d2-4140-a524-5a43f8a2f6b5";
const out={};
for (const vp of ["1440","1280","1024","768","zoom200"]) {
  const { browser, page } = await open("admin",{viewport:vp});
  await go(page,`/projects/${P}/preview`);
  await page.waitForTimeout(1500);
  await page.screenshot({path:`ux-audit/round-3/audit/s14-preview/shots/preview__default__${vp}.png`});
  out[vp]=await page.evaluate(()=>{
    const r=e=>{const b=e?.getBoundingClientRect();return b&&{x:Math.round(b.x*10)/10,y:Math.round(b.y*10)/10,w:Math.round(b.width*10)/10,h:Math.round(b.height*10)/10}};
    const tb=document.querySelector('[data-preview-toolbar]');
    const main=document.querySelector('main')||document.body;
    const region=document.querySelector('[role=region]');
    const tabs=[...document.querySelectorAll('[role=tablist]')].map(t=>({l:t.getAttribute('aria-label'),r:r(t),btns:[...t.children].map(c=>r(c))}));
    const labels=[...tb.querySelectorAll('span.text-xs')].map(s=>({t:s.textContent,r:r(s),sr:getComputedStyle(s).position}));
    const label=[...tb.querySelectorAll('label')].map(s=>({t:s.textContent,r:r(s)}));
    const sel=r(document.getElementById('fire-trigger'));
    const btns=[...tb.querySelectorAll('button')].filter(b=>!b.getAttribute('role')).map(b=>({t:b.textContent.trim(),r:r(b),dis:b.disabled||b.getAttribute('aria-disabled')}));
    const hint=tb.querySelectorAll('[data-help-hint],button[aria-label*="Help"],button[aria-label*="help"]').length;
    const frame=region&&[...region.querySelectorAll('*')].filter(e=>e.getBoundingClientRect().width>200).slice(0,6).map(e=>[e.tagName,e.className.toString().slice(0,50),r(e)]);
    return {sw:document.documentElement.scrollWidth,cw:document.documentElement.clientWidth,tb:r(tb),main:r(document.querySelector('#main, main')),region:r(region),regionLabel:region?.getAttribute('aria-label'),tabs,labels,label,sel,btns,hint,frame,
      caption:[...document.querySelectorAll('[role=region] p, [role=region] span')].map(e=>e.textContent.trim()).filter(t=>/%|Fit|real/i.test(t)).slice(0,6),
      title:document.title};
  });
  await browser.close();
}
writeFileSync("ux-audit/round-3/audit/s14-preview/a1.json",JSON.stringify(out,null,1));
console.log(JSON.stringify(out["1440"],null,1).slice(0,5000));
