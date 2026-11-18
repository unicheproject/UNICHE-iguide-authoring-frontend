import * as H from "./h.mjs";
const log = H.LOG("e6");
const { browser, page } = await H.session();
const api = (u) => u.pathname.includes("/iguide/api/");
const matchers = {
  "poi-load": [H.P("/pois/" + H.ids.poi), (p) => new RegExp(`/pois/${H.ids.poi}$`).test(p)],
  "list-pois": [H.P("/pois"), (p) => /\/pois$/.test(p)],
  "list-places": [H.P("/places"), (p) => /\/places$/.test(p)],
  "list-routes": [H.P("/routes"), (p) => /\/routes$/.test(p)],
  "list-guides": [H.P("/guides"), (p) => /\/guides$/.test(p)],
  "list-events": [H.P("/events"), (p) => /\/events$/.test(p)],
  "list-categories": [H.P("/categories"), (p) => /\/categories$/.test(p)],
  "media": [H.P("/media"), (p) => /\/assets$/.test(p)],
  "maps": [H.P("/maps"), (p) => /\/maps$/.test(p)],
  "floorplans": [H.P("/floor-plans"), (p) => /\/floor-plans$/.test(p)],
};
const codes = { 403: "FORBIDDEN", 404: "NOT_FOUND", 500: "INTERNAL_ERROR", 503: "SERVICE_UNAVAILABLE" };
for (const [name, [path, m]] of Object.entries(matchers)) {
  for (const st of name === "poi-load" ? [403, 404, 500, 503] : [403, 503]) {
    await page.unrouteAll({ behavior: "ignoreErrors" });
    await page.route(api, (r) => r.request().method() === "GET" && m(new URL(r.request().url()).pathname) ? r.fulfill(H.problem(st, codes[st])) : r.continue());
    await H.go(page, path); await H.sleep(1800);
    const b = await H.body(page);
    const main = await page.evaluate(() => (document.querySelector("main")?.innerText || "").trim().replace(/\s+/g, " ").slice(0, 380));
    log(`## ${name} ${st}`, { canary: b.includes(H.CANARY), reqId: /req-p6/.test(b), tryAgain: /try again/i.test(b), addLang: /add a language/i.test(b), focus: await H.AE(page), title: await page.title(), main });
    await H.shot(page, `${name}__load-${st}__1440`);
  }
}
await browser.close();
