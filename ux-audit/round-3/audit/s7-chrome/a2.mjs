import { open, go, P, shot, settle } from "./h.mjs";
const { browser, context, page } = await open("admin", { viewport: "1440" });
const errs = []; page.on("pageerror", e => errs.push(e.message));
const body = (status, code, extra = {}) => JSON.stringify({ type: "about:blank", title: "SECRET-TITLE", status, code, detail: "SECRET-DETAIL NullPointerException", requestId: "req-s7-" + status, ...extra });
async function mock(status, code, match = /\/iguide\/api\/v1\/(projects|me)/) {
  await page.unroute("**/iguide/api/v1/**").catch(() => {});
  await page.route("**/iguide/api/v1/**", r => {
    const rq = r.request();
    if (rq.resourceType() === "document" || !match.test(rq.url())) return r.continue();
    r.fulfill({ status, contentType: "application/problem+json", body: body(status, code) });
  });
}
async function capture(name, path, opts = {}) {
  await go(page, path); await settle(page, opts.wait ?? 2500);
  const m = await page.evaluate(() => {
    const h = document.querySelector("h1");
    const card = h?.closest("[class*=rounded]");
    const cb = card?.getBoundingClientRect();
    const a = document.activeElement;
    return { h1: h?.textContent.trim(), h1top: h && Math.round(h.getBoundingClientRect().top), h1fs: h && getComputedStyle(h).fontSize, cardW: cb && Math.round(cb.width), cardTop: cb && Math.round(cb.top), cardLeft: cb && Math.round(cb.left), focus: a?.tagName + ":" + (a?.textContent || "").trim().slice(0, 40), title: document.title,
      body: document.querySelector("main")?.innerText.replace(/\n+/g, " | ").slice(0, 500),
      alerts: [...document.querySelectorAll('[role=alert],[role=status]')].map(x => x.getAttribute("role") + ":" + x.textContent.trim().slice(0, 80)),
      headerChip: document.querySelector("header")?.innerText.replace(/\n+/g, " | ").slice(0, 100), detailLeak: /SECRET/.test(document.body.innerText) };
  });
  console.log("##", name, JSON.stringify(m));
  await shot(page, name + "__1440");
}
for (const [s, c] of [[403, "FORBIDDEN"], [404, "NOT_FOUND"], [500, "INTERNAL"], [502, "BAD_GATEWAY"], [503, "SERVICE_UNAVAILABLE"], [504, "GATEWAY_TIMEOUT"]]) {
  await mock(s, c);
  await capture(`err${s}__project`, `/projects/${P}`);
}
for (const [s, c] of [[403, "FORBIDDEN"], [404, "NOT_FOUND"], [503, "X"], [409, "CONFLICT"], [422, "VALIDATION_FAILED"]]) {
  await mock(s, c, /\/pois(\?|$)/);
  await capture(`err${s}__poilist`, `/projects/${P}/pois`);
}
await page.unroute("**/iguide/api/v1/**");
await capture("notfound__unknown-root", "/nothing-here");
await capture("notfound__project-bad-id", "/projects/not-a-uuid");
await capture("notfound__in-project", `/projects/${P}/zzz`);
await capture("notfound__ghost-uuid", "/projects/00000000-0000-4000-8000-000000000000");
await capture("notfound__apppreview", "/app-preview/nothing");
console.log("errs", errs);
await browser.close();
