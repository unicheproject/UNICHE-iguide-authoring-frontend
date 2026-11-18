import { open, CMS, P, EC, ED, EB, settle, attach, rec, tryDo, here } from "./lib.mjs";
import { writeFileSync, readFileSync } from "node:fs";
const vpName = process.argv[2] ?? "1440";
const { browser, page } = await open("admin", { viewport: vpName });
const errs = []; const e = attach(page, "routes-" + vpName); errs.push(e);
const base = `${CMS}/projects/${P}`;
const seed = JSON.parse(readFileSync(here + "/../../../tools/seed.json", "utf8"));
const id = (k, key) => seed[k].find((x) => x.key === key).id;
const all = [
 ["home", `${CMS}/`], ["create-project", `${CMS}/projects/new`],
 ["dashboard-populated", base], ["dashboard-emptyD", `${CMS}/projects/${ED}`],
 ["places", `${base}/places`], ["pois", `${base}/pois`], ["routes", `${base}/routes`], ["guides", `${base}/guides`], ["events", `${base}/events`], ["categories", `${base}/categories`],
 ["maps", `${base}/maps`], ["floor-plans", `${base}/floor-plans`], ["media", `${base}/media`], ["media-list", `${base}/media?view=list`], ["preview", `${base}/preview`],
 ["poi-editor-pending", `${base}/pois/${id("pois","frieze")}`],
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
 ["preview-trigger-qr", `${base}/preview?trigger=00000000-0000-0000-0000-000000000000`],
 ["app-preview", `${CMS}/projects/${P}/app-preview`],
];
const oos = ["overview","languages","surfaces","translations","navigation","launch","audit-log","pages","features","appearance","app-settings"].map((s)=>[`oos-${s}`, `${base}/${s}`]);
const fiveNames = ["dashboard-populated","pois","poi-editor-pending","media","preview"];
let targets = vpName === "1440" ? all.concat(oos) : vpName === "768" ? all.filter(([n]) => fiveNames.includes(n)) : all.filter(([n]) => ["poi-editor-draft","pois"].includes(n));
const only = process.env.ONLY; if (only) targets = targets.filter(([n]) => only.split(",").includes(n));
for (const [name, url] of targets) {
  const before = { p: e.pageerror.length, c: e.console.length };
  await tryDo(name, async () => { await page.goto(url); await settle(page, 1500); });
  const row = await rec(page, name, { vp: vpName });
  row.errors = { pageerror: e.pageerror.slice(before.p), console: e.console.slice(before.c) };
  console.log(name, row.url, "|", row.title, "| h1:", row.h1, "ov", row.overlay, "len", row.bodyLen, "hs", row.hscroll, "viol", row.violations.map(v=>v.id+":"+v.impact+":"+v.n).join(","), "err", row.errors.pageerror.length, row.errors.console.length);
}
writeFileSync(`${here}/errors-routes-${vpName}.json`, JSON.stringify(errs, null, 1));
await browser.close();
