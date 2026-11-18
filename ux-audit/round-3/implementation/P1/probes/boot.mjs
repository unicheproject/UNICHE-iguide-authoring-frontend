import { open, go } from "../../../../tools/session.mjs";
const P = "6958c18f-60d2-4140-a524-5a43f8a2f6b5";
const { browser, context, page } = await open("admin");
await page.addInitScript(() => {
  window.__s = [];
  new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__s.push({ v: +e.value.toFixed(4), t: Math.round(e.startTime), src: (e.sources ?? []).map((s) => ({ n: s.node?.nodeName + "#" + (s.node?.id ?? "") + "." + String(s.node?.className ?? "").slice(0, 40), prev: [s.previousRect.x, s.previousRect.y, s.previousRect.width, s.previousRect.height].map(Math.round), cur: [s.currentRect.x, s.currentRect.y, s.currentRect.width, s.currentRect.height].map(Math.round) })) }); }).observe({ type: "layout-shift", buffered: true });
});
for (const path of [`/projects/${P}`, "/"]) {
  await page.goto("about:blank"); await go(page, path); await page.waitForTimeout(1500);
  console.log(path, JSON.stringify(await page.evaluate(() => window.__s)));
}
await browser.close();
