// P4 behaviour checks: coordinates, triggers without public address, keyboard, axe. Windows Node.
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { open, go } from "../../../tools/session.mjs";
const require = createRequire(new URL("../../../../package.json", import.meta.url));
const { default: AxeBuilder } = require("@axe-core/playwright");
const seed = JSON.parse(readFileSync(new URL("../../../tools/seed.json", import.meta.url), "utf8"));
const rec = JSON.parse(readFileSync(new URL("./records.json", import.meta.url), "utf8"));
const P = seed.projects.populated.id;
const out = new URL("./after/", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const ready = async (page) => { await page.waitForLoadState("networkidle").catch(() => {}); await page.locator("main h1").first().waitFor({ timeout: 20000 }).catch(() => {}); await page.waitForTimeout(1800); };
const axe = async (page, name) => {
  const r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  console.log("AXE", name, r.violations.length ? r.violations.map((v) => `${v.id}(${v.impact}) x${v.nodes.length}: ${v.nodes[0].target}`) : "clean");
};
const { browser, page } = await open("curator", { viewport: "1440" });
const errors = [];
page.on("pageerror", (e) => errors.push("pageerror " + e.message));
page.on("console", (m) => { if (m.type() === "error") errors.push("console " + m.text().slice(0, 160)); });
const poi = `/projects/${P}/pois/${rec.draft}`;
// 1. coordinates
await go(page, poi); await ready(page);
await page.locator("#f-lat").fill("abc"); await page.locator("#f-lng").fill("999");
await page.locator("#f-summary").fill("UX-P4 summary " + Date.now());
await page.locator("[data-editor-primary]").click(); await page.waitForTimeout(1200);
console.log("lat error:", await page.locator("#f-lat-error").textContent().catch(() => null));
console.log("lng error:", await page.locator("#f-lng-error").textContent().catch(() => null));
await page.screenshot({ path: out + "poi-coordinate-errors__1440.png" });
await page.locator("#f-lat").fill("37,9715"); await page.locator("#f-lng").fill("23,7257"); await page.locator("#f-lat").blur();
console.log("lat after comma+blur:", await page.locator("#f-lat").inputValue());
await axe(page, "poi draft with errors");
await page.locator("[data-editor-primary]").click(); await page.waitForTimeout(2500);
console.log("state line:", await page.locator("[role=status]").allTextContents());
await page.evaluate(() => Object.keys(localStorage).filter((k) => k.startsWith("iguide:draft:")).forEach((k) => localStorage.removeItem(k)));
// 2. triggers without public address (surfaces response rewritten), keyboard order and axe
await page.route(/\/surfaces$/, async (route) => {
  const r = await route.fetch(); const j = await r.json();
  j.surfaces = j.surfaces.map((s) => s.surface === "WEB" ? { ...s, configuration: { ...s.configuration, publicBaseUrl: null } } : s);
  await route.fulfill({ response: r, json: j });
});
await go(page, poi); await ready(page);
await page.locator("#triggers").scrollIntoViewIfNeeded(); await page.waitForTimeout(500);
await page.screenshot({ path: out + "poi-triggers-no-address__1440.png" });
console.log("QR blocks:", await page.locator("[data-qr-block]").count(), "No-address alerts:", await page.getByText(/No QR image yet: the visitor app has no public web address/).count());
await axe(page, "poi draft triggers no address");
// remove with confirm
await page.getByRole("button", { name: /^Remove QR code$/ }).click(); await page.waitForTimeout(500);
await page.screenshot({ path: out + "poi-remove-confirm__1440.png" });
await page.getByRole("button", { name: /^Keep it$/ }).click(); await page.waitForTimeout(300);
console.log("focus after keep:", await page.evaluate(() => document.activeElement?.textContent?.trim().slice(0, 40)));
// 3. tab count from Latitude to Save (header primary)
await page.locator("#f-lat").focus();
let n = 0; for (; n < 40; n++) { await page.keyboard.press("Tab"); if (await page.evaluate(() => document.activeElement?.hasAttribute("data-editor-primary"))) break; }
console.log("Tabs from #f-lat to Save (forward):", n + 1);
await page.keyboard.press("Shift+Tab");
// 4. other states axe
for (const [name, url] of [["poi active", `/projects/${P}/pois/${rec.active}`], ["poi archived", `/projects/${P}/pois/${rec.archived}`], ["place outdoor", `/projects/${P}/places/${rec.outdoor}`], ["place indoor", `/projects/${P}/places/${rec.indoor}`], ["place sub", `/projects/${P}/places/${rec.sub}`]]) {
  await go(page, url); await ready(page); await axe(page, name);
}
console.log("ERRORS", errors.length ? errors : "none");
await browser.close();
