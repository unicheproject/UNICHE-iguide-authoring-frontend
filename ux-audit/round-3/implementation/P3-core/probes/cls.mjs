import { open, go, P, settle } from "./h.mjs";
const { browser, page } = await open("admin", { viewport: "1440" });
await page.addInitScript(() => { window.__sh = []; new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__sh.push({ v: +e.value.toFixed(4), t: Math.round(e.startTime), s: e.sources.map((x) => (x.node?.nodeName ?? "?") + "." + (x.node?.className?.toString?.().slice(0, 40) ?? "") + " " + Math.round(x.previousRect.y) + "->" + Math.round(x.currentRect.y) + " h" + Math.round(x.previousRect.height) + "->" + Math.round(x.currentRect.height)) }); }).observe({ type: "layout-shift", buffered: true }); });
for (const k of ["pois", "places", "events"]) for (let i = 0; i < 2; i++) { await go(page, `/projects/${P}/${k}`); await page.waitForSelector("[data-row-id]"); await settle(page, 1500); console.log(k, i, JSON.stringify(await page.evaluate(() => window.__sh))); }
await browser.close();
