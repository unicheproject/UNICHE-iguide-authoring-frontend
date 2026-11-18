import { call, closeAll } from "../../../../tools/lib.mjs";
import { writeFileSync } from "node:fs";
const PID = "6958c18f-60d2-4140-a524-5a43f8a2f6b5"; const P = (p) => `/projects/${PID}${p}`;
const ids = { pois: [] };
// five stops: 1, 3, 4 within about 15 m; 2 and 5 further away; one coincident with 5
const spots = [[37.97150, 23.72600], [37.97190, 23.72690], [37.97152, 23.72606], [37.97149, 23.72603], [37.97100, 23.72800]];
const names = ["Παρθενώνας", "Erechtheion", "Propylaea", "Nike", "Odeon"];
for (let i = 0; i < 5; i++) {
  const poi = await call("admin", "POST", P("/pois"), { title: `UX-R3-P5a ${names[i]} ${i + 1}` });
  await call("admin", "PUT", P(`/pois/${poi.id}`), { ...poi, latitude: spots[i][0], longitude: spots[i][1], version: poi.version }).catch((e) => console.log("put", e.message.slice(0, 300)));
  ids.pois.push(poi.id);
}
const route = await call("admin", "POST", P("/routes"), { title: "UX-R3-P5a Route A", type: "OUTDOOR" });
ids.route = route.id;
for (const id of ids.pois) await call("admin", "POST", P(`/routes/${route.id}/stops`), { poiId: id, translations: {} }).catch((e) => console.log("stop", e.message.slice(0, 300)));
const empty = await call("admin", "POST", P("/routes"), { title: "UX-R3-P5a Route empty", type: "OUTDOOR" });
ids.routeEmpty = empty.id;
const guide = await call("admin", "POST", P("/guides"), { title: "UX-R3-P5a Guide A" });
ids.guide = guide.id;
writeFileSync(new URL("./ids.json", import.meta.url), JSON.stringify(ids)); console.log(ids);
await closeAll();
