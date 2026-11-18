import { open, go } from "../../../tools/session.mjs";
import { writeFileSync } from "node:fs";
const P="6958c18f-60d2-4140-a524-5a43f8a2f6b5";
const D="ux-audit/round-3/audit/s14-preview/";
const log=[]; const L=(k,v)=>{log.push([k,v]);console.log(k,JSON.stringify(v));};
// reduced motion
{
 const s=await open("admin",{viewport:"1440",reducedMotion:"reduce"}); const page=s.page;
 await go(page,`/projects/${P}/preview`); await page.waitForTimeout(1200);
 await page.getByRole("tab",{name:"Kiosk",exact:true}).click();
 L("RM anims",await page.evaluate(()=>document.getAnimations().map(a=>[a.transitionProperty||a.animationName,a.effect.getTiming().duration])));
 L("RM transitionDur",await page.evaluate(()=>getComputedStyle(document.querySelector('[role=tab]')).transitionDuration));
 await page.getByRole("button",{name:/^Interact/}).click(); await page.waitForTimeout(400);
 L("RM spinning",await page.evaluate(()=>document.getAnimations().length));
 await s.browser.close();
}
// forced colors
{
 const s=await open("admin",{viewport:"1280",forcedColors:"active"}); const page=s.page;
 await go(page,`/projects/${P}/preview`); await page.waitForTimeout(1500);
 await page.screenshot({path:D+"shots/preview__forced-colors__1280.png"});
 L("FC selected tabs",await page.evaluate(()=>[...document.querySelectorAll('[role=tab][aria-selected=true]')].map(t=>{const c=getComputedStyle(t);return [t.textContent.trim(),c.backgroundColor,c.color,c.borderBottomColor,c.borderBottomWidth]})));
 L("FC unselected",await page.evaluate(()=>[...document.querySelectorAll('[role=tab][aria-selected=false]')].slice(0,2).map(t=>{const c=getComputedStyle(t);return [t.textContent.trim(),c.backgroundColor,c.color]})));
 const sel=page.locator("#fire-trigger"); const fb=page.getByRole("button",{name:/^Fire/});
 L("FC fire disabled",await fb.evaluate(b=>{const c=getComputedStyle(b);return [c.color,c.borderColor,c.backgroundColor,c.opacity]}));
 await page.getByRole("tab",{name:"Mobile",exact:true}).click();
 await sel.selectOption({index:1}); await fb.click(); await page.waitForTimeout(600);
 await page.screenshot({path:D+"shots/preview__forced-colors-fired__1280.png"});
 L("FC chip",await page.evaluate(()=>{const e=[...document.querySelectorAll('span')].find(e=>/^Fired:/.test(e.textContent.trim()));const p=e.parentElement;const c=getComputedStyle(p);return [p.className.slice(0,60),c.color,c.backgroundColor,c.borderTopWidth,c.borderTopColor]}));
 // interact: focus ring in forced colors on the stand-in
 await page.getByRole("button",{name:/^Interact/}).click(); await page.keyboard.press("Tab"); await page.waitForTimeout(200);
 await page.screenshot({path:D+"shots/preview__forced-colors-interacting__1280.png"});
 await s.browser.close();
}
// focus ring contrast on stand-in header (normal colours)
{
 const s=await open("admin",{viewport:"1440"}); const page=s.page;
 await go(page,`/projects/${P}/preview`); await page.waitForTimeout(1200);
 await page.getByRole("button",{name:/^Interact/}).click(); await page.waitForTimeout(300);
 await page.keyboard.press("Tab"); await page.waitForTimeout(200);
 L("ring in stand-in",await page.evaluate(()=>{const a=document.activeElement;const c=getComputedStyle(a);let p=a;let bg;while(p){bg=getComputedStyle(p).backgroundColor;if(bg!=='rgba(0, 0, 0, 0)')break;p=p.parentElement}return {el:a.tagName+':'+a.textContent.trim().slice(0,20),outline:c.outline,offset:c.outlineOffset,bg}}));
 await page.screenshot({path:D+"shots/preview__interacting-focus-ring__1440.png",clip:{x:256,y:350,width:1160,height:100}});
 // Interact button states
 const ib=page.getByRole("button",{name:/Stop interacting/});
 L("interact pressed",await ib.evaluate(b=>({txt:b.textContent.trim(),pressed:b.getAttribute("aria-pressed"),bg:getComputedStyle(b).backgroundColor,h:b.getBoundingClientRect().height})));
 await page.screenshot({path:D+"shots/preview__interacting__1440.png"});
 // Toolbar vs content column
 L("columns",await page.evaluate(()=>{const r=e=>e.getBoundingClientRect();const tb=r(document.querySelector('[data-preview-toolbar]'));const h=r(document.querySelector('h1'));const reg=r(document.querySelector('[role=region]'));return {tbL:tb.left,tbR:tb.right,h1L:h.left,regL:reg.left,regR:reg.right}}));
 // contrast of warning text
 await go(page,`/projects/${P}/preview?trigger=00000000-0000-4000-8000-000000000000`); await page.waitForTimeout(1500);
 L("warning text",await page.evaluate(()=>{const p=[...document.querySelectorAll('p[role=status]')].find(e=>/not found/.test(e.textContent));const c=getComputedStyle(p);return {color:c.color,bg:getComputedStyle(document.body).backgroundColor,fs:c.fontSize,page:getComputedStyle(p.closest('main')||document.body).backgroundColor}}));
 await s.browser.close();
}
// touch 1024
{
 const s=await open("admin",{viewport:"1024",touch:true}); const page=s.page;
 await go(page,`/projects/${P}/preview`); await page.waitForTimeout(1500);
 L("touch targets",await page.evaluate(()=>[...document.querySelectorAll('[data-preview-toolbar] [role=tab],[data-preview-toolbar] button,[data-preview-toolbar] select,[data-preview-toolbar] input,[role=region] button,[role=region] [role=tab],main > div button')].map(e=>{const b=e.getBoundingClientRect();return [e.textContent.trim().slice(0,16)||e.id||e.tagName,Math.round(b.width),Math.round(b.height)]}).filter(x=>x[2]<44||x[1]<44)));
 await page.getByRole("tab",{name:"Mobile",exact:true}).tap(); await page.waitForTimeout(400);
 await page.screenshot({path:D+"shots/preview__touch__1024.png"});
 await page.getByRole("button",{name:/^Interact/}).tap(); await page.waitForTimeout(400);
 L("touch interact",await page.evaluate(()=>document.activeElement.textContent.trim().slice(0,30)));
 await page.screenshot({path:D+"shots/preview__touch-interacting__1024.png"});
 await s.browser.close();
}
writeFileSync(D+"a10.json",JSON.stringify(log,null,1));
