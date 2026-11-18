import { open, go, base, shot } from "./lib.mjs";
import { readFileSync } from "node:fs";
const R = JSON.parse(readFileSync("ux-audit/round-3/audit/p3-translator/records.json","utf8"));
const { browser, page } = await open("admin", { viewport: "1440" });
await go(page, R.routes);
await page.waitForSelector("h1"); await page.waitForTimeout(1800);
await page.locator("#add-stop").click();
const d = page.locator("[role=dialog]");
await d.locator("input[type=search]").waitFor();
for (const q of ["Παρθενώνας","παρθενωνας","ΠΑΡΘΕΝΩΝΑΣ","παρθενώνας"]) {
  await d.locator("input[type=search]").fill(q);
  await page.waitForTimeout(700);
  console.log("picker", q, "->", (await d.innerText()).match(/(\d+) items? match|(\d+) items?/)?.[0], "|", await d.locator("button").evaluateAll(b=>b.map(x=>x.innerText.split("\n")[0]).filter(t=>/UX-R3|Παρθ/i.test(t)).slice(0,3).join(";")));
}
await shot(page,"stop-picker__search-greek-unaccented__1440");
await page.keyboard.press("Escape");
await browser.close();
