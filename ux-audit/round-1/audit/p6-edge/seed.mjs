import { call, closeAll } from "../../../tools/lib.mjs";
import { writeFileSync } from "node:fs";
const P = "/projects/6958c18f-60d2-4140-a524-5a43f8a2f6b5";
const ids = {};
const mk = async (k, path, body) => { try { const r = await call("curator","POST",P+path,body); ids[k]=r.id; console.log(k, r.id, r.version, r.status); return r; } catch(e){ console.log("FAIL",k,e.message); } };
await mk("poiA","/pois",{title:"UX-p6-edge POI A"});
await mk("poiB","/pois",{title:"UX-p6-edge POI B (conflict)"});
await mk("poiC","/pois",{title:"UX-p6-edge POI C (in route)"});
await mk("place","/places",{title:"UX-p6-edge Place",type:"SITE",environment:"OUTDOOR"});
await mk("cat","/categories",{name:"UX-p6-edge Category",scope:"POI",parentCategoryId:null});
await mk("guide","/guides",{title:"UX-p6-edge Guide"});
await mk("event","/events",{title:"UX-p6-edge Event"});
await mk("route","/routes",{title:"UX-p6-edge Route",type:"WALKING"});
if (ids.route && ids.poiC) { try { const s = await call("curator","POST",P+`/routes/${ids.route}/stops`,{poiId:ids.poiC,translations:{en:{titleOverride:null,description:"p6 stop",navigationInstructions:null,narrative:null}}}); console.log("stop", s.id);} catch(e){console.log("FAIL stop", e.message);} }
writeFileSync("ids.json", JSON.stringify(ids,null,1));
await closeAll();
