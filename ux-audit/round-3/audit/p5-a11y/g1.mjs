import * as H from "./h.mjs";
const log = H.LOG("g1");
const { browser, page } = await H.session();
const ids = JSON.parse((await import("node:fs")).readFileSync(H.here + "/ids.json", "utf8"));
async function cc(label) {
  const r = await new H.AxeBuilder({ page }).withRules(["color-contrast"]).analyze();
  const rows = new Map();
  for (const v of r.violations) for (const n of v.nodes) { const d = n.any[0]?.data || {}; const k = `${d.fgColor}/${d.bgColor}/${d.contrastRatio}/${d.fontSize}`; const e = rows.get(k) || { n: 0, ex: n.html.slice(0, 110) }; e.n++; rows.set(k, e); }
  log("CC", label, "violations nodes:", [...rows.values()].reduce((a, b) => a + b.n, 0)); for (const [k, v] of rows) log("   ", k, "x" + v.n, v.ex);
}
try {
  for (const [label, path] of [["dashboard", "/"], ["poi-list", "/pois"], ["event-editor", "/events/" + ids.event], ["poi-editor", "/pois/" + ids.poi], ["route-editor", "/routes/" + ids.route], ["guide-editor", "/guides/" + ids.guide], ["category-editor", "/categories/" + ids.category], ["media", "/media"], ["maps", "/maps"], ["preview", "/preview"]]) {
    await H.go(page, H.P(path)); await H.sleep(800); await cc(label);
  }
} finally { await browser.close(); }
