import { open, go } from "../../../tools/session.mjs";
const P = "6958c18f-60d2-4140-a524-5a43f8a2f6b5";
const D = "4e03e8e8-7d90-46bb-a3b0-4aab41d67135", A = "07927651-be7a-44e9-85eb-843d8ed219f7";
const log = (...a) => console.log(...a);
for (const vp of ["1440", "1024", "768", "zoom200"]) {
  const { browser, page } = await open("admin", { viewport: vp });
  await go(page, `/projects/${P}/pois/${D}`);
  await page.waitForSelector("[data-sticky-bar]", { timeout: 30000 }); await page.waitForTimeout(1500);
  log(vp, "draft h1 height", await page.evaluate(() => Math.round(document.querySelector("h1").getBoundingClientRect().height)), "texts h2:", await page.evaluate(() => [...document.querySelectorAll("h2")].map((h) => h.textContent.trim()).filter((t) => t === "Texts").length));
  await page.screenshot({ path: `after/draft-${vp}.png` });
  await go(page, `/projects/${P}/pois/${A}`);
  await page.waitForSelector("[data-sticky-bar]", { timeout: 30000 }); await page.waitForTimeout(1500);
  const apply = page.getByRole("button", { name: /^Apply changes$/ }).first();
  log(vp, "active clean: apply aria-disabled", await apply.getAttribute("aria-disabled"), "title/desc", await apply.evaluate((e) => e.getAttribute("aria-describedby") && document.getElementById(e.getAttribute("aria-describedby"))?.textContent));
  await page.screenshot({ path: `after/active-clean-${vp}.png` });
  await browser.close();
}
