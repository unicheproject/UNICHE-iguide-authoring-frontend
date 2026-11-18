import { open, go, CMS } from "../../../tools/session.mjs";
import fs from "node:fs";
const P="6958c18f-60d2-4140-a524-5a43f8a2f6b5";
const seed=JSON.parse(fs.readFileSync("ux-audit/tools/seed.json","utf8"));
const poi=seed.pois?.[0]?.id, place=seed.places?.[0]?.id;
const screens={dashboard:"",places:"/places",pois:"/pois",routes:"/routes",guides:"/guides",events:"/events",categories:"/categories",maps:"/maps",floorplans:"/floor-plans",media:"/media",preview:"/preview",navigation:"/navigation",translations:"/translations",languages:"/languages",overview:"/overview",surfaces:"/surfaces"};
if(poi)screens.poiEditor="/pois/"+poi; if(place)screens.placeEditor="/places/"+place;
const out={};
const measure=()=>{
  const vis=e=>{const r=e.getBoundingClientRect();const s=getComputedStyle(e);return r.width>0&&r.height>0&&s.visibility!=="hidden"&&s.display!=="none"};
  const sizes={};let tiny=[];
  const w=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let n;
  while(n=w.nextNode()){if(!n.textContent.trim())continue;const e=n.parentElement;if(!vis(e))continue;const fs=parseFloat(getComputedStyle(e).fontSize);sizes[fs]=(sizes[fs]||0)+1;if(fs<12&&tiny.length<6)tiny.push(fs+"px "+(e.className||e.tagName).toString().slice(0,50)+" :: "+n.textContent.trim().slice(0,25));}
  const sel='a[href],button,input:not([type=hidden]),select,textarea,[role=button],[role=tab],[role=menuitem],[role=checkbox],[role=switch],[tabindex="0"]';
  const small=[],mid=[];let total=0;
  for(const e of document.querySelectorAll(sel)){if(!vis(e))continue;const r=e.getBoundingClientRect();total++;
    const inline=e.tagName==="A"&&getComputedStyle(e).display==="inline";
    const d=(e.getAttribute("aria-label")||e.textContent||e.className).toString().trim().slice(0,30);
    if((r.width<24||r.height<24)&&!inline)small.push(Math.round(r.width)+"x"+Math.round(r.height)+" "+e.tagName+" "+d);
    else if((r.width<44||r.height<44)&&!inline)mid.push(1);}
  const fam={};for(const e of document.querySelectorAll("body *")){if(!vis(e))continue;const f=getComputedStyle(e).fontFamily.split(",")[0];fam[f]=(fam[f]||0)+1}
  const rad={},sh={};for(const e of document.querySelectorAll("main *,header *,nav *")){if(!vis(e))continue;const s=getComputedStyle(e);rad[s.borderRadius]=(rad[s.borderRadius]||0)+1;if(s.boxShadow!=="none")sh[s.boxShadow.slice(0,70)]=(sh[s.boxShadow.slice(0,70)]||0)+1}
  const icons=[...document.querySelectorAll("button,a")].filter(e=>vis(e)&&!e.textContent.trim().length&&e.querySelector("svg")).map(e=>{const r=e.getBoundingClientRect();return Math.round(r.width)+"x"+Math.round(r.height)});
  const iconSz={};icons.forEach(i=>iconSz[i]=(iconSz[i]||0)+1);
  const glyph=[...document.body.innerText.matchAll(/[✓✕✗☰⚠↗▾▲▼└↳⠿✎►◄•→←↑↓×]/g)].map(m=>m[0]);
  const sticky=[...document.querySelectorAll("*")].filter(e=>{const p=getComputedStyle(e).position;return(p==="sticky"||p==="fixed")&&vis(e)}).map(e=>{const r=e.getBoundingClientRect();return getComputedStyle(e).position[0]+" z"+getComputedStyle(e).zIndex+" top"+Math.round(r.top)+" h"+Math.round(r.height)+" "+(e.tagName+"."+(e.className||"").toString().split(" ").slice(0,2).join("."))});
  const ff=document.fonts.size; 
  return {sizes,tiny,total,small:small.slice(0,12),smallN:small.length,belowTouch:mid.length,fam,rad,sh,iconSz,glyph:[...new Set(glyph)].join(""),sticky,scrollW:document.documentElement.scrollWidth,clientW:document.documentElement.clientWidth};
};
const vp=process.argv[2]||"1440", touch=vp==="1024";
const {page,browser}=await open("admin",{viewport:vp,touch});
try{
for(const [k,p] of Object.entries(screens)){
  try{await go(page,`/projects/${P}${p}`);await page.waitForTimeout(1200);
  out[k]=await page.evaluate(measure);
  await page.screenshot({path:`ux-audit/round-2/audit/design-system/shots/${k}__default__${vp}.png`});}catch(e){out[k]={err:String(e).slice(0,120)}}
}}finally{await browser.close()}
fs.writeFileSync(`ux-audit/round-2/audit/design-system/probe-${vp}.json`,JSON.stringify(out,null,1));
console.log("done");
