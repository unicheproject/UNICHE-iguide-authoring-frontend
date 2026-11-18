import * as H from "./h.mjs";
const log = H.LOG("e7b");
const { browser, page } = await H.session();
const api = (u) => u.pathname.includes("/iguide/api/");
for (const [pn, pp, re] of [["pois","/pois",/\/triggers$/],["routes","/routes",/\/categories(\?|$)/],["routes","/routes",/\/(routes\/[^/]+\/)?categories/]]) {
  await page.unrouteAll({ behavior: "ignoreErrors" });
  const seen = [];
  await page.route(api, (r) => { const p = new URL(r.request().url()); if (r.request().method()==="GET" && re.test(p.pathname)) { seen.push(p.pathname.replace(H.PID,"PID")+p.search); return r.fulfill(H.problem(503, "SERVICE_UNAVAILABLE")); } return r.continue(); });
  await H.go(page, H.P(pp)); await H.sleep(1800);
  log(pn, String(re), "intercepted", [...new Set(seen)].slice(0,4), "noTrigger", (await H.body(page)).split("No trigger").length-1, "alerts", (await page.locator("[role=alert]").allInnerTexts()).filter(Boolean));
  await H.shot(page, `${pn}-list__reads-503-${String(re).replace(/\W/g,"").slice(0,12)}__1440`);
}
await browser.close();
