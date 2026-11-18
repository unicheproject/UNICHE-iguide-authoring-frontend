import { call, closeAll } from "../../../../tools/lib.mjs";
const PID="6958c18f-60d2-4140-a524-5a43f8a2f6b5"; const P=(p)=>`/projects/${PID}${p}`;
const poi="1e3e76c9-d9c2-48eb-8419-e54b7143180c";
const t=await call("admin","POST",P("/triggers"),{targetResourceType:"POI",targetResourceId:poi,triggerType:"BEACON",code:null,configuration:{uuid:"e2c56db5-dffb-48d2-b060-d0f5a71096e0",major:100,minor:4712,proximityMeters:2,cooldownSeconds:300}});
await call("admin","POST",P(`/triggers/${t.id}/status`),{targetStatus:"ACTIVE",version:t.version});
const l=await call("admin","GET",P(`/triggers?targetResourceType=POI&targetResourceId=${poi}&size=50`));
console.log(l.content.map(x=>[x.triggerType,x.status,x.code]));
await closeAll();
