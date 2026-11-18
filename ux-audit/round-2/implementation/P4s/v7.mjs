import { open, go } from "../../../tools/session.mjs";
import { createRequire } from "node:module";
const require = createRequire("C:/Users/mirto/IdeaProjects/iguide/uniche_iguide_frontend/package.json");
const { AxeBuilder } = require("@axe-core/playwright");
const P = "6958c18f-60d2-4140-a524-5a43f8a2f6b5";
const D = "4e03e8e8-7d90-46bb-a3b0-4aab41d67135";
const A = "07927651-be7a-44e9-85eb-843d8ed219f7";
const log = (...a) => console.log(...a);
const axe = async (page, name) => { const r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze(); log("axe", name, r.violations.filter((v) => ["serious", "critical"].includes(v.impact)).map((v) => v.id + ":" + v.nodes.length)); };
for (const vp of ["1440", "1024", "768", "zoom200"]) {
  const { browser, page } = await open("admin", { viewport: vp });
  await go(page, `/projects/${P}/pois/${D}`);
  await page.waitForSelector("[data-sticky-bar]", { timeout: 30000 }); await page.waitForTimeout(1500);
  await axe(page, `draft ${vp}`);
  log(vp, "next-missing buttons visible:", await page.locator("[data-next-missing]").evaluateAll((els) => els.filter((e) => e.getClientRects().length).map((e) => e.textContent.trim())));
  // activation failure inside dialog
  await page.route("**/status", (r) => r.request().method() === "POST" ? r.fulfill({ status: 503, contentType: "application/problem+json", body: JSON.stringify({ status: 503, code: "SERVICE_UNAVAILABLE", requestId: "req-act-503" }) }) : r.continue());
  const act = page.getByRole("button", { name: /^Activate$/ }).locator("visible=true").first();
  if (!(await act.count())) await page.getByRole("button", { name: /Draft/ }).first().click().catch(() => {});
  await page.getByRole("button", { name: /^Activate$/ }).locator("visible=true").first().click(); await page.waitForTimeout(600);
  await page.getByRole("dialog").getByRole("button", { name: /^Activate$/ }).click(); await page.waitForTimeout(1500);
  log(vp, "dialog after 503:", await page.evaluate(() => document.querySelector("[role=dialog]")?.innerText.replace(/\s+/g, " ").slice(-260)), "toasts error:", await page.locator("[role=alert]").count());
  await axe(page, `activate dialog ${vp}`);
  await page.screenshot({ path: `after/activate-fail-${vp}.png` });
  await browser.close();
}
const { browser, page } = await open("admin", { viewport: "1440", forcedColors: "active" });
await go(page, `/projects/${P}/pois/${A}`); await page.waitForSelector("[data-sticky-bar]"); await page.waitForTimeout(1500);
await page.getByLabel(/^summary$/i).first().fill("forced colours"); await page.waitForTimeout(300);
await page.screenshot({ path: "after/forced-colors-dirty-1440.png" });
await browser.close();
