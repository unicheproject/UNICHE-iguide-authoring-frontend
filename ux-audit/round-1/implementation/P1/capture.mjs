// P1 capture. Windows Node:
//   node ux-audit\round-1\implementation\P1\capture.mjs <mode> [viewports...]
// Modes: home, switcher, create-errors, create-flow, states, signin, axe, keys.
import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { open, go, CMS, VIEWPORTS } from "../../../tools/session.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const require = createRequire(join(here, "..", "..", "..", "..", "package.json"));
const { chromium } = require("@playwright/test");
const { default: AxeBuilder } = require("@axe-core/playwright");
const seed = JSON.parse(readFileSync(join(here, "..", "..", "..", "tools", "seed.json"), "utf8"));
const P = seed.projects.populated.id;
const out = (name) => join(here, "after", name);
const mode = process.argv[2] ?? "home";
const vps = process.argv.slice(3).length ? process.argv.slice(3) : ["1440", "1024", "768", "zoom200"];
const settle = async (page, ms = 900) => {
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.waitForTimeout(ms);
};
const shot = (page, name, vp, full = true) => page.screenshot({ path: out(`${name}__${vp}.png`), fullPage: full });

async function axe(page, label) {
  const r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  const bad = r.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
  console.log(`axe ${label}: ${r.violations.length} violations, ${bad.length} serious/critical`);
  for (const v of r.violations) console.log(`   ${v.impact} ${v.id}: ${v.help} (${v.nodes.length}) ${v.nodes.slice(0,2).map((n) => n.html.slice(0,160)).join(" // ")}`);
  return bad.length;
}

if (mode === "home") {
  for (const vp of vps) {
    const { browser, page } = await open("admin", { viewport: vp });
    await go(page, "/");
    await page.getByRole("heading", { name: "Projects", level: 1 }).waitFor();
    await settle(page, 1500);
    await shot(page, "home", vp);
    if (vp === "1440") {
      await page.getByLabel(/Search projects/).fill("populated");
      await settle(page, 600);
      await shot(page, "home-search", vp);
      await page.getByLabel(/Search projects/).fill("zzzz");
      await settle(page, 600);
      await shot(page, "home-nomatch", vp);
      await page.getByLabel(/Search projects/).fill("");
      await page.getByRole("button", { name: /Needs setup/ }).click();
      await settle(page, 1200);
      await shot(page, "home-setup-open", vp);
    }
    await browser.close();
  }
  // Forced colours and Greek search
  const { browser, page } = await open("admin", { viewport: "1440", forcedColors: "active" });
  await go(page, "/");
  await settle(page, 1500);
  await shot(page, "home-forced", "1440");
  await browser.close();
}

if (mode === "switcher") {
  for (const vp of vps) {
    const { browser, page } = await open("curator", { viewport: vp });
    await go(page, `/projects/${P}`);
    await settle(page, 1200);
    await shot(page, "header", vp, false);
    await page.getByRole("button", { name: /Switch project/ }).click();
    await settle(page, 1200);
    await shot(page, "switcher-open", vp, false);
    await browser.close();
  }
}

if (mode === "create-errors") {
  for (const vp of vps) {
    const { browser, page } = await open("admin", { viewport: vp });
    await go(page, "/projects/new");
    await page.getByRole("heading", { name: "Create a Project", level: 1 }).waitFor();
    await settle(page);
    await shot(page, "create-step1-empty", vp);
    await page.getByRole("button", { name: "Create Project and continue" }).click();
    await settle(page, 500);
    const active = await page.evaluate(() => ({ tag: document.activeElement?.tagName, data: document.activeElement?.hasAttribute("data-error-summary"), role: document.activeElement?.getAttribute("role") }));
    console.log(vp, "focus after empty submit", JSON.stringify(active), "alerts", await page.locator("[role=alert]").count());
    await shot(page, "create-step1-errors", vp);
    if (vp === "1440") {
      console.log("axe errors:", await axe(page, "create step1 errors"));
      // forced colours
    }
    await browser.close();
  }
  const { browser, page } = await open("admin", { viewport: "1440", forcedColors: "active" });
  await go(page, "/projects/new");
  await settle(page);
  await page.getByRole("button", { name: "Create Project and continue" }).click();
  await settle(page, 500);
  await shot(page, "create-step1-errors-forced", "1440");
  await browser.close();
}

if (mode === "create-422") {
  const { browser, page } = await open("admin", { viewport: "1440" });
  await page.route("**/organizations/*/projects", (route) => {
    if (route.request().method() !== "POST") return route.continue();
    return route.fulfill({
      status: 422,
      contentType: "application/problem+json",
      body: JSON.stringify({ type: "urn:uniche:problem:VALIDATION_ERROR", code: "VALIDATION_ERROR", title: "Validation failed", status: 422, requestId: "req-ux-p1-422", errors: [{ path: "name", code: "TOO_LONG", message: "name too long (secret-value)" }, { path: "slug", code: "INVALID", message: "slug invalid" }] }),
    });
  });
  await go(page, "/projects/new");
  await page.getByLabel(/Project name/).fill("UX-P1 mocked 422");
  await page.getByRole("button", { name: "Create Project and continue" }).click();
  await settle(page, 600);
  console.log("focus summary:", await page.evaluate(() => document.activeElement?.hasAttribute("data-error-summary")));
  console.log("summary text:", await page.locator("[data-error-summary]").innerText());
  console.log("name error text:", await page.locator("#project-name-error").innerText());
  console.log("aria-invalid name:", await page.locator("#project-name").getAttribute("aria-invalid"), "describedby:", await page.locator("#project-name").getAttribute("aria-describedby"));
  await shot(page, "create-step1-422", "1440");
  // link focuses the field
  await page.locator("[data-error-summary] a").first().click();
  console.log("focus after link:", await page.evaluate(() => document.activeElement?.id));
  await browser.close();
}

if (mode === "create-flow") {
  // Creates ONE real Project named "UX-P1 ..." and walks steps 2-4. Pass "init" as 2nd arg to initialize it at the end.
  const name = process.argv[3] ?? "UX-P1 Wizard";
  const init = process.argv[4] === "init";
  for (const vp of ["1440"]) {
    const { browser, page } = await open("admin", { viewport: vp });
    await go(page, "/projects/new");
    await page.getByLabel(/Project name/).fill(name);
    await shot(page, "create-step1-filled", vp);
    await page.getByRole("button", { name: "Create Project and continue" }).click();
    await page.getByRole("heading", { name: "Pick a Template and a style" }).waitFor({ timeout: 20000 }).catch(async () => {
      await shot(page, "create-flow-stuck", vp, false);
      console.log("stuck; summary:", await page.locator("[data-error-summary]").innerText().catch(() => "none"));
    });
    await settle(page, 1500);
    console.log("url", page.url(), "heading focused:", await page.evaluate(() => document.activeElement?.id));
    for (const v of vps.length ? ["1440", "1024", "768", "zoom200"] : []) {
      await page.setViewportSize({ width: VIEWPORTS[v].width, height: VIEWPORTS[v].height });
      await page.waitForTimeout(400);
      await shot(page, "create-step2", v);
    }
    await page.setViewportSize({ width: 1440, height: 900 });
    console.log("axe step2:", await axe(page, "step2"));
    await page.getByRole("button", { name: "Continue", exact: true }).click();
    await page.getByRole("heading", { name: "Choose languages and surfaces" }).waitFor();
    await settle(page, 600);
    for (const v of ["1440", "1024", "768", "zoom200"]) {
      await page.setViewportSize({ width: VIEWPORTS[v].width, height: VIEWPORTS[v].height });
      await page.waitForTimeout(400);
      await shot(page, "create-step3", v);
    }
    await page.setViewportSize({ width: 1440, height: 900 });
    console.log("axe step3:", await axe(page, "step3"));
    // Remove all languages -> summary
    for (let i = 0; i < 10; i++) {
      const rm = page.getByRole("button", { name: /^Remove / });
      if (!(await rm.count())) break;
      await rm.first().click();
    }
    await page.getByRole("button", { name: "Continue to review" }).click();
    await settle(page, 500);
    console.log("step3 empty-languages focus summary:", await page.evaluate(() => document.activeElement?.hasAttribute("data-error-summary")));
    await shot(page, "create-step3-nolang", "1440");
    // restore default languages by going back and changing template (languagesTouched => stays) -> add English + Greek
    await page.locator("#add-language").selectOption({ label: /English/ }).catch(async () => {
      const opts = await page.locator("#add-language option").allTextContents();
      const idx = opts.findIndex((t) => /English/.test(t));
      await page.locator("#add-language").selectOption({ index: idx });
    });
    await page.getByRole("button", { name: "Add", exact: true }).click();
    await page.getByRole("button", { name: "Continue to review" }).click();
    await page.getByRole("heading", { name: "Review and initialize" }).waitFor();
    await settle(page, 600);
    for (const v of ["1440", "1024", "768", "zoom200"]) {
      await page.setViewportSize({ width: VIEWPORTS[v].width, height: VIEWPORTS[v].height });
      await page.waitForTimeout(400);
      await shot(page, "create-step4", v);
    }
    await page.setViewportSize({ width: 1440, height: 900 });
    console.log("axe step4:", await axe(page, "step4"));
    if (init) {
      await page.getByRole("button", { name: "Initialize Project" }).click();
      await page.waitForURL(/\/projects\/[0-9a-f-]{36}$/, { timeout: 30000 });
      await settle(page, 1500);
      console.log("landed", page.url());
      await shot(page, "after-initialize", "1440");
    }
    await browser.close();
  }
}

if (mode === "step4-blocked") {
  // Resume an existing UX-P1 Project (id as arg) and remove languages to show Initialize disabled with a reason.
  const id = process.argv[3];
  const { browser, page } = await open("admin", { viewport: "1440" });
  await go(page, `/projects/new?resume=${id}`);
  await page.getByRole("heading", { name: "Pick a Template and a style" }).waitFor({ timeout: 20000 });
  await settle(page, 1200);
  await shot(page, "create-resume-step2", "1440");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  for (let i = 0; i < 10; i++) {
    const rm = page.getByRole("button", { name: /^Remove / });
    if (!(await rm.count())) break;
    await rm.first().click();
  }
  // jump to review through the stepper (allowed once created)
  await page.getByRole("button", { name: /Review/ }).click();
  await settle(page, 500);
  await shot(page, "create-step4-blocked", "1440");
  const btn = page.getByRole("button", { name: "Initialize Project" });
  console.log("initialize aria-disabled:", await btn.getAttribute("aria-disabled"), "title:", await btn.getAttribute("title"));
  await browser.close();
}

if (mode === "states") {
  // Project states, forced by page.route
  const stub = (status, body) => ({ status, contentType: "application/problem+json", body: JSON.stringify({ requestId: "req-ux-p1-" + status, ...body }) });
  const cases = [
    ["403", stub(403, { type: "urn:uniche:problem:ACCESS_DENIED", code: "ACCESS_DENIED", title: "Forbidden", status: 403, detail: "denied" })],
    ["404", stub(404, { type: "urn:uniche:problem:NOT_FOUND", code: "NOT_FOUND", title: "Not found", status: 404, detail: "gone" })],
    ["503", stub(503, { type: "urn:uniche:problem:PLATFORM_UNAVAILABLE", code: "PLATFORM_UNAVAILABLE", title: "Unavailable", status: 503, detail: "down" })],
    ["500", stub(500, { type: "urn:uniche:problem:INTERNAL", code: "INTERNAL", title: "Error", status: 500, detail: "boom" })],
  ];
  for (const vp of vps) {
    for (const [label, body] of cases) {
      const { browser, page } = await open("curator", { viewport: vp });
      await page.route(new RegExp(`/api/v1/projects/${P}$`), (route) => route.fulfill(body));
      await go(page, `/projects/${P}`);
      await settle(page, 1000);
      if (vp === "1440" || label === "403") await shot(page, `state-${label}`, vp);
      if (vp === "1440") {
        console.log(label, "title:", await page.title(), "| h1:", await page.locator("main h1").innerText(), "| reqId shown:", (await page.locator("main").innerText()).includes("req-ux-p1-" + label));
        console.log("   axe", await axe(page, label));
      }
      await browser.close();
    }
  }
}

if (mode === "session-expired") {
  for (const vp of vps) {
    const { browser, page } = await open("curator", { viewport: vp });
    await go(page, `/projects/${P}/pois`);
    await settle(page, 800);
    let nav = 0;
    page.on("framenavigated", (f) => {
      if (f === page.mainFrame() && /\/realms\//.test(f.url())) nav++;
    });
    await page.route(/\/api\/v1\/(?!.*token)/, (route) => route.fulfill({ status: 401, contentType: "application/problem+json", body: JSON.stringify({ code: "UNAUTHENTICATED", title: "Unauthorized", status: 401 }) }));
    await page.getByLabel(/Search/).first().fill("x").catch(() => {});
    await page.reload();
    await settle(page, 3500);
    const dlg = page.getByRole("dialog", { name: "Your session ended" });
    console.log(vp, "dialog visible:", await dlg.isVisible().catch(() => false), "keycloak navigations in 3.5s:", nav);
    await shot(page, "session-expired", vp, false);
    if (vp === "1440") console.log("axe", await axe(page, "session dialog"));
    await browser.close();
  }
  // Persistent 401: a sign-in redirect happened a moment ago -> the page, not the dialog
  const { browser, page } = await open("curator", { viewport: "1440" });
  await page.addInitScript(() => sessionStorage.setItem("iguide.signInRedirectAt", String(Date.now())));
  await page.route(/\/api\/v1\//, (route) => route.fulfill({ status: 401, contentType: "application/problem+json", body: JSON.stringify({ code: "UNAUTHENTICATED", title: "Unauthorized", status: 401 }) }));
  await page.goto(CMS + `/projects/${P}`);
  await settle(page, 4000);
  console.log("loop: h1:", await page.locator("main h1").first().innerText().catch(() => "none"), "title:", await page.title());
  await shot(page, "session-loop", "1440");
  await browser.close();
}

if (mode === "signin") {
  for (const vp of vps) {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ viewport: { width: VIEWPORTS[vp].width, height: VIEWPORTS[vp].height }, deviceScaleFactor: VIEWPORTS[vp].deviceScaleFactor ?? 1 });
    const page = await context.newPage();
    // Hold the silent check so the splash is visible once.
    if (vp === "1440") {
      await page.route("**/silent-check-sso.html", async (route) => {
        await new Promise((r) => setTimeout(r, 2500));
        await route.continue();
      });
      await page.goto(CMS + "/");
      await page.waitForTimeout(700);
      await shot(page, "sso-landing", vp, false);
      await page.unroute("**/silent-check-sso.html");
    } else {
      await page.goto(CMS + "/");
    }
    await page.getByRole("button", { name: "Sign in with UNICHE" }).waitFor({ timeout: 30000 });
    await settle(page, 600);
    await shot(page, "signin", vp, false);
    if (vp === "1440") {
      console.log("title:", await page.title(), "h1:", await page.locator("main h1").innerText());
      console.log("axe signin", await axe(page, "signin"));
    }
    await browser.close();
  }
  // Unreachable sign-in service
  const browser = await chromium.launch({ headless: true });
  const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
  await page.route("**/realms/**", (route) => route.abort());
  await page.goto(CMS + "/");
  await page.waitForTimeout(6000);
  await shot(page, "error-unreachable", "1440", false);
  console.log("unreachable h1:", await page.locator("main h1").innerText().catch(() => "none"), "| title:", await page.title());
  console.log("body:", (await page.locator("main").innerText().catch(() => "")).slice(0, 400));
  await browser.close();
}

if (mode === "keys") {
  // Keyboard run: open the switcher, search, arrows, Enter; Esc returns focus.
  const { browser, page } = await open("curator", { viewport: "1440" });
  await go(page, `/projects/${P}`);
  await settle(page, 1200);
  const trigger = page.getByRole("button", { name: /Switch project/ });
  await trigger.focus();
  await page.keyboard.press("Enter");
  await page.waitForTimeout(500);
  const f = () => page.evaluate(() => ({ tag: document.activeElement?.tagName, id: document.activeElement?.id, row: document.activeElement?.getAttribute("data-project-row"), label: document.activeElement?.textContent?.trim().slice(0, 40) }));
  console.log("after open:", JSON.stringify(await f()));
  await page.keyboard.press("ArrowDown");
  console.log("ArrowDown:", JSON.stringify(await f()));
  await page.keyboard.press("ArrowDown");
  console.log("ArrowDown:", JSON.stringify(await f()));
  await page.keyboard.press("ArrowUp");
  console.log("ArrowUp:", JSON.stringify(await f()));
  await page.keyboard.press("End");
  console.log("End:", JSON.stringify(await f()));
  await page.keyboard.press("Home");
  await page.keyboard.press("ArrowUp");
  console.log("ArrowUp from first row (search):", JSON.stringify(await f()));
  await page.keyboard.type("populated");
  await page.waitForTimeout(700);
  console.log("rows after search:", await page.locator("[data-project-row]").count());
  await page.keyboard.press("Escape");
  await page.waitForTimeout(300);
  console.log("after Esc, focus is trigger:", await page.evaluate(() => /Switch project/.test(document.activeElement?.getAttribute("aria-label") ?? "")), "popover open:", await page.locator("#project-search").count());
  await browser.close();
}

if (mode === "switch-unsaved") {
  const { browser, page } = await open("curator", { viewport: "1440" });
  const poi = seed.pois?.[0]?.id ?? seed.pois?.[0];
  await go(page, `/projects/${P}/pois`);
  await settle(page, 1000);
  await page.locator("main a").filter({ hasText: /./ }).nth(2).click().catch(() => {});
  await settle(page, 1500);
  const field = page.locator("main input[type=text], main textarea").first();
  await field.focus();
  await page.keyboard.type(" x");
  await page.getByRole("button", { name: /Switch project/ }).click();
  await page.waitForTimeout(600);
  const rows = page.locator("[data-project-row]");
  const other = rows.filter({ hasNotText: /Populated/ }).first();
  await other.click();
  await page.waitForTimeout(900);
  console.log("popover still open:", (await page.locator("#project-search").count()) > 0, "dialogs:", await page.locator("[role=dialog],[role=alertdialog]").count());
  await shot(page, "switch-unsaved", "1440", false);
  await browser.close();
}

if (mode === "init-by-name") {
  // Resume an existing, uninitialized UX-P1 Project found by name on Home, walk to review and initialize it.
  const name = process.argv[3];
  const { browser, page } = await open("admin", { viewport: "1440" });
  await go(page, "/");
  await page.getByLabel(/Search projects/).fill(name);
  await settle(page, 800);
  await page.getByRole("button", { name: /Needs setup/ }).click().catch(() => {});
  await page.locator("[data-project-row]").first().click();
  await page.getByRole("heading", { name: "Pick a Template and a style" }).waitFor({ timeout: 20000 });
  await settle(page, 1200);
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("button", { name: "Continue to review" }).click();
  await page.getByRole("heading", { name: "Review and initialize" }).waitFor();
  await shot(page, "create-step4", "1440");
  console.log("axe step4:", await axe(page, "step4"));
  await page.getByRole("button", { name: "Initialize Project" }).click();
  await page.waitForURL(/\/projects\/[0-9a-f-]{36}$/, { timeout: 30000 });
  await settle(page, 2000);
  console.log("landed", page.url(), "h1:", await page.locator("main h1").first().innerText().catch(() => "none"));
  await shot(page, "after-initialize", "1440");
  await browser.close();
}
