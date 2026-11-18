import { open, go, shot, POP } from "./lib.mjs";
const { browser, page } = await open("curator", { viewport: "1440" });
await go(page, `/projects/${POP}/places?q=${encodeURIComponent("UX-R2-s9")}`); await page.waitForTimeout(1200);
console.log(await page.locator("tbody tr").evaluateAll((r) => r.map((x) => x.innerText.replace(/\s+/g, " ").slice(0, 110))));
// sub-place no parent properly
await go(page, `/projects/${POP}/places`); await page.waitForTimeout(600);
await page.getByRole("button", { name: "New place", exact: true }).first().click(); await page.waitForTimeout(400);
const d = page.getByRole("dialog");
await d.getByRole("textbox").first().fill("UX-R2-s9 temp2");
await d.getByText("Sub-place", { exact: true }).click(); await page.waitForTimeout(300);
await d.getByRole("button", { name: "Create and open" }).click(); await page.waitForTimeout(900);
console.log("dialogs:", await page.getByRole("dialog").count(), "| summary:", (await d.locator("[data-error-summary]").innerText().catch(() => "none")).replace(/\s+/g, " "), "| url", page.url().slice(-60));
await shot(page, "create-places__sub-place-no-parent", "1440");
// typed text + backdrop click
if (await page.getByRole("dialog").count()) { await page.mouse.click(40, 450); await page.waitForTimeout(400); console.log("backdrop click with typed text closes:", (await page.getByRole("dialog").count()) === 0); }
await browser.close();
