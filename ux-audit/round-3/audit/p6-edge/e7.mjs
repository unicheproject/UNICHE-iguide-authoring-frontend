import * as H from "./h.mjs";
const log = H.LOG("e7");
const { browser, page } = await H.session();
const api = (u) => u.pathname.includes("/iguide/api/");
const sets = [
  ["languages", /\/languages$/], ["categories", /\/categories(\?|$)/], ["places", /\/places$/], ["triggers", /\/triggers$/],
];
const pages = { pois: "/pois", routes: "/routes", guides: "/guides", events: "/events", places: "/places", categories: "/categories", media: "/media" };
for (const [pn, pp] of Object.entries(pages)) for (const [sn, re] of sets) {
  if ((pn === "places" && sn === "places") || (pn === "categories" && sn === "categories")) continue;
  await page.unrouteAll({ behavior: "ignoreErrors" });
  await page.route(api, (r) => r.request().method() === "GET" && re.test(new URL(r.request().url()).pathname) ? r.fulfill(H.problem(503, "SERVICE_UNAVAILABLE")) : r.continue());
  await H.go(page, H.P(pp)); await H.sleep(1500);
  const main = await page.evaluate(() => (document.querySelector("main")?.innerText || "").trim().replace(/\s+/g, " "));
  const b = await H.body(page);
  log(`## ${pn} with ${sn} 503`, { canary: b.includes(H.CANARY), addLang: /add a language/i.test(b), alerts: await page.locator("[role=alert]").allInnerTexts(), tryAgain: /try again/i.test(b), rows: await page.locator("tbody tr, [role=row]").count(), head: main.slice(0, 160) });
  if (sn === "languages" || (pn === "pois" && sn === "categories")) await H.shot(page, `${pn}-list__${sn}-503__1440`);
}
await browser.close();
