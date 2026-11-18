import { open, go } from "../../../tools/session.mjs";
const P = "6958c18f-60d2-4140-a524-5a43f8a2f6b5";
const { browser, page } = await open("admin", { viewport: "1440" });
await go(page, `/projects/${P}/pois`); await page.waitForTimeout(2500);
await page.getByRole("heading", { level: 1 }).focus();
await page.keyboard.press("/");
console.log("slash focus:", await page.evaluate(() => document.activeElement?.getAttribute("type")));
await page.keyboard.type("/x"); console.log("typed value", await page.inputValue('input[type=search]'));
await page.fill('input[type=search]', "");
// next page by keyboard, focus stays on a pager control
await page.getByRole("button", { name: /^Next/ }).focus(); await page.keyboard.press("Enter"); await page.waitForTimeout(500);
console.log("after Next focus:", await page.evaluate(() => document.activeElement?.textContent?.trim()), "url", page.url().split("?")[1]);
// needs translation default with Search in empty -> first non-default
await page.goto(`http://localhost:5173/projects/${P}/pois`); await page.waitForTimeout(2000);
await page.getByRole("button", { name: /^Filters/ }).click();
await page.getByLabel("Needs translation").first().check().catch(async () => { await page.getByText("Needs translation").click(); });
await page.waitForTimeout(400);
console.log("missing in url:", page.url().split("?")[1]);
await browser.close();
