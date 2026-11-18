// W0 stage 0.2 acceptance checks. Windows Node: node ux-audit\round-1\implementation\W0.2\accept.mjs [1440|1024|768|zoom200]
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { open, go, VIEWPORTS } from "../../../tools/session.mjs";
const require = createRequire(new URL("../../../../package.json", import.meta.url));
const { AxeBuilder } = require("@axe-core/playwright");
const seed = JSON.parse(readFileSync(new URL("../../../tools/seed.json", import.meta.url), "utf8"));
const rec = JSON.parse(readFileSync(new URL("./records.json", import.meta.url), "utf8"));
const out = new URL("./after/", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
VIEWPORTS["1180"] = { width: 1180, height: 800 };
const P = seed.projects.populated.id;
const vp = process.argv[2] ?? "1440";
const pid = (k) => seed.pois.find((x) => x.key === k).id;
const url = (id) => `/projects/${P}/pois/${id}`;
const ready = async (page) => { await page.waitForLoadState("networkidle").catch(() => {}); await page.locator("main h1").first().waitFor({ state: "visible", timeout: 20000 }); await page.waitForTimeout(1000); };
const clean = (page) => page.evaluate(() => Object.keys(localStorage).filter((k) => k.startsWith("iguide:draft:")).forEach((k) => localStorage.removeItem(k)));
const y = (page, sel) => page.locator(sel).first().evaluate((e) => Math.round(e.getBoundingClientRect().top));
const result = {};
const { browser, page } = await open("curator", { viewport: vp });
const axe = async (name) => {
  const r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  result[`axe:${name}`] = r.violations.map((v) => `${v.id} x${v.nodes.length} (${v.impact})`);
};

// 1. Sticky header and banner after scrolling 1500 px (ACTIVE with pending changes)
await go(page, url(pid("frieze"))); await ready(page);
await page.evaluate(() => document.querySelector("main").scrollTo(0, 1500)); await page.waitForTimeout(500);
result.scrolled = await page.evaluate(() => {
  const r = (s) => { const e = document.querySelector(s); if (!e) return null; const b = e.getBoundingClientRect(); return { top: Math.round(b.top), bottom: Math.round(b.bottom), left: Math.round(b.left), right: Math.round(b.right) }; };
  return { vh: innerHeight, vw: innerWidth, primary: r("[data-editor-primary]"), banner: r("[data-working-copy-banner]"), h1: r("main h1") };
});
await axe("active-pending");
await clean(page);

// 2. Banner shift: y of the first field before and after typing (ACTIVE, no pending changes)
await go(page, url(pid("pediment"))); await ready(page);
const before = await y(page, "#f-title");
await page.locator("#f-title").click(); await page.keyboard.type(" x");
await page.waitForTimeout(800);
const after = await y(page, "#f-title");
result.bannerShift = { before, after, delta: after - before };
await axe("active-dirty");
await clean(page);

// 3. Preview: pushes content, Esc returns focus, header action reachable
await go(page, url(pid("frieze"))); await ready(page);
const probe = vp === "1440" ? "#readiness-heading" : "#f-title";
const y0 = await y(page, probe);
await page.locator("[data-preview-action]").first().click(); await page.waitForTimeout(800);
const y1 = await y(page, probe);
const primaryVisible = await page.locator("[data-editor-primary]").first().evaluate((e) => { const b = e.getBoundingClientRect(); return b.top >= 0 && b.bottom <= innerHeight; });
const probe2 = await page.evaluate(() => { const p = document.querySelector("#editor-preview"); const f = document.querySelector("#f-title"); if (!p || !f) return null; const a = p.getBoundingClientRect(), b = f.getBoundingClientRect(); return !(a.right <= b.left || a.left >= b.right || a.bottom <= b.top || a.top >= b.bottom); });
await page.keyboard.press("Escape"); await page.waitForTimeout(400);
const focused = await page.evaluate(() => document.activeElement?.hasAttribute("data-preview-action") ?? false);
const closed = (await page.locator("#editor-preview").count()) === 0;
result.preview = { probe, yBefore: y0, yOpen: y1, pushedDown: y1 > y0, overlapsForm: probe2, headerActionVisible: primaryVisible, escClosed: closed, focusReturned: focused };
await clean(page);

// 4. Language tab keys
await go(page, url(pid("frieze"))); await ready(page);
const sel = async () => page.evaluate(() => document.querySelector('[role=tab][aria-selected=true]')?.id);
await page.locator('[role=tab][aria-selected=true]').focus();
const keys = [];
for (const k of ["ArrowRight", "End", "Home", "ArrowLeft"]) { await page.keyboard.press(k); keys.push(`${k}:${await sel()}`); }
result.tabKeys = keys;
const first = await page.locator("[role=tab]").nth(1);
await first.click();
result.copySource = await page.getByRole("button", { name: /copy source/i }).count();
await clean(page);

// 5. Archived state axe
await go(page, url(pid("copies"))); await ready(page);
await axe("archived");
await page.screenshot({ path: `${out}poi-archived__${vp}.png` });

// 6. 409 state on my record (the PUT is answered with a conflict; nothing is saved)
await page.route(new RegExp(`/pois/${rec.draft}$`), (route) => route.request().method() === "PUT"
  ? route.fulfill({ status: 409, contentType: "application/problem+json", body: JSON.stringify({ type: "urn:uniche:iguide:problem:VERSION_CONFLICT", title: "Conflict", status: 409, code: "VERSION_CONFLICT", requestId: "req-w02-409", currentVersion: 99 }) })
  : route.continue());
await go(page, url(rec.draft)); await ready(page);
await page.locator("#f-summary").fill("UX-W0.2 conflict " + Date.now());
await page.locator("[data-editor-primary]").click(); await page.waitForTimeout(1500);
await page.screenshot({ path: `${out}poi-409-dialog__${vp}.png` });
result.conflictDialog = await page.getByRole("dialog").count();
await axe("409-dialog");
await page.keyboard.press("Escape");
await page.unroute(new RegExp(`/pois/${rec.draft}$`));
await clean(page);

// 7. Ctrl+S on my record (real save), state line, focus
await go(page, url(rec.draft)); await ready(page);
await page.locator("#f-summary").fill("UX-W0.2 saved with ctrl+s " + Date.now());
const put = page.waitForRequest((r) => r.method() === "PUT" && r.url().includes(rec.draft), { timeout: 8000 }).then(() => true, () => false);
await page.keyboard.press("Control+s");
result.ctrlS = { putSent: await put };
await page.waitForTimeout(1500);
result.ctrlS.stateLine = await page.locator('[role=status][aria-live=polite]').first().textContent();
result.ctrlS.focusOnPrimaryOrField = await page.evaluate(() => document.activeElement?.id || document.activeElement?.tagName);
await clean(page);

console.log(JSON.stringify(result, null, 1));
if (await page.getByRole("button", { name: /^(save and )?activate$/i }).count() === 0) { await browser.close(); process.exit(0); }
// 8. Activate on my record: always a confirm; toast never says "complete" when warnings exist
await page.getByRole("button", { name: /^(save and )?activate$/i }).first().click(); await page.waitForTimeout(800);
result.activateDialog = await page.getByRole("dialog").count();
await axe("activate-dialog");
await page.getByRole("dialog").getByRole("button", { name: /^(save and )?activate$/i }).click(); await page.waitForTimeout(2500);
await page.screenshot({ path: `${out}poi-activate-refused__${vp}.png` });
result.activateRefusalInDialog = await page.getByRole("dialog").locator("button", { hasText: /Required|missing|title/i }).count();
// fill the default title, then Save and activate
const dlg = page.getByRole("dialog");
if (await dlg.count()) {
  const link = dlg.locator("button").filter({ hasText: /:/ }).first();
  if (await link.count()) await link.click();
  await page.waitForTimeout(600);
  result.focusAfterDialogLink = await page.evaluate(() => document.activeElement?.id || document.activeElement?.tagName);
  await page.locator("#f-title").fill("UX-W0.2 point");
  await page.getByRole("button", { name: /^(save and )?activate$/i }).first().click(); await page.waitForTimeout(600);
  await page.getByRole("dialog").getByRole("button", { name: /^(save and )?activate$/i }).click(); await page.waitForTimeout(3000);
  result.toast = await page.locator('[role=status], [role=alert]').allTextContents().then((t) => t.filter((x) => /activated|complete/i.test(x)).slice(0, 3));
  await page.screenshot({ path: `${out}poi-after-activate__${vp}.png` });
}
await clean(page);
console.log(JSON.stringify(result, null, 1));
await browser.close();
