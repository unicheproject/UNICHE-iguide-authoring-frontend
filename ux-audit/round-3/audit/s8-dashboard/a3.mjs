import { open, go, shot, settle, measure, dash, mock, emptyPage, problem, text, P, T, B } from "./h.mjs";
import { writeFileSync, appendFileSync } from "node:fs";
const LOG = new URL("./a3.log", import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1");
writeFileSync(LOG, "");
const log = (...a) => { console.log(...a); appendFileSync(LOG, a.join(" ") + "\n"); };

// LOADING + CLS
for (const vp of ["1440", "1024", "zoom200"]) {
  const { browser, page } = await open("admin", { viewport: vp });
  await go(page, "/"); await settle(page, 800);
  // hold orgs list to expose "Organisation" fallback is not possible on SPA nav; use fresh load with orgs held
  const release = await mock(page, P, async (sub) => (sub === "/readiness" ? "hold" : undefined));
  await page.addInitScript(() => { window.__cls = []; new PerformanceObserver(l => { for (const e of l.getEntries()) window.__cls.push({ v: +e.value.toFixed(4), t: Math.round(e.startTime) }); }).observe({ type: "layout-shift", buffered: true }); });
  await page.goto("http://localhost:5173" + dash(P));
  await settle(page, 2200);
  await shot(page, `dashboard__loading__${vp}`);
  if (vp === "1440") {
    log("LOADING main text:", JSON.stringify(await text(page)));
    log("skeleton rects", JSON.stringify(await page.$$eval("[data-testid=dashboard-skeleton] > div > *", e => e.map(x => { const b = x.getBoundingClientRect(); return [Math.round(b.x), Math.round(b.y), Math.round(b.width), Math.round(b.height)]; }))));
    log("busy:", await page.evaluate(() => [...document.querySelectorAll("[aria-busy]")].map(e => e.tagName + ":" + e.getAttribute("aria-busy")).join(",")));
  }
  release(); await settle(page, 3000);
  await shot(page, `dashboard__loaded-after-hold__${vp}`);
  log(vp, "CLS entries:", JSON.stringify(await page.evaluate(() => window.__cls)));
  if (vp === "1440") log("final rects", JSON.stringify((await measure(page)).secs.map(s => [s.id, s.x, s.y, s.w, s.h])));
  await browser.close();
}
// ERRORS
const scenarios = {
  "403-all": async (sub) => ({ status: 403, json: problem(403, { code: "ACCESS_DENIED" }) }),
  "503-all": async (sub) => ({ status: 503, json: problem(503) }),
  "404-all": async (sub) => ({ status: 404, json: problem(404, { code: "PROJECT_NOT_FOUND" }) }),
  "500-readiness": async (sub) => (sub === "/readiness" ? { status: 500, json: problem(500) } : undefined),
  "503-pending-one": async (sub, q) => (sub === "/pois" && q.includes("pending") ? { status: 503, json: problem(503) } : undefined),
  "409-settings": async (sub) => (sub === "/settings" ? { status: 409, json: problem(409, { code: "PROJECT_NOT_INITIALIZED" }) } : undefined),
  "503-settings": async (sub) => (sub === "/settings" ? { status: 503, json: problem(503) } : undefined),
  "422-readiness": async (sub) => (sub === "/readiness" ? { status: 422, json: problem(422, { errors: [{ field: "x", message: "CANARY-FIELD" }] }) } : undefined),
};
for (const [name, rule] of Object.entries(scenarios)) {
  const { browser, page } = await open("admin", { viewport: "1440" });
  await mock(page, P, async (sub, q, m) => (sub === "" ? undefined : rule(sub, q, m)));
  await go(page, dash(P)); await settle(page, 2500);
  const t = await text(page);
  log(`ERR ${name} :: canary shown: ${/CANARY/.test(await page.content())} :: ${JSON.stringify(t.slice(0, 420))}`);
  await shot(page, `dashboard__err-${name}__1440`, false);
  if (name === "403-all") {
    log("403 buttons:", JSON.stringify(await page.$$eval("main button, main a", e => e.map(x => x.textContent.trim()).filter(Boolean).slice(0, 12))));
    log("403 role:", await page.$$eval("[role=alert]", e => e.map(x => x.textContent.trim().slice(0,60)).join("|")));
  }
  await browser.close();
}
console.log("done");
