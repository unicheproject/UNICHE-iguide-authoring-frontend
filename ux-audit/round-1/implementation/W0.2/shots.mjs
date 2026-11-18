// W0 stage 0.2 screenshots. Windows Node: node ux-audit\round-1\implementation\W0.2\shots.mjs <poi|others> [viewport...]
import { readFileSync } from "node:fs";
import { open, go, VIEWPORTS } from "../../../tools/session.mjs";
const seed = JSON.parse(readFileSync(new URL("../../../tools/seed.json", import.meta.url), "utf8"));
const rec = JSON.parse(readFileSync(new URL("./records.json", import.meta.url), "utf8"));
VIEWPORTS["1180"] = { width: 1180, height: 800 };
const P = seed.projects.populated.id;
const id = (list, key) => seed[list].find((x) => x.key === key).id;
const out = new URL("./after/", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const mode = process.argv[2] ?? "poi";
const vps = process.argv.slice(3).length ? process.argv.slice(3) : ["1440"];
const ready = async (page) => {
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.locator("main h1").first().waitFor({ state: "visible", timeout: 20000 }).catch(() => {});
  await page.waitForTimeout(1200);
};
const poi = (k) => `/projects/${P}/pois/${id("pois", k)}`;
const clean = (page) => page.evaluate(() => Object.keys(localStorage).filter((k) => k.startsWith("iguide:draft:")).forEach((k) => localStorage.removeItem(k)));

for (const vp of vps) {
  const { browser, page } = await open("curator", { viewport: vp });
  const shot = (n, full = false) => page.screenshot({ path: `${out}${n}__${vp}.png`, fullPage: full });
  if (mode === "poi") {
    for (const [name, url] of [["poi-draft", poi("horsemen")], ["poi-active", poi("pediment")], ["poi-active-pending", poi("frieze")]]) {
      await go(page, url); await ready(page); await shot(name);
    }
    await go(page, poi("frieze")); await ready(page);
    await page.evaluate(() => document.querySelector("main").scrollTo(0, 1500)); await page.waitForTimeout(600); await shot("poi-scrolled-1500");
    await go(page, poi("horsemen")); await ready(page);
    await page.getByRole("button", { name: /^(save and )?activate$/i }).first().click(); await page.waitForTimeout(700); await shot("poi-activate-dialog");
    await page.keyboard.press("Escape");
    await go(page, poi("frieze")); await ready(page);
    await page.getByRole("tab", { name: /ελληνικά/i }).click(); await page.waitForTimeout(600); await shot("poi-translation-greek");
    await go(page, poi("frieze")); await ready(page);
    await page.locator("[data-preview-action]").first().click(); await page.waitForTimeout(900); await shot("poi-preview-open");
    // 422 summary on my own record: the PUT is answered with a validation problem (nothing is saved).
    await page.route(new RegExp(`/pois/${rec.draft}$`), (route) => route.request().method() === "PUT"
      ? route.fulfill({ status: 422, contentType: "application/problem+json", body: JSON.stringify({ type: "urn:uniche:iguide:problem:VALIDATION_ERROR", title: "Validation failed", status: 422, code: "VALIDATION_ERROR", requestId: "req-w02-demo", details: ["slug: Use lowercase letters, digits and hyphens.", "translations.en.title: Required in the default language."] }) })
      : route.continue());
    await go(page, `/projects/${P}/pois/${rec.draft}`); await ready(page);
    await page.locator("#f-summary").fill("UX-W0.2 summary " + Date.now());
    await page.locator("[data-editor-primary]").click(); await page.locator("[data-error-summary]").waitFor({ timeout: 10000 }).catch(() => {}); await page.waitForTimeout(600); await shot("poi-422-summary");
    await clean(page);
  }
  if (mode === "others") {
    const targets = {
      "place-active": `/projects/${P}/places/${id("places", "athens")}`,
      "place-draft": `/projects/${P}/places/${id("places", "gf")}`,
      "route-active": `/projects/${P}/routes/${id("routes", "family")}`,
      "guide-active": `/projects/${P}/guides/${id("guides", "parthenon")}`,
      "event-active": `/projects/${P}/events/${id("events", "fullmoon")}`,
      "category-active": `/projects/${P}/categories/${id("categories", "monuments")}`,
    };
    for (const [name, url] of Object.entries(targets)) { await go(page, url); await ready(page); await shot(name); }
  }
  await browser.close();
}
