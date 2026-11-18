import { state, log, dump, focused } from "./lib.mjs";
export async function addStops(page, names) {
  for (const n of names) {
    await page.getByRole("button", { name: /add stop/i }).click(); await page.waitForTimeout(400);
    await page.keyboard.type("Stop " + n); await page.waitForTimeout(400);
    await page.locator("[role=dialog]").getByText(new RegExp("Stop " + n)).first().click();
    await page.waitForTimeout(400);
  }
}
export const stopTitles = (page) => page.evaluate(() => [...document.querySelectorAll("li, [data-stop], article")].filter(e => /^\s*Stop \d+:|^\d+\s*Stop \d/.test(e.innerText)).map(e => e.innerText.split("\n").slice(0,3).join(" ")));
