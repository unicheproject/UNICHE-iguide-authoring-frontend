import { open, go } from "../../../tools/session.mjs";
import { writeFileSync, readFileSync } from "node:fs";
const P="6958c18f-60d2-4140-a524-5a43f8a2f6b5";
const D="ux-audit/round-3/audit/s14-preview/";
const T=JSON.parse(readFileSync(D+"triggers.json"));
const qr=T.find(t=>t.type==="QR_CODE"&&t.status==="DRAFT"), qrA=T.find(t=>t.type==="QR_CODE"&&t.status==="ACTIVE"), bc=T.find(t=>t.type==="BEACON");
console.log("active qr",qrA?.id,"beacon",bc?.id, T.map(t=>t.status).reduce((a,s)=>(a[s]=(a[s]||0)+1,a),{}));
const log=[]; const L=(k,v)=>{log.push([k,v]);console.log(k,JSON.stringify(v));};
const { browser, page } = await open("admin",{viewport:"1440"});
const desc=()=>page.evaluate(()=>{const a=document.activeElement;if(!a)return null;const b=a.getBoundingClientRect();return {tag:a.tagName,role:a.getAttribute('role'),name:(a.getAttribute('aria-label')||a.textContent||'').trim().slice(0,40),id:a.id,y:Math.round(b.y),sel:a.getAttribute('aria-selected')}});
await go(page,`/projects/${P}/preview`); await page.waitForTimeout(1500);
// 1 tab order
await page.evaluate(()=>{document.querySelector('main h1')?.setAttribute('tabindex','-1');document.querySelector('main h1')?.focus();});
const seq=[];
for(let i=0;i<22;i++){await page.keyboard.press("Tab"); seq.push(await desc()); }
L("tabOrder",seq.map(s=>`${s.tag}${s.role?'/'+s.role:''}:${s.name}${s.sel?'['+s.sel+']':''}`));
// reset & focus ring on a tab
await go(page,`/projects/${P}/preview`); await page.waitForTimeout(1200);
const mob=page.getByRole("tab",{name:"Mobile",exact:true});
await mob.focus(); await page.keyboard.press("Shift+Tab"); await page.keyboard.press("Tab");
L("ring",await page.evaluate(()=>{const a=document.activeElement;const cs=getComputedStyle(a);const tl=a.closest('[role=tablist]');const ab=a.getBoundingClientRect(),tb=tl.getBoundingClientRect();return {out:cs.outline,off:cs.outlineOffset,boxShadow:cs.boxShadow.slice(0,120),tlOverflow:getComputedStyle(tl).overflow,pOverflow:getComputedStyle(tl.parentElement).overflow,gap:{L:ab.left-tb.left,T:ab.top-tb.top,B:tb.bottom-ab.bottom},sh:tl.scrollHeight,ch:tl.clientHeight}}));
await page.screenshot({path:D+"shots/preview__tab-focus__1440.png",clip:{x:240,y:170,width:700,height:70}});
// help hints
L("helpHints",await page.evaluate(()=>[...document.querySelectorAll('button[aria-label],button')].filter(b=>/help|what is|more about/i.test((b.getAttribute('aria-label')||'')+b.title)).map(b=>b.getAttribute('aria-label'))));
// 3 fire a QR (Web)
const sel=page.locator("#fire-trigger");
const opts=await sel.evaluate(s=>[...s.options].map(o=>[o.value,o.textContent,o.parentElement.label||'']));
L("webOptions",opts.length+" "+JSON.stringify(opts.slice(0,4)));
// disabled Fire hover/tooltip
L("fireDisabled",await page.evaluate(()=>{const b=[...document.querySelectorAll('button')].find(b=>b.textContent.startsWith('Fire'));return {dis:b.disabled,aria:b.getAttribute('aria-disabled'),desc:b.getAttribute('aria-describedby'),t:b.textContent}}));
await page.getByRole("button",{name:/^Fire/}).hover(); await page.waitForTimeout(400);
await page.screenshot({path:D+"shots/preview__fire-disabled-hover__1440.png",clip:{x:240,y:170,width:1180,height:200}});
await sel.selectOption(qr.id);
await page.getByRole("button",{name:/^Fire/}).click(); await page.waitForTimeout(800);
L("chip",await page.evaluate(()=>[...document.querySelectorAll('span,div')].filter(e=>/^Fired:/.test(e.textContent.trim())&&e.children.length<2).map(e=>e.textContent.trim()).slice(0,2)));
await page.screenshot({path:D+"shots/preview__fired-web__1440.png"});
L("focusAfterFire",await desc());
await page.getByRole("button",{name:/Reset/}).click(); await page.waitForTimeout(400);
L("focusAfterReset",await desc());
L("chipGone",await page.getByText(/^Fired:/).count());
// toolbar height change when chip shows?
// 4 mobile beacon
await mob.click(); await page.waitForTimeout(500);
await page.screenshot({path:D+"shots/preview__mobile-idle__1440.png"});
const mopts=await sel.evaluate(s=>[...s.options].length);
L("mobileOptions",mopts);
await sel.selectOption(bc.id); await page.getByRole("button",{name:/^Fire/}).click(); await page.waitForTimeout(800);
await page.screenshot({path:D+"shots/preview__fired-beacon-mobile__1440.png"});
L("notes",await page.locator("#fire-trigger-notes").innerText());
// 5 interact / esc order
await page.getByRole("button",{name:/^Interact/}).click(); await page.waitForTimeout(300);
L("afterInteract",await desc());
await page.screenshot({path:D+"shots/preview__interacting-mobile__1440.png"});
await page.keyboard.press("Escape"); await page.waitForTimeout(300);
L("afterEsc1",await desc());
L("pressed",await page.getByRole("button",{name:/Interact/}).getAttribute("aria-pressed"));
// skip link
await page.getByRole("tab",{name:"Web",exact:true}).focus();
for(let i=0;i<15;i++){await page.keyboard.press("Tab"); const d=await desc(); if(d.name==="Skip preview"){L("skipFound",i+1);await page.screenshot({path:D+"shots/preview__skip-focus__1440.png",clip:{x:240,y:290,width:1180,height:120}});await page.keyboard.press("Enter");await page.waitForTimeout(200);L("afterSkip",await desc());await page.keyboard.press("Tab");L("afterSkipTab",await desc());break;}}
// 7 animations on surface change
await page.evaluate(()=>window.__a=[]);
await page.getByRole("tab",{name:"Kiosk",exact:true}).click();
L("anims",await page.evaluate(()=>document.getAnimations().map(a=>[a.constructor.name,a.transitionProperty||a.animationName,a.effect?.getTiming().duration,a.effect?.target?.className?.toString().slice(0,50)])));
await browser.close();
writeFileSync(D+"a4.json",JSON.stringify(log,null,1));
