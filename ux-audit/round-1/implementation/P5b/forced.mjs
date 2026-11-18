import { readFileSync } from "node:fs";
import { open, go } from "../../../tools/session.mjs";
const rec = JSON.parse(readFileSync(new URL("./records.json", import.meta.url), "utf8"));
const seed = JSON.parse(readFileSync(new URL("../../../tools/seed.json", import.meta.url), "utf8"));
const P = seed.projects.populated.id;
const out = new URL("./after/", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const { browser, page } = await open("curator", { viewport: "1440", forcedColors: "active" });
for (const [n, u] of [["event", `/projects/${P}/events/${rec.event}`], ["category", `/projects/${P}/categories/${rec.category}`]]) {
  await go(page, u); await page.waitForLoadState("networkidle").catch(() => {}); await page.waitForTimeout(1500);
  await page.locator(n === "event" ? "#dates" : "#f-icon").first().scrollIntoViewIfNeeded();
  await page.screenshot({ path: `${out}${n}-forced-colors__1440.png` });
}
await browser.close();
