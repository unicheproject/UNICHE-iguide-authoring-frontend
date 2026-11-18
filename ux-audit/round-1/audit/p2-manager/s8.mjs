import { shot, CMS } from "./h.mjs";
import { open, go } from "../../../tools/session.mjs";
const { browser, page } = await open("admin", { viewport: "1280" });
await go(page, "/projects/new?resume=ef9a58e0-8f16-45a4-93ff-ab6590ddfc37"); await page.waitForTimeout(1500);
await shot(page, "resume__direct-deeplink", "1280");
await page.getByRole("button", { name: /Continue/ }).click(); await page.waitForTimeout(400);
// remove-language / default checks
await page.screenshot({ path: "ux-audit/round-1/audit/p2-manager/shots/create__step3-bottom__1280.png", fullPage: true });
const t=Date.now();
await page.getByRole("button", { name: "Initialize" }).click();
await page.waitForTimeout(400); await shot(page, "create__initializing", "1280");
await page.waitForURL(u=>!u.toString().includes("/projects/new"), {timeout:60000}).catch(()=>console.log("stay", page.url()));
await page.waitForLoadState("networkidle").catch(()=>{}); await page.waitForTimeout(1500);
console.log("init ms", Date.now()-t, page.url());
await shot(page, "dashboard-new__after-init", "1280");
console.log((await page.locator("main").innerText()));
console.log("toast/live:", await page.locator("[role=status],[role=alert]").allInnerTexts());
await browser.close();
