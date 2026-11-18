import { call, closeAll } from "../../../tools/lib.mjs";
import { ids } from "./lib.mjs";
const I = ids(); const PP = "/projects/6958c18f-60d2-4140-a524-5a43f8a2f6b5";
console.log("C refs", JSON.stringify(await call("curator", "GET", `${PP}/pois/${I.poiC}/references`)));
const c = await call("curator", "GET", `${PP}/pois/${I.poiC}`); console.log(c.status);
await closeAll();
