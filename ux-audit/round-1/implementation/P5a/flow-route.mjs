// P5a Route flow. Windows Node: node ...\flow-route.mjs [viewport]
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { open, go } from "../../../tools/session.mjs";
const require = createRequire(new URL("../../../../package.json", import.meta.url));
const { default: AxeBuilder } = require("@axe-core/playwright");
const seed = JSON.parse(readFileSync(new URL("../../../tools/seed.json", import.meta.url), "utf8"));
const rec = JSON.parse(readFileSync(new URL("./records.json", import.meta.url), "utf8"));
const P = seed.projects.populated.id;
const vp = process.argv[2] ?? "1440";
const out = new URL("./after/", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const { browser, page } = await open("curator", { viewport: vp });
const shot = (n, full = false) => page.screenshot({ path: `${out}route-${n}__${vp}.png`, fullPage: full });
const ready = async () => { await page.waitForLoadState("networkidle").catch(() => {}); await page.locator("main h1").first().waitFor({ timeout: 20000 }).catch(() => {}); await page.waitForTimeout(1200); };
const axe = async (label) => { const r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze(); console.log("AXE", label, r.violations.map((v) => `${v.id}:${v.impact}:${v.nodes.length}`).join(" ") || "clean"); };
await go(page, `/projects/${P}/routes/${rec.route}`); await ready();
await shot("empty"); await axe("empty");
await page.getByRole("button", { name: "Add stops" }).click(); await page.waitForTimeout(600);
await shot("picker-open");
const rows = page.getByRole("dialog").locator(`ul button:not([aria-disabled="true"])`); const have = await page.locator("[data-stop-row]").count();
console.log("picker rows", await rows.count());
for (let i = 0; i < Math.max(0, 6 - have); i++) await rows.nth(0).click();
await page.waitForTimeout(400); await shot("picker-6-added");
await axe("picker");
console.log("done label:", await page.getByRole("dialog").getByRole("button", { name: /^Done/ }).innerText());
await page.getByRole("dialog").getByRole("button", { name: /^Done/ }).click(); await page.waitForTimeout(600);
console.log("stops", await page.locator("[data-stop-row]").count());
await page.evaluate(() => document.getElementById("stops").scrollIntoView({ block: "start" })); await page.waitForTimeout(500); await shot("6-stops"); await axe("6 stops");
// keyboard remove stop 3 + undo
const third = page.locator("[data-stop-row]").nth(2);
await third.getByRole("button", { name: /^Remove stop 3/ }).focus();
await page.keyboard.press("Enter"); await page.waitForTimeout(500);
console.log("after remove stops", await page.locator("[data-stop-row]").count(), "focus:", await page.evaluate(() => document.activeElement?.textContent?.trim().slice(0, 40)));
await shot("removed");
await page.getByRole("button", { name: /^Undo/ }).click(); await page.waitForTimeout(500);
console.log("after undo stops", await page.locator("[data-stop-row]").count(), "focus:", await page.evaluate(() => document.activeElement?.textContent?.trim().slice(0, 40)));
// handle arrow
await page.locator("#stop-" + (await page.locator("[data-stop-row]").nth(1).getAttribute("id")).replace("stop-row-", "") + "-handle").focus();
await page.keyboard.press("ArrowDown"); await page.waitForTimeout(300);
console.log("focus after handle arrow:", await page.evaluate(() => document.activeElement?.id));
// sizes
console.log("sizes", JSON.stringify(await page.evaluate(() => [...document.querySelectorAll("[data-stop-row]")[0].querySelectorAll("button, select")].map((e) => { const r = e.getBoundingClientRect(); return `${e.getAttribute("aria-label") ?? e.id}:${Math.round(r.width)}x${Math.round(r.height)}`; }))));
// Save
await page.keyboard.press("Control+s"); await page.waitForTimeout(2500); await shot("saved");
// Greek tab
await page.getByRole("tab", { name: /ελληνικά/i }).click(); await page.waitForTimeout(800);
console.log("el: reorder buttons", await page.getByRole("button", { name: /Move stop/ }).count(), "remove", await page.getByRole("button", { name: /^Remove/ }).count(), "add", await page.getByRole("button", { name: "Add stops" }).count());
await shot("greek"); await page.locator("#stops").scrollIntoViewIfNeeded(); await page.evaluate(() => document.getElementById("stops").scrollIntoView({ block: "start" })); await page.waitForTimeout(500); await shot("greek-stops"); await axe("greek");
await browser.close();
