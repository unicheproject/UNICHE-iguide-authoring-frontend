import { session, go, P, ids, LOG, shot, ax, sleep } from "./h.mjs";
const log = LOG(process.argv[2] ?? "rt");
const vps = (process.argv[3] ?? "1440,768").split(",");
for (const vp of vps) {
  const { browser, page } = await session({ viewport: vp });
  await page.addInitScript(() => {
    window.__live = [];
    const start = () => new MutationObserver((ms) => { for (const m of ms) { const t = (m.target.nodeType === 3 ? m.target.parentElement : m.target); const live = t?.closest?.("[aria-live],[role=status],[role=alert]"); if (live && live.textContent.trim()) window.__live.push(live.textContent.trim().slice(0, 140)); } }).observe(document.body, { subtree: true, childList: true, characterData: true });
    document.addEventListener("DOMContentLoaded", start);
  });
  await go(page, P(`/routes/${ids.route}`));
  await page.waitForSelector(".leaflet-marker-icon", { timeout: 25000 }); await sleep(1500);
  const pins = async () => page.evaluate(() => {
    const r = [...document.querySelectorAll(".leaflet-marker-icon")].map((e) => { const b = e.getBoundingClientRect(); return { n: e.textContent.trim(), x: b.x, y: b.y, w: b.width, h: b.height }; });
    let worst = 0, pair = "";
    for (let i = 0; i < r.length; i++) for (let j = i + 1; j < r.length; j++) {
      const a = r[i], b = r[j];
      const ox = Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)), oy = Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));
      const f = (ox * oy) / (Math.min(a.w * a.h, b.w * b.h) || 1);
      if (f > worst) { worst = f; pair = a.n + "-" + b.n; }
    }
    return { count: r.length, size: r[0] && [r[0].w, r[0].h], maxOverlap: Math.round(worst * 100), pair };
  });
  log(vp, "pins", await pins());
  log(vp, "legend", await page.evaluate(() => [...document.querySelectorAll("#stops p")].map((p) => p.textContent.trim().replace(/\s+/g, " ")).filter((t) => /pins|line|Stops? \d|position|draft/i.test(t))));
  await shot(page, `route-map-${vp}`);
  if (vp === "1440") {
    // zoom in with the map's own button: pins return to true spots
    await page.locator(".leaflet-control-zoom-in").click(); await page.locator(".leaflet-control-zoom-in").click(); await page.locator(".leaflet-control-zoom-in").click(); await sleep(1200);
    log(vp, "zoomed +3 pins", await pins());
    await shot(page, `route-map-zoomed-${vp}`);
    await page.locator(".leaflet-control-zoom-out").click(); await page.locator(".leaflet-control-zoom-out").click(); await page.locator(".leaflet-control-zoom-out").click(); await sleep(1200);
    log(vp, "zoomed back pins", await pins());
  }
  log(vp, "axe", await ax(page));
  await browser.close();
}
