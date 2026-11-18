import { call, closeAll } from "../../../tools/lib.mjs";
import { writeFileSync } from "node:fs";
const P = "/projects/6958c18f-60d2-4140-a524-5a43f8a2f6b5";
const ids = {};
const mk = async (k, path, body) => { try { const r = await call("curator","POST",P+path,body); ids[k]=r.id; console.log(k, r.id, r.version, r.status); return r; } catch(e){ console.log("FAIL",k,e.message); } };
const ids0 = {poiA:"8bbd9003-ccc9-4d4b-b10f-0bf416751773",poiB:"00143631-4e34-43ed-b803-891f087a1c1c",poiC:"c10e8454-4484-4f47-bb0c-ad9e9571f155",place:"8acb2c95-374c-4462-98cb-cd6a5b2407ad",cat:"3b2f71ba-a385-4724-8dc7-fbe2407f4c4a",guide:"f7bf15a8-07ca-4ffc-928b-b0732f235fe8",event:"bcd713e4-6ad3-43bc-b35e-6450edc9c06a"};
Object.assign(ids, ids0);
await mk("route","/routes",{title:"UX-p6-edge Route",slug:"ux-p6-edge-route",type:"OUTDOOR"});
try { const s = await call("curator","POST",P+`/routes/${ids.route}/stops`,{poiId:ids.poiC,translations:{en:{titleOverride:null,description:"p6 stop",navigationInstructions:null,narrative:null}}}); console.log("stop", s.id);} catch(e){console.log("FAIL stop", e.message);}
writeFileSync("ids.json", JSON.stringify(ids,null,1));
await closeAll();
