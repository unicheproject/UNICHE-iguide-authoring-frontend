import { open, go, shot, settle, dash, mock, text, measure, T, P, B, SH, problem } from "./h.mjs";
import { writeFileSync, appendFileSync } from "node:fs";
const LOG = new URL("./a6.log", import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1");
writeFileSync(LOG, "");
const log = (...a) => { console.log(...a); appendFileSync(LOG, a.join(" ") + "\n"); };

// skeleton w/ orgs held
{
  const { browser, page } = await open("admin", { viewport: "1440" });
  let rel; const held = new Promise(r => rel = r);
  await page.route(/\/api\/v1\/organizations(\?.*)?$/, async (route) => { await held; route.continue(); });
  await page.route(new RegExp(`/api/v1/projects/${P}/readiness`), async (route) => { await held; route.continue(); });
  await page.goto("http://localhost:5173" + dash(P)); await settle(page, 2500);
  log("ORGS HELD main:", JSON.stringify(await text(page)));
  await shot(page, "dashboard__loading-orgs-held__1440", false);
  rel(); await browser.close();
}
// long Greek + RTL project name
for (const vp of ["1440", "zoom200"]) {
  const { browser, page } = await open("admin", { viewport: vp });
  const name = "Μουσείο Ιστορίας και Πολιτισμού της Αρχαίας Αθήνας και των Γύρω Περιοχών – Έκδοση Δοκιμής Πολύ Μεγάλου Ονόματος مشروع المتحف";
  await mock(page, P, async (sub) => { if (sub === "") return undefined; });
  await page.route(new RegExp(`/api/v1/projects/${P}$`), async (route) => { const r = await route.fetch(); const j = await r.json(); j.name = name; route.fulfill({ response: r, body: JSON.stringify(j) }); });
  await go(page, dash(P)); await settle(page, 2500);
  await shot(page, `dashboard__long-greek-name__${vp}`, false);
  const m = await measure(page);
  log("long name", vp, "docW", m.docW, "vw", m.vw, "h1", JSON.stringify(m.h1));
  await browser.close();
}
// trail counts + guide at widths + keyboard populated + offline retry
{
  const { browser, context, page } = await open("admin", { viewport: "1440" });
  await go(page, dash(T)); await settle(page, 1800);
  log("TRAIL counts:", JSON.stringify(await page.$$eval("#counts-title ~ ul li", e => e.map(x => x.innerText.replace(/\n/g, " ")))));
  // step 1 link: create dialog
  await page.getByRole("link", { name: "Show drafts" }).click(); await settle(page, 1200);
  log("show drafts ->", page.url());
  await go(page, "/projects/" + T + "/places?create=1"); await settle(page, 1500);
  log("create dlg:", await page.evaluate(() => document.querySelector("[role=dialog]")?.innerText.slice(0, 120)));
  await page.keyboard.press("Escape"); await settle(page, 400);
  log("after esc url", page.url());
  // keyboard run populated
  await go(page, dash(P)); await settle(page, 2000);
  await page.evaluate(() => { const h = document.querySelector("main h1"); h.setAttribute("tabindex", "-1"); h.focus(); });
  let stops = []; for (let i = 0; i < 80; i++) { await page.keyboard.press("Tab"); const s = await page.evaluate(() => { const e = document.activeElement; const inMain = !!e.closest("main"); return (inMain ? "M " : "X ") + (e.textContent || e.getAttribute("aria-label") || "").trim().replace(/\s+/g, " ").slice(0, 36); }); stops.push(s); if (s.startsWith("X") && stops.filter(x => x.startsWith("X")).length > 2 && stops.slice(-3).every(x => x.startsWith("X"))) break; }
  log("KEYBOARD stops:", stops.length, "\n" + stops.slice(0, 40).join("\n"));
  log("main tab stops before leaving main:", stops.findIndex(s => s.startsWith("X")));
  // offline
  await go(page, dash(P)); await settle(page, 1500);
  await page.unrouteAll({ behavior: "ignoreErrors" });
  await mock(page, P, async (sub) => (sub === "/readiness" ? { status: 503, json: problem(503) } : undefined));
  await page.getByRole("link", { name: "Dashboard" }).first().click().catch(() => {}); await go(page, dash(P)); await settle(page, 2000);
  await context.setOffline(true);
  await page.getByRole("button", { name: "Try again" }).click(); await settle(page, 2000);
  log("OFFLINE retry:", JSON.stringify((await text(page)).slice(0, 380)));
  await shot(page, "dashboard__offline-retry__1440", false);
  await context.setOffline(false);
  await browser.close();
}
// zoom/768 guide + overflow
for (const vp of ["768", "zoom200", "1280"]) {
  const { browser, page } = await open("admin", { viewport: vp });
  await go(page, dash(T)); await settle(page, 2000);
  const m = await page.evaluate(() => ({ docW: document.documentElement.scrollWidth, vw: innerWidth, over: [...document.querySelectorAll("main *")].filter(e => e.scrollWidth > e.clientWidth + 1 && getComputedStyle(e).overflowX === "visible" && e.clientWidth > 0).slice(0, 5).map(e => e.tagName + "." + e.className.toString().slice(0, 30)) }));
  log("overflow trail", vp, JSON.stringify(m));
  await browser.close();
}
console.log("done");
