import { open, go } from "../../../tools/session.mjs";
import fs from "node:fs";
const P="6958c18f-60d2-4140-a524-5a43f8a2f6b5"; const seed=JSON.parse(fs.readFileSync("ux-audit/tools/seed.json","utf8"));
const out={};
for(const vp of ["1280","zoom200"]){
 const {page,browser}=await open("admin",{viewport:vp});
 try{ for(const [k,p] of [["pois","/pois"],["poi",`/pois/${seed.pois[0].id}`],["preview","/preview"]]){
  await go(page,`/projects/${P}${p}`);await page.waitForTimeout(1800);
  out[vp+"-"+k]=await page.evaluate(()=>{const vh=innerHeight;const st=[...document.querySelectorAll("*")].filter(e=>{const s=getComputedStyle(e);return(s.position==="sticky"||s.position==="fixed")&&e.getBoundingClientRect().height>1&&!e.matches(".sr-only,a[href='#main']")}).map(e=>{const r=e.getBoundingClientRect();return{n:e.tagName+"."+(e.className||"").toString().split(" ").slice(0,2).join("."),top:Math.round(r.top),h:Math.round(r.height)}}).filter(x=>x.top<vh/2);const hdr=document.querySelector("header")?.getBoundingClientRect().height;const main=document.querySelector("main");return{vh,hdr,mainH:main&&Math.round(main.getBoundingClientRect().height),st}});
  await page.screenshot({path:`ux-audit/round-2/audit/design-system/shots/${k}__sticky__${vp}.png`});
 }}catch(e){out[vp]={err:String(e).slice(0,150)}}finally{await browser.close()}}
fs.writeFileSync("ux-audit/round-2/audit/design-system/probe3.json",JSON.stringify(out,null,1));console.log("d3");
