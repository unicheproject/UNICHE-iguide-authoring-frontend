import { open, go, shot, P, E, text, require } from "./lib.mjs";
const { AxeBuilder } = require("@axe-core/playwright");
const { browser, page } = await open("curator", { viewport: "1440" });
const { bearer } = await import("../../../tools/session.mjs");
let ready; page.on("response", async (r) => { if (r.url().endsWith("/readiness")) try { ready = await r.json(); } catch {} });
let proj;
page.on("response", async (r) => { if (r.url().endsWith("/projects/" + E) && r.request().method()==="GET") try { proj = await r.json(); } catch {} });
await go(page, `/projects/${E}`); await page.waitForTimeout(3000);
console.log("EMPTY B warnings", JSON.stringify(ready.warnings), "PROJECT", JSON.stringify(proj));
// open warnings disclosure
await page.getByText(/^Warnings \(/).click(); await shot(page, "emp__warnings-open__1440");
// axe
const ax = await new AxeBuilder({ page }).analyze();
console.log("AXE emp", ax.violations.map(v => v.id + ":" + v.impact + ":" + v.nodes.length));
// tab order
const order = [];
for (let i = 0; i < 40; i++) { await page.keyboard.press("Tab"); order.push(await page.evaluate(() => { const a = document.activeElement; return (a.tagName + " " + (a.getAttribute("aria-label") || a.textContent || "").trim().replace(/\s+/g," ").slice(0, 40)); })); }
console.log("TAB", order.join(" | "));
await shot(page, "emp__focus-after-tabs__1440", false);
// API counts probe
const tok = await bearer(page);
const base = "http://localhost:8080/iguide/api/v1/projects/" + P;
for (const k of ["places", "pois", "routes", "guides", "events", "categories", "assets", "maps", "floor-plans"]) {
  const r = await fetch(`${base}/${k}?size=1`, { headers: { Authorization: "Bearer " + tok } });
  const j = await r.json().catch(() => ({}));
  const r2 = await fetch(`${base}/${k}?size=1&pending=true`, { headers: { Authorization: "Bearer " + tok } });
  const j2 = await r2.json().catch(() => ({}));
  console.log(k, r.status, Object.keys(j).join(","), j.totalElements, "pending", r2.status, j2.totalElements);
}
await browser.close();
