import { shot, CMS } from "./h.mjs";
import { open, go } from "../../../tools/session.mjs";
const { browser, page } = await open("admin", { viewport: "1440" });
await go(page, "/"); await page.waitForTimeout(1200);
await page.getByRole("button", { name: /select a project/i }).click(); await page.waitForTimeout(400);
const row = page.locator("a", { hasText: "UX-p2-manager Trail" }).first();
await row.scrollIntoViewIfNeeded(); await shot(page, "resume__switcher-row", "1440");
console.log("row text:", (await row.innerText()).replace(/\n/g," | "), await row.getAttribute("href"));
await row.click(); await page.waitForLoadState("networkidle").catch(()=>{}); await page.waitForTimeout(1500);
console.log(page.url());
await shot(page, "resume__step2-landing", "1440");
await page.screenshot({ path: "ux-audit/round-1/audit/p2-manager/shots/resume__step2-full__1440.png", fullPage: true });
console.log("focus", await page.evaluate(()=>document.activeElement?.tagName));
// Step 2: choose template & style
await page.getByRole("button", { name: /Outdoor trail/ }).click(); await page.waitForTimeout(400);
await shot(page, "create__step2-outdoor", "1440");
await page.getByRole("button", { name: /Quarry Trail/ }).click(); await page.waitForTimeout(300);
await page.screenshot({ path: "ux-audit/round-1/audit/p2-manager/shots/create__step2-quarry-full__1440.png", fullPage: true });
// try clicking Initialize before continue
const init = page.getByRole("button", { name: "Initialize" });
console.log("initialize enabled before continue?", await init.isEnabled());
await page.getByRole("button", { name: "Continue" }).click(); await page.waitForTimeout(500);
await page.screenshot({ path: "ux-audit/round-1/audit/p2-manager/shots/create__step3-full__1440.png", fullPage: true });
console.log("focus after continue", await page.evaluate(()=>document.activeElement?.outerHTML.slice(0,100)));
console.log("initialize enabled after continue?", await init.isEnabled());
await browser.close();
