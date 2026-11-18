// P1 wizard probe: mocked create (no real Project), 2 templates, stepper, Continue reason, slug, default language, zoom200, forced colours.
import { createRequire } from "node:module";
import { open, go } from "../../../../tools/session.mjs";
const require = createRequire("C:/Users/mirto/IdeaProjects/iguide/uniche_iguide_frontend/package.json");
const AxeBuilder = require("@axe-core/playwright").default;
const tag = process.argv[2] ?? "after";
const OUT = `ux-audit/round-3/implementation/P1/${tag}/`;
const res = {};
const FAKE = "11111111-1111-4111-8111-111111111111";
async function setup(vp, extra = {}) {
  const o = await open("admin", { viewport: vp, ...extra });
  const { page, context } = o;
  let org = null;
  await context.route("**/organizations/*/projects", async (route) => {
    if (route.request().method() !== "POST") return route.fallback();
    const body = route.request().postDataJSON();
    res.lastPost = body;
    org = route.request().url().match(/organizations\/([^/]+)/)[1];
    await route.fulfill({ status: 201, contentType: "application/json", body: JSON.stringify({ id: FAKE, organizationId: org, name: body.name, slug: body.slug, status: "ACTIVE", localDescription: null, initialized: false }) });
  });
  await context.route("**/templates", async (route) => {
    const r = await route.fetch(); const j = await r.json();
    const t = j.templates[0]; j.templates = [t, { ...t, id: "22222222-2222-4222-8222-222222222222", name: t.name + " Two" }];
    await route.fulfill({ response: r, json: j });
  });
  return o;
}
const stepper = (page) => page.evaluate(() => [...document.querySelectorAll("nav[aria-label='Create Project progress'] li")].map((li) => { const c = li.querySelector("span[aria-hidden=true]").getBoundingClientRect(); return { top: Math.round(c.top * 10) / 10, h: c.height }; }));
let { browser, page } = await setup("1440");
await go(page, "/projects/new");
await page.waitForSelector("#project-name");
await page.fill("#project-name", "Μουσείο Κυκλαδικής Τέχνης ".repeat(5).slice(0, 117));
res.slugGreek = await page.inputValue("#project-slug");
res.slugGreekLen = res.slugGreek.length;
res.slugHint = await page.locator("#project-slug").evaluate((el) => document.getElementById(el.getAttribute("aria-describedby").split(" ").pop())?.textContent);
await page.fill("#project-name", "مرحبا بالعالم");
await page.waitForTimeout(200);
res.slugArabic = await page.inputValue("#project-slug");
res.arabicHint = await page.locator("#project-slug").evaluate((el) => [...el.getAttribute("aria-describedby").split(" ")].map((i) => document.getElementById(i)?.textContent).join(" / "));
res.nameDir = await page.getAttribute("#project-name", "dir");
await page.click("button[type=submit]");
await page.waitForTimeout(400);
res.arabicError = await page.evaluate(() => document.querySelector("[data-error-summary]")?.innerText);
await page.screenshot({ path: OUT + "wizard-1-arabic-1440.png" });
await page.fill("#project-name", "UX-R3-p1 Mock Wizard");
await page.click("button[type=submit]");
await page.waitForSelector("input[name=template]");
await page.waitForTimeout(500);
res.step2 = await stepper(page);
res.step2ContinueAria = await page.getByRole("button", { name: /^Continue/ }).getAttribute("aria-disabled");
res.step2Reason = await page.evaluate(() => [...document.querySelectorAll("form p")].map((p) => p.textContent.trim()).filter((t) => /Choose a Template/.test(t)));
await page.getByRole("button", { name: /^Continue/ }).click({ force: true });
res.focusAfterClick = await page.evaluate(() => document.activeElement?.getAttribute("name") + ":" + document.activeElement?.type);
await page.screenshot({ path: OUT + "wizard-2-no-template-1440.png" });
await page.evaluate(() => document.querySelector("input[name=template]").click());
await page.waitForTimeout(300);
await page.getByRole("button", { name: /^Continue/ }).click();
await page.waitForSelector("#default-language");
res.step3 = await stepper(page);
res.defaultLine = await page.evaluate(() => [...document.querySelectorAll("fieldset p")].map((p) => p.textContent.replace(/\s+/g, " ").trim()).find((t) => /default language because/.test(t)));
await page.screenshot({ path: OUT + "wizard-3-1440.png" });
const ax = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
res.axeWizard3 = ax.violations.map((v) => `${v.impact} ${v.id}: ${v.nodes.slice(0, 2).map((n) => n.target.join(" ")).join(" | ")}`);
await browser.close();

// 768
({ browser, page } = await setup("768"));
await go(page, "/projects/new"); await page.waitForSelector("#project-name");
await page.fill("#project-name", "UX-R3-p1 Mock Wizard"); await page.click("button[type=submit]"); await page.waitForSelector("input[name=template]");
res.step2at768 = await stepper(page);
await page.screenshot({ path: OUT + "wizard-2-768.png" });
await browser.close();

// zoom200
({ browser, page } = await setup("zoom200"));
await go(page, "/projects/new"); await page.waitForSelector("#project-name");
res.zoom200FirstFieldTop = await page.evaluate(() => Math.round(document.querySelector("#project-name").getBoundingClientRect().top));
await page.screenshot({ path: OUT + "wizard-1-zoom200.png" });
await browser.close();

// forced colours step 2
({ browser, page } = await setup("1440", { forcedColors: "active" }));
await go(page, "/projects/new"); await page.waitForSelector("#project-name");
res.forcedCurrent = await page.evaluate(() => { const c = document.querySelector("nav[aria-label='Create Project progress'] li:first-child span[aria-hidden=true]"); const s = getComputedStyle(c); return { border: s.borderTopWidth + " " + s.borderTopColor, bg: s.backgroundColor, color: s.color, text: c.textContent.trim() }; });
await page.screenshot({ path: OUT + "wizard-1-forced-1440.png" });
await browser.close();
console.log(JSON.stringify(res, null, 1));
