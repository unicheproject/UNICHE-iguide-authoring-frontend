import { open, go } from "../../../tools/session.mjs";
import fs from "node:fs";
const P="6958c18f-60d2-4140-a524-5a43f8a2f6b5"; const seed=JSON.parse(fs.readFileSync("ux-audit/tools/seed.json","utf8"));
const out={}; const S=n=>`ux-audit/round-2/audit/design-system/shots/${n}.png`;
const focusInfo=()=>{const e=document.activeElement;const s=getComputedStyle(e);return {tag:e.tagName,txt:(e.getAttribute("aria-label")||e.textContent||"").trim().slice(0,24),outline:s.outlineStyle+" "+s.outlineWidth+" "+s.outlineColor+" off"+s.outlineOffset,shadow:s.boxShadow.slice(0,80)}};
async function run(mode,opts){
 const {page,browser}=await open("admin",{viewport:"1440",...opts});
 try{
  // list + editor + dialog
  await go(page,`/projects/${P}/pois`);await page.waitForTimeout(1500);
  const r={};
  r.url=page.url();
  r.icons=await page.evaluate(()=>[...document.querySelectorAll("button,a")].filter(e=>!e.textContent.trim()&&e.querySelector("svg")&&e.getBoundingClientRect().width>0).map(e=>{const r=e.getBoundingClientRect();return Math.round(r.width)+"x"+Math.round(r.height)+" "+(e.getAttribute("aria-label")||"")}).slice(0,12));
  r.focus=[];for(let i=0;i<14;i++){await page.keyboard.press("Tab");r.focus.push(await page.evaluate(focusInfo));}
  await page.screenshot({path:S(`pois__${mode}__1440`)});
  // open New dialog
  const btn=page.getByRole("button",{name:/new point|new poi|new/i}).first();
  if(await btn.count()){await btn.click();await page.waitForTimeout(600);
   r.dialog=await page.evaluate(()=>{const d=document.querySelector("[role=dialog],dialog");if(!d)return null;const s=getComputedStyle(d);const cs=[...d.querySelectorAll("*")].slice(0,1);return{border:s.borderTopWidth+" "+s.borderTopStyle,shadow:s.boxShadow.slice(0,50),bg:s.backgroundColor,outline:s.outlineStyle}});
   r.dialogFocus=await page.evaluate(focusInfo);
   await page.screenshot({path:S(`pois-dialog__${mode}__1440`)});await page.keyboard.press("Escape");await page.waitForTimeout(300);}
  // preview tabs
  await go(page,`/projects/${P}/pois/${seed.pois[0].id}`);await page.waitForTimeout(2000);
  r.editorSticky=await page.evaluate(()=>[...document.querySelectorAll("*")].filter(e=>{const p=getComputedStyle(e).position;return(p==="sticky"||p==="fixed")&&e.getBoundingClientRect().height>0}).map(e=>{const r=e.getBoundingClientRect();return getComputedStyle(e).position[0]+" z"+getComputedStyle(e).zIndex+" top"+Math.round(r.top)+" h"+Math.round(r.height)+" "+e.tagName+"."+(e.className||"").toString().split(" ").slice(0,2).join(".")}));
  r.tabs=await page.evaluate(()=>[...document.querySelectorAll("[role=tab]")].map(e=>{const s=getComputedStyle(e);return e.textContent.trim().slice(0,14)+"|sel="+(e.getAttribute("aria-selected")||e.getAttribute("data-state"))+"|bb="+s.borderBottomWidth+" "+s.borderBottomColor+"|bg="+s.backgroundColor+"|o="+s.outlineStyle}).slice(0,12));
  await page.screenshot({path:S(`poi-editor__${mode}__1440`)});
  // reduced-motion: running animations after opening a toast-less load
  r.anims=await page.evaluate(()=>document.getAnimations().map(a=>a.animationName||a.transitionProperty).slice(0,10));
  out[mode]=r;
 }catch(e){out[mode]={err:String(e).slice(0,200)}}finally{await browser.close()}
}
await run("normal",{});
await run("forced",{forcedColors:"active"});
await run("reduced",{reducedMotion:"reduce"});
fs.writeFileSync("ux-audit/round-2/audit/design-system/probe2.json",JSON.stringify(out,null,1));console.log("done2");
