import { open, go, bearer, API } from "../../../tools/session.mjs";
import { writeFileSync } from "node:fs";
const P="6958c18f-60d2-4140-a524-5a43f8a2f6b5";
const D="ux-audit/round-3/audit/s14-preview/";
const { browser, page } = await open("admin",{viewport:"1440"});
const auth=await bearer(page);
const trig=[];
for (let pg=0;pg<5;pg++){const r=await page.request.get(`${API}/projects/${P}/triggers?page=${pg}&size=50`,{headers:{authorization:auth}}); if(!r.ok()){console.log("trig",r.status());break;} const j=await r.json(); trig.push(...(j.content??[])); if(j.last!==false)break;}
console.log(trig.length, JSON.stringify(trig.slice(0,2)));
const pick=(t)=>trig.filter(x=>x.triggerType===t).map(x=>({id:x.id,status:x.status,code:x.code,res:x.targetResourceType}));
console.log(JSON.stringify({qr:pick("QR_CODE").slice(0,4),b:pick("BEACON").slice(0,3),g:pick("GEO_PROXIMITY").slice(0,2)}));
writeFileSync(D+"triggers.json",JSON.stringify(trig.map(x=>({id:x.id,type:x.triggerType,status:x.status,code:x.code,surfaces:x.supportedSurfaces,res:x.targetResourceType}))));
await browser.close();
