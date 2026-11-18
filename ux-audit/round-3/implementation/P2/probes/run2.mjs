import { open, go, P, OUT } from "./lib.mjs";
import { mock, problem, blocking } from "./mocks.mjs";
const snap = async (page, name) => page.screenshot({ path: `${OUT}${name}.png` });
const card = (page) => page.evaluate(() => ({ h: document.querySelector("#status-title")?.textContent, p: document.querySelector("#status-title")?.closest("section")?.querySelector("p.max-w-prose")?.textContent, btns: [...(document.querySelector("#status-title")?.closest("section")?.querySelectorAll("a,button") ?? [])].map((e) => e.textContent.trim()), line: document.querySelector("[data-testid=app-status-line]")?.textContent.trim().replace(/\s+/g, " "), alerts: [...document.querySelectorAll("#main [role=alert]")].map((a) => a.textContent.trim().replace(/\s+/g, " ").slice(0, 260)), retry: [...document.querySelectorAll("#main button")].filter((b) => /try again/i.test(b.textContent)).length }));
async function scenario(name, id, rules, vp = "1440", after) {
  const { browser, page } = await open("admin", { viewport: vp });
  await mock(page, id, rules);
  await go(page, `/projects/${id}`);
  await page.waitForSelector("main h1"); await page.waitForTimeout(1800);
  const c = await card(page);
  console.log("##", name, JSON.stringify(c, null, 1));
  if (after) await after(page);
  await snap(page, `${name}-${vp}`);
  await browser.close();
}
const issue = (o) => ({ resourceId: "11111111-1111-1111-1111-111111111111", title: "Temple", languageCode: null, path: "title", ...o });
await scenario("suspended", P.pop, { settings: (j) => ({ ...j, applicationStatus: "SUSPENDED" }) });
await scenario("settings-503", P.pop, { settings: () => problem(503, "SERVICE_UNAVAILABLE") });
await scenario("settings-unknown", P.pop, { settings: (j) => ({ ...j, applicationStatus: "ARCHIVED" }) });
await scenario("blocked", P.pop, { readiness: blocking([
  issue({ resourceType: "POI", title: "Ναός του Ποσειδώνα", languageCode: "el", path: "translations.el.title", code: "MISSING_DEFAULT_LANGUAGE_VALUE" }),
  issue({ resourceType: "POI", title: "Ναός του Ποσειδώνα", languageCode: "en", path: "translations.en.title", code: "MISSING_DEFAULT_LANGUAGE_VALUE" }),
  issue({ resourceType: "NAVIGATION", resourceId: "22222222-2222-2222-2222-222222222222", title: "Main menu", path: "items[0].target", code: "DANGLING_REFERENCE" }),
  issue({ resourceType: "PROJECT", resourceId: null, title: null, path: "surfaces", code: "NO_SURFACE_ENABLED" }),
  issue({ resourceType: "ROUTE", resourceId: "33333333-3333-3333-3333-333333333333", title: "عبور القلعة", path: "stops", code: "ROUTE_WITHOUT_ACTIVE_STOP" }),
  issue({ resourceType: "PLACE", resourceId: "44444444-4444-4444-4444-444444444444", title: "Fort", languageCode: "it", path: "translations.it.summary", code: "MISSING_DEFAULT_LANGUAGE_VALUE" }),
]) });
await scenario("pending-500", P.pop, { "pois?pending": () => problem(500, "INTERNAL_ERROR") });
for (const [st, code] of [[403, "FORBIDDEN"], [404, "NOT_FOUND"], [422, "VALIDATION_ERROR"], [503, "SERVICE_UNAVAILABLE"]])
  await scenario(`err-${st}`, P.pop, { "places?size=1": () => problem(st, code) });
