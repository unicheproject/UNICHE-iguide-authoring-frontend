import { readFileSync } from "node:fs";
import { open, go } from "../../../tools/session.mjs";
const seed = JSON.parse(readFileSync(new URL("../../../tools/seed.json", import.meta.url), "utf8"));
const P = seed.projects.populated.id;
const shot = (n) => new URL(`./after/${n}.png`, import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const log = console.log;
const settle = async (p) => { await p.waitForLoadState("networkidle").catch(() => {}); await p.waitForTimeout(2500); };
const { browser, page } = await open("curator", { viewport: "1440" });
await go(page, `/projects/${P}/pois?q=UX-P3a`); await settle(page);
const kebab = () => page.getByRole("button", { name: /^Actions for UX-P3a/ }).first();
// deactivate with confirm
await kebab().focus(); await page.keyboard.press("Enter"); await page.getByRole("menuitem", { name: "Deactivate" }).click(); await page.waitForTimeout(1200);
log("deactivate dialog:", (await page.getByRole("dialog").innerText()).replace(/\n+/g, " | ").slice(0, 200));
await page.getByRole("dialog").getByRole("button", { name: "Deactivate" }).click(); await page.waitForTimeout(1500);
log("dialog gone:", !(await page.getByRole("dialog").isVisible().catch(() => false)), "| focus:", await page.evaluate(() => document.activeElement?.getAttribute("aria-label")));
// mocked refusal on activate
await page.route("**/pois/*/status", (r) => r.fulfill({ status: 422, contentType: "application/json", body: JSON.stringify({ code: "VALIDATION_ERROR", message: "Cannot activate", requestId: "req-test-1", errors: [{ path: "translations.el.title", code: "MISSING_REQUIRED_FIELDS", message: "is required" }] }) }));
await kebab().focus(); await page.keyboard.press("Enter"); await page.getByRole("menuitem", { name: "Activate" }).click(); await page.waitForTimeout(800);
await page.getByRole("dialog").getByRole("button", { name: /^Activate$/ }).click(); await page.waitForTimeout(1200);
log("refusal:", (await page.getByRole("dialog").innerText()).replace(/\n+/g, " | ").slice(0, 400));
await page.screenshot({ path: shot("activate-refusal__1440") });
await page.getByRole("button", { name: /Title \(el\)/ }).click(); await page.waitForTimeout(1500);
log("navigated to editor:", page.url().includes("/pois/"), page.url().split("/").pop());
await page.unroute("**/pois/*/status");
// move to position on full list
await go(page, `/projects/${P}/pois`); await settle(page);
const names = () => page.evaluate(() => [...document.querySelectorAll("tbody tr")].map((r) => r.querySelector("a")?.textContent.trim()));
const before = await names();
log("count", before.length, "mine at", before.findIndex((n) => n?.startsWith("UX-P3a")) + 1);
const mineKebab = page.getByRole("button", { name: /^Actions for UX-P3a/ }).first();
await mineKebab.scrollIntoViewIfNeeded(); await mineKebab.focus(); await page.keyboard.press("Enter");
await page.getByRole("menuitem", { name: "Move to position..." }).click(); await page.waitForTimeout(600);
await page.keyboard.type("3"); await page.keyboard.press("Enter"); await page.waitForTimeout(2000);
log("announce:", (await page.locator("[role=status]").allInnerTexts()).join("|"));
log("mine now at", (await names()).findIndex((n) => n?.startsWith("UX-P3a")) + 1, "focus:", await page.evaluate(() => document.activeElement?.getAttribute("aria-label")));
// back to bottom
const k2 = page.getByRole("button", { name: /^Actions for UX-P3a/ }).first();
await k2.focus(); await page.keyboard.press("Enter"); await page.getByRole("menuitem", { name: "Move to bottom" }).click(); await page.waitForTimeout(2000);
log("mine back at", (await names()).findIndex((n) => n?.startsWith("UX-P3a")) + 1);
// sort by title in URL; back restores
await page.getByLabel("Sort by").selectOption("title"); await page.waitForTimeout(800);
log("url", page.url().split("?")[1]);
await page.locator("tbody a").nth(3).click(); await page.waitForTimeout(1500);
await page.goBack(); await settle(page);
log("after back", page.url().split("?")[1], "| sort select:", await page.getByLabel("Sort by").inputValue());
await browser.close();
