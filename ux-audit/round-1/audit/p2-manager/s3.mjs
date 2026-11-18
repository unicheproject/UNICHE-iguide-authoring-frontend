import { shot, CMS } from "./h.mjs";
import { open } from "../../../tools/session.mjs";
const { browser, page } = await open("admin", { viewport: "1440" });
await page.goto(CMS + "/"); await page.waitForLoadState("networkidle").catch(()=>{}); await page.waitForTimeout(800);
await page.getByRole("button", { name: /select a project/i }).click(); await page.waitForTimeout(500);
// keyboard: Tab into list
await page.keyboard.press("Tab"); await page.keyboard.press("Tab");
console.log("focus after 2 tabs:", await page.evaluate(()=>document.activeElement?.outerHTML?.slice(0,200)));
await shot(page, "switcher__tab-focus", "1440");
// find popover container and scroll
const pop = page.locator("text=+ Create Project").first();
const item = page.getByText("UX Audit – Populated").last();
await item.scrollIntoViewIfNeeded(); await page.waitForTimeout(300);
await shot(page, "switcher__scrolled-to-ux", "1440");
const t=Date.now();
await item.click();
await page.waitForTimeout(250); await shot(page, "switch__skeleton", "1440");
await page.waitForLoadState("networkidle").catch(()=>{}); await page.waitForTimeout(1200);
console.log("switch ms", Date.now()-t, page.url());
await shot(page, "dashboard-populated__1st", "1440");
console.log(await page.locator("main").innerText());
await page.getByRole("button").filter({ hasText: /UX Audit/ }).first().click(); await page.waitForTimeout(500);
await shot(page, "switcher__open-in-workspace", "1440");
await page.keyboard.press("Escape");
await browser.close();
