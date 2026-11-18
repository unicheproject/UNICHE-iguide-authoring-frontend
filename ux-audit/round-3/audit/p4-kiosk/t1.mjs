import { open, go } from "../../../tools/session.mjs"; import {P,shotp,log} from "./lib.mjs"; import {coarse,small} from "./tlib.mjs";
const vp=process.argv[2]||"1024";
const { browser, page } = await open("admin",{viewport:vp,touch:true}); await coarse(page);
log("coarse",await page.evaluate(()=>matchMedia("(pointer: coarse)").matches));
const screens={dashboard:"",pois:"/pois",places:"/places",routes:"/routes",maps:"/maps",floorplans:"/floor-plans",media:"/media",preview:"/preview",
 "poi-editor":"/pois/40cab7b2-a7f7-4057-b56e-5605a589156f","map-editor":"/maps/f8daa876-f2af-4552-95ae-431c96ed1b2d","fp-editor":"/floor-plans/d40864d1-684a-466f-819d-68fa651b7146"};
const only=process.argv[3]?process.argv[3].split(","):Object.keys(screens);
for(const n of only){ await go(page,`/projects/${P}${screens[n]}`); await page.waitForTimeout(3000);
 const r=await small(page); log(`## ${n} @${vp}: ${r.total} controls, ${r.small.length} under 44`); 
 const agg={}; for(const s of r.small){const k=`${s.tag}|${s.t.slice(0,24)}|${s.w}x${s.h}`;agg[k]=(agg[k]||0)+1;} log(JSON.stringify(agg));
 await page.screenshot({path:shotp(`${n}__touch-default__${vp}`)}); }
await browser.close();
