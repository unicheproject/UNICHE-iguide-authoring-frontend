import { open, go, P, shot, log, alerts, focused, problem } from "./lib.mjs";
import { readFileSync } from "node:fs";
const ids = JSON.parse(readFileSync("ux-audit/round-1/audit/p6-edge/ids.json","utf8"));
const { browser, context, page } = await open("curator", { viewport: "1440" });
const url = `/projects/${P}/pois/${ids.poiA}`;
const body = async () => (await page.locator("main").first().innerText().catch(()=>"")).replace(/\n+/g," | ").slice(0,900);
async function scenario(name, fulfill, { edit = true, click = "Save", wait = 1500 } = {}) {
  await page.unrouteAll({ behavior: "ignoreErrors" });
  await go(page, url); await page.waitForTimeout(1200);
  const seen = [];
  await page.route("**/iguide/api/v1/**", (route) => {
    const r = route.request();
    if (r.method() !== "GET") { seen.push(r.method()+" "+r.url().split("/v1")[1]); return fulfill(route); }
    return route.continue();
  });
  if (edit) { await page.locator("#f-title").fill("UX-p6-edge POI A edited " + name); }
  await page.getByRole("button", { name: click, exact: true }).first().click();
  await page.waitForTimeout(wait);
  log(`\n=== ${name} requests=${JSON.stringify(seen)}`);
  log("alerts:", await alerts(page));
  log("focus:", await focused(page));
  log("main:", await body());
  await shot(page, `poi-editor__err-${name}__1440`);
}
const P7 = (s, c, e) => (route) => route.fulfill(problem(s, c, e));
await scenario("500", P7(500, "INTERNAL_ERROR"));
await scenario("502", P7(502, "PLATFORM_UNAVAILABLE"));
await scenario("503", P7(503, "PLATFORM_UNAVAILABLE"));
await scenario("504", P7(504, "PLATFORM_UNAVAILABLE"));
await scenario("403", P7(403, "PROJECT_ACCESS_DENIED"));
await scenario("404", P7(404, "RESOURCE_NOT_FOUND"));
await scenario("404project", P7(404, "PROJECT_NOT_FOUND"));
await scenario("422", (route) => route.fulfill(problem(422, "VALIDATION_ERROR", { errors: [{ path: "translations.en.title", code: "TOO_LONG", message: "Title must be at most 200 characters." }, { path: "latitude", code: "OUT_OF_RANGE", message: "Latitude must be between -90 and 90." }], details: ["translations.en.title: Title must be at most 200 characters.", "latitude: Latitude must be between -90 and 90."] })));
await scenario("html502", (route) => route.fulfill({ status: 502, contentType: "text/html", body: "<html><body>Bad Gateway nginx</body></html>" }));
await scenario("empty500", (route) => route.fulfill({ status: 500, body: "" }));
await scenario("abort", (route) => route.abort("failed"));
await browser.close();
