import { readFileSync } from "node:fs";
import { open, go } from "../../../tools/session.mjs";
const rec = JSON.parse(readFileSync(new URL("./records.json", import.meta.url), "utf8"));
const seed = JSON.parse(readFileSync(new URL("../../../tools/seed.json", import.meta.url), "utf8"));
const P = seed.projects.populated.id;
const { browser, page } = await open("curator", { viewport: "1440" });
await go(page, `/projects/${P}/routes/${rec.route}`); await page.waitForTimeout(2500);
const warn = () => page.getByText("Stops are in a different order than visitors see").count();
console.log("status chip:", await page.locator("h1").first().innerText());
if (await page.getByRole("button", { name: /^(save and )?activate$/i }).count()) {
  await page.getByRole("button", { name: /^(save and )?activate$/i }).first().click(); await page.waitForTimeout(800);
  await page.getByRole("dialog").getByRole("button", { name: /activate/i }).last().click(); await page.waitForTimeout(3500);
}
await page.getByRole("button", { name: /^Move stop 1.* down$/ }).first().click(); await page.waitForTimeout(500);
console.log("warning after reorder:", await warn());
await page.getByRole("button", { name: /^Apply changes/ }).first().click(); await page.waitForTimeout(800);
await page.getByRole("dialog").getByRole("button", { name: /^Apply changes/ }).click(); await page.waitForTimeout(3500);
console.log("warning after apply:", await warn());
await browser.close();
