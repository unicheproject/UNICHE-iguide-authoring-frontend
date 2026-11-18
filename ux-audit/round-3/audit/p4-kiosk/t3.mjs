import { open, go } from "../../../tools/session.mjs"; import {P,shotp,log} from "./lib.mjs"; import {coarse,small} from "./tlib.mjs";
const { browser, page } = await open("admin",{viewport:"768",touch:true}); await coarse(page);
for (const [w,h] of [[768,600],[1024,768],[768,1024],[1024,480]]) {
 await page.setViewportSize({width:w,height:h});
 await go(page,`/projects/${P}/pois/40cab7b2-a7f7-4057-b56e-5605a589156f`); await page.waitForSelector("text=How visitors reach it"); await page.waitForTimeout(1000);
 const probe=()=>page.evaluate(()=>{const r=e=>{if(!e)return null;const b=e.getBoundingClientRect();return [Math.round(b.y),Math.round(b.height)]};
  const hdr=document.querySelector("header:not(:first-of-type), main header")||null; const apply=[...document.querySelectorAll("button")].find(b=>/Apply changes/.test(b.textContent)); const save=[...document.querySelectorAll("button")].find(b=>/^Save draft/.test(b.textContent.trim()));
  const banner=save?.closest("[class*=sticky],div"); return {apply:r(apply),save:r(save),appHeader:r(document.querySelector("body > div header, #app header")), y:Math.round(scrollY), sc:window.__sc?[window.__sc.tagName,(window.__sc.id||window.__sc.className+'').slice(0,30),Math.round(window.__sc.scrollTop)]:null}});
 const sticky=await page.evaluate(()=>[...document.querySelectorAll("*")].filter(e=>getComputedStyle(e).position==="sticky"||getComputedStyle(e).position==="fixed").map(e=>{const b=e.getBoundingClientRect();return e.tagName.toLowerCase()+"."+(e.className+"").slice(0,40)+" y"+Math.round(b.y)+" h"+Math.round(b.height)+" w"+Math.round(b.width)}).filter(s=>!/ w0/.test(s)));
 log(`== ${w}x${h} top`,await probe()); log(" sticky",sticky);
 await page.mouse.move(300,300); await page.evaluate(()=>{const sc=[...document.querySelectorAll('main, #main, body > div, body > div > div, html')].concat([...document.querySelectorAll('*')]).find(e=>e.scrollHeight>e.clientHeight+50&&/auto|scroll/.test(getComputedStyle(e).overflowY)&&e.clientHeight>300)||document.scrollingElement;window.__sc=sc;sc.scrollTop=700;});await page.waitForTimeout(400);
 log(" after scroll 700",await probe());
 const sticky2=await page.evaluate(()=>[...document.querySelectorAll("*")].filter(e=>getComputedStyle(e).position==="sticky"||getComputedStyle(e).position==="fixed").map(e=>{const b=e.getBoundingClientRect();return e.tagName.toLowerCase()+" y"+Math.round(b.y)+" h"+Math.round(b.height)}).filter(s=>!/h0$/.test(s)));
 log(" sticky after",sticky2);
 await page.screenshot({path:shotp(`poi-editor__scrolled-touch__${w}x${h}`)});
 // focus a field at bottom: tap a title input after scroll and see if visible under stack
 await page.evaluate(()=>{window.__sc&&(window.__sc.scrollTop=0)});
 const f=page.getByLabel(/^Title/).first(); await f.tap(); await page.waitForTimeout(400);
 const fb=await f.boundingBox(); log(" tapped title field y",Math.round(fb.y),"stack bottom ~", sticky2.map(s=>s).join(";"));
}
await browser.close();
