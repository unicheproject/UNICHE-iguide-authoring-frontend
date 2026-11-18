import { open, go, P, T, settle } from "./lib.mjs";
import { writeFileSync } from "node:fs";
const { browser, page } = await open("admin", { viewport: "1440" });
const out = {};
page.on("response", async r => { const u = r.url(); if (!u.includes(":8080")) return; const k = u.replace(/^.*\/api\/v1/, "").replace(/[0-9a-f-]{36}/g, ":id"); if (/settings|readiness|places\?size=1&status=ACTIVE|pois\?pending|languages|navigations|\/me\/|projects\/:id$/.test(k)) { try { out[k] = (await r.text()).slice(0, 2500);} catch {} } });
await go(page, `/projects/${T}`); await settle(page, 3000);
writeFileSync("api-shapes.json", JSON.stringify(out, null, 1));
await browser.close();
