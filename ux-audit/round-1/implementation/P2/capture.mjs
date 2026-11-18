// P2 captures. Windows Node: node ux-audit\round-1\implementation\P2\capture.mjs <mode>
// modes: shots | states | axe
import { createRequire } from "node:module";
import { open, go, VIEWPORTS, bearer, API } from "../../../tools/session.mjs";
const require = createRequire(new URL("../../../../package.json", import.meta.url));
const { AxeBuilder } = require("@axe-core/playwright");
const OUT = "ux-audit/round-1/implementation/P2/after/";
const POP = "6958c18f-60d2-4140-a524-5a43f8a2f6b5";
const EMPTY_B = "1d6971ce-6391-4da8-848e-8d7466d25128";
const EMPTY_C = "ceee1b24-e7c4-474e-93ba-f77067ed8a72";
const mode = process.argv[2] ?? "shots";
const label = process.argv[3] ?? "";
const settle = (page) => page.waitForTimeout(2500);
const path = (id) => `/projects/${id}`;

async function shotAll(name, id, extra) {
  for (const viewport of ["1440", "1024", "768", "zoom200"]) {
    const { browser, page } = await open("curator", { viewport });
    if (extra) await extra(page);
    await go(page, path(id)); await settle(page);
    await page.screenshot({ path: `${OUT}${name}__${viewport}.png`, fullPage: true });
    await browser.close();
  }
  const { browser, page } = await open("curator", { viewport: "1280", forcedColors: "active" });
  if (extra) await extra(page);
  await go(page, path(id)); await settle(page);
  await page.screenshot({ path: `${OUT}${name}__forced-colors.png`, fullPage: true });
  await browser.close();
}

if (mode === "shots") {
  const target = { c: ["empty-c", EMPTY_C], b: ["empty-b", EMPTY_B], pop: ["populated", POP] }[label];
  await shotAll(target[0] + (process.argv[4] ?? ""), target[1]);
}

if (mode === "states") {
  const readiness = (blocking, warnings) => ({ activatable: blocking.length === 0, blocking, warnings });
  const issue = (code, over = {}) => ({ resourceType: "POI", resourceId: "00000000-0000-0000-0000-000000000001", title: "Temple of Hera", languageCode: "el", path: "translations.el.title", code, ...over });
  const cases = {
    blocked: readiness([issue("MISSING_DEFAULT_LANGUAGE_VALUE", { languageCode: null, path: "translations.en.summary" }), issue("MISSING_ALTERNATIVE_TEXT", { resourceType: "ASSET", title: "Hall.jpg" })], []),
    warnings: null, // real data
    ready: readiness([], []),
    "not-live": readiness([], []),
  };
  for (const [name, body] of Object.entries(cases)) {
    const { browser, page } = await open("curator", { viewport: "1440" });
    if (body) await page.route(/\/readiness$/, (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(body) }));
    if (name === "not-live") {
      await page.route(/\/(places|pois|routes|guides|events|categories|assets|maps|floor-plans)\?size=1&status=ACTIVE/, (r) =>
        r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ content: [], page: 0, size: 1, totalElements: 0, totalPages: 0 }) }));
    }
    await go(page, path(POP)); await settle(page);
    await page.screenshot({ path: `${OUT}state-${name}__1440.png`, fullPage: true });
    await browser.close();
  }
  const { browser, page } = await open("curator", { viewport: "1440" });
  await page.route(/\/readiness$/, (r) => r.fulfill({ status: 503, contentType: "application/problem+json", body: JSON.stringify({ type: "urn:x", title: "Unavailable", status: 503, code: "PLATFORM_UNAVAILABLE", requestId: "req-test-1234", detail: "boom" }) }));
  await go(page, path(POP)); await settle(page);
  await page.screenshot({ path: `${OUT}state-error__1440.png`, fullPage: true });
  await browser.close();
}

if (mode === "axe") {
  for (const [name, id] of [["empty-c", EMPTY_C], ["empty-b", EMPTY_B], ["populated", POP]]) {
    for (const viewport of ["1440", "768"]) {
      const { browser, page } = await open("curator", { viewport });
      await go(page, path(id)); await settle(page);
      const r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
      console.log(name, viewport, r.violations.map((v) => `${v.impact}:${v.id}(${v.nodes.length})`).join(" ") || "clean");
      // tab stops before first content
      const stops = await page.evaluate(async () => {
        document.querySelector("#main")?.scrollIntoView();
        return null;
      });
      await browser.close();
    }
  }
}

if (mode === "keys") {
  const { browser, page } = await open("curator", { viewport: "1440" });
  await go(page, path(POP)); await settle(page);
  const main = await page.locator("#main").elementHandle();
  // count tab stops from the skip-link start until the first stop inside main
  await page.evaluate(() => { (document.activeElement)?.blur?.(); window.scrollTo(0, 0); });
  await page.locator("body").click({ position: { x: 1, y: 1 } }).catch(() => {});
  let n = 0; let total = 0; let firstInMain = -1;
  for (let i = 0; i < 400; i++) {
    await page.keyboard.press("Tab"); n++;
    const inMain = await page.evaluate(() => !!document.activeElement?.closest("#main"));
    if (inMain && firstInMain < 0) firstInMain = n;
    if (inMain) total++;
    const left = await page.evaluate(() => document.activeElement === document.body);
    if (left) break;
  }
  console.log("tab stops before main:", firstInMain - 1, "inside main:", total);
  await browser.close();
}
