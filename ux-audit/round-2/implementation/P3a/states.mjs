import { open, go } from "../../../tools/session.mjs";
import { createRequire } from "node:module";
const require = createRequire(new URL("../../../../package.json", import.meta.url));
const AxeBuilder = require("@axe-core/playwright").default ?? require("@axe-core/playwright").AxeBuilder;
const D = "ux-audit/round-2/implementation/P3a/after";
const P = "6958c18f-60d2-4140-a524-5a43f8a2f6b5";
const axe = async (page, name) => {
  const r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  console.log("axe", name, r.violations.map((v) => `${v.id}:${v.impact}:${v.nodes.length}`).join(", ") || "0");
};
const { browser, page } = await open("admin", { viewport: "1440" });
// ?create=1
await go(page, `/projects/${P}/pois?create=1`); await page.waitForTimeout(2500);
console.log("create=1 dialog", await page.getByRole("dialog").count(), "url", page.url(), "focus", await page.evaluate(() => document.activeElement?.getAttribute("aria-label") ?? document.activeElement?.id ?? document.activeElement?.tagName));
await page.screenshot({ path: `${D}/create-poi-1440.png` });
await axe(page, "create-poi");
await page.keyboard.press("Escape"); await page.waitForTimeout(300);
// places: create sub-place without parent
await go(page, `/projects/${P}/places?create=1`); await page.waitForTimeout(2500);
await page.getByRole("dialog").getByRole("textbox").first().fill("UX-R2-P3a no parent");
await page.getByText("Sub-place", { exact: true }).click();
await page.getByRole("button", { name: /Create and open/ }).click(); await page.waitForTimeout(600);
console.log("subplace url", page.url(), "summary", await page.getByRole("dialog").innerText().then((t) => t.includes("Choose the place") || t.includes("to fix")));
await page.screenshot({ path: `${D}/create-place-noparent-1440.png` });
await axe(page, "create-place-error");
await page.keyboard.press("Escape"); await page.waitForTimeout(300);
await page.getByRole("button", { name: "Cancel" }).click().catch(() => {});
await page.waitForTimeout(400);
await page.screenshot({ path: `${D}/after-cancel.png` });
await go(page, `/projects/${P}/places`); await page.waitForTimeout(2500);
await axe(page, "places");
await page.getByRole("button", { name: /^Actions for/ }).first().click(); await page.waitForTimeout(300);
await page.screenshot({ path: `${D}/places-menu-1440.png` });
await page.getByRole("menuitem", { name: "Add sub-place" }).click(); await page.waitForTimeout(500);
await page.screenshot({ path: `${D}/places-addsub-1440.png` });
console.log("addsub parent value", await page.getByRole("dialog").locator("select").evaluate((s) => s.selectedOptions[0].textContent));
await page.keyboard.press("Escape"); await page.waitForTimeout(300);
await page.getByRole("button", { name: /Cancel/ }).click().catch(() => {});
// pois degraded: abort categories + places 403
await page.route("**/categories**", (r) => r.abort());
await page.route("**/places**", (r) => r.fulfill({ status: 403, contentType: "application/problem+json", body: JSON.stringify({ title: "Forbidden", status: 403, requestId: "test-req" }) }));
await go(page, `/projects/${P}/pois`); await page.waitForTimeout(3000);
console.log("degraded rows", await page.locator("[data-row-id]").count(), await page.getByText("could not be loaded").count());
await page.screenshot({ path: `${D}/pois-degraded-1440.png` });
await axe(page, "pois-degraded");
await page.unroute("**/categories**"); await page.unroute("**/places**");
// search hint in Greek
await go(page, `/projects/${P}/pois?q=Ακρόπολη`); await page.waitForTimeout(2500);
await page.screenshot({ path: `${D}/pois-search-el-1440.png` });
console.log("hints", await page.getByText(/^Matches/).count(), "rows", await page.locator("[data-row-id]").count());
// translation dot link
await go(page, `/projects/${P}/pois`); await page.waitForTimeout(2500);
console.log("dot href", await page.locator("tbody a[href*='lang=']").first().getAttribute("href"));
// load error
await page.route("**/pois**", (r) => r.fulfill({ status: 500, contentType: "application/problem+json", body: JSON.stringify({ title: "x", status: 500, requestId: "req-1" }) }));
await go(page, `/projects/${P}/pois`); await page.waitForTimeout(3000);
await page.screenshot({ path: `${D}/pois-error-1440.png` });
await browser.close();
for (const vp of ["768", "zoom200"]) {
  const { browser: b, page: p } = await open("admin", { viewport: vp });
  await go(p, `/projects/${P}/places?create=1`); await p.waitForTimeout(2500);
  await p.screenshot({ path: `${D}/create-place-${vp}.png` });
  await b.close();
}
const f = await open("admin", { viewport: "1440", forcedColors: "active" });
await go(f.page, `/projects/${P}/places`); await f.page.waitForTimeout(2500);
await f.page.screenshot({ path: `${D}/places-forced-1440.png` });
await f.browser.close();
