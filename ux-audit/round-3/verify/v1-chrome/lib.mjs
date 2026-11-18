import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { VIEWPORTS, CMS, open, go } from "../../../tools/session.mjs";
const here = dirname(fileURLToPath(import.meta.url));
const require = createRequire(join(here, "..", "..", "..", "..", "package.json"));
export const { chromium } = require("@playwright/test");
export const { AxeBuilder } = require("@axe-core/playwright");
export { VIEWPORTS, CMS, open, go };
export const P = "6958c18f-60d2-4140-a524-5a43f8a2f6b5";
export const B = "1d6971ce-6391-4da8-848e-8d7466d25128";
export const T = "600c4311-3e81-4235-91b0-5b3e336918fc";
export const D = "f56e8c75-94af-4c87-88c8-06cba46240a1";
export const SHOTS = join(here, "shots");
const creds = () => JSON.parse(readFileSync(join(here, "..", "..", "..", "tools", "accounts.local"), "utf8")).admin;
export async function fresh(vp = "1440", opts = {}) {
  const v = VIEWPORTS[vp];
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: v.width, height: v.height }, deviceScaleFactor: v.deviceScaleFactor ?? 1, reducedMotion: opts.reducedMotion ?? "no-preference", forcedColors: opts.forcedColors ?? "none" });
  const page = await context.newPage();
  return { browser, context, page };
}
export async function kcLogin(page) {
  const c = creds();
  await page.waitForURL(/\/realms\//, { timeout: 30000 });
  await page.locator("#username").fill(c.user);
  await page.locator("#password").fill(c.password);
  await page.locator("#kc-login").click();
}
export const shot = (page, name, full = false) => page.screenshot({ path: join(SHOTS, name + ".png"), fullPage: full }).catch(e => console.log("shotfail", name, e.message));
export const text = (page) => page.evaluate(() => document.body.innerText);
export const settle = (page, ms = 1200) => page.waitForTimeout(ms);
export const problem = (status, code = "SERVER_ERROR") => ({ status, contentType: "application/problem+json", body: JSON.stringify({ type: "about:blank", title: "SECRET-SERVER-DETAIL", status, detail: "SECRET-SERVER-DETAIL", code, requestId: "req-v1chrome-123" }) });
export async function axe(page) {
  const r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  return r.violations.map(v => `${v.impact} ${v.id} x${v.nodes.length} ${v.nodes[0]?.target?.join(" ")}`);
}
export const rect = (page, sel) => page.locator(sel).first().evaluate(e => { const r = e.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }; }).catch(() => null);
export async function bearerOf(page) {
  return null;
}
export const json = (body, status = 200) => ({ status, contentType: "application/json", body: JSON.stringify(body) });
const empty = { content: [], page: 0, size: 1, totalElements: 0, totalPages: 0 };
/** Dashboard mocks. mode: pristine | suspended | blocked | f403 | f503 | f404 */
export async function mockDash(page, id, mode) {
  await page.route(new RegExp(`/projects/${id}/(settings|readiness|languages|navigations|places|pois|routes|guides|events|categories|assets|maps|floor-plans)`), async (route) => {
    const u = route.request().url();
    const k = (u.match(/projects\/[0-9a-f-]{36}\/([a-z-]+)/) || [])[1];
    if (mode === "pristine") {
      if (k === "settings") { const r = await route.fetch(); const b = await r.json(); return route.fulfill(json({ ...b, applicationStatus: "DRAFT", contentRevision: 0 })); }
      if (k === "readiness") return route.fulfill(json({ activatable: true, blocking: [], warnings: [] }));
      if (k === "languages") { const r = await route.fetch(); const b = await r.json(); return route.fulfill(json({ languages: b.languages.map(l => ({ ...l, titledResourceCount: 0 })), resourceCount: 0 })); }
      if (k === "navigations") return route.fulfill(json([]));
      return route.fulfill(json(empty));
    }
    if (mode === "suspended" && k === "settings") { const r = await route.fetch(); const b = await r.json(); return route.fulfill(json({ ...b, applicationStatus: "SUSPENDED" })); }
    if (mode === "blocked" && k === "readiness") return route.fulfill(json({ activatable: false, blocking: [
      { resourceType: "PROJECT", resourceId: null, title: null, languageCode: null, path: "enabledSurfaces", code: "NO_SURFACE_ENABLED" },
      { resourceType: "POI", resourceId: "aaaaaaaa-0000-4000-8000-000000000001", title: null, languageCode: "en", path: "title", code: "MISSING_DEFAULT_LANGUAGE_VALUE" },
      { resourceType: "ROUTE", resourceId: "aaaaaaaa-0000-4000-8000-000000000002", title: "Family Trail", languageCode: "en", path: "stops", code: "ROUTE_WITHOUT_ACTIVE_STOP" },
      { resourceType: "ASSET", resourceId: "aaaaaaaa-0000-4000-8000-000000000003", title: "Hero", languageCode: null, path: "alt", code: "MISSING_ALTERNATIVE_TEXT" },
      { resourceType: "PLACE", resourceId: "aaaaaaaa-0000-4000-8000-000000000004", title: "Main hall", languageCode: "el", path: "title", code: "MISSING_DEFAULT_LANGUAGE_VALUE" } ], warnings: [] }));
    if (mode === "f403" && (k === "settings" || k === "readiness")) return route.fulfill(problem(403, "FORBIDDEN"));
    if (mode === "f503" && (k === "settings" || k === "readiness")) return route.fulfill(problem(503, "SERVICE_UNAVAILABLE"));
    if (mode === "f404" && (k === "settings" || k === "readiness")) return route.fulfill(problem(404, "NOT_FOUND"));
    if (/^d(403|503|404)$/.test(mode) && /size=1&status=/.test(u)) return route.fulfill(problem(Number(mode.slice(1)), "X"));
    return route.continue();
  });
}
