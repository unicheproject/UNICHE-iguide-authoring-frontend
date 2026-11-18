import * as L from "./lib.mjs";
const vp = process.argv[2] ?? "1440";
const { page, browser } = await L.open("curator", { viewport: vp });
const ids = {};
const lists = ["", "/places", "/pois", "/routes", "/guides", "/events", "/categories", "/maps", "/floor-plans", "/media", "/preview", "/navigation"];
const sumRows = [];
for (const p of lists) {
  await L.nav(page, L.P(p), 900);
  const rows = await L.axe(page, `${p || "/dashboard"}@${vp}`);
  sumRows.push([p || "/dashboard", rows]);
  if (p && !["/preview", "/navigation", "/floor-plans"].includes(p)) {
    const href = await page.locator(`main a[href*="${p}/"]`).first().getAttribute("href").catch(() => null);
    if (href) ids[p] = href;
  }
  if (p === "/floor-plans") { const h = await page.locator(`main a[href*="floor-plans/"]`).first().getAttribute("href").catch(() => null); if (h) ids[p] = h; }
}
L.log("t33", "ids", ids);
for (const [p, href] of Object.entries(ids)) {
  await L.nav(page, href, 2500);
  const rows = await L.axe(page, `editor ${p}@${vp}`);
  sumRows.push(["editor " + p, rows]);
  await L.shot(page, `editor${p.replace("/", "-")}__existing__${vp}`);
}
for (const [p, r] of sumRows) console.log(p, r.length ? JSON.stringify(r.map((x) => `${x.impact}:${x.id}x${x.n}`)) : "clean");
await browser.close();
