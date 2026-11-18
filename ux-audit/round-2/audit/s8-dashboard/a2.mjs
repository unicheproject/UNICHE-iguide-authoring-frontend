import { open, go, API, P, emptyPage, json, problem, shot } from "./lib.mjs";
const pid = P.pop;
const dash = (id) => `/projects/${id}`;
const { browser, context, page } = await open("curator", { viewport: "1440" });
page.on("pageerror", (e) => console.log("PAGEERROR", e.message));
page.on("console", (m) => { if (m.type() === "error") console.log("CONSOLE", m.text().slice(0, 200)); });
const wait = (ms) => page.waitForTimeout(ms);
async function fresh(id = pid) { await page.unrouteAll({ behavior: "ignoreErrors" }); }
const blockedBody = (n) => ({ activatable: false, blocking: Array.from({ length: n }, (_, i) => ({ resourceType: ["POI","PLACE","GUIDE","NAVIGATION","PROJECT","ROUTE"][i % 6], resourceId: i % 6 === 4 || i % 6 === 3 ? null : "00000000-0000-4000-8000-00000000000" + i, title: ["Parthenon Frieze","Acropolis Museum","The Story of the Parthenon",null,null,"Family Trail"][i % 6], languageCode: "en", path: ["translations.en.title","translations.en.title","blocks","items","surfaces","stops"][i % 6], code: ["MISSING_DEFAULT_LANGUAGE_VALUE","MISSING_DEFAULT_LANGUAGE_VALUE","MISSING_DEFAULT_LANGUAGE_VALUE","DANGLING_REFERENCE","NO_SURFACE_ENABLED","ROUTE_WITHOUT_ACTIVE_STOP"][i % 6] })), warnings: [] });

// 1. Populated: tall + review warnings + expanded
await go(page, dash(pid)); await wait(1200);
await page.setViewportSize({ width: 1440, height: 2600 }); await wait(400);
await shot(page, "dashboard__pop-tall__1440");
await page.getByRole("button", { name: "Review warnings" }).click(); await wait(500);
console.log("focus after review:", await page.evaluate(() => document.activeElement?.tagName + " " + document.activeElement?.textContent?.slice(0, 40)));
await shot(page, "dashboard__pop-review-warnings__1440");
// expand all groups
const sums = await page.locator("details > summary").count(); console.log("summaries", sums);
for (let i = 0; i < sums; i++) await page.locator("details > summary").nth(i).click();
await wait(400); await shot(page, "dashboard__pop-groups-open__1440");
console.log("warnings text sample:", (await page.locator("#warnings-title").locator("xpath=ancestor::section").innerText()).slice(0, 2500));
// links
const links = await page.locator("main a").evaluateAll((as) => as.map((a) => [a.textContent.trim().slice(0, 40), a.getAttribute("href")]));
console.log("LINKS", links.length, JSON.stringify(links.slice(0, 40)));

// 2. Blocked (6 blockers) and 1 blocker, not-live+blocked
for (const [n, nm] of [[6, "blocked-6"], [1, "blocked-1"]]) {
  await page.setViewportSize({ width: 1440, height: 1100 });
  await fresh();
  await page.route(`**/projects/${pid}/readiness`, (r) => json(r, 200, blockedBody(n)));
  await go(page, dash(pid)); await wait(1200);
  await shot(page, `dashboard__${nm}__1440`);
  console.log(nm, (await page.locator("main section").first().innerText()).slice(0, 900));
}
// Not-live and ready (empty warnings), against Populated
await fresh();
await page.route(`**/projects/${pid}/readiness`, (r) => json(r, 200, { activatable: true, blocking: [], warnings: [] }));
await go(page, dash(pid)); await wait(1200); await shot(page, "dashboard__ready__1440");
console.log("ready:", (await page.locator("main section").first().innerText()).slice(0, 400));
// Pristine simulated (Empty D)
await fresh();
await page.route(new RegExp(`/projects/${P.D}/(places|pois|routes|guides|events|categories|assets|maps|floor-plans)\\?`), (r) => json(r, 200, emptyPage));
await go(page, dash(P.D)); await wait(1200); await shot(page, "dashboard__first-run-pristine__1440");
console.log("pristine:", (await page.locator("main").innerText()).slice(0, 900));
const gl = await page.locator("main a").evaluateAll((as) => as.map((a) => [a.textContent.trim().slice(0, 40), a.getAttribute("href")])); console.log("GUIDE LINKS", JSON.stringify(gl));
// Click the primary button and see where it lands
await page.getByRole("link", { name: "Add a Place" }).first().click(); await wait(1500);
console.log("after Add a Place ->", page.url(), "dialog:", await page.getByRole("dialog").count());
await fresh();
// Loading (hold readiness + counts)
await page.route(new RegExp(`/projects/${pid}/(readiness|places\\?size=1)`), async (r) => { await new Promise((s) => setTimeout(s, 6000)); r.continue(); });
await page.goto("http://localhost:5173" + dash(pid)); await wait(2500); await shot(page, "dashboard__loading__1440");
console.log("loading main:", (await page.locator("main").innerText()).slice(0, 200), "busy:", await page.locator("[aria-busy]").count());
await wait(6000);
// Error: counts 503
await fresh();
await page.route(new RegExp(`/projects/${pid}/pois\\?size=1`), (r) => json(r, 503, problem(503, "SERVICE_UNAVAILABLE", "Service unavailable", "Upstream catalogue timed out at jdbc:postgresql://db.internal:5432")));
await go(page, dash(pid)); await wait(1500); await shot(page, "dashboard__error-503__1440");
console.log("err:", (await page.locator("main").innerText()).slice(0, 500));
// Error: readiness 500 only
await fresh();
await page.route(`**/projects/${pid}/readiness`, (r) => json(r, 500, problem(500, "INTERNAL_ERROR", "Internal error", "NullPointerException at ReadinessReport.java:88")));
await go(page, dash(pid)); await wait(1500); await shot(page, "dashboard__error-readiness__1440");
console.log("err2:", (await page.locator("main").innerText()).slice(0, 600));
// settings 409
await fresh();
await page.route(`**/projects/${pid}/settings`, (r) => json(r, 409, problem(409, "PROJECT_NOT_INITIALIZED", "Conflict", "Project is not initialized")));
await go(page, dash(pid)); await wait(1500); await shot(page, "dashboard__settings-409__1440");
// 403 on readiness
await fresh();
await page.route(`**/projects/${pid}/readiness`, (r) => json(r, 403, problem(403, "ACCESS_DENIED", "Forbidden", "No")));
await go(page, dash(pid)); await wait(1500); await shot(page, "dashboard__readiness-403__1440");
console.log("403:", (await page.locator("main").innerText()).slice(0, 400));
// offline
await fresh(); await go(page, dash(pid)); await wait(800);
await context.setOffline(true); await page.reload().catch(() => {}); await wait(2500); await shot(page, "dashboard__offline-reload__1440");
await context.setOffline(false);
await browser.close();
