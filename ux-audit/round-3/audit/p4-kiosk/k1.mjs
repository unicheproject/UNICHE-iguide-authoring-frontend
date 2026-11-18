import { open, go } from "../../../tools/session.mjs"; import {P,shotp,log,rects} from "./lib.mjs"; import {coarse} from "./tlib.mjs";
// toasts at tablet widths
for (const vp of ["1024","768"]) {
 const { browser, context, page } = await open("admin",{viewport:vp,touch:true}); await coarse(page);
 await context.grantPermissions(["clipboard-read","clipboard-write"],{origin:"http://localhost:5173"});
 await go(page,`/projects/${P}/pois/40cab7b2-a7f7-4057-b56e-5605a589156f`); await page.getByRole("heading",{name:/How visitors reach it/}).scrollIntoViewIfNeeded(); await page.waitForTimeout(700);
 const cp=page.getByRole("button",{name:"Copy link"}); await cp.scrollIntoViewIfNeeded(); await cp.tap(); await page.waitForTimeout(600);
 const t=await page.evaluate(()=>{const e=[...document.querySelectorAll("[role=status]")].find(x=>/Link copied/.test(x.textContent)&&x.getBoundingClientRect().width>10);const b=e?.getBoundingClientRect();const c=[...document.querySelectorAll("main button,main a,main input")].filter(x=>{const r=x.getBoundingClientRect();return b&&r.width&&r.right>b.left&&r.left<b.right&&r.bottom>b.top&&r.top<b.bottom}).map(x=>(x.getAttribute("aria-label")||x.textContent||x.type).trim().slice(0,25));return {toast:b&&[Math.round(b.x),Math.round(b.y),Math.round(b.width),Math.round(b.height)],vw:innerWidth,vh:innerHeight,covers:c}});
 log(vp,"toast",t); await page.screenshot({path:shotp(`poi-triggers__copied-toast__${vp}-touch`)}); await browser.close(); }
// keyboard run on preview page
const { browser, page } = await open("admin",{viewport:"1440"});
await go(page,`/projects/${P}/preview`); await page.waitForSelector("[data-preview-frame]"); await page.waitForTimeout(1200);
await page.evaluate(()=>document.activeElement.blur()); const seq=[];
for(let i=0;i<30;i++){ await page.keyboard.press("Tab"); const d=await page.evaluate(()=>{const e=document.activeElement;const cs=getComputedStyle(e);const b=e.getBoundingClientRect();return {t:(e.getAttribute("aria-label")||e.textContent||e.tagName).trim().replace(/\s+/g," ").slice(0,32),role:e.getAttribute("role")||e.tagName,ol:cs.outlineStyle+" "+cs.outlineWidth+" "+cs.outlineColor,bs:cs.boxShadow.slice(0,50),vis:b.width>1&&b.bottom>0&&b.top<innerHeight}});seq.push(d); if(/Skip preview|End of preview/.test(d.t)&&i>12)break;}
log(JSON.stringify(seq.map(s=>`${s.role}:${s.t}${s.vis?"":" (offscreen)"} | ${s.ol} | ${s.bs}`)));
await page.screenshot({path:shotp("preview__keyboard-focus__1440")});
await browser.close();
