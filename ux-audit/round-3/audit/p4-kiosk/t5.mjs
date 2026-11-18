import { open, go } from "../../../tools/session.mjs"; import {P,shotp,log} from "./lib.mjs"; import {coarse} from "./tlib.mjs";
const vp=process.argv[2]||"1024";
const { browser, page } = await open("admin",{viewport:vp,touch:true}); const cdp=await coarse(page);
await go(page,`/projects/${P}/maps/f8daa876-f2af-4552-95ae-431c96ed1b2d`); await page.waitForTimeout(4000);
const state=()=>page.evaluate(()=>{const p=document.querySelector(".leaflet-map-pane");const m=document.querySelector(".leaflet-container");const b=m.getBoundingClientRect();return {main:document.querySelector("main").scrollTop,pane:p.style.transform,ta:getComputedStyle(m).touchAction,mapY:Math.round(b.y),mapH:Math.round(b.height)}});
async function drag(x,y,dy,steps=10){ // finger moves up by dy (page scrolls down)
 await cdp.send("Input.dispatchTouchEvent",{type:"touchStart",touchPoints:[{x,y}]});
 for(let i=1;i<=steps;i++){await cdp.send("Input.dispatchTouchEvent",{type:"touchMove",touchPoints:[{x,y:y+dy*i/steps}]});await page.waitForTimeout(16);}
 await cdp.send("Input.dispatchTouchEvent",{type:"touchEnd",touchPoints:[]}); await page.waitForTimeout(600);}
const s0=await state(); log("start",s0);
const mb=await page.evaluate(()=>{const b=document.querySelector(".leaflet-container").getBoundingClientRect();return {x:b.x,y:b.y,w:b.width,h:b.height}});
log("control swipe outside map (x=500,y=200)"); let a=await state(); await drag(500,300,-200); log(a.main,"->",(await state()).main);
await page.evaluate(()=>document.querySelector("main").scrollTop=0); await page.waitForTimeout(300);
const b2=await page.evaluate(()=>{const b=document.querySelector(".leaflet-container").getBoundingClientRect();return {x:b.x,y:b.y,w:b.width,h:b.height}});
const cx=b2.x+b2.w/2, cy=Math.min(b2.y+b2.h/2, 650); log("map box",b2,"cx cy",cx,cy);
a=await state(); await drag(cx,cy,-200); let c=await state(); log("swipe over map (default): main",a.main,"->",c.main,"pane",a.pane,"->",c.pane,"ta",c.ta);
await page.screenshot({path:shotp(`map-editor__after-swipe-default__${vp}`)});
await page.evaluate(()=>document.querySelector("main").scrollTop=0); await page.waitForTimeout(300);
const mk=()=>page.evaluate(()=>[...document.querySelectorAll(".leaflet-marker-icon")].slice(0,3).map(e=>{const b=e.getBoundingClientRect();return [Math.round(b.x),Math.round(b.y)]}));
const mm=page.getByRole("button",{name:/^Move map/}); await mm.first().tap(); await page.waitForTimeout(500);
const b3=await page.evaluate(()=>{const b=document.querySelector(".leaflet-container").getBoundingClientRect();return {x:b.x,y:b.y,w:b.width,h:b.height}}); const cy3=Math.min(b3.y+b3.h/2,650);
log("el at point",await page.evaluate(([x,y])=>{const e=document.elementFromPoint(x,y);return e.tagName+"."+(e.className+"").slice(0,60)},[b3.x+b3.w/2,cy3]));
const m0=await mk(); await drag(b3.x+b3.w/2,cy3,-120,20); log("touch drag after hold",await mk());
// pointer-event based touch drag
await page.evaluate(()=>{window.__pe=[];for(const t of ["pointerdown","pointermove","pointerup","pointercancel","touchstart","touchmove"])document.querySelector(".leaflet-container").addEventListener(t,e=>window.__pe.push(t+":"+(e.pointerType||"")),{capture:true})});
await drag(b3.x+b3.w/2,cy3,-120,20); log("events",await page.evaluate(()=>{const c={};window.__pe.forEach(x=>c[x]=(c[x]||0)+1);return c}),"markers",await mk());
await page.mouse.move(b3.x+b3.w/2,cy3); await page.mouse.down(); await page.mouse.move(b3.x+b3.w/2,cy3-100,{steps:10}); await page.mouse.up(); log("mouse drag markers",await mk());
await browser.close();
