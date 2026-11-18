import { open, go } from "../../../tools/session.mjs";
const poi = process.argv[2];
const P = "6958c18f-60d2-4140-a524-5a43f8a2f6b5";
const { browser, page } = await open("admin", { viewport: "1440" });
await go(page, `/projects/${P}/pois/${poi}`);
await page.waitForSelector("[data-sticky-bar]", { timeout: 30000 });
await page.waitForTimeout(2000);
const status = await page.evaluate(() => document.querySelector("#status-card-heading")?.parentElement?.textContent?.replace(/\s+/g, " ").slice(0, 80));
console.log("status card:", status);
if (/Draft/.test(status)) {
  await page.getByRole("button", { name: /^(Save and activate|Activate)$/ }).first().click();
  await page.waitForTimeout(600);
  await page.locator("[role=dialog]").getByRole("button", { name: /^(Save and activate|Activate)$/ }).click();
  await page.waitForTimeout(2500);
  const toast = await page.evaluate(() => [...document.querySelectorAll("[role=status],[role=alert],[data-toast]")].map((e) => e.textContent.replace(/\s+/g, " ").trim()).filter((t) => /Activated/.test(t)));
  console.log("toast:", toast);
  await page.screenshot({ path: "after/poi-activated.png" });
}
const deact = page.getByRole("button", { name: "Deactivate" }).first();
console.log("deactivate aria-disabled:", await deact.getAttribute("aria-disabled"), "| reason line:", await page.evaluate(() => document.querySelector("[data-blocked-reason]")?.textContent ?? null));
await deact.click();
await page.waitForTimeout(1500);
console.log("dialog:", await page.evaluate(() => document.querySelector("[role=dialog]")?.textContent?.replace(/\s+/g, " ").slice(0, 500)));
await page.screenshot({ path: "after/poi-deactivate-dialog.png" });
const confirm = page.locator("[role=dialog]").getByRole("button", { name: "Deactivate" });
if (await confirm.count()) {
  await confirm.click(); await page.waitForTimeout(2000);
  console.log("after confirm dialog:", await page.evaluate(() => document.querySelector("[role=dialog]")?.textContent?.replace(/\s+/g, " ").slice(0, 600) ?? "(closed)"));
  await page.screenshot({ path: "after/poi-deactivate-result.png" });
}
await browser.close();
