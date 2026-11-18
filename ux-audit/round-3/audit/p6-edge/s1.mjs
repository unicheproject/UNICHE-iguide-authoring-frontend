import { call, closeAll } from "../../../tools/lib.mjs";
import { readFileSync } from "node:fs";
const ids = JSON.parse(readFileSync(new URL("./ids.json", import.meta.url)));
const PID="6958c18f-60d2-4140-a524-5a43f8a2f6b5"; const P=(p)=>`/projects/${PID}${p}`;
const r = await call("admin","POST",P(`/routes/${ids.route}/stops`),{poiId:ids.poi2,translations:{en:{titleOverride:null,description:"UX-R3-p6 stop",navigationInstructions:null,narrative:null}}});
console.log(JSON.stringify(r).slice(0,300));
await closeAll();
