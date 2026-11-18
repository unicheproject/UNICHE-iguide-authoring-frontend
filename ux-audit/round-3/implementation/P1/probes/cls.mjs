// P1: CLS + skeleton geometry on a list, Dashboard. Usage: node ...cls.mjs <before|after>
import { open, go } from "../../../../tools/session.mjs";
const tag = process.argv[2] ?? "before";
const P = "6958c18f-60d2-4140-a524-5a43f8a2f6b5";
const OUT = `ux-audit/round-3/implementation/P1/${tag}/`;
const res = {};
const { browser, context, page } = await open("admin");
await page.addInitScript(() => {
  window.__cls = 0; window.__shifts = [];
  new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) { window.__cls += e.value; window.__shifts.push({ v: +e.value.toFixed(4), t: Math.round(e.startTime), src: (e.sources ?? []).map((s) => (s.node?.nodeName ?? "?") + "." + String(s.node?.className ?? "").slice(0, 30)) }); } }).observe({ type: "layout-shift", buffered: true });
});
// geometry of the page head and first rows, whichever state
const geo = () => page.evaluate(() => {
  const r = (el) => { if (!el) return null; const b = el.getBoundingClientRect(); return { top: Math.round(b.top * 10) / 10, h: Math.round(b.height * 10) / 10, w: Math.round(b.width) }; };
  const main = document.querySelector("main");
  const h1 = main?.querySelector("h1") ?? main?.querySelector("[data-skel-title]") ?? main?.querySelector("[aria-hidden=true]");
  const rows = [...document.querySelectorAll("main tbody tr")];
  return { h1: r(h1), h1text: h1?.textContent?.trim().slice(0, 30), row0: r(rows[0]), row1: r(rows[1]), table: r(main?.querySelector("table")), main: r(main) };
});
for (const [name, path] of [["pois", `/projects/${P}/pois`], ["places", `/projects/${P}/places`], ["dashboard", `/projects/${P}`]]) {
  const clsRuns = [];
  for (let i = 0; i < 3; i++) {
    await page.goto("about:blank");
    await go(page, path);
    await page.waitForTimeout(1200);
    clsRuns.push(await page.evaluate(() => ({ cls: +window.__cls.toFixed(4), shifts: window.__shifts })));
  }
  res[name] = { cls: clsRuns.map((c) => c.cls), shifts: clsRuns[0].shifts };
  res[name].loaded = await geo();
  // skeleton state: hold the project read for 2.5 s
  let hold = true;
  const handler = async (route) => { if (hold) await new Promise((r) => setTimeout(r, 2500)); await route.continue().catch(() => {}); };
  await page.route(new RegExp(`/projects/${P}$`), handler);
  await page.goto("about:blank");
  await page.goto("http://localhost:5173" + path);
  await page.waitForSelector("[role=status][aria-busy=true]", { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(400);
  res[name].skeleton = await geo();
  res[name].skeletonH1Exists = await page.evaluate(() => !!document.querySelector("main h1"));
  res[name].skeletonOrganisation = await page.evaluate(() => /Organisation/.test(document.querySelector("main")?.textContent ?? ""));
  await page.screenshot({ path: OUT + `${name}-skeleton-1440.png` });
  hold = false;
  await page.waitForTimeout(3500);
  await page.unroute(new RegExp(`/projects/${P}$`), handler);
  await page.screenshot({ path: OUT + `${name}-loaded-1440.png` });
}
console.log(JSON.stringify(res, null, 1));
await browser.close();
