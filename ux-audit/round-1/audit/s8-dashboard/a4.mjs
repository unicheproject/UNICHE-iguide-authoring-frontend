import { open, P } from "./lib.mjs";
import { bearer } from "../../../tools/session.mjs";
const { browser, page } = await open("curator", { viewport: "1440" });
const tok = await bearer(page);
const base = "http://localhost:8080/iguide/api/v1/projects/" + P;
const get = async (u) => { const r = await fetch(base + u, { headers: { Authorization: tok } }); return [r.status, await r.json().catch(() => ({}))]; };
for (const k of ["places", "pois", "routes", "guides", "events", "categories", "assets", "maps", "floor-plans"]) {
  const [s, j] = await get(`/${k}?size=1`); const [s2, j2] = await get(`/${k}?size=1&pending=true`); const [s3, j3] = await get(`/${k}?size=1&status=ACTIVE`);
  console.log(k, s, Object.keys(j).join(","), "total", j.totalElements, "pending", j2.totalElements, "active", j3.totalElements);
  if (k === "pois") console.log(JSON.stringify(j.content?.[0] ?? j.items?.[0]).slice(0, 900));
}
for (const u of ["/statistics", "/deployment-packages", "/packages", "/dashboard", "/settings"]) { const [s, j] = await get(u); console.log(u, s, JSON.stringify(j).slice(0, 200)); }
await browser.close();
