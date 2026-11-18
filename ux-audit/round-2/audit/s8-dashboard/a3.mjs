import { createRequire } from "node:module";
import { open, go, API, P, emptyPage, json, problem, shot } from "./lib.mjs";
const require = createRequire("C:/Users/mirto/IdeaProjects/iguide/uniche_iguide_frontend/package.json");
const { AxeBuilder } = require("@axe-core/playwright");
const pid = P.pop;
const dash = (id) => `/projects/${id}`;
const { browser, context, page } = await open("curator", { viewport: "1440" });
page.on("pageerror", (e) => console.log("PAGEERROR", e.message));
const wait = (ms) => page.waitForTimeout(ms);
const fresh = () => page.unrouteAll({ behavior: "ignoreErrors" });
const txt = async () => (await page.locator("main").innerText()).replace(/\n+/g, " | ").slice(0, 700);
// loading
await page.route(new RegExp(`/projects/${pid}/(readiness|places\\?size=1)`), async (r) => { await new Promise((s) => setTimeout(s, 5000)); try { await r.continue(); } catch {} });
await page.goto("http://localhost:5173" + dash(pid)); await wait(2500); await shot(page, "dashboard__loading__1440");
console.log("loading:", await txt(), "busy:", await page.locator("[aria-busy=true]").count());
await wait(6000); await fresh();
// 503 counts
await page.route(new RegExp(`/projects/${pid}/pois\\?size=1`), (r) => json(r, 503, problem(503, "SERVICE_UNAVAILABLE", "Service unavailable", "Upstream timed out at jdbc:postgresql://db.internal:5432")));
await go(page, dash(pid)); await wait(1500); await shot(page, "dashboard__error-503__1440"); console.log("503:", await txt()); await fresh();
await page.route(`**/projects/${pid}/readiness`, (r) => json(r, 500, problem(500, "INTERNAL_ERROR", "Internal error", "NullPointerException at ReadinessReport.java:88")));
await go(page, dash(pid)); await wait(1500); await shot(page, "dashboard__error-readiness__1440"); console.log("readiness500:", await txt()); await fresh();
await page.route(`**/projects/${pid}/readiness`, (r) => json(r, 403, problem(403, "ACCESS_DENIED", "Forbidden", "No")));
await go(page, dash(pid)); await wait(1500); console.log("403:", await txt()); await fresh();
await page.route(`**/projects/${pid}/settings`, (r) => json(r, 409, problem(409, "PROJECT_NOT_INITIALIZED", "Conflict", "x")));
await go(page, dash(pid)); await wait(1500); await shot(page, "dashboard__settings-409__1440"); console.log("409:", await txt()); await fresh();
// DRAFT-only B at 1024 tall + zoom guide
await go(page, dash(P.B)); await wait(1000);
// keyboard: tab order inside main on populated
await go(page, dash(pid)); await wait(1500);
await page.keyboard.press("Tab");
const stops = [];
for (let i = 0; i < 60; i++) { stops.push(await page.evaluate(() => { const e = document.activeElement; return (e.closest("main") ? "M:" : e.closest("nav,aside") ? "N:" : "H:") + (e.getAttribute("aria-label") || e.textContent.trim().slice(0, 28)); })); await page.keyboard.press("Tab"); }
console.log("TABS", JSON.stringify(stops));
await page.keyboard.press("Tab");
// axe on states
async function axe(label) { const r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze(); console.log("AXE", label, JSON.stringify(r.violations.map((v) => [v.id, v.impact, v.nodes.length, v.nodes[0].target.join(" ")]))); }
await axe("populated");
await page.getByRole("button", { name: "Review warnings" }).click(); const s = await page.locator("details > summary").count(); for (let i=0;i<s;i++) await page.locator("details > summary").nth(i).click(); await axe("groups-open");
// warnings group detail: field header vs field lines
const info = await page.evaluate(() => [...document.querySelectorAll("#warnings-title ~ * h3, section[aria-labelledby=warnings-title] h3")].slice(0, 12).map((h) => { const ul = h.nextElementSibling; const items = [...ul.querySelectorAll("li")].map((l) => l.textContent.trim()); return [h.textContent.trim(), items.length, new Set(items).size]; }));
console.log("H3 dup", JSON.stringify(info));
await fresh();
await page.route(`**/projects/${P.D}/readiness`, (r) => json(r, 200, { activatable: true, blocking: [], warnings: [{ resourceType: "PROJECT", resourceId: null, title: null, languageCode: null, path: "surfaces", code: "PUBLIC_BASE_URL_MISSING" }] }));
await go(page, dash(P.D)); await wait(1200); await axe("D");
await page.locator("details > summary").first().click(); await wait(300); await shot(page, "dashboard__D-warning-open__1440");
console.log("Dwarn:", await txt());
const ds = await page.locator("main a").evaluateAll((as) => as.map((a) => [a.textContent.trim().slice(0, 30), a.getAttribute("href")])); console.log("D links", JSON.stringify(ds));
await fresh();
// NAVIGATION blocker kind label
await browser.close();
