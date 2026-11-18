import { open, go } from "../../../tools/session.mjs";
const { browser, page } = await open("curator", { viewport: "1440" });
await go(page, "/projects/ceee1b24-e7c4-474e-93ba-f77067ed8a72"); await page.waitForTimeout(3000);
await page.screenshot({ path: "ux-audit/round-1/implementation/P2/after/empty-c-after-place__1440.png", fullPage: true });
console.log(await page.locator("[data-step]").evaluateAll((l) => l.map((e) => e.dataset.step + ":" + e.dataset.state)));
await browser.close();
