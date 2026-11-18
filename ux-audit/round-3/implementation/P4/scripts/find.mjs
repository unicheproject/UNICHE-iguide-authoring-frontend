import { call, closeAll } from "../../../../tools/lib.mjs";
const PID="6958c18f-60d2-4140-a524-5a43f8a2f6b5"; const P=(p)=>`/projects/${PID}${p}`;
for (const k of ["places","pois"]) { const r=await call("admin","GET",P(`/${k}?size=200&query=UX-R3-P4`)); console.log(k,(r.content??r).filter(x=>JSON.stringify(x).includes("UX-R3-P4")).map(x=>[x.id,x.slug,x.status])); }
const t=await call("admin","GET",P("/triggers?size=200")); console.log(t.content.filter(x=>x.code==="P4QR001"||(x.configuration?.major===100)).map(x=>[x.id,x.triggerType,x.targetResourceId,x.status,x.code]));
await closeAll();
