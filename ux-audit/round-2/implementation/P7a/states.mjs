import { open, go } from "../../../tools/session.mjs";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { AxeBuilder } = require("@axe-core/playwright");
const P = "6958c18f-60d2-4140-a524-5a43f8a2f6b5";
const out = {};
const ax = async (page, k) => { const r = await new AxeBuilder({ page }).withTags(["wcag2a","wcag2aa","wcag21a","wcag21aa"]).analyze(); out[`axe-${k}`] = r.violations.map((v) => `${v.id}:${v.impact}:${v.nodes.length}`); };
{ // populated, 1440, list + grid + forced colours + filters + keyboard
  const { browser, page } = await open("admin", { viewport: "1440" });
  await go(page, `/projects/${P}/media?view=list`);
  await page.waitForSelector("[data-media-count]", { timeout: 30000 }); await page.waitForTimeout(1500);
  await page.screenshot({ path: "after/list-1440.png" });
  out.cols1440 = await page.evaluate(() => [...document.querySelectorAll("table th")].map((th) => Math.round(th.getBoundingClientRect().width)));
  await ax(page, "list");
  // filters: no alt text, then clear
  await page.getByRole("button", { name: /Filters/ }).click();
  await page.getByLabel(/No alt text in/).check();
  await page.keyboard.press("Escape");
  await page.waitForTimeout(500);
  out.countFiltered = await page.locator("[data-media-count]").innerText();
  out.clearButtons = await page.getByRole("button", { name: "Clear filters" }).count();
  await page.screenshot({ path: "after/list-1440-filtered.png" });
  await page.getByRole("button", { name: "Clear filters" }).click();
  await page.waitForTimeout(400);
  out.afterClear = await page.evaluate(() => `${document.activeElement?.tagName}:${document.activeElement?.getAttribute("type")}`);
  out.urlAfterClear = await page.evaluate(() => location.search);
  await page.getByRole("button", { name: /Filters/ }).click(); await page.getByRole("button", { name: "Grid" }).click(); await page.keyboard.press("Escape");
  out.urlGrid = await page.evaluate(() => location.search);
  await page.goBack(); await page.waitForTimeout(300);
  out.viewAfterBack = await page.evaluate(() => !!document.querySelector("table"));
  await browser.close();
}
{ const { browser, page } = await open("admin", { viewport: "1280", forcedColors: "active" });
  await go(page, `/projects/${P}/media?view=list`); await page.waitForSelector("[data-media-count]", { timeout: 30000 }); await page.waitForTimeout(1000);
  await page.screenshot({ path: "after/list-1280-forced.png" }); await browser.close(); }
{ const { browser, page } = await open("admin", { viewport: "1024" });
  await page.route((u) => /\/api\/v1\/.*\/assets(\?|$)/.test(u.toString()), (r) => r.request().method() === "GET" && !r.request().url().includes("limits") ? r.fulfill({ status: 503, contentType: "application/problem+json", body: JSON.stringify({ title: "SECRET", detail: "NullPointerException at X", status: 503, requestId: "req-p7a-1" }) }) : r.continue());
  await go(page, `/projects/${P}/media`); await page.waitForTimeout(2500);
  out.errText = (await page.locator("main").innerText()).slice(0, 400);
  await page.screenshot({ path: "after/error-1024.png" }); await ax(page, "error"); await browser.close(); }
{ const { browser, page } = await open("admin", { viewport: "1024" });
  await page.route((u) => /\/api\/v1\/.*\/assets(\?|$)/.test(u.toString()), (r) => r.request().method() === "GET" && !r.request().url().includes("limits") ? r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ content: [], page: 0, size: 200, totalElements: 0, totalPages: 0 }) }) : r.continue());
  await go(page, `/projects/${P}/media`); await page.waitForTimeout(2500);
  out.emptyText = (await page.locator("main").innerText()).slice(0, 400);
  out.toolbar = await page.locator("[role=search]").count();
  await page.screenshot({ path: "after/empty-1024.png" }); await ax(page, "empty"); await browser.close(); }
{ const { browser, page } = await open("admin", { viewport: "1024" });
  await go(page, `/projects/${P}/media?view=list&q=zzzzqq`); await page.waitForTimeout(2500);
  out.noMatch = (await page.locator("main").innerText()).replace(/\n+/g, " | ").slice(0, 300);
  out.clearNoMatch = await page.getByRole("button", { name: "Clear filters" }).count();
  await page.screenshot({ path: "after/nomatch-1024.png" }); await browser.close(); }
console.log(JSON.stringify(out, null, 1));
