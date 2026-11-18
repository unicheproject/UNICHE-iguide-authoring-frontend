import { open, CMS, P, EC, EB, settle, attach, rec, tryDo, here } from "./lib.mjs";
import { writeFileSync } from "node:fs";
const vpName = process.argv[2] ?? "1440";
const { browser, page } = await open("curator", { viewport: vpName });
const errs = [];
const e = attach(page, "routes"); errs.push(e);
const base = `${CMS}/projects/${P}`;
const routes = [
 ["home", `${CMS}/`], ["dashboard-populated", base], ["dashboard-emptyC", `${CMS}/projects/${EC}`], ["dashboard-emptyB", `${CMS}/projects/${EB}`],
 ["places", `${base}/places`], ["pois", `${base}/pois`], ["routes", `${base}/routes`], ["guides", `${base}/guides`], ["events", `${base}/events`], ["categories", `${base}/categories`],
 ["maps", `${base}/maps`], ["floor-plans", `${base}/floor-plans`], ["media", `${base}/media`], ["preview", `${base}/preview`],
 ["poi-editor-active-pending", `${base}/pois/546c5177-effd-49c8-acae-85d751f89bbe`],
 ["poi-editor-draft", `${base}/pois/${process.env.DRAFTPOI}`],
 ["poi-editor-active", `${base}/pois/9d32bf3f`],
];
const seed = JSON.parse((await import("node:fs")).readFileSync(here + "/../../../tools/seed.json", "utf8"));
const id = (k, key) => seed[k].find((x) => x.key === key).id;
const more = [
 ["poi-editor-active-pending", `${base}/pois/${id("pois","frieze")}`],
 ["poi-editor-draft", `${base}/pois/${id("pois","horsemen")}`],
 ["poi-editor-active", `${base}/pois/${id("pois","pediment")}`],
 ["place-editor", `${base}/places/${id("places","athens")}`],
 ["route-editor", `${base}/routes/${id("routes","acro")}`],
 ["route-editor-draft", `${base}/routes/${id("routes","agora")}`],
 ["guide-editor", `${base}/guides/${id("guides","parthenon")}`],
 ["event-editor", `${base}/events/${id("events","fullmoon")}`],
 ["category-editor", `${base}/categories/${id("categories","monuments")}`],
 ["map-editor", `${base}/maps/${seed.maps[0].id}`],
 ["floor-plan-editor", `${base}/floor-plans/${seed.floorPlans[0].id}`],
 ["asset-editor", `${base}/media/${id("assets","a_parthenon_dawn")}`],
];
const list = routes.slice(0, 14).concat(more);
// out-of-scope
const oos = ["overview","languages","surfaces","translations","navigation","launch","audit-log","pages","features","appearance"].map((s)=>[`oos-${s}`, `${base}/${s}`]);
const oosAll = vpName === "1440" ? oos.concat([["oos-appsettings", `${base}/app-settings`]]) : [];
const appPrev = [["app-preview", `${CMS}/projects/${P}/app-preview`]];
const targets = vpName === "1440" ? list.concat(appPrev, oosAll) : list.filter(([n]) => ["dashboard-populated","pois","poi-editor-active-pending","media","preview"].includes(n));
for (const [name, url] of targets) {
  const before = { p: e.pageerror.length, c: e.console.length };
  await tryDo(name, async () => { await page.goto(url); await settle(page, 1500); });
  const row = await rec(page, name, { vp: vpName });
  row.errors = { pageerror: e.pageerror.slice(before.p), console: e.console.slice(before.c) };
  console.log(name, row.url, "h1:", row.h1, "ov", row.overlay, "len", row.bodyLen, "viol", row.violations.map(v=>v.id+":"+v.impact).join(","), "err", row.errors.pageerror.length, row.errors.console.length);
}
writeFileSync(`${here}/errors-routes-${vpName}.json`, JSON.stringify(errs, null, 1));
await browser.close();
