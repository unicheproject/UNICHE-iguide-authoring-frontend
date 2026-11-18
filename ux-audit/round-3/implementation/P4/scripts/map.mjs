import { call, closeAll } from "../../../../tools/lib.mjs";
const PID="6958c18f-60d2-4140-a524-5a43f8a2f6b5"; const P=(p)=>`/projects/${PID}${p}`;
const m=await call("admin","POST",P("/maps"),{internalName:"UX-R3-P4 Map",placeId:null,initialLatitude:37.97,initialLongitude:23.72,initialZoom:15,minLatitude:37.96,minLongitude:23.71,maxLatitude:37.98,maxLongitude:23.73,area:null,osmId:null});
console.log(m.id); await closeAll();
