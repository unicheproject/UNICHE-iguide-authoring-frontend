import { open, go, shot, POP, focusDesc } from "./lib.mjs";
const { browser, page } = await open("curator", { viewport: "1440" }); page.setDefaultTimeout(8000);
// duplicate slug
await go(page, `/projects/${POP}/guides`); await page.waitForTimeout(700);
await page.getByRole("button", { name: "New guide", exact: true }).first().click(); await page.waitForTimeout(400);
const d = page.getByRole("dialog");
await d.getByRole("textbox").first().fill("UX-R2-s9 Guide duplicate");
await d.getByRole("button", { name: "Edit slug" }).click(); await d.getByLabel(/^Slug/).fill("ux-r2-s9-guide");
await d.getByRole("button", { name: "Create and open" }).click(); await page.waitForTimeout(2000);
console.log("dup slug: dialogs", await page.getByRole("dialog").count(), "|", (await d.locator("[data-error-summary]").innerText().catch(() => "none/closed")).replace(/\s+/g, " "), "| url", page.url().slice(-40), "| focus", await focusDesc(page));
await shot(page, "create-guides__duplicate-slug", "1440");
await page.keyboard.press("Escape");
// scroll restore precise
await go(page, `/projects/${POP}/pois`); await page.waitForTimeout(1200);
await page.mouse.move(700, 500); await page.mouse.wheel(0, 3000); await page.waitForTimeout(600);
const before = await page.evaluate(() => document.querySelector("main").scrollTop);
const link = page.locator("tbody tr a").filter({ visible: true }).nth(5);
await link.click(); await page.waitForTimeout(1200); await page.goBack(); await page.waitForTimeout(2000);
console.log("scroll before click", before, "after Back", await page.evaluate(() => document.querySelector("main").scrollTop), "focus:", await focusDesc(page));
// matched via other language
await go(page, `/projects/${POP}/pois?q=${encodeURIComponent("Κόρη")}`); await page.waitForTimeout(1000);
console.log("greek search rows:", await page.locator("tbody tr").evaluateAll((r) => r.slice(0, 3).map((x) => x.innerText.replace(/\s+/g, " ").slice(0, 150))));
await shot(page, "pois-list__greek-search", "1440");
await browser.close();
