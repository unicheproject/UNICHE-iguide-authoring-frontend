import { open, go, P, shot, settle } from "./h.mjs";
const { browser, context, page } = await open("admin", { viewport: "1440" });
await context.addInitScript(() => { window.__cls = 0; window.__shifts = []; try { new PerformanceObserver(l => { for (const e of l.getEntries()) { window.__cls += e.value; window.__shifts.push(+e.value.toFixed(3)); } }).observe({ type: "layout-shift", buffered: true }); } catch {} });
await page.route("**/iguide/api/v1/**", async r => { if (r.request().resourceType()==="document") return r.continue(); await new Promise(s => setTimeout(s, 1200)); r.continue(); });
for (const r of ["", "/places", "/pois", "/routes", "/guides", "/events", "/categories", "/maps", "/media"]) {
  await page.goto(`http://localhost:5173/projects/${P}${r}`); await page.waitForTimeout(6500);
  const m = await page.evaluate(() => ({ cls: +window.__cls.toFixed(3), shifts: window.__shifts.slice(0, 6), h1top: document.querySelector("main h1")?.getBoundingClientRect().top }));
  console.log("CLS", r || "/", JSON.stringify(m));
}
await browser.close();
