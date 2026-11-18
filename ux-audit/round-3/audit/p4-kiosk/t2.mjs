import { open, go } from "../../../tools/session.mjs"; import {P,shotp,log,rects} from "./lib.mjs"; import {coarse,small} from "./tlib.mjs";
const { browser, page } = await open("admin",{viewport:"768",touch:true}); await coarse(page);
const errs=[]; page.on("pageerror",e=>errs.push(String(e)));
await go(page,`/projects/${P}/pois`); await page.waitForTimeout(2500);
// drawer
await page.getByRole("button",{name:/Menu/}).first().tap(); await page.waitForTimeout(600);
await page.screenshot({path:shotp("nav-drawer__open__768")});
const d=await page.evaluate(()=>{const dlg=document.querySelector("[role=dialog]");const b=dlg?.getBoundingClientRect();return {dlg:b&&[b.x|0,b.y|0,b.width|0,b.height|0],items:[...(dlg?.querySelectorAll("a,button")||[])].map(e=>{const r=e.getBoundingClientRect();return (e.textContent||e.getAttribute("aria-label")||"").trim().slice(0,18)+":"+Math.round(r.width)+"x"+Math.round(r.height)}),focus:document.activeElement.tagName+":"+(document.activeElement.getAttribute("aria-label")||document.activeElement.textContent||"").trim().slice(0,20)}});
log("drawer",d);
const sm=await small(page,"[role=dialog]"); log("drawer small",sm);
// tap link inside
await page.getByRole("dialog").getByRole("link",{name:/Places/}).tap(); await page.waitForTimeout(1500);
log("after nav tap url",page.url().replace(/.*5173/,""),"dialog open?",await page.getByRole("dialog").count());
// tap-away on overlay
await page.getByRole("button",{name:/Menu/}).first().tap(); await page.waitForTimeout(500);
await page.touchscreen.tap(740,500); await page.waitForTimeout(500); log("tap-away closes?",await page.getByRole("dialog").count()===0);
// row menu
await go(page,`/projects/${P}/pois`); await page.waitForTimeout(2500);
const kebab=page.getByRole("button",{name:/^Actions for/}).first(); log("kebab box",await kebab.boundingBox());
await kebab.tap(); await page.waitForTimeout(600); await page.screenshot({path:shotp("poi-list__row-menu__768-touch")});
log("menu items",await page.evaluate(()=>[...document.querySelectorAll("[role=menuitem]")].map(e=>{const r=e.getBoundingClientRect();return e.textContent.trim()+":"+Math.round(r.width)+"x"+Math.round(r.height)})));
await page.keyboard.press("Escape");
// create dialog at 768x1024 and short
await page.getByRole("button",{name:/New point of interest/}).tap(); await page.waitForTimeout(700);
await page.screenshot({path:shotp("poi-list__create-dialog__768-touch")});
const dm=()=>page.evaluate(()=>{const d=document.querySelector("[role=dialog]");const r=d.getBoundingClientRect();const f=[...d.querySelectorAll("button")].filter(b=>/Create|Cancel/.test(b.textContent));return {dlg:[r.x|0,r.y|0,r.width|0,r.height|0],vh:innerHeight,footer:f.map(b=>{const q=b.getBoundingClientRect();return b.textContent.trim()+"@y"+Math.round(q.y)+" "+Math.round(q.width)+"x"+Math.round(q.height)}),scroll:d.scrollHeight>d.clientHeight, bodyScroll:[...d.querySelectorAll("*")].some(e=>e.scrollHeight>e.clientHeight+1&&/auto|scroll/.test(getComputedStyle(e).overflowY))}});
log("create dlg 768x1024",await dm()); log("dlg small",(await small(page,"[role=dialog]")).small);
await page.setViewportSize({width:768,height:600}); await page.waitForTimeout(500); await page.screenshot({path:shotp("poi-list__create-dialog__768x600-touch")}); log("create dlg 768x600",await dm());
await page.setViewportSize({width:1024,height:600}); await page.waitForTimeout(400); log("create dlg 1024x600",await dm());
await page.setViewportSize({width:768,height:360}); await page.waitForTimeout(400); await page.screenshot({path:shotp("poi-list__create-dialog__768x360-touch")}); log("create dlg 768x360",await dm());
await page.keyboard.press("Escape");
log(errs); await browser.close();
