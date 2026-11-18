import { open, go, P, shot, log, alerts, focused, problem } from "./lib.mjs";
import { readFileSync } from "node:fs";
const ids = JSON.parse(readFileSync("ux-audit/round-1/audit/p6-edge/ids.json","utf8"));
const { browser, context, page } = await open("curator", { viewport: "1440" });
const text = async () => (await page.locator("body").innerText().catch(()=>"")).replace(/\n+/g," | ").slice(0,700);
// GET failures: match GET of record or project
async function load(name, url, matcher, fulfill) {
  await page.unrouteAll({ behavior: "ignoreErrors" });
  await page.route("**/iguide/api/v1/**", (route) => { const r = route.request(); if (r.method()==="GET" && matcher(r.url())) return fulfill(route); return route.continue(); });
  await page.goto("http://localhost:5173"+url); await page.waitForLoadState("networkidle").catch(()=>{}); await page.waitForTimeout(1500);
  log(`\n=== ${name}`); log("url", page.url()); log("alerts", await alerts(page)); log("focus", await focused(page)); log("body", await text());
  await shot(page, `load-${name}__1440`);
}
const rec = new RegExp(`/pois/${ids.poiA}$`);
const proj = new RegExp(`/projects/${P}$`);
const E = (s,c)=>(r)=>r.fulfill(problem(s,c));
await load("poi-404", `/projects/${P}/pois/${ids.poiA}`, u=>rec.test(u), E(404,"RESOURCE_NOT_FOUND"));
await load("poi-403", `/projects/${P}/pois/${ids.poiA}`, u=>rec.test(u), E(403,"PROJECT_ACCESS_DENIED"));
await load("poi-500", `/projects/${P}/pois/${ids.poiA}`, u=>rec.test(u), E(500,"INTERNAL_ERROR"));
await load("poi-503", `/projects/${P}/pois/${ids.poiA}`, u=>rec.test(u), E(503,"PLATFORM_UNAVAILABLE"));
await load("project-404", `/projects/${P}/pois`, u=>proj.test(u), E(404,"PROJECT_NOT_FOUND"));
await load("project-403", `/projects/${P}/pois`, u=>proj.test(u), E(403,"PROJECT_ACCESS_DENIED"));
await load("project-502", `/projects/${P}`, u=>proj.test(u), E(502,"PLATFORM_UNAVAILABLE"));
await load("list-500", `/projects/${P}/pois`, u=>/\/pois(\?.*)?$/.test(u), E(500,"INTERNAL_ERROR"));
await load("list-abort", `/projects/${P}/routes`, u=>/\/routes(\?.*)?$/.test(u), r=>r.abort("failed"));
await load("bad-uuid", `/projects/${P}/pois/not-a-uuid`, ()=>false, ()=>{});
await load("bad-project", `/projects/00000000-0000-0000-0000-000000000000/pois`, ()=>false, ()=>{});
await browser.close();
