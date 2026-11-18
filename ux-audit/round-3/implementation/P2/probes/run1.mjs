import { open, go, P, OUT } from "./lib.mjs";
import { mock, problem, blocking } from "./mocks.mjs";
const tabOrder = async (page, n = 60) => {
  await page.evaluate(() => { document.activeElement?.blur(); window.scrollTo(0,0); document.querySelector("main")?.scrollTo(0,0); });
  await page.locator("main h1").focus(); const stops = [];
  for (let i = 0; i < n; i++) {
    await page.keyboard.press("Tab");
    const s = await page.evaluate(() => { const e = document.activeElement; if (!e || e === document.body) return null; const r = e.getBoundingClientRect(); const main = document.getElementById("main"); if (!main || !main.contains(e)) return { out: true, t: (e.textContent||"").trim().slice(0,20) }; return { t: (e.textContent || e.getAttribute("aria-label") || "").trim().slice(0, 28), x: Math.round(r.x), y: Math.round(r.y + (main.scrollTop||0)) }; });
    if (!s || s.out) break; stops.push(s);
  }
  return stops;
};
const backtracks = (stops) => stops.filter((s, i) => i > 0 && s.y + 4 < stops[i - 1].y).map((s) => s.t);
const vp = process.argv[2] ?? "1024";
const { browser, page } = await open("admin", { viewport: vp });
await go(page, `/projects/${P.pop}`);
await page.waitForSelector("[data-testid=app-status-line]");
await page.waitForTimeout(800);
const stops = await tabOrder(page, 40);
console.log("TAB", vp, JSON.stringify(stops.map((s) => `${s.t}@${s.x},${s.y}`)));
console.log("BACKTRACKS", backtracks(stops));
const m = await page.evaluate(() => {
  const r = (sel) => { const e = document.querySelector(sel); if (!e) return null; const b = e.getBoundingClientRect(); return { y: Math.round(b.y + document.getElementById("main").scrollTop), h: Math.round(b.height), w: Math.round(b.width) }; };
  return { counts: r("[aria-labelledby=counts-title]"), pending: r("[aria-labelledby=pending-title]"), status: r("[aria-labelledby=status-title]"), h1: r("main h1"), details: r("details"), docH: document.getElementById("main").scrollHeight };
});
console.log("MEASURE", vp, JSON.stringify(m));
await page.screenshot({ path: `${OUT}pop-${vp}-top.png` });
await browser.close();
