import { call, closeAll } from "../../../../tools/lib.mjs";
import { writeFileSync } from "node:fs";
const PID="6958c18f-60d2-4140-a524-5a43f8a2f6b5"; const P=(p)=>`/projects/${PID}${p}`;
const W=(m,p,b)=>call("admin",m,P(p),b);
const ids={};
ids.place=(await W("POST","/places",{title:"UX-R3-P4 Place",type:"SITE",environment:"OUTDOOR",parentPlaceId:null}).catch(async e=>{console.log(e.message);return W("POST","/places",{title:"UX-R3-P4 Place",type:"SITE"})})).id;
ids.poi=(await W("POST","/pois",{title:"UX-R3-P4 POI three triggers",placeId:null,code:null})).id;
async function trig(type,body,target,tid){const t=await W("POST","/triggers",{targetResourceType:target,targetResourceId:tid,triggerType:type,...body});await W("POST",`/triggers/${t.id}/status`,{targetStatus:"ACTIVE",version:t.version});return t.id}
ids.t1=await trig("QR_CODE",{code:"P4QR001",configuration:{}},"POI",ids.poi);
ids.t2=await trig("GEO_PROXIMITY",{code:null,configuration:{latitude:37.9715,longitude:23.7257,radiusMeters:30,cooldownSeconds:300}},"POI",ids.poi);
ids.t3=await trig("BEACON",{code:null,configuration:{uuid:"e2c56db5-dffb-48d2-b060-d0f5a71096e0",major:100,minor:4712,proximityMeters:2,cooldownSeconds:300}},"POI",ids.poi);
writeFileSync(new URL("./ids.json",import.meta.url),JSON.stringify(ids,null,1));
console.log(ids);await closeAll();
