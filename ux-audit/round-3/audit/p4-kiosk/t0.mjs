import { open, go, bearer, API } from "../../../tools/session.mjs"; import {P,log,here} from "./lib.mjs"; import fs from "node:fs";
const { browser, page } = await open("admin",{viewport:"1280"}); const auth=await bearer(page);
const get=async p=>{const r=await page.request.get(`${API}/projects/${P}/${p}`,{headers:{authorization:auth}});const j=await r.json();return (j.content??j)};
const maps=await get("maps?size=50"), fps=await get("floor-plans?size=50"), pois=await get("pois?size=100");
const out={maps:maps.map(m=>({id:m.id,name:m.name??m.title,keys:Object.keys(m).slice(0,8)})).slice(0,12),fps:fps.map(m=>({id:m.id,name:m.name??m.title,placeId:m.placeId})).slice(0,12),pois:pois.filter(p=>/UX-R2-p4|UX-R2-P4|P4|Tablet/i.test(JSON.stringify(p.title||p.name||""))||true).map(p=>({id:p.id,t:p.title??p.name,s:p.status})).slice(0,60)};
fs.writeFileSync(here+"/ids.json",JSON.stringify(out,null,1)); log(JSON.stringify(out).slice(0,2500)); await browser.close();
