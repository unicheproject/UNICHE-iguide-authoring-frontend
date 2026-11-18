import * as H from "./h.mjs";
import { readFileSync } from "node:fs";
const log = H.LOG("n1");
const ids = JSON.parse(readFileSync(H.here + "/ids.json", "utf8"));
const seed = JSON.parse(readFileSync(H.here + "/../../../tools/seed.json", "utf8"));
const vp = process.argv[2] || "1440";
const { browser, page } = await H.session({ viewport: vp });
const routes = [
  ["dashboard", "/"], ["places", "/places"], ["place-editor", "/places/" + seed.places[0].id], ["pois", "/pois"], ["poi-editor-mine", "/pois/" + ids.poi], ["poi-editor-active", "/pois/" + seed.pois[0].id],
  ["routes", "/routes"], ["route-editor", "/routes/" + ids.route], ["guides", "/guides"], ["guide-editor", "/guides/" + ids.guide], ["events", "/events"], ["event-editor", "/events/" + ids.event],
  ["categories", "/categories"], ["category-editor", "/categories/" + ids.category], ["maps", "/maps"], ["map-editor", "/maps/" + seed.maps[0].id], ["floor-plans", "/floor-plans"], ["floor-plan-editor", "/floor-plans/" + seed.floorPlans[0].id],
  ["media", "/media"], ["asset-editor", "/media/" + seed.assets[0].id], ["preview", "/preview"], ["not-found", "/nothing-here"],
];
const out = [];
try {
  for (const [label, path] of routes) {
    await H.go(page, H.P(path)); await H.sleep(1200);
    const t = await H.title(page);
    const r = await H.axe(page, `${label}@${vp}`, log);
    out.push({ label, vp, title: t.title, h1: t.h1, ae: t.ae, counts: r.counts, v: r.v.map(v => v.id + ":" + v.impact + "x" + v.n) });
    if (!t.h1) log("NO H1", label);
  }
  await H.go(page, "/projects/new"); await H.sleep(1000); const r = await H.axe(page, `create-project@${vp}`, log); out.push({ label: "create-project", vp, counts: r.counts, v: r.v.map(v => v.id + ":" + v.impact) });
  await H.go(page, "/projects/not-a-uuid/pois"); await H.sleep(800); const r2 = await H.axe(page, `bad-project-id@${vp}`, log); log("bad id", JSON.stringify(await H.title(page)));
  await H.go(page, "/"); await H.sleep(800); const r3 = await H.axe(page, `home@${vp}`, log);
} finally { await browser.close(); }
