// Sets the WEB surface's publicBaseUrl on the Populated audit Project so QR codes render (test data only).
import { call, closeAll } from "./lib.mjs";
const P = "6958c18f-60d2-4140-a524-5a43f8a2f6b5";
const cur = await call("admin", "GET", `/projects/${P}/surfaces`);
const surfaces = cur.surfaces.map((s) => ({ surface: s.surface, enabled: s.enabled,
  configuration: s.surface === "WEB" ? { ...s.configuration, publicBaseUrl: "https://ux-audit-museum.example.org" } : s.configuration }));
console.log(JSON.stringify(await call("admin", "PUT", `/projects/${P}/surfaces`, { surfaces })));
await closeAll();
