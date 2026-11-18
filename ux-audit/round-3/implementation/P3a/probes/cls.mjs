// CLS of /pois, /places, /routes over 3 cold loads (new context each time), list part: shifts whose sources are in main.
import { open, go, P, settle, save } from "./h.mjs";
const res = {};
for (const k of ["pois", "places", "routes"]) {
  res[k] = [];
  for (let i = 0; i < 3; i++) {
    const { browser, page } = await open("admin", { viewport: "1440" });
    await page.addInitScript(() => { window.__sh = []; new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__sh.push({ v: +e.value.toFixed(4), t: Math.round(e.startTime), s: e.sources.map((x) => (x.node?.nodeName ?? "?") + "." + String(x.node?.className ?? "").slice(0, 30) + " h" + Math.round(x.previousRect.height) + "->" + Math.round(x.currentRect.height) + " y" + Math.round(x.previousRect.y) + "->" + Math.round(x.currentRect.y)) }); }).observe({ type: "layout-shift", buffered: true }); });
    await go(page, `/projects/${P}/${k}`); await page.waitForSelector("[data-row-id]"); await settle(page, 2000);
    const sh = await page.evaluate(() => window.__sh);
    res[k].push({ total: +sh.reduce((a, b) => a + b.v, 0).toFixed(4), shifts: sh });
    await browser.close();
  }
}
save("cls", res);
console.log(JSON.stringify(Object.fromEntries(Object.entries(res).map(([k, v]) => [k, v.map((x) => x.total)]))));
for (const [k, v] of Object.entries(res)) for (const x of v) console.log(k, x.total, JSON.stringify(x.shifts).slice(0, 500));
