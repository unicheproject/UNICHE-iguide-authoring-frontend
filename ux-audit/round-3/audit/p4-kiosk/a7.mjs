import { open, go } from "../../../tools/session.mjs"; import {P,shotp,log,rects,here} from "./lib.mjs";
const vp=process.argv[2]||"1440"; const touch=process.argv[3]==="touch";
const { browser, context, page } = await open("admin",{viewport:vp,touch});
const poi="a12564e2-1d45-4441-b421-ef3497979ef6";
await go(page,`/projects/${P}/pois/${poi}`); await page.waitForSelector("text=How visitors reach it",{timeout:20000}); await page.waitForTimeout(800);
if(vp==="1440"){
 const h=page.getByText("Beacon (Bluetooth)",{exact:false}).first(); await h.scrollIntoViewIfNeeded(); await page.waitForTimeout(400);
 await page.screenshot({path:shotp("poi-beacon__default__1440")});
 log("beacon region text",(await page.locator("main").innerText()).split("\n").filter(l=>/Mobile app|beacon|Beacon|iBeacon|UUID|Major|Minor|only/i.test(l)).slice(0,20));
}
await go(page,`/projects/${P}/pois/${poi}`); await page.waitForTimeout(1200);
const btn=page.getByRole("button",{name:/Preview in app/}).first(); log("btn visible",await btn.isVisible(), await btn.evaluate(e=>{const b=e.getBoundingClientRect();return [Math.round(b.x),Math.round(b.y),b.width,b.height]}));
await btn.scrollIntoViewIfNeeded(); await btn.click(); await page.waitForTimeout(2500);
await page.screenshot({path:shotp(`poi-preview-panel__open__${vp}${touch?"-touch":""}`)});
const info=()=>page.evaluate(()=>{const r=e=>{const b=e.getBoundingClientRect();return {x:Math.round(b.x),y:Math.round(b.y),w:Math.round(b.width),h:Math.round(b.height)}};
 const fr=document.querySelector("[data-preview-frame]"); const panel=fr?.closest("[role=region],[role=dialog],section");
 const apply=[...document.querySelectorAll("button")].find(b=>/Apply changes/.test(b.textContent));
 const ab=apply&&r(apply); const hit=ab&&document.elementFromPoint(ab.x+ab.w/2,ab.y+ab.h/2);
 return {frame:fr&&{...r(fr),scale:fr.dataset.scale,inner:r(fr.firstElementChild)},panel:panel&&r(panel),applyBox:ab,applyHit:hit&&(hit.textContent||"").trim().slice(0,30),docSW:document.documentElement.scrollWidth,cw:document.documentElement.clientWidth,
  controls:[...document.querySelectorAll("[role=dialog] button,[role=dialog] [role=tab],[role=region] [role=tab],section [role=tab]")].filter(e=>e.offsetParent).map(e=>({t:(e.getAttribute("aria-label")||e.textContent||"").trim().slice(0,28),...r(e)})).filter(c=>c.w>0).slice(0,24)}});
log("open",await info());
const exp=page.getByRole("button",{name:/Expand/}); log("expand count",await exp.count());
if(await exp.count()){ await exp.first().click(); await page.waitForTimeout(1200); await page.screenshot({path:shotp(`poi-preview-panel__expanded__${vp}${touch?"-touch":""}`)}); log("expanded",await info());
  await page.keyboard.press("Escape"); await page.waitForTimeout(300); log("after esc 1 expanded?",await page.getByRole("button",{name:/Collapse|Shrink|Close/}).count());}
await browser.close();
