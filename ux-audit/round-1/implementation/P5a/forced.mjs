import { readFileSync } from "node:fs";
import { open, go } from "../../../tools/session.mjs";
const rec = JSON.parse(readFileSync(new URL("./records.json", import.meta.url), "utf8"));
const seed = JSON.parse(readFileSync(new URL("../../../tools/seed.json", import.meta.url), "utf8"));
const P = seed.projects.populated.id;
const out = new URL("./after/", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const { browser, page } = await open("curator", { viewport: "1440", forcedColors: "active" });
for (const [n, u, id] of [["route", `/projects/${P}/routes/${rec.route}`, "stops"], ["guide", `/projects/${P}/guides/${rec.guide}`, "story"]]) {
  await go(page, u); await page.waitForTimeout(2500);
  await page.evaluate((i) => document.getElementById(i).scrollIntoView({ block: "start" }), id); await page.waitForTimeout(500);
  await page.screenshot({ path: `${out}${n}-forced-colors__1440.png` });
}
await browser.close();
