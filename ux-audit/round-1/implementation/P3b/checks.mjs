import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { open, go } from "../../../tools/session.mjs";
const require = createRequire(new URL("../../../../package.json", import.meta.url));
const { default: AxeBuilder } = require("@axe-core/playwright");
const seed = JSON.parse(readFileSync(new URL("../../../tools/seed.json", import.meta.url), "utf8"));
const P = seed.projects.populated.id;
const out = new URL("./after/", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const { browser, page } = await open("curator", { viewport: "1440" });
for (const k of ["guides", "events", "categories"]) {
  await go(page, `/projects/${P}/${k}`); await page.waitForTimeout(3000);
  const r = await new AxeBuilder({ page }).withTags(["wcag2a","wcag21a","wcag2aa","wcag21aa"]).analyze();
  console.log(k, "axe", r.violations.map((v) => `${v.id}:${v.impact}:${v.nodes.length}`).join(" ") || "clean");
}
// Categories tree collapse by keyboard
await go(page, `/projects/${P}/categories`); await page.waitForTimeout(3000);
const rowsBefore = await page.locator("tbody tr").count();
const disc = page.getByRole("button", { name: /Collapse|Expand|Visitor Services/ }).first();
console.log("disclosure", await disc.getAttribute("aria-label"), await disc.getAttribute("aria-expanded"));
await disc.focus(); await page.keyboard.press("Enter"); await page.waitForTimeout(300);
console.log("rows", rowsBefore, "->", await page.locator("tbody tr").count(), await disc.getAttribute("aria-expanded"));
await page.keyboard.press("Space"); await page.waitForTimeout(300);
console.log("rows again", await page.locator("tbody tr").count());
// forced colours
await page.emulateMedia({ forcedColors: "active" });
await page.screenshot({ path: `${out}categories-forced__1440.png` });
await go(page, `/projects/${P}/events`); await page.waitForTimeout(2500);
await page.screenshot({ path: `${out}events-forced__1440.png` });
await browser.close();
