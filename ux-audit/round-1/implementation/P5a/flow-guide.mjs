// P5a Guide flow. Windows Node: node ...\flow-guide.mjs [viewport]
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { open, go } from "../../../tools/session.mjs";
const require = createRequire(new URL("../../../../package.json", import.meta.url));
const { default: AxeBuilder } = require("@axe-core/playwright");
const rec = JSON.parse(readFileSync(new URL("./records.json", import.meta.url), "utf8"));
const seed = JSON.parse(readFileSync(new URL("../../../tools/seed.json", import.meta.url), "utf8"));
const P = seed.projects.populated.id;
const vp = process.argv[2] ?? "1440";
const out = new URL("./after/", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const { browser, page } = await open("curator", { viewport: vp });
const shot = (n) => page.screenshot({ path: `${out}guide-${n}__${vp}.png` });
const ready = async () => { await page.waitForLoadState("networkidle").catch(() => {}); await page.locator("main h1").first().waitFor({ timeout: 20000 }).catch(() => {}); await page.waitForTimeout(1200); };
const axe = async (label) => { const r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze(); console.log("AXE", label, r.violations.map((v) => `${v.id}:${v.impact}:${v.nodes.length}`).join(" ") || "clean"); };
const toStory = () => page.evaluate(() => document.getElementById("story").scrollIntoView({ block: "start" }));
await go(page, `/projects/${P}/guides/${rec.guide}`); await ready();
await shot("empty");
let n = await page.locator("[data-element-row]").count();
if (n < 6) {
  for (let i = n; i < 6; i++) {
    const kind = i % 3 === 1 ? "heading" : "paragraph";
    await page.getByRole("button", { name: `Add ${kind}`, exact: true }).click();
    await page.keyboard.type(`UX-P5a ${kind} ${i + 1} text`);
  }
  await page.keyboard.press("Control+s"); await page.waitForTimeout(2500);
}
await toStory(); await page.waitForTimeout(400); await shot("6-blocks"); await axe("guide default");
console.log("heading buttons names:", await page.locator('[role=group] button[aria-pressed]').evaluateAll((els) => els.slice(0, 4).map((e) => e.textContent.trim().replace(/\s+/g, " "))));
// keyboard remove block 3 + undo
const row = page.locator("[data-element-row]").nth(2);
await row.getByRole("button", { name: /^Remove/ }).focus(); await page.keyboard.press("Enter"); await page.waitForTimeout(500);
console.log("after remove", await page.locator("[data-element-row]").count(), "focus:", await page.evaluate(() => document.activeElement?.id || document.activeElement?.textContent?.slice(0, 30)));
await shot("removed");
await page.getByRole("button", { name: /^Undo/ }).click(); await page.waitForTimeout(500);
console.log("after undo", await page.locator("[data-element-row]").count(), "focus:", await page.evaluate(() => document.activeElement?.id));
console.log("sizes", JSON.stringify(await page.evaluate(() => [...document.querySelector("[data-element-row]").querySelectorAll("button, select")].map((e) => { const r = e.getBoundingClientRect(); return `${(e.getAttribute("aria-label") || e.textContent).trim().slice(0, 24)}:${Math.round(r.width)}x${Math.round(r.height)}`; }))));
await page.getByRole("tab", { name: /ελληνικά/i }).click(); await page.waitForTimeout(800);
console.log("el: move", await page.getByRole("button", { name: /^Move/ }).count(), "remove", await page.getByRole("button", { name: /^Remove/ }).count(), "add", await page.getByRole("button", { name: /^Add (paragraph|heading|image|reference)/ }).count(), "Insert", await page.getByRole("button", { name: /^Insert/ }).count());
await toStory(); await page.waitForTimeout(400); await shot("greek"); await axe("guide greek");
await browser.close();
