import { open, go } from "../../../tools/session.mjs"; import {P,shotp,log,rects} from "./lib.mjs"; import {coarse,small} from "./tlib.mjs";
const vp=process.argv[2]||"1024";
const { browser, page } = await open("admin",{viewport:vp,touch:true}); const cdp=await coarse(page);
const errs=[]; page.on("pageerror",e=>errs.push(String(e)));
await go(page,`/projects/${P}/maps/f8daa876-f2af-4552-95ae-431c96ed1b2d`); await page.waitForTimeout(4000);
await page.screenshot({path:shotp(`map-editor__touch-default__${vp}`)});
const mapBox=await page.evaluate(()=>{const m=document.querySelector(".leaflet-container");if(!m)return null;const b=m.getBoundingClientRect();return {x:b.x|0,y:b.y|0,w:b.width|0,h:b.height|0,ta:getComputedStyle(m).touchAction,cls:m.className.slice(0,80)}});
log("map",mapBox);
log("controls near map",await page.evaluate(`(${rects})("main button, main [role=switch], main [role=tab]")`).then(a=>a.filter(x=>/map|Move|Pan|Zoom|Lock|Edit/i.test(x.t)).slice(0,20)));
const mainTop=()=>page.evaluate(()=>document.querySelector("main").scrollTop);
const center=()=>page.evaluate(()=>{const m=document.querySelector(".leaflet-container");const t=m.querySelector(".leaflet-map-pane");return getComputedStyle(t).transform});
const swipe=async(x,y,dy,label)=>{const t0=await mainTop();const c0=await page.evaluate(()=>{const p=document.querySelector(".leaflet-pane.leaflet-map-pane");return p?p.style.transform:null});
 await cdp.send("Input.synthesizeScrollGesture",{x,y,yDistance:dy,gestureSourceType:"touch",speed:800}); await page.waitForTimeout(700);
 const t1=await mainTop();const c1=await page.evaluate(()=>{const p=document.querySelector(".leaflet-pane.leaflet-map-pane");return p?p.style.transform:null});
 log(label,"main scroll",t0,"->",t1,"map pane",c0,"->",c1);};
if(mapBox){ const cx=mapBox.x+mapBox.w/2, cy=mapBox.y+Math.min(mapBox.h/2,300);
 await swipe(cx,cy,-300,"swipe up over map");
 await page.evaluate(()=>document.querySelector("main").scrollTop=0);
 const mm=page.getByRole("button",{name:/Move map|Pan/i}); log("move map btn",await mm.count(), await mm.first().evaluate(e=>[e.textContent.trim(),e.getAttribute("aria-pressed"),e.getBoundingClientRect().width|0,e.getBoundingClientRect().height|0]).catch(()=>null));
 if(await mm.count()){ await mm.first().tap(); await page.waitForTimeout(400); await page.screenshot({path:shotp(`map-editor__move-map-on__${vp}`)});
   log("touch-action while pan on",await page.evaluate(()=>getComputedStyle(document.querySelector(".leaflet-container")).touchAction));
   await swipe(cx,cy,-120,"swipe in Move map mode"); await page.screenshot({path:shotp(`map-editor__move-map-after-swipe__${vp}`)}); }
}
log("small",(await small(page)).small.filter(s=>!/UNICHE/.test(s.t)));
log(errs); await browser.close();
